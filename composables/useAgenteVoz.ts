// Cliente de voz en tiempo real (OpenAI Realtime por WebRTC).
// 1. Pide al servidor una clave temporal (server/api/voz/sesion.post.ts).
// 2. Abre la conexión WebRTC: micrófono → OpenAI, audio del modelo → <audio>.
// 3. Por el canal de datos recibe transcripciones y llamadas a herramientas;
//    las ejecuta en el navegador (controlan la interfaz) y devuelve el resultado.
//
// UNA sola sesión por pestaña: todo el estado vive en un singleton en
// globalThis. Antes vivía en variables del módulo y una recarga en caliente
// (o una segunda copia del módulo) dejaba la conexión vieja viva "huérfana"
// mientras la interfaz mostraba "inactivo" y permitía abrir otra.
import { ref, readonly, type Ref } from "vue";
import { HERRAMIENTAS_VOZ, INSTRUCCIONES_VOZ, ETIQUETAS_HERRAMIENTA, ejecutarHerramienta } from "~/agente/herramientasVoz";
import { marcarTurnoUsuario } from "~/agente/correoAgente";

export type EstadoVoz = "inactivo" | "conectando" | "escuchando" | "pensando" | "hablando" | "error";

export interface MensajeVoz {
  id: number;
  rol: "usuario" | "agente" | "accion" | "sistema";
  texto: string;
  pendiente?: boolean; // acción en curso
}

interface SesionVoz {
  estado: Ref<EstadoVoz>;
  mensajes: Ref<MensajeVoz[]>;
  error: Ref<string | null>;
  silenciado: Ref<boolean>;
  panelAbierto: Ref<boolean>;
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  microfono: MediaStream | null;
  audio: HTMLAudioElement | null;
  siguienteId: number;
  burbujas: Map<string, number>;
  // Conexión en curso: un segundo clic espera a esta en vez de abrir otra.
  conectando: Promise<void> | null;
  timerDesconexion: ReturnType<typeof setTimeout> | null;
}

const g = globalThis as any;
const S: SesionVoz = (g.__sesionVoz ??= {
  estado: ref<EstadoVoz>("inactivo"),
  mensajes: ref<MensajeVoz[]>([]),
  error: ref<string | null>(null),
  silenciado: ref(false),
  panelAbierto: ref(false),
  pc: null,
  dc: null,
  microfono: null,
  audio: null,
  siguienteId: 1,
  burbujas: new Map(),
  conectando: null,
  timerDesconexion: null,
} satisfies SesionVoz);

const MAX_MENSAJES = 60;
// Turnos previos que se le recuerdan al agente al retomar la conversación.
const TURNOS_CONTEXTO = 12;

const sesionViva = () => !!S.pc && S.pc.connectionState !== "closed" && S.pc.connectionState !== "failed";

const agregar = (m: Omit<MensajeVoz, "id">) => {
  const nuevo = { ...m, id: S.siguienteId++ };
  S.mensajes.value = [...S.mensajes.value, nuevo].slice(-MAX_MENSAJES);
  return nuevo.id;
};

const actualizar = (id: number, cambios: Partial<MensajeVoz>) => {
  S.mensajes.value = S.mensajes.value.map((m) => (m.id === id ? { ...m, ...cambios } : m));
};

const enviar = (evento: Record<string, unknown>) => {
  if (S.dc?.readyState === "open") S.dc.send(JSON.stringify(evento));
};

// Ejecuta las herramientas pedidas en una respuesta y pide al modelo que continúe.
const resolverLlamadas = async (llamadas: Array<{ name: string; call_id: string; arguments: string }>) => {
  S.estado.value = "pensando";
  for (const ll of llamadas) {
    const idAccion = agregar({ rol: "accion", texto: ETIQUETAS_HERRAMIENTA[ll.name] ?? ll.name, pendiente: true });
    const salida = await ejecutarHerramienta(ll.name, ll.arguments);
    actualizar(idAccion, { pendiente: false });
    enviar({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: ll.call_id, output: salida },
    });
  }
  enviar({ type: "response.create" });
};

const alEvento = (ev: any) => {
  switch (ev.type) {
    case "input_audio_buffer.speech_started":
      S.estado.value = "escuchando";
      break;

    // El VAD cerró un turno hablado del usuario (llega antes de que el modelo
    // responda): cuenta como posible confirmación para enviar un correo.
    case "input_audio_buffer.committed":
      marcarTurnoUsuario();
      break;

    case "conversation.item.input_audio_transcription.completed":
      if (ev.transcript?.trim()) agregar({ rol: "usuario", texto: ev.transcript.trim() });
      break;

    // Nombre GA y nombre beta del delta de transcripción del audio de salida.
    case "response.output_audio_transcript.delta":
    case "response.audio_transcript.delta": {
      S.estado.value = "hablando";
      const clave = ev.item_id ?? ev.response_id;
      const existente = S.burbujas.get(clave);
      if (existente) {
        const m = S.mensajes.value.find((x) => x.id === existente);
        if (m) actualizar(existente, { texto: m.texto + ev.delta });
      } else {
        S.burbujas.set(clave, agregar({ rol: "agente", texto: ev.delta }));
      }
      break;
    }

    case "response.done": {
      const llamadas = (ev.response?.output ?? []).filter((o: any) => o.type === "function_call");
      if (llamadas.length) resolverLlamadas(llamadas);
      if (ev.response?.status === "failed") {
        S.error.value = ev.response?.status_details?.error?.message ?? "La respuesta falló";
      }
      break;
    }

    case "output_audio_buffer.stopped":
      if (S.estado.value === "hablando") S.estado.value = "escuchando";
      break;

    case "error":
      S.error.value = ev.error?.message ?? "Error en la sesión de voz";
      console.warn("[voz]", ev.error);
      break;
  }
};

/** Libera la conexión y el micrófono. Conserva la conversación en pantalla. */
const cerrarConexion = () => {
  if (S.timerDesconexion) clearTimeout(S.timerDesconexion);
  S.timerDesconexion = null;
  S.dc?.close();
  S.pc?.getSenders().forEach((s) => s.track?.stop());
  S.pc?.close();
  S.microfono?.getTracks().forEach((t) => t.stop());
  if (S.audio) S.audio.srcObject = null;
  S.pc = S.dc = S.microfono = null;
  S.burbujas.clear();
  S.silenciado.value = false;
};

/** Termina la conversación de voz (acción explícita del usuario). */
const terminar = () => {
  const habia = sesionViva();
  cerrarConexion();
  S.estado.value = "inactivo";
  if (habia) agregar({ rol: "sistema", texto: "Conversación terminada" });
};

// Al retomar, el agente recibe lo conversado antes (la sesión de OpenAI es nueva).
const contextoPrevio = () =>
  S.mensajes.value
    .filter((m) => m.rol === "usuario" || m.rol === "agente")
    .slice(-TURNOS_CONTEXTO)
    .map((m) => `${m.rol === "usuario" ? "Usuario" : "Atlas"}: ${m.texto}`)
    .join("\n");

const abrirSesion = async () => {
  S.error.value = null;
  S.estado.value = "conectando";
  const previo = contextoPrevio();
  try {
    const { value: clave } = await $fetch<{ value: string }>("/api/voz/sesion", {
      method: "POST",
      body: { instructions: INSTRUCCIONES_VOZ, tools: HERRAMIENTAS_VOZ },
    });

    const pc = new RTCPeerConnection();
    S.pc = pc;
    S.audio ??= Object.assign(document.createElement("audio"), { autoplay: true });
    pc.ontrack = (e) => {
      S.audio!.srcObject = e.streams[0];
    };

    S.microfono = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    pc.addTrack(S.microfono.getTracks()[0], S.microfono);

    const dc = pc.createDataChannel("oai-events");
    S.dc = dc;
    dc.addEventListener("message", (e) => {
      try {
        alEvento(JSON.parse(e.data));
      } catch {
        /* evento no JSON: ignorar */
      }
    });
    dc.addEventListener("open", () => {
      S.estado.value = "escuchando";
      if (previo) {
        agregar({ rol: "sistema", texto: "Conversación retomada" });
        enviar({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [{ type: "input_text", text: `Conversación previa con este usuario (retómala, no te vuelvas a presentar):\n${previo}` }],
          },
        });
        enviar({ type: "response.create", response: { instructions: "Di en una frase corta que retomas la conversación." } });
      } else {
        enviar({
          type: "response.create",
          response: { instructions: "Salúdate en una sola frase corta y pregunta en qué puedes ayudar con la planta." },
        });
      }
    });
    pc.addEventListener("connectionstatechange", () => {
      if (S.pc !== pc) return; // evento de una conexión ya reemplazada
      if (pc.connectionState === "failed") {
        S.error.value = "Se perdió la conexión de voz";
        cerrarConexion();
        S.estado.value = "error";
      } else if (pc.connectionState === "disconnected") {
        // Un corte breve de red puede recuperarse solo: esperar antes de cerrar.
        S.timerDesconexion ??= setTimeout(() => {
          S.timerDesconexion = null;
          if (S.pc === pc && pc.connectionState !== "connected") {
            S.error.value = "Se perdió la conexión de voz";
            cerrarConexion();
            S.estado.value = "error";
          }
        }, 6000);
      } else if (pc.connectionState === "connected" && S.timerDesconexion) {
        clearTimeout(S.timerDesconexion);
        S.timerDesconexion = null;
      }
    });

    const oferta = await pc.createOffer();
    await pc.setLocalDescription(oferta);
    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      body: oferta.sdp,
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/sdp" },
    });
    if (!r.ok) throw new Error(`OpenAI rechazó la conexión (${r.status}): ${await r.text()}`);
    await pc.setRemoteDescription({ type: "answer", sdp: await r.text() });
  } catch (e: any) {
    cerrarConexion();
    S.error.value =
      e?.name === "NotAllowedError"
        ? "Sin permiso para usar el micrófono"
        : e?.data?.statusMessage || e?.message || "No se pudo iniciar la voz";
    S.estado.value = "error";
  }
};

/**
 * Inicia la conversación solo si no hay una viva o conectándose; si ya
 * existe, no abre otra (solo muestra el panel).
 */
const conectar = async () => {
  S.panelAbierto.value = true;
  if (S.conectando) return S.conectando;
  if (sesionViva()) return;
  S.conectando = abrirSesion().finally(() => {
    S.conectando = null;
  });
  return S.conectando;
};

const abrirPanel = () => {
  S.panelAbierto.value = true;
};

/** Registra en la conversación algo que hizo el usuario fuera de la voz (p. ej. un botón). */
const registrarAccion = (texto: string, avisarAlAgente = true) => {
  agregar({ rol: "accion", texto });
  if (avisarAlAgente) {
    enviar({
      type: "conversation.item.create",
      item: { type: "message", role: "system", content: [{ type: "input_text", text: `Aviso de la interfaz: ${texto}` }] },
    });
  }
};

const alternarPanel = () => {
  S.panelAbierto.value = !S.panelAbierto.value;
};

const alternarSilencio = () => {
  S.silenciado.value = !S.silenciado.value;
  S.microfono?.getAudioTracks().forEach((t) => (t.enabled = !S.silenciado.value));
};

// Mensaje escrito (útil en salas con ruido): entra a la misma conversación
// y el agente responde por voz como si se lo hubieran dicho.
const enviarTexto = (texto: string) => {
  const t = texto.trim();
  if (!t || S.dc?.readyState !== "open") return;
  agregar({ rol: "usuario", texto: t });
  marcarTurnoUsuario();
  enviar({
    type: "conversation.item.create",
    item: { type: "message", role: "user", content: [{ type: "input_text", text: t }] },
  });
  enviar({ type: "response.create" });
};

const limpiarConversacion = () => {
  S.mensajes.value = [];
};

// Cerrar o recargar la pestaña corta la sesión (no queda micrófono abierto).
if (import.meta.client && !g.__sesionVozUnload) {
  g.__sesionVozUnload = true;
  window.addEventListener("pagehide", cerrarConexion);
}

export const useAgenteVoz = () => ({
  estado: readonly(S.estado),
  mensajes: readonly(S.mensajes),
  error: readonly(S.error),
  silenciado: readonly(S.silenciado),
  panelAbierto: readonly(S.panelAbierto),
  conectar,
  terminar,
  abrirPanel,
  registrarAccion,
  alternarPanel,
  alternarSilencio,
  enviarTexto,
  limpiarConversacion,
});

// Estado compartido del flujo de correo del agente: el borrador en vista
// previa y la marca del último turno del usuario (para exigir confirmación
// humana antes de enviar). En globalThis por la misma razón que la sesión de
// voz: una sola instancia aunque la recarga en caliente duplique módulos.
import { ref, type Ref } from "vue";

export type TipoCorreo = "falla" | "alerta" | "grafico";

export interface BorradorCorreo {
  para: string[];
  asunto: string;
  cuerpo: string;
  tipo: TipoCorreo;
  imagen: string | null; // data:image/png;base64,...
  descripcionGrafico: string | null;
  creadoEn: number;
}

interface EstadoCorreo {
  borrador: Ref<BorradorCorreo | null>;
  enviando: Ref<boolean>;
  // Último turno del usuario (voz confirmada por VAD o mensaje escrito).
  ultimoTurnoUsuario: number;
}

const g = globalThis as any;
export const correo: EstadoCorreo = (g.__correoAgente ??= {
  borrador: ref<BorradorCorreo | null>(null),
  enviando: ref(false),
  ultimoTurnoUsuario: 0,
} satisfies EstadoCorreo);

export const marcarTurnoUsuario = () => {
  correo.ultimoTurnoUsuario = Date.now();
};

/** Envía el borrador actual. Lo usan la herramienta de voz y el botón Enviar. */
export const enviarBorrador = async (): Promise<{ ok: boolean; mensaje: string }> => {
  const b = correo.borrador.value;
  if (!b) return { ok: false, mensaje: "No hay ningún borrador para enviar." };
  if (correo.enviando.value) return { ok: false, mensaje: "El correo ya se está enviando." };
  correo.enviando.value = true;
  try {
    await $fetch("/api/correo/enviar", {
      method: "POST",
      body: {
        para: b.para,
        asunto: b.asunto,
        cuerpo: b.cuerpo,
        tipo: b.tipo,
        imagen: b.imagen ?? undefined,
        descripcionGrafico: b.descripcionGrafico ?? undefined,
      },
    });
    correo.borrador.value = null;
    return { ok: true, mensaje: `Correo enviado a ${b.para.join(", ")}.` };
  } catch (e: any) {
    return { ok: false, mensaje: e?.data?.statusMessage || e?.message || "No se pudo enviar el correo." };
  } finally {
    correo.enviando.value = false;
  }
};

export const descartarBorrador = () => {
  correo.borrador.value = null;
};

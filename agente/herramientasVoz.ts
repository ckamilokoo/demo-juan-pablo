// Herramientas del agente de voz (OpenAI Realtime). Las define el cliente y
// también las ejecuta el cliente: controlan la interfaz a través del bus
// useControlUI. La única que sale del navegador es `consultar_analista`, que
// delega el análisis de datos al agente LangGraph del servidor.
import { emitirOrden, emitirOrdenCuandoListo, estadoUI } from "~/composables/useControlUI";
import { resolverSensor, normalizarTexto } from "~/utils/resolverSensor";
import { construirEstadoPlanta, resumenPantalla } from "./estadoPlanta";
import { capturarGrafico } from "./capturaGrafico";
import { enfocarSeccion, resaltar, SECCIONES_FOCO, type SeccionFoco } from "./enfocar";
import { generarReporte, reporteAbierto, duracionLegible, type ReporteTurno } from "./reporteTurno";
import { alertasVisibles, escenario, ahoraSim } from "~/mock/escenario";
import { buscarConfigSensor } from "~/config/sensoresAnomaliasConfig";
import { conocimientoDe } from "~/config/conocimientoSensores";
import { leerSenal } from "~/mock/simulador";
import { perfilDe } from "~/mock/perfiles";
import { correo, enviarBorrador, descartarBorrador, type TipoCorreo } from "./correoAgente";

type Bomba = "A" | "B";

const bombaEnum = { type: "string", enum: ["A", "B"], description: "Bomba: A o B." };

export const INSTRUCCIONES_VOZ = `
Eres "Atlas", el asistente de operaciones por voz de Planta Demo, una central con dos bombas de
alimentación de caldera (Bomba A y Bomba B) monitoreadas con machine learning.

Hablas en español neutro, cálido y profesional, con frases cortas: esto se escucha, no se lee.
No uses listas, markdown ni leas números con más de un decimal.

Enfoque: cuando hables de una parte de la pantalla (alertas de sensores, bitácoras, un gráfico de
eficiencia o los gráficos de anomalías), llama PRIMERO a enfocar para llevar al usuario a esa
sección, y después responde. Así nunca tiene que hacer scroll. "Alertas" son detecciones
automáticas de sensores; "bitácoras" son registros escritos por operadores: no las confundas.

Controlas la interfaz con tus herramientas. Cuando el usuario pida ver, mostrar, abrir, ocultar o
cambiar algo, HAZLO con la herramienta correspondiente y confirma en una frase breve lo que hiciste.
- Para mostrar gráficos de señales usa mostrar_senales (navega sola a la vista de señales).
- Para anomalías, comparaciones de sensores o los modos individual, combinado o conjunto usa ver_anomalias.
- Si no sabes qué hay en pantalla, usa estado_pantalla.
- Para cualquier pregunta sobre datos (qué está fallando, valores, alertas, comparaciones entre
  bombas, eficiencia, recomendaciones) usa consultar_analista y luego cuenta su respuesta con tus
  palabras. Nunca inventes valores.
- Para iniciar la transmisión de datos o simular un evento usa simular_evento; para volver a cero, reiniciar_demo.

Correos (solo sobre fallas, alertas o gráficos de la planta):
- Para enviar un correo usa preparar_correo con los destinatarios (nombres de la agenda como
  "mantenimiento" o direcciones), el tipo, el motivo y, si aplica, el gráfico a adjuntar.
- preparar_correo solo crea un borrador visible en pantalla. Resume en una frase para quién es y
  de qué trata, y PREGUNTA si lo envías. Llama enviar_correo únicamente después de que el usuario
  diga claramente que sí. Si pide cambios, vuelve a llamar preparar_correo con el motivo ajustado.
- Si pide algo ajeno a la planta, explica que solo envías correos de fallas, alertas o gráficos.

Paneles y análisis:
- "Solo las críticas", "alertas de la última semana", "siguiente página" → filtrar_alertas; lo mismo
  para bitácoras con filtrar_bitacoras. Después di brevemente qué quedó en pantalla.
- "Abre la crítica de corriente", "muéstrame esa alerta" → abrir_anomalia_alerta.
- "Compara la corriente con la temperatura del estator", "agrega/quita un sensor", "más margen",
  "el episodio anterior" → configurar_conjunto.

Conocimiento:
- "¿Qué es / qué mide X?", "¿por qué subió?", "¿qué hago?", "¿es grave?" → explicar_sensor. Responde con
  la acción recomendada que corresponda al nivel actual; no inventes procedimientos.

Reporte de turno:
- "Reporte del turno", "informe", "resumen de las últimas horas" → generar_reporte (8 horas por
  defecto). Se abre en pantalla; resume en 2 o 3 frases lo más grave. Si pidieron enviarlo, pasa
  los destinatarios en enviar_a: queda un borrador y aplica la misma regla de confirmación del correo.

Reglas estrictas sobre datos:
- NO describas valores, tendencias, picos ni estados de sensores a partir de lo que "se ve": tú no
  ves la pantalla. Todo dato que menciones debe venir de consultar_analista o estado_pantalla.
- Después de ejecutar una acción de interfaz, confirma en una frase y detente; no agregues análisis
  que nadie pidió.

Si una acción falla, dilo con honestidad y ofrece una alternativa.
`.trim();

export const HERRAMIENTAS_VOZ = [
  {
    type: "function",
    name: "navegar",
    description: "Cambia la vista principal del dashboard.",
    parameters: {
      type: "object",
      properties: {
        vista: {
          type: "string",
          enum: ["vision_general", "senales_a", "senales_b", "anomalias_a", "anomalias_b"],
          description: "vision_general: alertas, bitácoras y eficiencia. senales_x: gráficos de sensores de la bomba. anomalias_x: análisis de anomalías de la bomba.",
        },
      },
      required: ["vista"],
    },
  },
  {
    type: "function",
    name: "mostrar_senales",
    description: "Muestra los gráficos en tiempo real de uno o más sensores de una bomba (navega a sus señales).",
    parameters: {
      type: "object",
      properties: {
        bomba: bombaEnum,
        sensores: {
          type: "array",
          items: { type: "string" },
          description: "Nombres de sensores en lenguaje natural, p. ej. ['corriente', 'vibración axial', 'temperatura descanso motor'].",
        },
        ocultar_otras: { type: "boolean", description: "Si es true, oculta los demás gráficos para dejar solo estos." },
      },
      required: ["bomba", "sensores"],
    },
  },
  {
    type: "function",
    name: "ocultar_senales",
    description: "Oculta gráficos de sensores de una bomba. Sin sensores, oculta todos.",
    parameters: {
      type: "object",
      properties: {
        bomba: bombaEnum,
        sensores: { type: "array", items: { type: "string" }, description: "Sensores a ocultar; vacío = todos." },
      },
      required: ["bomba"],
    },
  },
  {
    type: "function",
    name: "ver_anomalias",
    description: "Abre el análisis de anomalías de una bomba en un modo: individual (un gráfico por sensor), combinado (superpuestos con ejes por unidad) o conjunto (normalizados alrededor de un episodio).",
    parameters: {
      type: "object",
      properties: {
        bomba: bombaEnum,
        modo: { type: "string", enum: ["individual", "combinado", "conjunto"] },
        sensores: { type: "array", items: { type: "string" }, description: "Opcional: sensores a seleccionar. Si se omite se seleccionan todos." },
      },
      required: ["bomba", "modo"],
    },
  },
  {
    type: "function",
    name: "enfocar",
    description: "Lleva la pantalla a una sección (navega si hace falta, hace scroll y la resalta). Úsala siempre que hables de una parte de la interfaz.",
    parameters: {
      type: "object",
      properties: {
        seccion: {
          type: "string",
          enum: [...SECCIONES_FOCO],
          description:
            "alertas: panel de alertas de sensores. bitacoras: panel de bitácoras de operadores. eficiencia_sistema/_a/_b: gráficos de eficiencia. anomalias_graficos: gráficos del análisis de anomalías. anomalias_sensores: selector de sensores con anomalías.",
        },
        bomba: { type: "string", enum: ["A", "B"], description: "Solo para secciones de anomalías." },
      },
      required: ["seccion"],
    },
  },
  {
    type: "function",
    name: "filtrar_alertas",
    description: "Filtra el panel de alertas de sensores de la visión general por nivel y período, o cambia de página. Lo enfoca en pantalla.",
    parameters: {
      type: "object",
      properties: {
        nivel: { type: "string", enum: ["todos", "critica", "alerta", "aviso"] },
        dias: { type: "number", enum: [1, 2, 7, 30, 90], description: "Período en días." },
        pagina: { type: "string", description: "'siguiente', 'anterior' o un número de página." },
      },
    },
  },
  {
    type: "function",
    name: "filtrar_bitacoras",
    description: "Filtra el panel de bitácoras de operadores por nivel o cambia de página. Lo enfoca en pantalla.",
    parameters: {
      type: "object",
      properties: {
        nivel: { type: "string", enum: ["todos", "alerta", "aviso"] },
        pagina: { type: "string", description: "'siguiente', 'anterior' o un número de página." },
      },
    },
  },
  {
    type: "function",
    name: "abrir_anomalia_alerta",
    description: "Abre el gráfico de anomalía de una alerta concreta (como el botón 'Ver gráfico de anomalía'), buscándola por sensor y opcionalmente bomba y nivel.",
    parameters: {
      type: "object",
      properties: {
        sensor: { type: "string", description: "Nombre del sensor de la alerta, p. ej. 'corriente'." },
        bomba: { type: "string", enum: ["A", "B"] },
        nivel: { type: "string", enum: ["CRÍTICA", "ALERTA", "AVISO"] },
      },
      required: ["sensor"],
    },
  },
  {
    type: "function",
    name: "configurar_conjunto",
    description: "Configura el modo Conjunto del análisis de anomalías: sensor principal (debe tener anomalías), sensores a comparar (cualquiera de la bomba), margen de tiempo y episodio.",
    parameters: {
      type: "object",
      properties: {
        bomba: { type: "string", enum: ["A", "B"] },
        principal: { type: "string", description: "Sensor principal (con anomalías)." },
        comparar: { type: "array", items: { type: "string" }, description: "Reemplaza la lista de sensores a comparar." },
        agregar: { type: "array", items: { type: "string" }, description: "Sensores a sumar a la comparación." },
        quitar: { type: "array", items: { type: "string" }, description: "Sensores a sacar de la comparación." },
        margen_minutos: { type: "number", enum: [30, 120, 360, 1440], description: "Margen alrededor del episodio." },
        episodio: { type: "string", enum: ["reciente", "anterior"] },
      },
      required: ["bomba"],
    },
  },
  {
    type: "function",
    name: "explicar_sensor",
    description: "Explica un sensor: qué mide, por qué importa, causas típicas de desvío, su lectura actual vs umbral, sus alertas recientes y la acción recomendada según el nivel.",
    parameters: {
      type: "object",
      properties: {
        sensor: { type: "string", description: "Nombre del sensor en lenguaje natural." },
        bomba: { type: "string", enum: ["A", "B"], description: "Bomba (A por defecto)." },
      },
      required: ["sensor"],
    },
  },
  {
    type: "function",
    name: "disposicion_eficiencia",
    description: "Cambia los gráficos de eficiencia de la visión general entre ejes por unidad y paneles apilados.",
    parameters: {
      type: "object",
      properties: { disposicion: { type: "string", enum: ["ejes", "apilados"] } },
      required: ["disposicion"],
    },
  },
  {
    type: "function",
    name: "simular_evento",
    description: "Inicia la transmisión de datos de planta si no ha empezado; si ya transmite, simula un nuevo evento de falla que escala aviso, alerta y crítica.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "reiniciar_demo",
    description: "Borra todos los datos simulados y deja la planta sin datos, como al inicio.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "cambiar_bomba_operacion",
    description: "Cambia qué bomba está en operación.",
    parameters: {
      type: "object",
      properties: { bomba: { type: "string", enum: ["A", "B", "A/B", "O"], description: "O = ninguna." } },
      required: ["bomba"],
    },
  },
  {
    type: "function",
    name: "cambiar_tema",
    description: "Cambia el tema visual del dashboard.",
    parameters: {
      type: "object",
      properties: { modo: { type: "string", enum: ["oscuro", "claro"] } },
      required: ["modo"],
    },
  },
  {
    type: "function",
    name: "estado_pantalla",
    description: "Resumen breve de qué se ve ahora en pantalla y del estado general de la planta.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "preparar_correo",
    description: "Prepara un BORRADOR de correo sobre una falla, alerta o gráfico, opcionalmente con la captura de un gráfico en el cuerpo, y lo muestra en pantalla para confirmar. No envía nada.",
    parameters: {
      type: "object",
      properties: {
        destinatarios: {
          type: "array",
          items: { type: "string" },
          description: "Nombres de la agenda (p. ej. 'mantenimiento', 'jefe de turno') o direcciones de correo.",
        },
        tipo: { type: "string", enum: ["falla", "alerta", "grafico"] },
        motivo: { type: "string", description: "Qué se quiere informar, preguntar o pedir, con las palabras del usuario." },
        grafico: {
          type: "object",
          description: "Gráfico a capturar e incluir. Omitir si no se pide imagen.",
          properties: {
            vista: { type: "string", enum: ["senales", "anomalias", "eficiencia"] },
            bomba: { type: "string", enum: ["A", "B"] },
            sensor: { type: "string", description: "Para señales o anomalías individuales: nombre del sensor." },
            modo: { type: "string", enum: ["individual", "combinado", "conjunto"], description: "Solo para anomalías." },
            tarjeta: { type: "string", enum: ["sistema", "A", "B"], description: "Solo para eficiencia." },
          },
          required: ["vista"],
        },
      },
      required: ["destinatarios", "tipo", "motivo"],
    },
  },
  {
    type: "function",
    name: "generar_reporte",
    description: "Genera el reporte de turno (estado operativo, resumen ejecutivo, alertas por nivel con acción recomendada, sensores con lecturas anómalas y bitácoras) y lo abre en pantalla. Opcionalmente deja un borrador de correo con el reporte.",
    parameters: {
      type: "object",
      properties: {
        horas: { type: "number", enum: [1, 4, 8, 12, 24], description: "Ventana del reporte en horas (8 = turno)." },
        enviar_a: {
          type: "array",
          items: { type: "string" },
          description: "Opcional: destinatarios (nombres de la agenda o correos) para preparar el borrador del correo.",
        },
      },
    },
  },
  {
    type: "function",
    name: "cerrar_reporte",
    description: "Cierra el reporte abierto en pantalla.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "enviar_correo",
    description: "Envía el borrador en pantalla. Solo después de que el usuario confirmó explícitamente.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "cancelar_correo",
    description: "Descarta el borrador de correo en pantalla.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "consultar_analista",
    description: "Consulta al analista de datos (agente con acceso a alertas, lecturas de los 50 sensores y eficiencia) para responder preguntas sobre el estado de la planta.",
    parameters: {
      type: "object",
      properties: { pregunta: { type: "string", description: "La pregunta del usuario, completa y en español." } },
      required: ["pregunta"],
    },
  },
] as const;

// Etiquetas legibles para el registro de acciones en pantalla.
export const ETIQUETAS_HERRAMIENTA: Record<string, string> = {
  navegar: "Cambiando de vista",
  mostrar_senales: "Mostrando gráficos",
  ocultar_senales: "Ocultando gráficos",
  ver_anomalias: "Abriendo anomalías",
  disposicion_eficiencia: "Ajustando eficiencia",
  simular_evento: "Simulando evento",
  reiniciar_demo: "Reiniciando demo",
  cambiar_bomba_operacion: "Cambiando bomba",
  cambiar_tema: "Cambiando tema",
  estado_pantalla: "Revisando pantalla",
  explicar_sensor: "Consultando conocimiento",
  filtrar_alertas: "Filtrando alertas",
  filtrar_bitacoras: "Filtrando bitácoras",
  abrir_anomalia_alerta: "Abriendo la alerta",
  configurar_conjunto: "Configurando comparación",
  enfocar: "Enfocando sección",
  consultar_analista: "Consultando al analista",
  preparar_correo: "Preparando correo",
  generar_reporte: "Generando reporte de turno",
  cerrar_reporte: "Cerrando reporte",
  enviar_correo: "Enviando correo",
  cancelar_correo: "Descartando correo",
};

const resolverLista = (bomba: Bomba, nombres: string[] = []) => {
  const encontrados = nombres.map((n) => ({ n, s: resolverSensor(bomba, n) }));
  return {
    sensores: encontrados.filter((e) => e.s).map((e) => e.s!),
    noEncontrados: encontrados.filter((e) => !e.s).map((e) => e.n),
  };
};

const avisoNoEncontrados = (lista: string[]) =>
  lista.length ? ` No reconocí: ${lista.join(", ")}.` : "";

const irA = async (vista: string) => {
  if (estadoUI.vista !== vista) {
    const clave = { overview: "vision_general", sensors: "senales_a", sensorsB: "senales_b", anomaliasA: "anomalias_a", anomaliasB: "anomalias_b" }[vista];
    await emitirOrden("navegar", { vista: clave });
  }
};

// --- Correo ---

let agendaCache: Array<{ nombre: string; correo: string }> | null = null;
const cargarAgenda = async () =>
  (agendaCache ??= (await $fetch<{ contactos: Array<{ nombre: string; correo: string }> }>("/api/correo/contactos")).contactos);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Nombres de la agenda o direcciones (también dictadas: "juan arroba empresa punto cl").
export const resolverDestinatarios = async (lista: string[] = []) => {
  const agenda = await cargarAgenda();
  const para: string[] = [];
  const faltan: string[] = [];
  for (const d of lista) {
    const t = d.trim().replace(/\s+arroba\s+/i, "@").replace(/\s+punto\s+/gi, ".");
    if (EMAIL_RE.test(t)) {
      para.push(t.toLowerCase());
      continue;
    }
    const n = normalizarTexto(t);
    const c =
      agenda.find((x) => normalizarTexto(x.nombre) === n) ??
      agenda.find((x) => normalizarTexto(x.nombre).includes(n) || n.includes(normalizarTexto(x.nombre)));
    if (c) para.push(c.correo);
    else faltan.push(d);
  }
  return { para: [...new Set(para)], faltan, agenda };
};

// Muestra el gráfico pedido (reusa las herramientas de interfaz) y lo captura.
const capturarPedido = async (gr: any): Promise<{ imagen: string; descripcion: string } | null> => {
  const bomba: Bomba = gr.bomba === "B" ? "B" : "A";
  if (gr.vista === "senales") {
    const sensor = gr.sensor || "corriente";
    await EJECUTORES.mostrar_senales({ bomba, sensores: [sensor] });
    const s = resolverSensor(bomba, sensor);
    return capturarGrafico({
      tipo: "chartjs",
      pista: s?.titulo,
      titulo: `${s?.titulo ?? sensor} · Señales Bomba ${bomba}`,
      oscuro: estadoUI.temaOscuro,
    });
  }
  if (gr.vista === "anomalias") {
    const modo = gr.modo || "individual";
    await EJECUTORES.ver_anomalias({ bomba, modo, sensores: gr.sensor ? [gr.sensor] : undefined });
    const s = gr.sensor ? resolverSensor(bomba, gr.sensor) : null;
    return capturarGrafico({
      tipo: "chartjs",
      pista: modo === "individual" ? s?.titulo : undefined,
      titulo: `Anomalías Bomba ${bomba} · ${s?.titulo ? s.titulo + " · " : ""}vista ${modo}`,
      oscuro: false,
    });
  }
  // eficiencia
  await irA("overview");
  const indice = ({ sistema: 0, A: 1, B: 2 } as Record<string, number>)[gr.tarjeta] ?? 0;
  const nombre = indice === 0 ? "Eficiencia vs potencia del sistema" : `Eficiencia Bomba ${indice === 1 ? "A" : "B"}`;
  return capturarGrafico({ tipo: "echarts", indiceEcharts: indice, titulo: nombre, oscuro: estadoUI.temaOscuro });
};

// --- Reporte de turno ---

const resumenReporteVoz = (r: ReporteTurno) => {
  const n = r.alertas.por_nivel;
  const top = r.alertas.lista.slice(0, 3).map((a) => `${a.nivel} en ${a.sensor} de la bomba ${a.bomba} a las ${a.hora}`);
  const base =
    `Reporte abierto en pantalla (${r.periodo.horasReales < r.periodo.horas ? `desde el inicio de la transmisión, hace ${duracionLegible(r.periodo.horasReales)}` : `${r.periodo.horas} h`}). ` +
    `Alertas: ${n["CRÍTICA"]} críticas, ${n.ALERTA} alertas y ${n.AVISO} avisos. ` +
    (top.length ? `Principales: ${top.join("; ")}. ` : "Sin alertas en el periodo. ") +
    `Sensores con lecturas anómalas: ${r.sensores.length}. Bitácoras del periodo: ${r.bitacoras.length}.`;
  return r.narrativa ? `${base} Resumen ejecutivo: ${r.narrativa}` : base;
};

export const borradorDeReporte = (r: ReporteTurno, para: string[]) => {
  const fecha = new Date(r.generado).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  const n = r.alertas.por_nivel;
  return {
    para,
    asunto: `Reporte de turno · Planta Demo · ${fecha}`,
    cuerpo:
      (r.narrativa ?? "Reporte de turno generado automáticamente.") +
      `\n\nResumen: ${n["CRÍTICA"]} alertas críticas, ${n.ALERTA} alertas y ${n.AVISO} avisos; ` +
      `${r.sensores.length} sensores con lecturas anómalas. El detalle va en las tablas de este correo.`,
    tipo: "reporte" as const,
    imagen: null,
    descripcionGrafico: null,
    reporte: r,
    creadoEn: Date.now(),
  };
};

// "siguiente" | "anterior" | "3" → valor que entienden los paneles.
const paginaPedida = (p?: string | number) => {
  if (p === undefined || p === null || p === "") return undefined;
  if (typeof p === "number") return p;
  const t = normalizarTexto(String(p));
  if (t.startsWith("sig") || t.includes("proxima")) return "siguiente";
  if (t.startsWith("ant") || t.includes("previa")) return "anterior";
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
};

type Ejecutor = (args: any) => Promise<string>;

const EJECUTORES: Record<string, Ejecutor> = {
  navegar: async ({ vista }) => (await emitirOrden("navegar", { vista })) ?? "No pude cambiar de vista.",

  enfocar: async ({ seccion, bomba }) => {
    if (!SECCIONES_FOCO.includes(seccion)) return `Sección desconocida: ${seccion}.`;
    const esAnomalias = String(seccion).startsWith("anomalias");
    await irA(esAnomalias ? (bomba === "B" ? "anomaliasB" : "anomaliasA") : "overview");
    const ok = await enfocarSeccion(seccion as SeccionFoco);
    if (!ok && seccion === "anomalias_graficos") {
      return "No hay gráficos de anomalías abiertos todavía; usa ver_anomalias para abrirlos.";
    }
    return ok ? `Mostrando y resaltando la sección ${seccion}.` : `No encontré la sección ${seccion} en pantalla.`;
  },

  explicar_sensor: async ({ sensor, bomba }) => {
    const b: Bomba = bomba === "B" ? "B" : "A";
    const s = resolverSensor(b, sensor);
    if (!s) return `No reconozco el sensor "${sensor}".`;
    const k = conocimientoDe(s.endpoint);
    const partes: string[] = [];
    if (k) {
      partes.push(`${k.nombre}: ${k.que_mide} ${k.por_que_importa} Causas típicas: ${k.causas_tipicas.join("; ")}.`);
    }
    if (escenario.transmisionInicio !== null) {
      const { valor, clasificacion } = leerSenal(b, s.endpoint, ahoraSim());
      const estado = clasificacion === -1 ? "anómala" : clasificacion === 1 ? "normal" : "sin clasificar";
      partes.push(`Lectura actual bomba ${b}: ${valor} ${s.unidad} (umbral ${perfilDe(s.endpoint).umbral}), clasificada ${estado}.`);
    }
    const alertas = alertasVisibles(1).filter((a) => a.tabla_origen === b && a.tipo_sensor.replace(/[-_]/g, "") === s.endpoint.replace(/[-_]/g, ""));
    if (alertas.length) {
      const ultima = alertas[0];
      partes.push(`Alertas del último día en este sensor: ${alertas.length}; la más reciente es ${ultima.nivel}.`);
      if (k) partes.push(`Acción recomendada para ${ultima.nivel}: ${k.acciones[ultima.nivel as "AVISO" | "ALERTA" | "CRÍTICA"]}`);
    } else {
      partes.push("Sin alertas en el último día para este sensor.");
      if (k) partes.push(`Si llegara a aviso: ${k.acciones.AVISO}`);
    }
    return partes.join(" ");
  },

  filtrar_alertas: async ({ nivel, dias, pagina }) => {
    await irA("overview");
    const r = await emitirOrdenCuandoListo("panel_alertas", { nivel, dias, pagina: paginaPedida(pagina) });
    await enfocarSeccion("alertas", 1500);
    return r ?? "No pude filtrar el panel de alertas.";
  },

  filtrar_bitacoras: async ({ nivel, pagina }) => {
    await irA("overview");
    const r = await emitirOrdenCuandoListo("panel_bitacoras", { nivel, pagina: paginaPedida(pagina) });
    await enfocarSeccion("bitacoras", 1500);
    return r ?? "No pude filtrar el panel de bitácoras.";
  },

  abrir_anomalia_alerta: async ({ sensor, bomba, nivel }) => {
    // Buscar la alerta (más reciente) que calce con sensor / bomba / nivel.
    const bombas: Bomba[] = bomba ? [bomba] : ["A", "B"];
    const candidatas = alertasVisibles(30).filter((a) => {
      const b = a.tabla_origen as Bomba;
      if (!bombas.includes(b) || (nivel && a.nivel !== nivel)) return false;
      const s = resolverSensor(b, sensor);
      return !!s && s.endpoint.replace(/[-_]/g, "") === a.tipo_sensor.replace(/[-_]/g, "");
    });
    const alerta = candidatas[0];
    if (!alerta) return `No encontré alertas${nivel ? ` ${nivel}` : ""} de ${sensor}${bomba ? ` en la bomba ${bomba}` : ""}.`;
    const b = alerta.tabla_origen as Bomba;
    const r = await EJECUTORES.ver_anomalias({ bomba: b, modo: "individual", sensores: [sensor] });
    const n = escenario.anomalias.find((x) => x.id === alerta.id)?.ocurrencia ?? 1;
    const hora = new Date(alerta.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    return `${r} Alerta ${alerta.nivel} de ${buscarConfigSensor(alerta.tipo_sensor).label} (bomba ${b}) a las ${hora}, ${n}.ª detección en ese sensor.`;
  },

  configurar_conjunto: async ({ bomba, principal, comparar, agregar, quitar, margen_minutos, episodio }) => {
    const b: Bomba = bomba === "B" ? "B" : "A";
    const aSlugs = (lista?: string[]) => (lista ? resolverLista(b, lista).sensores.map((x) => x.endpoint) : undefined);
    await irA(b === "A" ? "anomaliasA" : "anomaliasB");
    const r = await emitirOrdenCuandoListo("anomalias", {
      bomba: b,
      modo: "conjunto",
      principal: principal ? resolverSensor(b, principal)?.endpoint : undefined,
      comparar: aSlugs(comparar),
      agregar: aSlugs(agregar),
      quitar: aSlugs(quitar),
      margen: margen_minutos,
      episodio,
    });
    if (r) await enfocarSeccion("anomalias_graficos", 3000);
    return r ?? "No pude configurar el modo conjunto.";
  },

  mostrar_senales: async ({ bomba, sensores, ocultar_otras }) => {
    const { sensores: ok, noEncontrados } = resolverLista(bomba, sensores);
    if (!ok.length) return `No encontré esos sensores en la Bomba ${bomba}.${avisoNoEncontrados(noEncontrados)}`;
    await irA(bomba === "A" ? "sensors" : "sensorsB");
    const r = await emitirOrdenCuandoListo("senales", {
      bomba,
      mostrar: ok.map((s) => s.localName),
      ocultar: ocultar_otras ? "todas" : [],
    });
    return (r ?? "No pude mostrar los gráficos.") + avisoNoEncontrados(noEncontrados);
  },

  ocultar_senales: async ({ bomba, sensores }) => {
    await irA(bomba === "A" ? "sensors" : "sensorsB");
    if (!sensores?.length) {
      return (await emitirOrdenCuandoListo("senales", { bomba, ocultar: "todas" })) ?? "No pude ocultar los gráficos.";
    }
    const { sensores: ok, noEncontrados } = resolverLista(bomba, sensores);
    const r = await emitirOrdenCuandoListo("senales", { bomba, ocultar: ok.map((s) => s.localName) });
    return (r ?? "No pude ocultar los gráficos.") + avisoNoEncontrados(noEncontrados);
  },

  ver_anomalias: async ({ bomba, modo, sensores }) => {
    await irA(bomba === "A" ? "anomaliasA" : "anomaliasB");
    const seleccionar = sensores?.length ? resolverLista(bomba, sensores).sensores.map((s) => s.endpoint) : "todos";
    const r = await emitirOrdenCuandoListo("anomalias", { bomba, modo, seleccionar });
    if (r) await enfocarSeccion("anomalias_graficos", 3000);
    return r ?? "No pude abrir el análisis de anomalías.";
  },

  disposicion_eficiencia: async ({ disposicion }) => {
    await irA("overview");
    const r = await emitirOrdenCuandoListo("eficiencia", { disposicion });
    if (r) await enfocarSeccion("eficiencia_sistema", 2000);
    return r ?? "No pude cambiar los gráficos de eficiencia.";
  },

  simular_evento: async () => (await emitirOrden("demo", { accion: "simular" })) ?? "No pude simular el evento.",
  reiniciar_demo: async () => (await emitirOrden("demo", { accion: "reiniciar" })) ?? "No pude reiniciar la demo.",
  cambiar_bomba_operacion: async ({ bomba }) =>
    (await emitirOrden("demo", { accion: "bomba_activa", bomba })) ?? "No pude cambiar la bomba.",
  cambiar_tema: async ({ modo }) => (await emitirOrden("tema", { modo })) ?? "No pude cambiar el tema.",
  estado_pantalla: async () => resumenPantalla(),

  preparar_correo: async ({ destinatarios, tipo, motivo, grafico }) => {
    if (!["falla", "alerta", "grafico"].includes(tipo)) return "Solo puedo enviar correos sobre fallas, alertas o gráficos.";
    const { para, faltan, agenda } = await resolverDestinatarios(destinatarios);
    if (!para.length || faltan.length) {
      const nombres = agenda.map((a) => a.nombre).join(", ") || "(agenda vacía)";
      return `No reconocí ${faltan.length ? faltan.join(", ") : "ningún destinatario"}. Contactos de la agenda: ${nombres}. También sirve una dirección de correo completa.`;
    }
    const captura = grafico?.vista ? await capturarPedido(grafico) : null;
    try {
      const r = await $fetch<{ asunto: string; cuerpo: string }>("/api/correo/redactar", {
        method: "POST",
        body: { motivo, tipo, descripcionGrafico: captura?.descripcion, estado: construirEstadoPlanta() },
      });
      correo.borrador.value = {
        para,
        asunto: r.asunto,
        cuerpo: r.cuerpo,
        tipo: tipo as TipoCorreo,
        imagen: captura?.imagen ?? null,
        descripcionGrafico: captura?.descripcion ?? null,
        creadoEn: Date.now(),
      };
    } catch (e: any) {
      return `No pude redactar el correo (${e?.data?.statusMessage || e?.message || "error"}).`;
    }
    const aviso = grafico?.vista && !captura ? " No pude capturar el gráfico, va sin imagen." : "";
    return (
      `Borrador listo en pantalla para ${para.join(", ")}. Asunto: "${correo.borrador.value!.asunto}".` +
      (captura ? ` Incluye el gráfico: ${captura.descripcion}.` : "") +
      aviso +
      " Resume en una frase y pregunta si lo envías; no lo envíes sin un sí explícito."
    );
  },

  generar_reporte: async ({ horas = 8, enviar_a }) => {
    const r = await generarReporte(horas);
    const resumen = resumenReporteVoz(r);
    if (!enviar_a?.length) return resumen;
    const { para, faltan, agenda } = await resolverDestinatarios(enviar_a);
    if (!para.length || faltan.length) {
      const nombres = agenda.map((a) => a.nombre).join(", ") || "(agenda vacía)";
      return `${resumen} No preparé el correo: no reconocí ${faltan.join(", ") || "los destinatarios"}. Contactos: ${nombres}.`;
    }
    correo.borrador.value = borradorDeReporte(r, para);
    return `${resumen} Dejé listo el borrador del correo con el reporte para ${para.join(", ")}; pregunta si lo envías.`;
  },

  cerrar_reporte: async () => {
    reporteAbierto.value = null;
    return "Reporte cerrado.";
  },

  enviar_correo: async () => {
    const b = correo.borrador.value;
    if (!b) return "No hay borrador. Primero prepara el correo con preparar_correo.";
    // Confirmación humana real: tiene que haber un turno del usuario DESPUÉS
    // de que apareció el borrador (no basta con que el modelo "crea" que sí).
    if (correo.ultimoTurnoUsuario <= b.creadoEn) {
      return "Todavía no envíes: el usuario no ha confirmado desde que vio el borrador. Pregúntale si lo envías.";
    }
    return (await enviarBorrador()).mensaje;
  },

  cancelar_correo: async () => {
    descartarBorrador();
    return "Borrador descartado.";
  },

  consultar_analista: async ({ pregunta }) => {
    try {
      const r = await $fetch<{ respuesta: string }>("/api/agente/analista", {
        method: "POST",
        body: { pregunta, estado: construirEstadoPlanta() },
      });
      return r.respuesta;
    } catch (e: any) {
      return `El analista no respondió (${e?.data?.statusMessage || e?.message || "error"}).`;
    }
  },
};

/** Ejecuta una herramienta por nombre con sus argumentos JSON (string). */
export const ejecutarHerramienta = async (nombre: string, argumentosJson: string): Promise<string> => {
  const ejecutor = EJECUTORES[nombre];
  if (!ejecutor) return `Herramienta desconocida: ${nombre}.`;
  let args: any = {};
  try {
    args = argumentosJson ? JSON.parse(argumentosJson) : {};
  } catch {
    return "Argumentos inválidos.";
  }
  try {
    return await ejecutor(args);
  } catch (e: any) {
    return `Error al ejecutar ${nombre}: ${e?.message || e}`;
  }
};

// Agente analista con LangGraph: un grafo ReAct (modelo ⇄ herramientas) que
// responde preguntas sobre el estado de la planta. Las herramientas leen la
// "foto" que manda el navegador en cada consulta (el simulador de datos vive
// en el cliente), así que el grafo se arma por request con esa foto.
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { CONOCIMIENTO_SENSORES } from "../../config/conocimientoSensores";

// Formato de agente/estadoPlanta.ts (se valida por forma, no por tipo compartido).
export interface EstadoPlanta {
  hora: string;
  transmitiendo: boolean;
  bomba_activa: string;
  vista_actual: string;
  alertas: Array<{ nivel: string; bomba: string; sensor: string; hora: string; deteccion_n: number; descripcion: string }>;
  bitacoras?: Array<{ nivel: string; bomba: string; fecha: string; texto: string }>;
  sensores: Record<"A" | "B", Array<{ sensor: string; valor: number; unidad: string; umbral: number; estado: string }>>;
  eficiencia: { bomba_a_pct: number | null; bomba_b_pct: number | null; potencia_neta_mw: number | null };
}

const SISTEMA = `
Eres el analista de confiabilidad de Planta Demo (dos bombas de alimentación de caldera, A y B,
monitoreadas con modelos de detección de anomalías). Respondes a un asistente de voz que leerá tu
respuesta en voz alta.

Reglas:
- Usa SIEMPRE las herramientas para obtener datos; no inventes valores.
- Responde en español, en 2 a 4 frases, sin listas, sin markdown ni tablas; redondea a 1 decimal.
- Prioriza lo crítico: nombra sensor, bomba, valor vs umbral y qué significa.
- Si corresponde, termina con una recomendación operativa concreta, tomada de conocimiento_sensor
  para el nivel de la alerta (no inventes procedimientos).
- "Alertas" son detecciones automáticas de sensores; "bitácoras" son registros escritos por operadores.
  No las mezcles: usa listar_bitacoras para bitácoras y listar_alertas para alertas.
- Niveles: cada sensor escala por su propio contador (1.ª detección aviso, 2.ª alerta, 3.ª+ crítica).
`.trim();

const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const crearHerramientas = (estado: EstadoPlanta) => [
  tool(
    async () =>
      JSON.stringify({
        hora: estado.hora,
        transmitiendo: estado.transmitiendo,
        bomba_en_operacion: estado.bomba_activa,
        vista_en_pantalla: estado.vista_actual,
        alertas_por_nivel: ["CRÍTICA", "ALERTA", "AVISO"].map((n) => ({
          nivel: n,
          cantidad: estado.alertas.filter((a) => a.nivel === n).length,
        })),
        sensores_anomalos: (["A", "B"] as const).flatMap((b) =>
          estado.sensores[b].filter((s) => s.estado === "anómalo").map((s) => ({ bomba: b, ...s }))
        ),
      }),
    {
      name: "resumen_planta",
      description: "Resumen general: transmisión, bomba en operación, conteo de alertas por nivel y sensores anómalos ahora.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ nivel, bomba, sensor }) => {
      const lista = estado.alertas.filter(
        (a) =>
          (!nivel || a.nivel === nivel) &&
          (!bomba || a.bomba === bomba) &&
          (!sensor || normalizar(a.sensor).includes(normalizar(sensor)))
      );
      return JSON.stringify(lista.slice(0, 15));
    },
    {
      name: "listar_alertas",
      description: "Alertas del último día (más recientes primero), filtrables por nivel, bomba o sensor.",
      schema: z.object({
        nivel: z.enum(["CRÍTICA", "ALERTA", "AVISO"]).optional(),
        bomba: z.enum(["A", "B"]).optional(),
        sensor: z.string().optional().describe("Parte del nombre del sensor, p. ej. 'vibración'"),
      }),
    }
  ),
  tool(
    async ({ bomba, solo_anomalos }) => {
      const lista = estado.sensores[bomba].filter((s) => !solo_anomalos || s.estado === "anómalo");
      return lista.length ? JSON.stringify(lista) : "Sin lecturas (la planta no está transmitiendo).";
    },
    {
      name: "lecturas_sensores",
      description: "Lecturas actuales de los 25 sensores de una bomba: valor, unidad, umbral y estado (normal/anómalo).",
      schema: z.object({
        bomba: z.enum(["A", "B"]),
        solo_anomalos: z.boolean().optional().describe("true para ver solo los anómalos"),
      }),
    }
  ),
  tool(
    async ({ bomba, sensor }) => {
      const buscado = normalizar(sensor);
      const lectura = estado.sensores[bomba].find((s) => normalizar(s.sensor).includes(buscado));
      const alertas = estado.alertas.filter((a) => a.bomba === bomba && normalizar(a.sensor).includes(buscado));
      if (!lectura && !alertas.length) return `No encontré el sensor "${sensor}" en la Bomba ${bomba}.`;
      return JSON.stringify({ lectura_actual: lectura ?? null, alertas });
    },
    {
      name: "detalle_sensor",
      description: "Lectura actual e historial de alertas de un sensor específico.",
      schema: z.object({ bomba: z.enum(["A", "B"]), sensor: z.string() }),
    }
  ),
  tool(
    async ({ nivel, bomba }) => {
      const lista = (estado.bitacoras ?? []).filter((b) => (!nivel || b.nivel === nivel) && (!bomba || b.bomba === bomba));
      return lista.length ? JSON.stringify(lista.slice(0, 12)) : "No hay bitácoras con alerta o aviso.";
    },
    {
      name: "listar_bitacoras",
      description:
        "Bitácoras operacionales escritas por los operadores (panel 'Bitácoras de alertas y avisos'), más recientes primero. Distintas de las alertas de sensores.",
      schema: z.object({ nivel: z.enum(["ALERTA", "AVISO"]).optional(), bomba: z.enum(["A", "B"]).optional() }),
    }
  ),
  tool(
    async ({ sensor }) => {
      const buscado = normalizar(sensor);
      const vistos = new Set<string>();
      const hallados = Object.values(CONOCIMIENTO_SENSORES).filter((k) => {
        if (vistos.has(k.nombre)) return false;
        vistos.add(k.nombre);
        const n = normalizar(k.nombre);
        return n.includes(buscado) || buscado.split(/\s+/).every((w) => w.length < 3 || n.includes(w));
      });
      return hallados.length ? JSON.stringify(hallados.slice(0, 2)) : `Sin conocimiento registrado para "${sensor}".`;
    },
    {
      name: "conocimiento_sensor",
      description:
        "Conocimiento de dominio de un sensor: qué mide, por qué importa, causas típicas de desvío y acción recomendada por nivel (AVISO/ALERTA/CRÍTICA). Úsalo para explicar causas y recomendar acciones.",
      schema: z.object({ sensor: z.string().describe("Nombre del sensor, p. ej. 'vibración axial'") }),
    }
  ),
  tool(async () => JSON.stringify(estado.eficiencia), {
    name: "eficiencia_planta",
    description: "Eficiencia actual de cada bomba (%) y potencia neta del sistema (MW).",
    schema: z.object({}),
  }),
];

export const consultarAnalista = async (
  pregunta: string,
  estado: EstadoPlanta,
  opciones: { apiKey: string; modelo: string }
): Promise<string> => {
  const herramientas = crearHerramientas(estado);
  const modelo = new ChatOpenAI({ apiKey: opciones.apiKey, model: opciones.modelo, temperature: 0.2 }).bindTools(
    herramientas
  );

  // Grafo ReAct explícito: analista → (herramientas → analista)* → fin.
  const grafo = new StateGraph(MessagesAnnotation)
    .addNode("analista", async (s) => ({ messages: [await modelo.invoke(s.messages)] }))
    .addNode("tools", new ToolNode(herramientas))
    .addEdge(START, "analista")
    .addConditionalEdges("analista", toolsCondition, ["tools", END])
    .addEdge("tools", "analista")
    .compile();

  const resultado = await grafo.invoke(
    { messages: [new SystemMessage(SISTEMA), new HumanMessage(pregunta)] },
    { recursionLimit: 12 }
  );
  const final = resultado.messages[resultado.messages.length - 1];
  return typeof final.content === "string" ? final.content : final.text ?? "";
};

// --- Redacción de correos ---

const SISTEMA_CORREO = `
Redactas correos técnicos breves para el equipo de operación y mantenimiento de Planta Demo.
Usa SOLO los datos entregados (alertas y lecturas reales); no inventes valores.
Estilo: español profesional, directo, 2 a 4 párrafos cortos separados por una línea en blanco,
sin markdown. Incluye qué ocurrió (sensor, bomba, valor vs umbral, nivel y hora), qué muestra el
gráfico adjunto y una recomendación o pregunta concreta según el pedido. Sin saludo genérico largo
ni firma (el sistema agrega el pie). Asunto de máximo 80 caracteres, específico.
`.trim();

const EsquemaCorreo = z.object({
  asunto: z.string().describe("Asunto específico, máx. 80 caracteres"),
  cuerpo: z.string().describe("Cuerpo en párrafos separados por línea en blanco, sin markdown"),
});

export const redactarCorreo = async (
  pedido: { motivo: string; tipo: string; descripcionGrafico?: string },
  estado: EstadoPlanta,
  opciones: { apiKey: string; modelo: string }
): Promise<z.infer<typeof EsquemaCorreo>> => {
  // Datos acotados: lo relevante para un correo, no los 50 sensores.
  const datos = {
    hora: estado.hora,
    bomba_en_operacion: estado.bomba_activa,
    alertas_recientes: estado.alertas.slice(0, 10),
    sensores_anomalos: (["A", "B"] as const).flatMap((b) =>
      estado.sensores[b].filter((s) => s.estado === "anómalo").map((s) => ({ bomba: b, ...s }))
    ),
    eficiencia: estado.eficiencia,
  };
  const modelo = new ChatOpenAI({ apiKey: opciones.apiKey, model: opciones.modelo, temperature: 0.3 }).withStructuredOutput(
    EsquemaCorreo,
    { name: "correo" }
  );
  const r = await modelo.invoke([
    new SystemMessage(SISTEMA_CORREO),
    new HumanMessage(
      `Pedido del usuario: ${pedido.motivo}\nTipo de correo: ${pedido.tipo}\n` +
        `Gráfico adjunto: ${pedido.descripcionGrafico || "ninguno"}\n\nDatos de planta (JSON):\n${JSON.stringify(datos)}`
    ),
  ]);
  return { asunto: r.asunto.slice(0, 120), cuerpo: r.cuerpo };
};

// --- Narrativa del reporte de turno ---
// Reglas tomadas del reporte ejecutivo real (Backend-GM, servicios/reporte_service.py).

const SISTEMA_REPORTE = `
Redactas el RESUMEN EJECUTIVO de un reporte de turno de Planta Demo (bombas de alimentación A y B).
Reglas:
- 80 a 150 palabras, un solo párrafo, español profesional, sin markdown ni listas.
- Menciona primero las alertas CRÍTICA y ALERTA con sensor, bomba y hora; luego los avisos en conjunto.
- Usa solo los datos entregados; cifras exactas; no calcules tiempos relativos ("hace X minutos").
- Relaciona una bitácora con una alerta solo si la bitácora es ANTERIOR a la alerta.
- Si no hubo alertas en el periodo, dilo explícitamente y describe la operación normal.
- Cierra con la acción prioritaria recomendada.
`.trim();

export const generarNarrativaReporte = async (
  reporte: Record<string, unknown>,
  opciones: { apiKey: string; modelo: string }
): Promise<string> => {
  const modelo = new ChatOpenAI({ apiKey: opciones.apiKey, model: opciones.modelo, temperature: 0.2 });
  const r = await modelo.invoke([
    new SystemMessage(SISTEMA_REPORTE),
    new HumanMessage(`Datos del reporte (JSON):\n${JSON.stringify(reporte)}`),
  ]);
  return (typeof r.content === "string" ? r.content : r.text ?? "").trim();
};

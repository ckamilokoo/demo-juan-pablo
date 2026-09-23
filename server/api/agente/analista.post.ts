// Analista de datos (LangGraph) que el agente de voz consulta con la
// herramienta `consultar_analista`. Recibe la pregunta y la foto del estado
// de la planta que arma el navegador.
import { consultarAnalista, type EstadoPlanta } from "../../utils/analista";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: "Falta OPENAI_API_KEY en el archivo .env del proyecto" });
  }

  const body = await readBody<{ pregunta?: string; estado?: EstadoPlanta }>(event);
  if (!body?.pregunta || !body?.estado?.sensores) {
    throw createError({ statusCode: 400, statusMessage: "Se requiere pregunta y estado" });
  }

  try {
    const respuesta = await consultarAnalista(body.pregunta, body.estado, {
      apiKey: config.openaiApiKey,
      modelo: config.openaiModelo,
    });
    return { respuesta };
  } catch (e: any) {
    console.error("[analista] Error:", e?.message || e);
    throw createError({ statusCode: 502, statusMessage: `El analista falló: ${e?.message || "error"}` });
  }
});

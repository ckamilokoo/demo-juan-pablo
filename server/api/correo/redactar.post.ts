// Redacta asunto y cuerpo de un correo sobre fallas, alertas o gráficos,
// a partir de la foto del estado de la planta que manda el navegador.
import { redactarCorreo, type EstadoPlanta } from "../../utils/analista";
import { TIPOS_CORREO, type TipoCorreo } from "../../utils/correo";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: "Falta OPENAI_API_KEY en el archivo .env del proyecto" });
  }
  const b = await readBody<{ motivo?: string; tipo?: TipoCorreo; descripcionGrafico?: string; estado?: EstadoPlanta }>(event);
  if (!b?.motivo || !b?.estado?.sensores || !b.tipo || !TIPOS_CORREO.includes(b.tipo)) {
    throw createError({ statusCode: 400, statusMessage: "Se requiere motivo, tipo (falla/alerta/grafico) y estado" });
  }
  try {
    return await redactarCorreo(
      { motivo: b.motivo, tipo: b.tipo, descripcionGrafico: b.descripcionGrafico },
      b.estado,
      { apiKey: config.openaiApiKey, modelo: config.openaiModelo }
    );
  } catch (e: any) {
    console.error("[correo] Error al redactar:", e?.message || e);
    throw createError({ statusCode: 502, statusMessage: `No se pudo redactar el correo: ${e?.message || "error"}` });
  }
});

// Resumen ejecutivo (LLM) del reporte de turno que arma el navegador.
import { generarNarrativaReporte } from "../../utils/analista";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: "Falta OPENAI_API_KEY en el archivo .env del proyecto" });
  }
  const r = await readBody<Record<string, any>>(event);
  if (!r?.periodo || !r?.alertas) throw createError({ statusCode: 400, statusMessage: "Reporte inválido" });
  // Solo lo necesario para redactar (acota tokens y evita pasar campos ajenos).
  const datos = {
    periodo: r.periodo,
    estado: r.estado,
    alertas: { por_nivel: r.alertas.por_nivel, lista: (r.alertas.lista ?? []).slice(0, 20) },
    sensores: (r.sensores ?? []).slice(0, 10),
    bitacoras: (r.bitacoras ?? []).slice(0, 8),
  };
  try {
    return { narrativa: await generarNarrativaReporte(datos, { apiKey: config.openaiApiKey, modelo: config.openaiModelo }) };
  } catch (e: any) {
    console.error("[reporte] Error en narrativa:", e?.message || e);
    throw createError({ statusCode: 502, statusMessage: `No se pudo redactar el resumen: ${e?.message || "error"}` });
  }
});

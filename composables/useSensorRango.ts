import { authFetch } from "~/utils/authFetch";

/**
 * Fetch de datos de un sensor (con o sin anomalías) en un rango de tiempo específico.
 * Usado en el gráfico combinado de Análisis de Anomalías para agregar sensores que
 * NO tuvieron anomalías, comparándolos contra el mismo rango temporal de los sensores
 * que sí las tuvieron. También usado en modo Conjunto para traer TODOS los sensores
 * (con y sin anomalía) sobre una ventana temporal común.
 *
 * @param tipoSensor - slug igual al campo `endpoint` de bombasConfig.ts (A con guiones, B con guion bajo)
 * @param bomba - 'A' | 'B'
 * @param fechaInicio - ISO 8601 CON offset (ej. "2026-09-13T18:53:00.000Z"). Sin
 *   zona horaria el backend asume UTC, no hora local: la ventana queda corrida.
 * @param fechaFin - ISO 8601 con offset, ídem
 * @param maxPuntos - opcional, límite de puntos a devolver (el backend submuestrea
 *   preservando siempre los puntos anómalos). Si el backend aún no soporta el
 *   parámetro, se ignora sin romper.
 */
export const fetchDatosSensorRango = async (
  tipoSensor: string,
  bomba: "A" | "B",
  fechaInicio: string,
  fechaFin: string,
  maxPuntos?: number
) => {
  const { apiUrl } = useRuntimeConfig().public;

  // Base explícita: en la demo apiUrl es relativa ("/api") y `new URL` sin
  // base lanza "Invalid URL" (todos los sensores quedaban "SIN DATOS").
  const url = new URL(`${apiUrl}/alertas_umbral/sensor/${bomba}/${tipoSensor}/datos`, window.location.origin);
  url.searchParams.append("fecha_inicio", fechaInicio);
  url.searchParams.append("fecha_fin", fechaFin);
  if (maxPuntos) {
    url.searchParams.append("max_puntos", String(maxPuntos));
  }

  const response = await authFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error al obtener datos de ${tipoSensor}`);
  }
  return await response.json();
};

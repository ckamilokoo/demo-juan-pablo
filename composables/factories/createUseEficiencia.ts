import { useQuery } from "@tanstack/vue-query";
import { ref, computed, type Ref } from "vue";
import { authFetch } from "~/utils/authFetch";
import { BOMBAS_CONFIG, type BombaId } from "~/config/bombasConfig";
import { REFRESCO_EFICIENCIA_MS } from "~/config/demo";

// Fila que devuelve /sensores/eficiencia y /sensores_b/eficiencia
export interface RegistroEficiencia {
  id: number;
  clasificacion: number;      // fijo en 1 (las tablas no tienen ML)
  tiempo_sensor: string;      // "19:34:00"
  valor_sensor: number;       // eficiencia %
  potencia_kw: number;
  presion_bar: number;
  flujo_kg_h: number;
  tiempo_ejecucion: string;   // ISO 8601
}

// Ventana por defecto de los gráficos de eficiencia del Overview.
// Demo: 1 día para que el avance en vivo del borde derecho sea visible.
export const EFICIENCIA_DIAS_DEFAULT = 1;

// Con 14 días de datos, refrescar cada minuto mueve el gráfico casi nada y
// descarga la ventana completa cada vez. 5 min es suficiente.
// Exportada para que otros composables de la misma familia (ej. usePotencias)
// usen exactamente el mismo intervalo de refetch/staleTime.
// Demo: refresco casi en vivo (config/demo.ts).
export const EFICIENCIA_REFETCH_MS = REFRESCO_EFICIENCIA_MS;

// Tope de puntos que devuelve el backend con `dias` (submuestreo uniforme por
// stride, filas reales, conserva primer y último registro). ~12.000 filas en
// 14 días de bomba B; 2000 deja ~1 punto cada 10 min y ~300 KB por bomba.
// Máximo permitido: 5000.
export const EFICIENCIA_MAX_PUNTOS = 2000;

// URL completa para cualquier endpoint que comparta el contrato de
// dias/max_puntos (eficiencia, potencias, ...).
// Contrato backend: dias (1-14) > inicio/termino > limite. max_puntos aplica
// con dias o rango. Orden siempre ascendente. Backend con `dias` en prod
// desde el 2026-09-16 (commit a708dce); ya no se manda `limite`.
export const urlRangoDias = (apiUrl: string, endpoint: string, dias: number): string => {
  const params = new URLSearchParams({
    dias: String(dias),
    max_puntos: String(EFICIENCIA_MAX_PUNTOS),
  });
  return `${apiUrl}${endpoint}?${params}`;
};

// URL de eficiencia por bomba. Compartida con el prefetch de
// pages/callback.vue para que ambos pidan exactamente lo mismo.
export const urlEficiencia = (apiUrl: string, bombaId: BombaId, dias: number): string =>
  urlRangoDias(apiUrl, BOMBAS_CONFIG[bombaId].eficienciaEndpoint, dias);

// queryKey compartida con el prefetch de pages/callback.vue.
export const queryKeyEficiencia = (bombaId: BombaId, dias: number) =>
  [`eficiencia-${bombaId}`, "dias", dias] as const;

const tiempoMs = <T extends { tiempo_ejecucion: string }>(r: T): number => {
  const t = Date.parse(r.tiempo_ejecucion);
  return Number.isNaN(t) ? 0 : t;
};

// Acepta {data: [...]} o arreglo directo. El backend ya devuelve ascendente en
// todos los modos; el sort es defensivo (versiones viejas del modo rango
// venían descendentes) y barato para <= 5000 filas.
// Genérica para que cualquier serie con `tiempo_ejecucion` (eficiencia,
// potencias, ...) reutilice la misma normalización.
export const normalizarSerieTemporal = <T extends { tiempo_ejecucion: string }>(
  payload: unknown
): T[] => {
  const p = payload as { data?: T[] } | T[] | null | undefined;
  const filas: T[] = Array.isArray(p) ? p : p?.data ?? [];
  return [...filas].sort((a, b) => tiempoMs(a) - tiempoMs(b));
};

export const normalizarEficiencia = (payload: unknown): RegistroEficiencia[] =>
  normalizarSerieTemporal<RegistroEficiencia>(payload);

/**
 * Factory para el composable de eficiencia.
 * Pide los últimos `dias` días (param `dias` del backend) submuestreados a
 * EFICIENCIA_MAX_PUNTOS.
 */
export const createUseEficiencia = (bombaId: BombaId) => {
  const config = BOMBAS_CONFIG[bombaId];

  const fetchEficiencia = async (dias: number): Promise<RegistroEficiencia[]> => {
    const { apiUrl } = useRuntimeConfig().public;
    try {
      const response = await authFetch(urlEficiencia(apiUrl, bombaId, dias));
      if (!response.ok) {
        console.warn(`Error ${response.status} en ${config.eficienciaEndpoint}`);
        return [];
      }
      return normalizarEficiencia(await response.json());
    } catch (e) {
      console.error(`Error fetching ${config.eficienciaEndpoint}:`, e);
      return [];
    }
  };

  return (diasRef: Ref<number> = ref(EFICIENCIA_DIAS_DEFAULT)) => {
    const { data, isLoading, error, refetch } = useQuery({
      queryKey: computed(() => queryKeyEficiencia(bombaId, diasRef.value)),
      queryFn: () => fetchEficiencia(diasRef.value),
      refetchInterval: EFICIENCIA_REFETCH_MS,
      staleTime: 0,
    });

    return {
      eficiencia: computed<RegistroEficiencia[]>(() => data.value || []),
      isLoadingEficiencia: isLoading,
      errorEficiencia: error,
      refetchEficiencia: refetch,
      bombaId: config.id,
    };
  };
};

export type UseEficienciaReturn = ReturnType<ReturnType<typeof createUseEficiencia>>;

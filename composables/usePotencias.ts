import { useQuery } from "@tanstack/vue-query";
import { ref, computed, type Ref } from "vue";
import { authFetch } from "~/utils/authFetch";
import {
  EFICIENCIA_DIAS_DEFAULT,
  EFICIENCIA_REFETCH_MS,
  urlRangoDias,
  normalizarSerieTemporal,
} from "~/composables/factories/createUseEficiencia";

// Fila que devuelve /sensores/potencias.
export interface RegistroPotencia {
  id: number;
  clasificacion: number;
  tiempo_sensor: string;         // "02:14:00"
  valor_sensor: number;          // alias de valor_neto
  valor_neto: number;
  valor_bruto: number;           // hoy siempre 0.0 (tags de origen caídos)
  contador_anomalias: number | null;
  tiempo_ejecucion: string;      // ISO 8601
}

// Mismo contrato de query params que /sensores/eficiencia:
// dias (1-14) > inicio/termino > limite. max_puntos aplica con dias o rango.
// Orden siempre ascendente.
export const POTENCIAS_ENDPOINT = "/sensores/potencias";

// queryKey compartida con el prefetch de pages/callback.vue.
export const queryKeyPotencias = (dias: number) => ["potencias", "dias", dias] as const;

// URL completa. Reutiliza urlRangoDias (misma factory que urlEficiencia) para
// que ambos endpoints pidan los parámetros exactamente igual.
export const urlPotencias = (apiUrl: string, dias: number): string =>
  urlRangoDias(apiUrl, POTENCIAS_ENDPOINT, dias);

// Acepta {data: [...]} o arreglo directo, ordena ascendente por
// tiempo_ejecucion. Misma lógica que normalizarEficiencia vía el helper
// genérico compartido.
export const normalizarPotencias = (payload: unknown): RegistroPotencia[] =>
  normalizarSerieTemporal<RegistroPotencia>(payload);

const fetchPotencias = async (dias: number): Promise<RegistroPotencia[]> => {
  const { apiUrl } = useRuntimeConfig().public;
  try {
    const response = await authFetch(urlPotencias(apiUrl, dias));
    if (!response.ok) {
      console.warn(`Error ${response.status} en ${POTENCIAS_ENDPOINT}`);
      return [];
    }
    return normalizarPotencias(await response.json());
  } catch (e) {
    console.error(`Error fetching ${POTENCIAS_ENDPOINT}:`, e);
    return [];
  }
};

/**
 * Composable de potencias (/sensores/potencias). Mismo patrón que
 * createUseEficiencia: pide los últimos `dias` días, refetch/staleTime de
 * EFICIENCIA_REFETCH_MS.
 */
export const usePotencias = (diasRef: Ref<number> = ref(EFICIENCIA_DIAS_DEFAULT)) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: computed(() => queryKeyPotencias(diasRef.value)),
    queryFn: () => fetchPotencias(diasRef.value),
    refetchInterval: EFICIENCIA_REFETCH_MS,
    staleTime: 0,
  });

  return {
    potencias: computed<RegistroPotencia[]>(() => data.value || []),
    isLoadingPotencias: isLoading,
    errorPotencias: error,
    refetchPotencias: refetch,
  };
};

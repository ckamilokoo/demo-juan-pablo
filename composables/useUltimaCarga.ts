import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { authFetch } from "~/utils/authFetch";
import { REFRESCO_DEMO_MS } from "~/config/demo";

/**
 * Composable para consultar cuándo fue la última carga de datos de señales
 * (sensores) y de bitácoras. Consulta /estado-datos/ultima-carga cada 5 min.
 * Las horas vienen ya convertidas a hora de Chile desde el backend.
 */

export interface UltimaCargaSeccion {
  ultima_carga: string | null; // ISO naive (hora Chile)
  texto: string | null; // "dd-mm-YYYY HH:MM:SS"
  hace_minutos: number | null;
  bomba_a?: string | null;
  bomba_b?: string | null;
}

export interface UltimaCargaResponse {
  ahora: string;
  zona_horaria: string;
  senales: UltimaCargaSeccion;
  bitacoras: UltimaCargaSeccion;
}

/** Convierte minutos transcurridos en texto relativo ("hace 2 min", "hace 3 días"). */
export const formatoRelativo = (minutos: number | null | undefined): string => {
  if (minutos === null || minutos === undefined) return "sin datos";
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
};

export const useUltimaCarga = () => {
  const { apiUrl } = useRuntimeConfig().public;

  const fetchUltimaCarga = async (): Promise<UltimaCargaResponse> => {
    const response = await authFetch(`${apiUrl}/estado-datos/ultima-carga`);
    if (!response.ok) {
      throw new Error("Error al obtener la última carga de datos");
    }
    return await response.json();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["ultimaCarga"],
    queryFn: fetchUltimaCarga,
    refetchInterval: REFRESCO_DEMO_MS,
    staleTime: 0,
  });

  const senales = computed<UltimaCargaSeccion | null>(() => data.value?.senales ?? null);
  const bitacoras = computed<UltimaCargaSeccion | null>(() => data.value?.bitacoras ?? null);

  const senalesRelativo = computed(() => formatoRelativo(senales.value?.hace_minutos));
  const bitacorasRelativo = computed(() => formatoRelativo(bitacoras.value?.hace_minutos));

  return {
    data,
    senales,
    bitacoras,
    senalesRelativo,
    bitacorasRelativo,
    isLoading,
    error,
  };
};

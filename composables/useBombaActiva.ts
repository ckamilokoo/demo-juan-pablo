import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { authFetch } from "~/utils/authFetch";
import { REFRESCO_DEMO_MS } from "~/config/demo";

/**
 * Composable para consultar qué bomba está activa actualmente.
 * Consulta /bomba_activa/actual cada 60 segundos.
 * Retorna "A", "B", o "A/B".
 */
export const useBombaActiva = () => {
  const { apiUrl } = useRuntimeConfig().public;

  const fetchBombaActiva = async () => {
    const response = await authFetch(`${apiUrl}/bomba_activa/actual`);
    if (!response.ok) {
      throw new Error("Error al obtener bomba activa");
    }
    return await response.json();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["bombaActiva"],
    queryFn: fetchBombaActiva,
    refetchInterval: REFRESCO_DEMO_MS,
    staleTime: 0,
  });

  const bombaActiva = computed<string>(() => {
    return data.value?.bomba_activa || "A/B"; // Default: ambas si no hay datos
  });

  // "O" (ninguna activa) se trata igual que "A/B": las alertas se quedan donde se generaron
  const esBombaAActiva = computed(() => {
    return bombaActiva.value === "A" || bombaActiva.value === "A/B" || bombaActiva.value === "O";
  });

  const esBombaBActiva = computed(() => {
    return bombaActiva.value === "B" || bombaActiva.value === "A/B" || bombaActiva.value === "O";
  });

  return {
    bombaActiva,
    esBombaAActiva,
    esBombaBActiva,
    isLoading,
    error,
  };
};

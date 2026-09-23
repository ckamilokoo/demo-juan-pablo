import { useQuery } from "@tanstack/vue-query";
import { ref, computed, type Ref } from "vue";
import { authFetch } from "~/utils/authFetch";
import { REFRESCO_DEMO_MS } from "~/config/demo";

// Función para obtener alertas con filtro de días
const fetchAlertas = async (dias: number) => {
  const { apiUrl } = useRuntimeConfig().public;
  const response = await authFetch(`${apiUrl}/alertas_umbral/todas_alertas?dias=${dias}`);
  if (!response.ok) {
    throw new Error(`Error al obtener alertas: ${response.status}`);
  }
  const data = await response.json();

  // Manejar ambos formatos: array directo o {data: [...]}
  const alertasArray = Array.isArray(data) ? data : (data.data || []);

  return {
    alertas: alertasArray,
    totalAlertas: data.total_alertas || alertasArray.length,
    filtroDias: data.filtro_dias || dias
  };
};

export const useAlertas = (diasRef: Ref<number> = ref(2)) => {
  // Consulta de alertas con el filtro de días
  const { data, isLoading: alertasLoading, isError: isError_alerta, error: error_alerta, refetch } = useQuery({
    queryKey: computed(() => ["alertas", diasRef.value]),
    queryFn: () => fetchAlertas(diasRef.value),
    refetchInterval: REFRESCO_DEMO_MS,
    staleTime: 0,
  });

  const alertas = computed(() => data.value?.alertas || []);
  const totalAlertas = computed(() => data.value?.totalAlertas || 0);
  const filtroDias = computed(() => data.value?.filtroDias || diasRef.value);

  return {
    alertas,
    totalAlertas,
    filtroDias,
    isLoading_alerta: alertasLoading,
    isError_alerta,
    error_alerta,
    refetchAlertas: refetch
  };
};
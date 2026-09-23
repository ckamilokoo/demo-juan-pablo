import { useQuery } from "@tanstack/vue-query";
import { authFetch } from "~/utils/authFetch";
import { BOMBAS_CONFIG, type BombaId } from "~/config/bombasConfig";

/**
 * Factory function para crear composables de predicciones
 * Genera la query para obtener predicciones de cada bomba
 */
export const createUsePredicciones = (bombaId: BombaId) => {
  const config = BOMBAS_CONFIG[bombaId];
  const queryKey = bombaId === 'A' ? 'prediccionesBombaA' : 'prediccionesBombab';

  // Funcion fetch para predicciones
  const fetchPredicciones = async () => {
    const { apiUrl } = useRuntimeConfig().public;
    const response = await authFetch(`${apiUrl}${config.prediccionEndpoint}`);
    if (!response.ok) throw new Error("Error al obtener predicciones");
    return await response.json();
  };

  // Retornar el composable
  return () => {
    const { data, isLoading, error } = useQuery({
      queryKey: [queryKey],
      queryFn: fetchPredicciones,
      refetchInterval: 60000,
      staleTime: 30000,
    });

    // Retornar con nombres consistentes para ambas bombas
    // Esto permite usar el mismo nombre de variable independientemente de la bomba
    return {
      predicciones: data,
      isLoadingPredicciones: isLoading,
      errorPredicciones: error,
      bombaId: config.id,
    };
  };
};

// Tipos para el retorno del composable
export type UsePrediccionesReturn = ReturnType<ReturnType<typeof createUsePredicciones>>;

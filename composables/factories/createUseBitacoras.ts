import { useQuery } from "@tanstack/vue-query";
import { authFetch } from "~/utils/authFetch";
import { BOMBAS_CONFIG, type BombaId } from "~/config/bombasConfig";

/**
 * Factory function para crear composables de bitacoras
 * Genera las queries para bitacoras normales y de fallas
 */
export const createUseBitacoras = (bombaId: BombaId) => {
  const config = BOMBAS_CONFIG[bombaId];
  const queryKeyPrefix = bombaId === 'A' ? 'bitacoras' : 'bitacorasB';

  // Funcion fetch para todas las bitacoras
  const fetchBitacoras = async () => {
    const { apiUrl } = useRuntimeConfig().public;
    const response = await authFetch(`${apiUrl}${config.bitacorasEndpoint}/todas`);
    const data = await response.json();
    return data.data || data;
  };

  // Funcion fetch para bitacoras de fallas
  const fetchBitacorasFallas = async () => {
    const { apiUrl } = useRuntimeConfig().public;
    const response = await authFetch(`${apiUrl}${config.bitacorasEndpoint}/todas_fallas`);
    const data = await response.json();
    return data.data || data;
  };

  // Retornar el composable
  return () => {
    // Query para todas las bitacoras
    const { data: bitacoras, isLoading: bitacorasLoading } = useQuery({
      queryKey: [queryKeyPrefix],
      queryFn: fetchBitacoras,
      refetchInterval: 15 * 60 * 1000, // 15 minutos
      staleTime: 10 * 60 * 1000,
    });

    // Query para bitacoras de fallas
    const { data: bitacorasFallas, isLoading: bitacorasFallasLoading } = useQuery({
      queryKey: [`${queryKeyPrefix}Fallas`],
      queryFn: fetchBitacorasFallas,
      refetchInterval: 15 * 60 * 1000, // 15 minutos
      staleTime: 10 * 60 * 1000,
    });

    return {
      bitacoras,
      bitacorasFallas,
      isLoading: bitacorasLoading || bitacorasFallasLoading,
      bombaId: config.id,
    };
  };
};

// Tipos para el retorno del composable
export type UseBitacorasReturn = ReturnType<ReturnType<typeof createUseBitacoras>>;

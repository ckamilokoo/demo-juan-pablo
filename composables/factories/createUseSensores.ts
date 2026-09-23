import { useQuery } from "@tanstack/vue-query";
import { authFetch } from "~/utils/authFetch";
import { ref, computed, reactive, type Ref } from "vue";
import { BOMBAS_CONFIG, getAllSensores, type BombaId } from "~/config/bombasConfig";
import { REFRESCO_DEMO_MS } from "~/config/demo";

/**
 * Factory function para crear composables de sensores
 * Genera dinamicamente todas las queries basandose en la configuracion de la bomba
 */
export const createUseSensores = (bombaId: BombaId) => {
  const config = BOMBAS_CONFIG[bombaId];
  const allSensores = getAllSensores(bombaId);

  // Funcion fetch generica para sensores
  const fetchSensor = async (endpoint: string, limite: number = 40) => {
    const { apiUrl } = useRuntimeConfig().public;
    try {
      const response = await authFetch(
        `${apiUrl}${config.sensoresEndpoint}/${endpoint}?limite=${limite}`
      );
      if (!response.ok) {
        console.warn(
          `Error ${response.status} en endpoint: ${config.sensoresEndpoint}/${endpoint}`
        );
        return [];
      }
      const data = await response.json();
      return data.data || data || [];
    } catch (e) {
      console.error(`Error fetching ${config.sensoresEndpoint}/${endpoint}:`, e);
      return [];
    }
  };

  // Retornar el composable
  return (limiteRef: Ref<number> = ref(40)) => {
    // Crear estado de habilitacion dinamicamente
    const sensoresHabilitados = reactive<Record<string, boolean>>({});

    // Inicializar estado de habilitacion basado en configuracion
    allSensores.forEach((sensor) => {
      sensoresHabilitados[sensor.localName] = sensor.defaultEnabled || false;
    });

    // Funcion para habilitar un sensor
    const habilitarSensor = (key: string) => {
      if (key in sensoresHabilitados) {
        sensoresHabilitados[key] = true;
      }
    };

    // Crear queries dinamicamente
    const queries: Record<string, any> = {};
    const loadingStates: Record<string, any> = {};

    allSensores.forEach((sensor) => {
      const { data, isLoading } = useQuery({
        queryKey: computed(() => [
          `${config.queryKeyPrefix}-${sensor.localName}`,
          limiteRef.value,
        ]),
        queryFn: () => fetchSensor(sensor.endpoint, limiteRef.value),
        refetchInterval: REFRESCO_DEMO_MS,
        staleTime: 0,
        enabled: computed(() => sensoresHabilitados[sensor.localName]),
      });

      queries[sensor.localName] = data;
      loadingStates[sensor.localName] = isLoading;
    });

    return {
      // Sensores individuales (acceso dinamico)
      ...queries,

      // Funcion para habilitar sensores bajo demanda
      habilitarSensor,

      // Estado de carga (basado en corriente que siempre esta habilitado)
      isLoading: loadingStates.corriente,

      // Acceso al estado de habilitacion (util para debugging)
      sensoresHabilitados,

      // Metadata
      bombaId: config.id,
      bombaConfig: config,
    };
  };
};

// Tipos para el retorno del composable
export type UseSensoresReturn = ReturnType<ReturnType<typeof createUseSensores>>;

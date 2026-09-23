import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { ref, computed, type Ref } from "vue";
import { authFetch } from "~/utils/authFetch";
import { REFRESCO_DEMO_MS } from "~/config/demo";

/**
 * Composable para obtener todas las alertas con información de anomalías
 * @param diasRef - Ref con el número de días a consultar (default: 7 para análisis de anomalías)
 */
export const useAlertasConAnomalias = (diasRef: Ref<number> = ref(7)) => {
  const { apiUrl } = useRuntimeConfig().public;

  const fetchAlertasConAnomalias = async () => {
    const response = await authFetch(`${apiUrl}/alertas_umbral/todas_alertas?dias=${diasRef.value}`);
    if (!response.ok) {
      throw new Error("Error al obtener alertas");
    }
    const data = await response.json();
    return data.data || data;
  };

  const { data: alertas, isLoading, error, refetch } = useQuery({
    queryKey: computed(() => ["alertasConAnomalias", diasRef.value]),
    queryFn: fetchAlertasConAnomalias,
    refetchInterval: REFRESCO_DEMO_MS,
    staleTime: 0,
  });

  // Filtrar solo alertas que tienen datos de anomalías Y datos disponibles en la DB
  const alertasConDatos = computed(() => {
    if (!alertas.value) return [];
    return alertas.value.filter((alerta: any) =>
      alerta.tiene_datos_anomalia === true &&
      alerta.datos_disponibles === true
    );
  });

  // Contador de alertas sin datos disponibles (para mostrar advertencia si es necesario)
  const alertasSinDatos = computed(() => {
    if (!alertas.value) return 0;
    return alertas.value.filter((alerta: any) =>
      alerta.tiene_datos_anomalia === true &&
      alerta.datos_disponibles === false
    ).length;
  });

  // Agrupar alertas por bomba usando tabla_origen (no "origen" que el backend puede reescribir)
  const alertasPorBomba = computed(() => {
    if (!alertasConDatos.value) return { A: [], B: [] };

    return {
      A: alertasConDatos.value.filter((a: any) => a.tabla_origen === "A" || (!a.tabla_origen && a.origen === "Bomba A")),
      B: alertasConDatos.value.filter((a: any) => a.tabla_origen === "B" || (!a.tabla_origen && a.origen === "Bomba B")),
    };
  });

  // Obtener tipos de sensores únicos por bomba
  const sensoresConAnomaliasPorBomba = computed(() => {
    return {
      A: [...new Set(alertasPorBomba.value.A.map((a: any) => a.tipo_sensor))],
      B: [...new Set(alertasPorBomba.value.B.map((a: any) => a.tipo_sensor))],
    };
  });

  return {
    alertas,
    alertasConDatos,
    alertasPorBomba,
    sensoresConAnomaliasPorBomba,
    alertasSinDatos,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Composable para obtener datos del periodo anómalo de una alerta específica
 */
export const useDatosAnomalia = (alertaId: Ref<number | null>) => {
  const { apiUrl } = useRuntimeConfig().public;

  const fetchDatosAnomalia = async () => {
    if (!alertaId.value) return null;

    const response = await authFetch(`${apiUrl}/alertas_umbral/${alertaId.value}/datos_anomalia`);
    if (!response.ok) {
      throw new Error("Error al obtener datos de anomalía");
    }
    return await response.json();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["datosAnomalia", alertaId],
    queryFn: fetchDatosAnomalia,
    enabled: computed(() => alertaId.value !== null),
  });

  return {
    datosAnomalia: data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Helper para prefetchear datos_anomalia_contexto desde fuera del composable.
 * Usa la MISMA queryKey que useDatosAnomaliaConContexto → cuando el componente
 * monte la query, encontrará los datos cacheados y no fetcheará de nuevo.
 */
export const prefetchDatosAnomaliaContexto = (
  queryClient: QueryClient,
  alertaId: number,
  minutosAntes: number,
  minutosDespues: number,
  bomba?: "A" | "B"
) => {
  if (!alertaId) return Promise.resolve();
  const { apiUrl } = useRuntimeConfig().public;

  return queryClient.prefetchQuery({
    queryKey: [
      "datosAnomaliaContexto",
      alertaId,
      minutosAntes,
      minutosDespues,
      bomba,
    ],
    queryFn: async () => {
      let url = `${apiUrl}/alertas_umbral/${alertaId}/datos_anomalia_contexto?minutos_antes=${minutosAntes}&minutos_despues=${minutosDespues}`;
      if (bomba) url += `&bomba=${bomba}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error("Error al obtener datos con contexto");
      return await response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Composable para obtener datos con contexto (antes y después del periodo anómalo)
 */
export const useDatosAnomaliaConContexto = (
  alertaId: Ref<number | null>,
  minutosAntes: Ref<number> = ref(15),
  minutosDespues: Ref<number> = ref(15),
  bomba?: Ref<"A" | "B" | null | undefined>
) => {
  const { apiUrl } = useRuntimeConfig().public;

  const fetchDatosConContexto = async () => {
    if (!alertaId.value) return null;

    let url = `${apiUrl}/alertas_umbral/${alertaId.value}/datos_anomalia_contexto?minutos_antes=${minutosAntes.value}&minutos_despues=${minutosDespues.value}`;
    if (bomba?.value) url += `&bomba=${bomba.value}`;
    const response = await authFetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener datos con contexto");
    }
    return await response.json();
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["datosAnomaliaContexto", alertaId, minutosAntes, minutosDespues, bomba],
    queryFn: fetchDatosConContexto,
    enabled: computed(() => alertaId.value !== null),
    staleTime: 5 * 60 * 1000,
  });

  return {
    datosContexto: data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

/**
 * Composable para obtener la alerta más reciente de un tipo de sensor específico
 */
export const useAlertaRecientePorSensor = (
  tipoSensor: Ref<string | null>,
  bomba: Ref<"A" | "B">
) => {
  const { alertasPorBomba, isLoading } = useAlertasConAnomalias();

  const alertaReciente = computed(() => {
    if (!tipoSensor.value) return null;

    const alertasBomba = alertasPorBomba.value[bomba.value];
    const alertasSensor = alertasBomba.filter((a: any) => a.tipo_sensor === tipoSensor.value);

    if (alertasSensor.length === 0) return null;

    // Ordenar por timestamp descendente y tomar la primera
    return alertasSensor.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  });

  return {
    alertaReciente,
    isLoading,
  };
};

/**
 * Función para calcular si dos periodos temporales se solapan
 * @param inicio1 - Timestamp de inicio del periodo 1
 * @param fin1 - Timestamp de fin del periodo 1
 * @param inicio2 - Timestamp de inicio del periodo 2
 * @param fin2 - Timestamp de fin del periodo 2
 * @param margenMinutos - Margen adicional para considerar "simultáneo" (default: 5 minutos)
 * @returns Objeto con información del solapamiento
 */
export const calcularSolapamiento = (
  inicio1: string | Date,
  fin1: string | Date,
  inicio2: string | Date,
  fin2: string | Date,
  margenMinutos: number = 5
): { haySolapamiento: boolean; porcentaje: number; diferenciaInicioMinutos: number } => {
  const margenMs = margenMinutos * 60 * 1000;

  const i1 = new Date(inicio1).getTime() - margenMs;
  const f1 = new Date(fin1).getTime() + margenMs;
  const i2 = new Date(inicio2).getTime();
  const f2 = new Date(fin2).getTime();

  // Verificar si hay solapamiento
  const inicioSolapamiento = Math.max(i1, i2);
  const finSolapamiento = Math.min(f1, f2);

  if (inicioSolapamiento >= finSolapamiento) {
    return { haySolapamiento: false, porcentaje: 0, diferenciaInicioMinutos: 0 };
  }

  // Calcular porcentaje de solapamiento respecto al periodo más corto
  const duracion1 = f1 - i1;
  const duracion2 = f2 - i2;
  const duracionSolapamiento = finSolapamiento - inicioSolapamiento;
  const duracionMinima = Math.min(duracion1, duracion2);

  const porcentaje = Math.round((duracionSolapamiento / duracionMinima) * 100);
  const diferenciaInicioMinutos = Math.abs(i2 - (i1 + margenMs)) / (60 * 1000);

  return {
    haySolapamiento: true,
    porcentaje: Math.min(porcentaje, 100),
    diferenciaInicioMinutos: Math.round(diferenciaInicioMinutos)
  };
};

/**
 * Composable para encontrar sensores con anomalías correlacionadas temporalmente
 * @param sensorSeleccionadoRef - Ref con el tipo de sensor seleccionado actualmente
 * @param bomba - 'A' o 'B'
 * @param alertasPorBombaRef - Ref con las alertas agrupadas por bomba
 */
export const useSensoresCorrelacionados = (
  sensorSeleccionadoRef: Ref<string | null>,
  bomba: "A" | "B",
  alertasPorBombaRef: Ref<{ A: any[]; B: any[] }>
) => {
  const sensoresCorrelacionados = computed(() => {
    if (!sensorSeleccionadoRef.value) return [];

    const alertasBomba = alertasPorBombaRef.value[bomba] || [];

    // Encontrar la alerta del sensor seleccionado
    const alertaSeleccionada = alertasBomba.find(
      (a: any) => a.tipo_sensor === sensorSeleccionadoRef.value
    );

    if (!alertaSeleccionada || !alertaSeleccionada.timestamp) return [];

    // Usar el timestamp de la alerta como referencia para el periodo
    const timestampSeleccionado = new Date(alertaSeleccionada.timestamp);
    // Crear un periodo ficticio de 30 minutos alrededor del timestamp
    const inicioSeleccionado = new Date(timestampSeleccionado.getTime() - 15 * 60 * 1000);
    const finSeleccionado = new Date(timestampSeleccionado.getTime() + 15 * 60 * 1000);

    // Comparar con los demás sensores
    const correlacionados: Array<{
      tipoSensor: string;
      alertaId: number;
      porcentajeSolapamiento: number;
      diferenciaMinutos: number;
    }> = [];

    alertasBomba.forEach((alerta: any) => {
      // No comparar consigo mismo
      if (alerta.tipo_sensor === sensorSeleccionadoRef.value) return;

      if (!alerta.timestamp) return;

      const timestampAlerta = new Date(alerta.timestamp);
      const inicioAlerta = new Date(timestampAlerta.getTime() - 15 * 60 * 1000);
      const finAlerta = new Date(timestampAlerta.getTime() + 15 * 60 * 1000);

      const resultado = calcularSolapamiento(
        inicioSeleccionado,
        finSeleccionado,
        inicioAlerta,
        finAlerta,
        10 // Margen de 10 minutos para considerar "simultáneo"
      );

      if (resultado.haySolapamiento && resultado.porcentaje >= 30) {
        correlacionados.push({
          tipoSensor: alerta.tipo_sensor,
          alertaId: alerta.id,
          porcentajeSolapamiento: resultado.porcentaje,
          diferenciaMinutos: resultado.diferenciaInicioMinutos
        });
      }
    });

    // Ordenar por porcentaje de solapamiento (mayor primero)
    return correlacionados.sort((a, b) => b.porcentajeSolapamiento - a.porcentajeSolapamiento);
  });

  // Lista simple de tipos de sensores correlacionados para uso fácil
  const tiposSensoresCorrelacionados = computed(() =>
    sensoresCorrelacionados.value.map(s => s.tipoSensor)
  );

  return {
    sensoresCorrelacionados,
    tiposSensoresCorrelacionados
  };
};

<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">Comparación de Sensores (Conjunto)</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ 1 + sensoresComparar.length }} sensores seleccionados
        </p>
      </div>
      <button
        @click="cargarTodosDatos"
        :disabled="cargando"
        class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
      >
        <svg v-if="!cargando" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ cargando ? 'Cargando...' : 'Actualizar' }}</span>
      </button>
    </div>

    <div class="p-6">
      <!-- Skeleton -->
      <div v-if="cargando" class="animate-pulse">
        <!-- Pills placeholder -->
        <div class="flex flex-wrap gap-2 mb-4">
          <div
            v-for="i in Math.max(1 + sensoresComparar.length, 2)"
            :key="'pill-sk-' + i"
            class="h-8 w-44 rounded-full bg-gray-200"
          ></div>
        </div>
        <!-- Chart area -->
        <div class="bg-gray-100 rounded-lg" style="height: 500px;"></div>
        <!-- Leyenda placeholder -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-wrap justify-center gap-4 mb-3">
            <div v-for="i in 4" :key="'leyenda-sk-' + i" class="h-4 w-32 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-700 font-medium">Error al cargar datos</p>
        <p class="text-red-600 text-sm mt-1">{{ error }}</p>
      </div>

      <!-- No Data State -->
      <div v-else-if="datasetsListos.length === 0" class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 font-medium">No hay datos disponibles</p>
        <p class="text-gray-500 text-sm mt-1">No se encontraron datos para los sensores seleccionados en la ventana del episodio</p>
      </div>

      <!-- Chart -->
      <div v-else>
        <!-- Resumen de sensores con formas -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="ds in datasetsListos"
            :key="ds.label"
            class="px-3 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-2"
            :style="{ backgroundColor: ds.sinDatos ? '#ef4444' : ds.color.border, backgroundImage: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35))' }"
          >
            <span v-if="!ds.sinDatos" class="text-lg">{{ ds.forma }}</span>
            <span v-else class="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wide">
              {{ ds.errorCarga ? 'Error' : 'Sin datos' }}
            </span>
            {{ ds.label }} ({{ ds.unidad }})<template v-if="ds.tag"> / {{ ds.tag }}</template>
            <span v-if="ds.esPrincipal" class="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wide">
              principal
            </span>
          </span>
        </div>

        <!-- Canvas para Chart.js (solo si hay al menos un sensor graficable) -->
        <div v-if="datasetsGraficables.length > 0" class="relative" style="height: 500px;">
          <canvas ref="chartCanvas"></canvas>
        </div>
        <div
          v-else
          class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center flex flex-col items-center justify-center"
          style="height: 500px;"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-gray-600 font-medium">Ningún sensor tiene datos para graficar en esta ventana</p>
          <p class="text-gray-500 text-sm mt-1">Los sensores en rojo arriba no tienen datos en el rango consultado</p>
        </div>

        <!-- Leyenda de formas -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-wrap justify-center gap-4 mb-3">
            <div class="flex items-center">
              <div class="w-4 h-4 rounded-full mr-2 bg-blue-500"></div>
              <span class="text-xs text-gray-600">Sensor 1: Círculo</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 mr-2 bg-green-500"></div>
              <span class="text-xs text-gray-600">Sensor 2: Cuadrado</span>
            </div>
            <div class="flex items-center">
              <div class="w-0 h-0 mr-2 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-purple-500"></div>
              <span class="text-xs text-gray-600">Sensor 3: Triángulo</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 mr-2 bg-orange-500 rotate-45"></div>
              <span class="text-xs text-gray-600">Sensor 4: Diamante</span>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-6">
            <div class="flex items-center">
              <div class="w-5 h-5 rounded-full mr-2 bg-white border-4 border-blue-500"></div>
              <span class="text-sm text-gray-600">Punto anómalo (más grande, fondo blanco)</span>
            </div>
            <div class="flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span v-if="ventanaEpisodio">
                Ventana del episodio: {{ formatearFechaLegible(ventanaEpisodio.inicio) }} – {{ formatearFechaLegible(ventanaEpisodio.fin) }}
                (margen ±{{ formatearMinutos(margenMinutos) }})<template v-if="normalizado"> · valores normalizados 0-100% en un solo eje Y (pasa el cursor para ver el valor real)</template><template v-else> · valores reales en un solo eje Y auto-escalado (unidades mixtas)</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { crearGraficoNormalizado } from '@/utils/chartUtils';
import { authFetch } from '~/utils/authFetch';
import { fetchDatosSensorRango } from '@/composables/useSensorRango';

const props = defineProps({
  sensorPrincipal: {
    type: Object,
    required: true,
    // Formato: { key, alertaId, label, unidad, bomba, tag }
  },
  sensoresComparar: {
    type: Array,
    default: () => [],
    // Formato: [{ key, label, unidad, bomba, tag }]
  },
  bomba: {
    type: String,
    required: true,
    validator: (value) => ['A', 'B'].includes(value)
  },
  margenMinutos: {
    type: Number,
    default: 30
  },
  normalizado: {
    type: Boolean,
    default: false
  }
});

const { apiUrl } = useRuntimeConfig().public;
const queryClient = useQueryClient();

// Estado
const chartCanvas = ref(null);
const cargando = ref(false);
const error = ref(null);
const datasetsListos = ref([]);
// Ventana temporal calculada del episodio (en epoch ms), para mostrarla en la nota inferior.
const ventanaEpisodio = ref(null);

// Subconjunto de datasetsListos que SÍ tiene datos (Caso A: se excluyen los
// marcados sinDatos, que solo se muestran como pill roja en la leyenda, no
// como serie del gráfico — una serie vacía no se puede graficar).
const datasetsGraficables = computed(() => datasetsListos.value.filter(ds => !ds.sinDatos));

// Colores para los sensores (deben coincidir con COLORES_SENSORES en chartUtils.js)
const COLORES = [
  { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.2)' },   // Azul
  { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.2)' },     // Verde
  { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.2)' },   // Púrpura
  { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.2)' },   // Naranja
  { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.2)' },   // Rosa
  { border: 'rgb(6, 182, 212)', bg: 'rgba(6, 182, 212, 0.2)' },     // Cian
  { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.2)' },   // Ámbar
  { border: 'rgb(20, 184, 166)', bg: 'rgba(20, 184, 166, 0.2)' },   // Teal
];

// Formas para la leyenda (deben coincidir en orden con ESTILOS_PUNTOS en chartUtils.js)
const FORMAS = ['●', '■', '▲', '◆', '★', '✚', '⬟', '✕'];

// Límite de puntos a pedir por sensor cuando se trae la ventana temporal del episodio
// (el backend submuestrea preservando siempre las anomalías).
const MAX_PUNTOS_VENTANA = 2000;

// Convierte un epoch (ms) a ISO 8601 con offset explícito (UTC, sufijo "Z").
// El backend interpreta TODA fecha sin zona horaria como UTC, nunca como hora
// local de planta (confirmado 2026-09-16 con Backend-GM: Postgres con
// timezone de sesión UTC, FastAPI parsea naive sin convertir). Antes se
// mandaba hora local "naive" y la ventana quedaba corrida 3-4 h: el sensor
// principal salía "SIN DATOS" en Conjunto aunque Individual sí lo mostraba.
// La regla "eje X sin GMT" de CLAUDE.md aplica solo a lo que se DIBUJA, no a
// los parámetros que viajan al backend.
const aIsoUtc = (epochMs) => new Date(epochMs).toISOString();

// Formatea un epoch (ms) a DD/MM/AAAA HH:mm en hora local, para la nota bajo el gráfico.
const formatearFechaLegible = (epochMs) => {
  if (!epochMs) return '';
  const d = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Formatea minutos a una unidad legible (min / h / día) para el margen aplicado.
const formatearMinutos = (minutos) => {
  if (minutos >= 1440 && minutos % 1440 === 0) {
    const dias = minutos / 1440;
    return `${dias} día${dias > 1 ? 's' : ''}`;
  }
  if (minutos >= 60 && minutos % 60 === 0) {
    return `${minutos / 60} h`;
  }
  return `${minutos} min`;
};

// Intervalo mediano (en minutos) entre muestras consecutivas de un dataset.
// Solo para el diagnóstico dev-only de cargarTodosDatos() más abajo: permite
// confirmar en consola si un sensor muestrea más lento que otros (hipótesis
// del bug de tooltip en modo Conjunto, ver plugins/chartjs.js).
const calcularIntervaloMedianoMinutos = (data) => {
  const tiempos = data
    .map(d => new Date(d.tiempo).getTime())
    .filter(t => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (tiempos.length < 2) return null;
  const diffs = [];
  for (let i = 1; i < tiempos.length; i++) diffs.push(tiempos[i] - tiempos[i - 1]);
  diffs.sort((a, b) => a - b);
  const mitad = Math.floor(diffs.length / 2);
  const medianaMs = diffs.length % 2 !== 0 ? diffs[mitad] : (diffs[mitad - 1] + diffs[mitad]) / 2;
  return +(medianaMs / 60000).toFixed(1);
};

// Paso A: leer el periodo_anomalo (timestamp_inicio/fin) del episodio seleccionado
// del sensor principal. Reusa la MISMA queryKey que useDatosAnomaliaConContexto /
// el prefetch de hover en AnalisisAnomaliasA/B, así que si ya está cacheado no
// se vuelve a pedir nada.
const obtenerPeriodoAnomaloPrincipal = async () => {
  const sensor = props.sensorPrincipal;
  if (!sensor?.alertaId) {
    console.warn(`Sensor principal ${sensor?.label} no tiene alertaId`);
    return null;
  }

  const bombaSensor = sensor.bomba || props.bomba;

  try {
    const data = await queryClient.fetchQuery({
      queryKey: [
        'datosAnomaliaContexto',
        sensor.alertaId,
        props.margenMinutos,
        props.margenMinutos,
        bombaSensor,
      ],
      queryFn: async () => {
        const url = `${apiUrl}/alertas_umbral/${sensor.alertaId}/datos_anomalia_contexto?minutos_antes=${props.margenMinutos}&minutos_despues=${props.margenMinutos}&bomba=${bombaSensor}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return await response.json();
      },
      staleTime: 5 * 60 * 1000,
    });

    const periodo = data?.periodo_anomalo;
    if (!periodo?.timestamp_inicio || !periodo?.timestamp_fin) {
      console.warn(`Sensor principal ${sensor.label} no tiene periodo_anomalo válido`);
      return null;
    }
    return periodo;
  } catch (err) {
    console.error(`Error obteniendo periodo anómalo de ${sensor.label}:`, err);
    throw err;
  }
};

// Paso C: cargar un sensor sobre la ventana temporal del episodio.
const cargarDatosSensorVentana = async (sensor, ventanaInicio, ventanaFin, esPrincipal) => {
  const bombaSensor = sensor.bomba || props.bomba;
  const base = {
    label: sensor.label,
    unidad: sensor.unidad || 'valor',
    tag: sensor.tag,
    esPrincipal,
  };

  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['datosSensorRango', bombaSensor, sensor.key, ventanaInicio, ventanaFin, MAX_PUNTOS_VENTANA],
      queryFn: () => fetchDatosSensorRango(sensor.key, bombaSensor, ventanaInicio, ventanaFin, MAX_PUNTOS_VENTANA),
      staleTime: 5 * 60 * 1000,
    });

    if (!data?.datos || data.datos.length === 0) {
      console.warn(`Sensor ${sensor.label} no tiene datos en la ventana del episodio`);
      // Caso A: ya NO se descarta. Se mantiene visible como pill roja
      // "SIN DATOS" en la leyenda propia del componente (ver template),
      // pero sin agregarse como dataset de Chart.js (data: [] se filtra
      // antes de llamar a crearGraficoNormalizado, ver cargarTodosDatos).
      return { ...base, sinDatos: true, data: [] };
    }

    return {
      ...base,
      estadisticas: data.estadisticas,
      data: data.datos.map(d => ({
        tiempo: d.tiempo_ejecucion,
        valor: d.valor_sensor,
        esAnomalia: d.es_anomalia
      }))
    };
  } catch (err) {
    console.warn(`Error cargando datos de ${sensor.label} en la ventana del episodio:`, err);
    // Mismo criterio que el caso "sin datos": el sensor nunca desaparece en
    // silencio. Se distingue con errorCarga para que la pill diga "Error" y no
    // se confunda una falla de red con una ausencia real de registros.
    return { ...base, sinDatos: true, errorCarga: true, data: [] };
  }
};

// Carga completa: Paso A (periodo del episodio del principal) + Paso B (ventana =
// periodo ± margenMinutos) + Paso C (traer principal + comparar sobre esa ventana).
// El principal siempre queda primero en datasetsListos si tiene datos.
const cargarTodosDatos = async () => {
  if (!props.sensorPrincipal) {
    datasetsListos.value = [];
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    const periodo = await obtenerPeriodoAnomaloPrincipal();

    if (!periodo) {
      datasetsListos.value = [];
      ventanaEpisodio.value = null;
      error.value = 'No se pudo determinar la ventana del episodio seleccionado';
      return;
    }

    const inicio = new Date(periodo.timestamp_inicio).getTime();
    const fin = new Date(periodo.timestamp_fin).getTime();
    const margenMs = props.margenMinutos * 60 * 1000;

    const ventanaInicioMs = inicio - margenMs;
    const ventanaFinMs = fin + margenMs;
    ventanaEpisodio.value = { inicio: ventanaInicioMs, fin: ventanaFinMs };

    const ventanaInicio = aIsoUtc(ventanaInicioMs);
    const ventanaFin = aIsoUtc(ventanaFinMs);

    const listaSensores = [props.sensorPrincipal, ...props.sensoresComparar];
    const promesas = listaSensores.map((sensor, index) =>
      cargarDatosSensorVentana(sensor, ventanaInicio, ventanaFin, index === 0)
    );
    const resultados = (await Promise.all(promesas)).filter(r => r !== null);

    // Asignar color/forma solo a los sensores GRAFICABLES (sinDatos=false),
    // indexando por su posición entre ELLOS (no por posición en `resultados`,
    // que también incluye las pills rojas "sin datos"). Así el índice usado
    // acá coincide exactamente con el índice que crearGraficoNormalizado usará
    // internamente para elegir el mismo color/forma (ver más abajo, se le pasa
    // solo el subconjunto graficable) — evita desalineación entre el color del
    // dataset dibujado y el de su pill en la leyenda.
    let indiceGraficable = 0;
    datasetsListos.value = resultados.map((ds) => {
      if (ds.sinDatos) return ds;
      const color = COLORES[indiceGraficable % COLORES.length];
      const forma = FORMAS[indiceGraficable % FORMAS.length];
      indiceGraficable++;
      return { ...ds, color, forma };
    });

    if (datasetsListos.value.length === 0) {
      error.value = 'No se encontraron datos para ningún sensor en la ventana del episodio';
      return;
    }

    // Diagnóstico dev-only: confirmar si sensores como "Flujo Agua
    // Recalentador"/"Flujo Agua Vapor Alta" muestrean más lento que el resto
    // (causa de que antes se perdieran del tooltip con el umbral fijo en
    // píxeles) y si el submuestreo del backend está entrando en juego.
    if (import.meta.dev) {
      console.table(datasetsGraficables.value.map(ds => ({
        Sensor: ds.label,
        'Puntos recibidos': ds.data.length,
        'Total registros (backend)': ds.estadisticas?.total_registros ?? '—',
        'Puntos devueltos (backend)': ds.estadisticas?.puntos_devueltos ?? '—',
        'Submuestreado (backend)': ds.estadisticas?.submuestreado ?? '—',
        'Intervalo mediano (min)': calcularIntervaloMedianoMinutos(ds.data) ?? '—',
      })));
    }

    // Esperar a que el DOM se actualice y crear el gráfico. Solo con los
    // sensores graficables: si TODOS los sensores a comparar quedaron sin
    // datos pero el principal sí tiene, igual se dibuja con solo el
    // principal. Si ni siquiera el principal tiene datos graficables, no se
    // llama a crearGraficoNormalizado (el template muestra un aviso en el
    // lugar del canvas en vez de romperse con un dataset vacío).
    await nextTick();
    setTimeout(() => {
      if (chartCanvas.value && datasetsGraficables.value.length > 0) {
        crearGraficoNormalizado(chartCanvas.value, datasetsGraficables.value, {
          isDarkMode: false,
          normalizar: props.normalizado
        });
      }
    }, 100);

  } catch (err) {
    error.value = err.message;
    console.error('Error al cargar datos del conjunto:', err);
  } finally {
    cargando.value = false;
  }
};

// Recargar/redibujar cuando cambia el sensor principal, la lista a comparar,
// el margen (cambia la ventana temporal) o el sub-modo normalizado/valores reales.
watch(
  [() => props.sensorPrincipal, () => props.sensoresComparar, () => props.margenMinutos, () => props.normalizado],
  () => {
    if (props.sensorPrincipal) {
      cargarTodosDatos();
    } else {
      datasetsListos.value = [];
      ventanaEpisodio.value = null;
    }
  },
  { deep: true, immediate: true }
);
</script>

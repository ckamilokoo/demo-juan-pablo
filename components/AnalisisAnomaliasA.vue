<template>
  <div class="p-0 sm:p-2 lg:p-6 space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Análisis de Anomalías - Bomba A</h1>
          <p class="text-gray-600 mt-1">Visualización de periodos anómalos detectados en sensores</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Selector de período -->
          <select
            v-model.number="diasSeleccionado"
            class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <option
              v-for="opcion in opcionesPeriodo"
              :key="opcion.valor"
              :value="opcion.valor"
            >
              {{ opcion.texto }}
            </option>
          </select>
          <button
            @click="refrescarAlertas"
            :disabled="isLoadingAlertas"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="!isLoadingAlertas" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ isLoadingAlertas ? 'Actualizando...' : 'Actualizar Alertas' }}</span>
          </button>
        </div>
      </div>

      <!-- Modo de vista: control principal de la pagina, siempre visible y
           grande. Antes estaba abajo junto a Seleccionar/Deseleccionar y
           pasaba desapercibido. -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3 mb-5 pb-5 border-b border-gray-200">
        <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Modo de vista</span>
        <div class="flex max-w-full overflow-x-auto bg-gray-100 rounded-xl p-1.5" role="tablist" aria-label="Modo de vista">
          <button
            v-for="modo in MODOS_VISTA"
            :key="modo.valor"
            type="button"
            role="tab"
            :aria-selected="modoVista === modo.valor"
            @click="modoVista = modo.valor"
            :class="[
              'px-6 py-2.5 rounded-lg text-base font-semibold transition-all',
              modoVista === modo.valor
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            ]"
          >
            {{ modo.texto }}
          </button>
        </div>
        <span class="text-sm text-gray-500">{{ descripcionModoVista }}</span>
      </div>

      <!-- Skeleton -->
      <div v-if="isLoadingAlertas" class="space-y-3 animate-pulse">
        <div class="h-3 w-48 rounded bg-gray-200"></div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
          <div
            v-for="i in 10"
            :key="'sensor-sk-' + i"
            class="h-12 rounded-lg bg-gray-200"
          ></div>
        </div>
        <div class="flex gap-3 mt-4">
          <div class="h-9 w-32 rounded-lg bg-gray-200"></div>
          <div class="h-9 w-36 rounded-lg bg-gray-200"></div>
        </div>
      </div>

      <!-- No Alerts State -->
      <div v-else-if="sensoresConAnomalias.length === 0" class="bg-teal-50 border border-teal-200 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-teal-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold text-teal-800">No hay anomalías detectadas</p>
        <p class="text-teal-600 mt-1">Todos los sensores de la Bomba A están funcionando normalmente</p>
      </div>

      <!-- Selector de Sensores -->
      <div v-else data-foco="anomalias_sensores">
        <p class="text-sm text-gray-600 mb-3">
          <span class="font-medium">{{ sensoresConAnomalias.length }}</span>
          {{ sensoresConAnomalias.length === 1 ? 'sensor con anomalías detectadas' : 'sensores con anomalías detectadas' }}
        </p>

        <!-- Indicador de límite (solo aplica a Individual/Combinado) -->
        <div v-if="modoVista !== 'conjunto' && limiteAlcanzado" class="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm text-amber-700">
            <span class="font-semibold">Límite alcanzado:</span> Máximo {{ MAX_SENSORES }} sensores. Deselecciona uno para agregar otro.
          </p>
        </div>

        <!-- Grid de botones de sensores (solo Individual/Combinado; en Conjunto el sensor principal se elige en el selector de abajo) -->
        <div v-if="modoVista !== 'conjunto'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            v-for="sensor in configuracionSensores"
            :key="sensor.key"
            @click="toggleSensor(sensor.key)"
            @mouseenter="prefetchSensor(sensor.key)"
            @focus="prefetchSensor(sensor.key)"
            :disabled="limiteAlcanzado && !sensoresActivos.includes(sensor.key)"
            :class="[
              'px-4 py-3 rounded-lg border-2 font-medium transition-all text-sm relative',
              sensoresActivos.includes(sensor.key)
                ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                : limiteAlcanzado
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : esSensorCorrelacionado(sensor.key)
                    ? 'bg-red-50 text-red-700 border-red-400 hover:border-red-500 hover:bg-red-100 animate-pulse'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            ]"
          >
            <span class="mr-2">{{ sensor.icon }}</span>
            {{ sensor.label }}<template v-if="sensor.tag"> / {{ sensor.tag }}</template>
            <!-- Indicador de correlación -->
            <span
              v-if="esSensorCorrelacionado(sensor.key) && !sensoresActivos.includes(sensor.key) && !limiteAlcanzado"
              class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"
            ></span>
            <span
              v-if="esSensorCorrelacionado(sensor.key) && !sensoresActivos.includes(sensor.key) && !limiteAlcanzado"
              class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            ></span>
          </button>
        </div>

        <!-- Leyenda de correlación -->
        <div v-if="modoVista !== 'conjunto' && tiposSensoresCorrelacionados.length > 0 && sensoresActivos.length > 0" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">
            <span class="font-semibold">Anomalías simultáneas detectadas:</span>
            Los sensores resaltados en rojo tuvieron fallas en el mismo periodo de tiempo que el sensor seleccionado.
          </p>
        </div>

        <!-- Botones de control (el toggle de modo de vista vive arriba, en el header) -->
        <div v-if="modoVista !== 'conjunto'" class="flex gap-3 mt-4">
          <button
            @click="seleccionarTodos"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Seleccionar Todos
          </button>
          <button
            @click="deseleccionarTodos"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Deseleccionar Todos
          </button>
        </div>

        <!-- Controles del modo Conjunto: sensor principal + episodio + margen + sensores a comparar -->
        <div v-if="modoVista === 'conjunto'" class="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Sensor principal</label>
              <select
                v-model="sensorPrincipalConjunto"
                class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <option v-for="sensor in configuracionSensores" :key="sensor.key" :value="sensor.key">
                  {{ sensor.label }}<template v-if="sensor.tag"> / {{ sensor.tag }}</template>
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Episodio</label>
              <select
                v-model.number="episodioSeleccionado"
                :disabled="episodiosSensorPrincipal.length === 0"
                class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option v-for="episodio in episodiosSensorPrincipal" :key="episodio.id" :value="episodio.id">
                  {{ episodio.etiqueta }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Margen</label>
              <select
                v-model.number="margenMinutos"
                class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <option v-for="opcion in opcionesMargen" :key="opcion.valor" :value="opcion.valor">
                  {{ opcion.texto }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Sensores a comparar</p>
            <div class="flex flex-wrap items-center gap-3">
              <select
                v-model="sensorCompararSeleccionado"
                :disabled="opcionesSensoresComparar.length === 0"
                class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {{ opcionesSensoresComparar.length === 0 ? 'No hay más sensores disponibles' : 'Selecciona un sensor...' }}
                </option>
                <option
                  v-for="opcion in opcionesSensoresComparar"
                  :key="opcion.endpoint"
                  :value="opcion.endpoint"
                >
                  {{ opcion.label }}
                </option>
              </select>
              <button
                @click="agregarSensorComparar"
                :disabled="!sensorCompararSeleccionado"
                class="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>

            <!-- Chips de sensores agregados para comparar -->
            <div v-if="sensoresCompararActivos.length > 0" class="flex flex-wrap gap-2 mt-3">
              <span
                v-for="slug in sensoresCompararActivos"
                :key="slug"
                class="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 flex items-center gap-2"
              >
                {{ buscarConfigSensor(slug).label }}
                <button
                  @click="quitarSensorComparar(slug)"
                  class="text-gray-500 hover:text-gray-800 font-bold"
                  aria-label="Quitar sensor"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráficos activos -->
    <div v-if="hayGraficoParaMostrar" data-foco="anomalias_graficos">
      <!-- Vista Individual: Layout horizontal con scroll -->
      <div v-if="modoVista === 'individual'" class="overflow-x-auto overflow-y-hidden mb-6 p-4">
        <div class="flex gap-6 min-w-max">
          <div v-for="sensorKey in sensoresActivos" :key="sensorKey" class="flex-shrink-0 w-[1030px]">
            <GraficoAnomalia
              :alerta-id="obtenerAlertaIdPorSensor(sensorKey)"
              :titulo="obtenerTituloSensor(sensorKey)"
              :descripcion="obtenerDescripcionPorSensor(sensorKey)"
              :minutos-contexto="30"
              :bomba="obtenerBombaOrigenPorSensor(sensorKey)"
            />
          </div>
        </div>
      </div>

      <!-- Vista Combinada: Un solo gráfico con los sensores activos -->
      <div v-else-if="modoVista === 'combinado'" class="mb-6 p-4">
        <GraficoAnomaliasCombinado
          :sensores="sensoresParaCombinar"
          bomba="A"
          :minutos-contexto="30"
        />
      </div>

      <!-- Vista Conjunto: sensor principal + episodio sobre una ventana temporal común -->
      <div v-else class="mb-6 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p class="text-xs text-gray-600">
            <template v-if="conjuntoNormalizado">
              Valores normalizados al rango de cada sensor (0-100%). Pasa el cursor para ver valores reales.
            </template>
            <template v-else>
              Todos los sensores comparten un eje Y con sus valores reales — sensores de magnitud grande pueden aplastar visualmente a los pequeños.
            </template>
          </p>
          <!-- Sub-toggle: valores reales vs normalizado -->
          <div class="flex bg-gray-100 rounded-md p-0.5 shrink-0">
            <button
              @click="conjuntoNormalizado = false"
              :class="[
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                !conjuntoNormalizado
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              Valores reales
            </button>
            <button
              @click="conjuntoNormalizado = true"
              :class="[
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                conjuntoNormalizado
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              Normalizado
            </button>
          </div>
        </div>
        <GraficoConjunto
          :sensor-principal="sensorPrincipalParaGrafico"
          :sensores-comparar="sensoresCompararParaGrafico"
          bomba="A"
          :margen-minutos="margenMinutos"
          :normalizado="conjuntoNormalizado"
        />
      </div>
    </div>

    <!-- Mensaje cuando no hay sensores seleccionados -->
    <div v-else-if="sensoresConAnomalias.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-lg font-semibold text-blue-800">Selecciona un sensor para visualizar</p>
      <p class="text-blue-600 mt-1">Usa los botones superiores para mostrar los gráficos de anomalías</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import GraficoAnomalia from './GraficoAnomalia.vue';
import GraficoAnomaliasCombinado from './GraficoAnomaliasCombinado.vue';
import GraficoConjunto from './GraficoConjunto.vue';
import {
  useAlertasConAnomalias,
  useSensoresCorrelacionados,
  prefetchDatosAnomaliaContexto,
} from '@/composables/useAlertasAnomalias';
import { useBombaActiva } from '@/composables/useBombaActiva';
import { esSensorGeneral, normalizarSensor, getAllSensores } from '@/config/bombasConfig';
import { buscarConfigSensor, buscarTagSensor } from '@/config/sensoresAnomaliasConfig';
import { useOrdenUI } from '@/composables/useControlUI';

const queryClient = useQueryClient();
const MINUTOS_CONTEXTO = 30;

const prefetchSensor = (sensorKey) => {
  const alertaId = obtenerAlertaIdPorSensor(sensorKey);
  if (!alertaId) return;
  const bomba = obtenerBombaOrigenPorSensor(sensorKey);
  prefetchDatosAnomaliaContexto(queryClient, alertaId, MINUTOS_CONTEXTO, MINUTOS_CONTEXTO, bomba);
};

// Props
const props = defineProps({
  sensorSeleccionado: {
    type: String,
    default: null
  }
});

// Contexto visual para el chatbot: que sensor/alerta esta viendo el usuario ahora mismo,
// y que ventana de dias tiene puesta en el selector (mismo patron que AlertasPanel.vue
// en Overview, que ya emite 'filtro-dias-cambio' hacia index.vue)
const emit = defineEmits(['sensor-en-pantalla', 'filtro-dias-cambio']);

// Opciones de período para el selector
const opcionesPeriodo = [
  { valor: 2, texto: 'Últimos 2 días' },
  { valor: 7, texto: 'Última semana' },
  { valor: 30, texto: 'Último mes' },
  { valor: 90, texto: 'Últimos 3 meses' }
];
const diasSeleccionado = ref(30); // Por defecto último mes para ver datos históricos

// El chatbot de esta pagina debe consultar la MISMA ventana que el selector,
// o el resumen que cita no coincide con lo que el usuario ve (ver contexto_chat_service).
watch(diasSeleccionado, (dias) => emit('filtro-dias-cambio', dias), { immediate: true });

// Composables
const { alertasPorBomba: alertasPorBombaRaw, alertasConDatos, isLoading: isLoadingAlertas, refetch } = useAlertasConAnomalias(diasSeleccionado);
const { esBombaAActiva } = useBombaActiva();

// Cuando Bomba A está activa: incluir alertas propias + alertas de sensores generales de AMBAS bombas
const alertasPorBomba = computed(() => {
  const alertasPropias = (alertasPorBombaRaw.value.A || []);

  if (!esBombaAActiva.value) {
    // Si Bomba A no está activa, quitar sensores generales
    return { ...alertasPorBombaRaw.value, A: alertasPropias.filter((a) => !esSensorGeneral(a.tipo_sensor)) };
  }

  // Bomba A está activa: agregar sensores generales de Bomba B también
  const generalesDeBombaB = (alertasPorBombaRaw.value.B || []).filter((a) => esSensorGeneral(a.tipo_sensor));
  const todasAlertasA = [...alertasPropias, ...generalesDeBombaB];

  // Deduplicar por sensor normalizado (flujo-agua-domo-ap y flujo_agua_domo_ap son el mismo)
  const vistos = new Set();
  const deduplicadas = todasAlertasA.filter((a) => {
    if (esSensorGeneral(a.tipo_sensor)) {
      const clave = normalizarSensor(a.tipo_sensor);
      if (vistos.has(clave)) return false;
      vistos.add(clave);
    }
    return true;
  });

  return { ...alertasPorBombaRaw.value, A: deduplicadas };
});

const sensoresConAnomaliasPorBomba = computed(() => {
  return {
    A: [...new Set(alertasPorBomba.value.A.map((a) => a.tipo_sensor))],
    B: (alertasPorBombaRaw.value.B || []).map((a) => a.tipo_sensor).filter((v, i, arr) => arr.indexOf(v) === i),
  };
});

// Helpers de lectura de alertas por sensor. Se declaran temprano (antes de los
// computeds/watchers que las usan, incluyendo watchers con immediate:true que
// evalúan de forma síncrona durante setup()) para evitar acceder a estas
// funciones const antes de su inicialización (TDZ).
const obtenerAlertaIdPorSensor = (sensorKey) => {
  const alertasBombaA = alertasPorBomba.value.A;
  const alerta = alertasBombaA.find(a => a.tipo_sensor === sensorKey);
  return alerta?.id || null;
};

// Usa descripcion_corta del backend si existe. Fallback: extraer texto entre "Descripción:" y "Intervalo:"/"Acción recomendada:".
const obtenerDescripcionPorSensor = (sensorKey) => {
  const alerta = alertasPorBomba.value.A.find(a => a.tipo_sensor === sensorKey);
  if (!alerta) return '';
  if (alerta.descripcion_corta) return alerta.descripcion_corta;

  const desc = alerta.descripcion || '';
  const match = desc.match(/descripci[oó]n\s*:\s*([\s\S]*?)(?=\s*(?:intervalo|acci[oó]n\s+recomendada)\s*[:\-]|$)/i);
  if (match) return match[1].trim();
  return desc.replace(/\s*(?:[|\-•·💡\n]\s*)?acci[oó]n\s+recomendada\s*[:\-]?[\s\S]*$/i, '').trim();
};

// Obtener la bomba de origen real de una alerta (para sensores generales movidos de otra bomba)
const obtenerBombaOrigenPorSensor = (sensorKey) => {
  const alerta = alertasPorBomba.value.A.find(a => a.tipo_sensor === sensorKey);
  if (!alerta) return 'A';
  return (alerta.tabla_origen === 'B' || alerta.origen === 'Bomba B') ? 'B' : 'A';
};

const obtenerTituloSensor = (sensorKey) => {
  const config = buscarConfigSensor(sensorKey);
  const tag = buscarTagSensor(sensorKey, obtenerBombaOrigenPorSensor(sensorKey));
  const base = `${config.label} ${config.icon || ''}`.trim();
  return tag ? `${base} / ${tag}` : base;
};

// Estado
const sensoresActivos = ref([]);
const modoVista = ref('individual'); // 'individual' | 'combinado' | 'conjunto'

// Opciones del control "Modo de vista" del header. La descripcion se muestra
// al lado del control para que el usuario sepa que cambia cada modo.
const MODOS_VISTA = [
  { valor: 'individual', texto: 'Individual', descripcion: 'Un gráfico por cada sensor seleccionado' },
  { valor: 'combinado', texto: 'Combinado', descripcion: 'Sensores seleccionados superpuestos en un solo gráfico' },
  { valor: 'conjunto', texto: 'Conjunto', descripcion: 'Sensor principal y su episodio anómalo sobre una ventana de tiempo común' },
];
const descripcionModoVista = computed(
  () => MODOS_VISTA.find((m) => m.valor === modoVista.value)?.descripcion ?? ''
);

// Sub-modo del gráfico "conjunto": false = valores reales (default), true = normalizado 0-100%
// Demo: normalizado por defecto para que las curvas del episodio se superpongan
// aunque tengan unidades distintas (A, °C, ms).
const conjuntoNormalizado = ref(true);

// --- Estado exclusivo del modo Conjunto ---
// Sensor principal: define el episodio (alerta) que fija la ventana temporal común.
const sensorPrincipalConjunto = ref(null); // tipo_sensor del sensor principal
const episodioSeleccionado = ref(null); // id de la alerta/episodio seleccionado del sensor principal
const margenMinutos = ref(30); // ± minutos alrededor del episodio (define la ventana junto al periodo_anomalo)
const opcionesMargen = [
  { valor: 30, texto: '± 30 min' },
  { valor: 120, texto: '± 2 h' },
  { valor: 360, texto: '± 6 h' },
  { valor: 1440, texto: '± 1 día' },
];
// Sensores a comparar contra el principal (cualquiera de los 25 de la bomba, con o sin anomalía)
const sensoresCompararActivos = ref([]);
const sensorCompararSeleccionado = ref('');

// Sensor principal (el primero seleccionado) para calcular correlaciones
const sensorPrincipal = computed(() => sensoresActivos.value.length > 0 ? sensoresActivos.value[0] : null);

// Composable para obtener sensores correlacionados
const { tiposSensoresCorrelacionados } = useSensoresCorrelacionados(
  sensorPrincipal,
  'A',
  alertasPorBomba
);

// Función para verificar si un sensor está correlacionado con el principal
const esSensorCorrelacionado = (sensorKey) => {
  return tiposSensoresCorrelacionados.value.includes(sensorKey);
};

// Computed
const sensoresConAnomalias = computed(() => sensoresConAnomaliasPorBomba.value.A || []);

const configuracionSensores = computed(() => {
  return sensoresConAnomalias.value
    .map(tipoSensor => ({
      key: tipoSensor,
      ...buscarConfigSensor(tipoSensor),
      tag: buscarTagSensor(tipoSensor, obtenerBombaOrigenPorSensor(tipoSensor))
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

// Sensores preparados para el gráfico combinado
const sensoresParaCombinar = computed(() => {
  return sensoresActivos.value.map(sensorKey => {
    const config = buscarConfigSensor(sensorKey);
    const bombaOrigen = obtenerBombaOrigenPorSensor(sensorKey);
    return {
      key: sensorKey,
      alertaId: obtenerAlertaIdPorSensor(sensorKey),
      label: config.label,
      unidad: config.unit || 'unidad',
      bomba: bombaOrigen,
      tag: buscarTagSensor(sensorKey, bombaOrigen),
    };
  }).filter(s => s.alertaId !== null);
});

// Máximo de sensores seleccionables en Individual/Combinado (para que los gráficos
// sigan siendo legibles). En Conjunto no hay límite: los colores/formas ciclan.
const MAX_SENSORES = 4;

// Métodos
const toggleSensor = (sensorKey) => {
  const index = sensoresActivos.value.indexOf(sensorKey);
  if (index > -1) {
    sensoresActivos.value.splice(index, 1);
  } else if (sensoresActivos.value.length < MAX_SENSORES) {
    sensoresActivos.value.push(sensorKey);
  }
};

const seleccionarTodos = () => {
  sensoresActivos.value = sensoresConAnomalias.value.slice(0, MAX_SENSORES);
};

// Computed para verificar si se alcanzó el límite de Individual/Combinado.
const limiteAlcanzado = computed(() => sensoresActivos.value.length >= MAX_SENSORES);

// Al cambiar a "combinado" con más de MAX_SENSORES sensoresActivos seleccionados, recortar a los primeros 4.
watch(modoVista, (nuevoModo) => {
  if (nuevoModo === 'combinado' && sensoresActivos.value.length > MAX_SENSORES) {
    sensoresActivos.value = sensoresActivos.value.slice(0, MAX_SENSORES);
  }
});

const deseleccionarTodos = () => {
  sensoresActivos.value = [];
};

// --- Modo Conjunto: sensor principal, episodio, margen y sensores a comparar ---

// Sensor principal por defecto: el primero de la lista de sensores con anomalía.
// Si el principal actual deja de existir en la lista (cambia el período consultado),
// se recae también al primero.
watch(configuracionSensores, (opciones) => {
  if (opciones.length === 0) {
    sensorPrincipalConjunto.value = null;
    return;
  }
  if (!sensorPrincipalConjunto.value || !opciones.some((o) => o.key === sensorPrincipalConjunto.value)) {
    sensorPrincipalConjunto.value = opciones[0].key;
  }
}, { immediate: true });

// Si el sensor principal se agregó antes como "sensor a comparar", se quita de esa lista
// para no duplicarlo en el gráfico.
watch(sensorPrincipalConjunto, (nuevoPrincipal) => {
  if (!nuevoPrincipal) return;
  const normalizado = normalizarSensor(nuevoPrincipal);
  const index = sensoresCompararActivos.value.findIndex((s) => normalizarSensor(s) === normalizado);
  if (index > -1) sensoresCompararActivos.value.splice(index, 1);
});

const formatearFechaHora = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Etiqueta del episodio: usa el rango timestamp_inicio_anomalia/timestamp_fin_anomalia
// si el backend los trae; si no, cae al timestamp puntual de la alerta.
const formatearFechaEpisodio = (alerta) => {
  if (alerta.timestamp_inicio_anomalia && alerta.timestamp_fin_anomalia) {
    return `${formatearFechaHora(alerta.timestamp_inicio_anomalia)} – ${formatearFechaHora(alerta.timestamp_fin_anomalia)}`;
  }
  return formatearFechaHora(alerta.timestamp);
};

// Todas las alertas (episodios) del sensor principal dentro del período consultado
// (diasSeleccionado), de más reciente a más antigua.
const episodiosSensorPrincipal = computed(() => {
  if (!sensorPrincipalConjunto.value) return [];
  const claveNormalizada = normalizarSensor(sensorPrincipalConjunto.value);

  return alertasPorBomba.value.A
    .filter((a) => normalizarSensor(a.tipo_sensor) === claveNormalizada)
    .map((a) => ({
      id: a.id,
      etiqueta: formatearFechaEpisodio(a),
      ordenTimestamp: new Date(a.timestamp_inicio_anomalia || a.timestamp).getTime(),
    }))
    .sort((a, b) => b.ordenTimestamp - a.ordenTimestamp);
});

// Episodio por defecto: el más reciente del sensor principal. Se re-selecciona
// automáticamente si el episodio actual ya no pertenece a la lista (cambió el
// sensor principal, o la alerta salió del período consultado).
watch(episodiosSensorPrincipal, (episodios) => {
  if (episodios.length === 0) {
    episodioSeleccionado.value = null;
    return;
  }
  if (!episodioSeleccionado.value || !episodios.some((e) => e.id === episodioSeleccionado.value)) {
    episodioSeleccionado.value = episodios[0].id;
  }
}, { immediate: true });

// Sensor principal listo para pasar a GraficoConjunto
const sensorPrincipalParaGrafico = computed(() => {
  if (!sensorPrincipalConjunto.value || !episodioSeleccionado.value) return null;
  const config = buscarConfigSensor(sensorPrincipalConjunto.value);
  const bombaOrigen = obtenerBombaOrigenPorSensor(sensorPrincipalConjunto.value);
  return {
    key: sensorPrincipalConjunto.value,
    alertaId: episodioSeleccionado.value,
    label: config.label,
    unidad: config.unit || 'unidad',
    bomba: bombaOrigen,
    tag: buscarTagSensor(sensorPrincipalConjunto.value, bombaOrigen),
  };
});

// Catálogo completo de sensores de la bomba (25), excluyendo el principal y los ya agregados
const opcionesSensoresComparar = computed(() => {
  const excluidoPrincipal = sensorPrincipalConjunto.value ? normalizarSensor(sensorPrincipalConjunto.value) : null;
  const yaAgregados = new Set(sensoresCompararActivos.value.map((s) => normalizarSensor(s)));

  return getAllSensores('A')
    .filter((s) => {
      const normalizado = normalizarSensor(s.endpoint);
      if (excluidoPrincipal && normalizado === excluidoPrincipal) return false;
      return !yaAgregados.has(normalizado);
    })
    .map((s) => ({
      endpoint: s.endpoint,
      label: buscarConfigSensor(s.endpoint).label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const agregarSensorComparar = () => {
  if (!sensorCompararSeleccionado.value) return;
  sensoresCompararActivos.value.push(sensorCompararSeleccionado.value);
  sensorCompararSeleccionado.value = '';
};

const quitarSensorComparar = (slug) => {
  const index = sensoresCompararActivos.value.indexOf(slug);
  if (index > -1) sensoresCompararActivos.value.splice(index, 1);
};

// Sensores a comparar, listos para pasar a GraficoConjunto
const sensoresCompararParaGrafico = computed(() => {
  return sensoresCompararActivos.value.map((slug) => {
    const config = buscarConfigSensor(slug);
    return {
      key: slug,
      label: config.label,
      unidad: config.unit || 'unidad',
      bomba: 'A',
      tag: buscarTagSensor(slug, 'A'),
    };
  });
});

// Determina si hay algo que graficar según el modo de vista activo
const hayGraficoParaMostrar = computed(() => {
  if (modoVista.value === 'conjunto') return sensorPrincipalParaGrafico.value !== null;
  return sensoresActivos.value.length > 0;
});

const refrescarAlertas = () => {
  refetch();
};

// Watch para seleccionar automáticamente el sensor cuando se navega desde una alerta
// Se vigilan ambos: el prop y los datos de la API, para cubrir el caso donde
// el componente se monta antes de que la API responda (lazy loading)
watch(
  [() => props.sensorSeleccionado, sensoresConAnomalias],
  ([nuevoSensor, sensores]) => {
    if (nuevoSensor && sensores.includes(nuevoSensor)) {
      if (!sensoresActivos.value.includes(nuevoSensor)) {
        sensoresActivos.value = [nuevoSensor];
      }
    }
  },
  { immediate: true }
);

// Prefetch automático de los sensores correlacionados (los que se marcan en rojo)
// Son los más probables de ser clickeados por el usuario.
watch(tiposSensoresCorrelacionados, (correlacionados) => {
  correlacionados.forEach((sensorKey) => prefetchSensor(sensorKey));
});

// Avisar a index.vue (y de ahi al chatbot) que sensor/alerta esta en pantalla.
// alertasPorBomba tambien se vigila porque obtenerAlertaIdPorSensor depende de datos
// que pueden llegar despues de que sensorPrincipal ya tenga valor (lazy loading).
watch(
  [sensorPrincipal, alertasPorBomba],
  ([sensor]) => {
    emit('sensor-en-pantalla', {
      tipoSensor: sensor,
      alertaId: sensor ? obtenerAlertaIdPorSensor(sensor) : null,
    });
  },
  { immediate: true }
);
// Demo: al elegir un episodio en Conjunto se precargan como "a comparar" los
// sensores con anomalías en la misma ventana (±15 min), así el gráfico muestra
// de entrada las señales del episodio alineadas en el tiempo.
const VENTANA_SIMULTANEA_MS = 15 * 60 * 1000;
watch(episodioSeleccionado, (id) => {
  if (!id) return;
  const alertasBomba = alertasPorBomba.value.A || [];
  const episodio = alertasBomba.find((a) => a.id === id);
  if (!episodio) return;
  const t = new Date(episodio.timestamp).getTime();
  const principal = normalizarSensor(sensorPrincipalConjunto.value || '');
  sensoresCompararActivos.value = [...new Set(
    alertasBomba
      .filter((a) => Math.abs(new Date(a.timestamp).getTime() - t) <= VENTANA_SIMULTANEA_MS)
      .map((a) => a.tipo_sensor)
  )].filter((s) => normalizarSensor(s) !== principal);
}, { immediate: true });
// Control por voz (agente): modo de vista y sensores seleccionados.
// `seleccionar`: 'todos' | 'ninguno' | lista de slugs (endpoint) de sensores.
useOrdenUI('anomalias', async ({ bomba, modo, seleccionar, principal, comparar, agregar, quitar, margen, episodio }) => {
  if (bomba !== 'A') return undefined;
  // Vista recién montada: esperar a que carguen las alertas (el emisor reintenta).
  if (isLoadingAlertas.value) return undefined;
  if (modo) modoVista.value = modo;
  if (seleccionar === 'todos') seleccionarTodos();
  else if (seleccionar === 'ninguno') deseleccionarTodos();
  else if (Array.isArray(seleccionar)) {
    const buscados = seleccionar.map((s) => normalizarSensor(s));
    const encontrados = sensoresConAnomalias.value.filter((k) => buscados.includes(normalizarSensor(k)));
    sensoresActivos.value = encontrados.slice(0, MAX_SENSORES);
    if (modoVista.value === 'conjunto' && encontrados[0]) sensorPrincipalConjunto.value = encontrados[0];
  } else if (modoVista.value !== 'conjunto' && sensoresActivos.value.length === 0) {
    seleccionarTodos();
  }
  // --- Modo Conjunto: principal, episodio, margen y sensores a comparar ---
  if (modoVista.value === 'conjunto') {
    const mismo = (a, b) => normalizarSensor(a) === normalizarSensor(b);
    if (principal) {
      const k = sensoresConAnomalias.value.find((x) => mismo(x, principal));
      if (k) sensorPrincipalConjunto.value = k;
    }
    if (margen) {
      const cercano = opcionesMargen.reduce((a, b) => (Math.abs(b.valor - margen) < Math.abs(a.valor - margen) ? b : a));
      margenMinutos.value = cercano.valor;
    }
    // Esperar a que se elija el episodio y a la precarga automática de
    // sensores simultáneos, para aplicar encima lo que pidió el usuario.
    await new Promise((r) => setTimeout(r, 350));
    if (episodio === 'anterior' || episodio === 'reciente') {
      const lista = episodiosSensorPrincipal.value;
      const i = lista.findIndex((e) => e.id === episodioSeleccionado.value);
      if (episodio === 'anterior' && i < lista.length - 1) episodioSeleccionado.value = lista[i + 1].id;
      if (episodio === 'reciente' && lista[0]) episodioSeleccionado.value = lista[0].id;
      await new Promise((r) => setTimeout(r, 350));
    }
    const principalActual = sensorPrincipalConjunto.value;
    const limpiar = (lista) => [...new Set(lista)].filter((x) => !principalActual || !mismo(x, principalActual));
    if (Array.isArray(comparar)) sensoresCompararActivos.value = limpiar(comparar);
    if (Array.isArray(agregar)) sensoresCompararActivos.value = limpiar([...sensoresCompararActivos.value, ...agregar]);
    if (Array.isArray(quitar)) sensoresCompararActivos.value = sensoresCompararActivos.value.filter((x) => !quitar.some((q) => mismo(q, x)));
  }

  const nombres = (lista) => lista.map((k) => buscarConfigSensor(k).label).join(', ') || 'ninguno';
  return `Anomalías Bomba A: modo ${modoVista.value}. Sensores con anomalías: ${nombres(sensoresConAnomalias.value)}. ` +
    (modoVista.value === 'conjunto'
      ? `Conjunto: principal ${sensorPrincipalConjunto.value ? buscarConfigSensor(sensorPrincipalConjunto.value).label : 'ninguno'}, ` +
        `comparado con ${nombres(sensoresCompararActivos.value)}, margen ±${margenMinutos.value} min, ` +
        `episodio ${episodiosSensorPrincipal.value.find((e) => e.id === episodioSeleccionado.value)?.etiqueta ?? 'ninguno'} ` +
        `(${episodiosSensorPrincipal.value.length} episodios del principal).`
      : `Seleccionados: ${nombres(sensoresActivos.value)}.`);
});
</script>

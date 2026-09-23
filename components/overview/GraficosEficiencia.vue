<template>
  <div class="w-full space-y-6">
    <!-- Controles: tipo de grafico + eje fijo + refrescar -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div class="flex flex-wrap items-center gap-2">
        <div
          class="inline-flex rounded-md overflow-hidden border"
          :class="isDarkMode ? 'border-gray-700' : 'border-gray-300'"
          role="group"
          aria-label="Tipo de grafico"
        >
          <button
            v-for="opt in LAYOUTS"
            :key="opt.valor"
            @click="layout = opt.valor"
            :aria-pressed="layout === opt.valor"
            class="px-3 py-1 text-xs font-medium transition-colors focus:outline-none"
            :class="layout === opt.valor
              ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
              : (isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100')"
          >
            {{ opt.texto }}
          </button>
        </div>

        <label
          class="inline-flex items-center gap-1.5 text-xs cursor-pointer"
          :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          <input type="checkbox" v-model="fixPct" class="accent-amber-500" />
          fijar eje % en 0-100
        </label>
      </div>

      <button
        @click="refrescarDatos"
        class="px-3 py-1 text-sm font-medium rounded-lg shadow transition-colors flex items-center gap-1 focus:outline-none focus:ring-2"
        :class="isDarkMode
          ? 'bg-blue-900 bg-opacity-40 text-blue-300 hover:bg-blue-800 focus:ring-blue-600'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-400'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Refrescar datos
      </button>
    </div>

    <template v-for="tarjeta in tarjetas" :key="tarjeta.id">
      <!-- Cargando -->
      <div
        v-if="tarjeta.cargando"
        class="rounded-lg shadow p-4 sm:p-6 min-h-[320px]"
        :class="isDarkMode ? 'bg-gray-800' : 'bg-white'"
      >
        <div class="animate-pulse">
          <div class="flex items-center justify-between mb-4">
            <div class="h-5 w-24 rounded" :class="isDarkMode ? 'bg-gray-700' : 'bg-gray-200'"></div>
            <div class="h-7 w-24 rounded-lg" :class="isDarkMode ? 'bg-gray-700' : 'bg-gray-200'"></div>
          </div>
          <div class="w-full h-64 sm:h-80 rounded" :class="isDarkMode ? 'bg-gray-700' : 'bg-gray-200'"></div>
        </div>
      </div>

      <!-- Sin datos y colapsada: una fila en vez de media pantalla vacia -->
      <button
        v-else-if="!tarjeta.datos.length && !expandido[tarjeta.id]"
        type="button"
        @click="expandido[tarjeta.id] = true"
        class="w-full flex items-center gap-2 rounded-lg shadow px-5 py-4 text-left transition-colors focus:outline-none focus:ring-2"
        :class="isDarkMode
          ? 'bg-gray-800 hover:bg-gray-700 focus:ring-gray-600'
          : 'bg-white hover:bg-gray-50 focus:ring-gray-300'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0"
          :class="isDarkMode ? 'text-gray-500' : 'text-gray-400'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-base font-medium" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
          {{ tarjeta.titulo }}
        </span>
        <span class="text-xs" :class="isDarkMode ? 'text-gray-500' : 'text-gray-400'">
          {{ tarjeta.textoSinDatos }}
        </span>
      </button>

      <!-- Card completa -->
      <div v-else class="rounded-lg shadow p-4 sm:p-6" :class="isDarkMode ? 'bg-gray-800' : 'bg-white'">
        <div class="flex items-center gap-2 mb-3 sm:mb-4">
          <!-- Solo se puede volver a colapsar si no hay nada que mostrar -->
          <button
            v-if="!tarjeta.datos.length"
            type="button"
            @click="expandido[tarjeta.id] = false"
            class="flex-shrink-0 rounded focus:outline-none focus:ring-2"
            :class="isDarkMode
              ? 'text-gray-500 hover:text-gray-300 focus:ring-gray-600'
              : 'text-gray-400 hover:text-gray-600 focus:ring-gray-300'"
            :aria-label="`Colapsar ${tarjeta.titulo}`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h3 class="text-base sm:text-lg font-medium" :class="isDarkMode ? 'text-white' : 'text-[#2E4053]'">
            {{ tarjeta.titulo }}
            <span class="ml-2 text-xs font-normal" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ tarjeta.subtitulo }}
            </span>
          </h3>
        </div>

        <GraficoEficiencia
          :datos="tarjeta.datos"
          :is-dark-mode="isDarkMode"
          :layout="layout"
          :fix-pct="fixPct"
          :acento="ACENTO"
          :niveles="tarjeta.niveles"
          :pcts="tarjeta.pcts"
          :texto-sin-datos="tarjeta.textoSinDatosGrafico"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import GraficoEficiencia from "@/components/overview/GraficoEficiencia.vue";
import { useEficienciaBombaA, useEficienciaBombaB } from "@/composables/useEficiencia";
import { EFICIENCIA_DIAS_DEFAULT } from "@/composables/factories/createUseEficiencia";
import { usePotencias } from "@/composables/usePotencias";
import { tiempoMs, alinearPorTiempo, toleranciaAdaptativaMs } from "@/utils/alinearSeries";

const props = defineProps({
  isDarkMode: { type: Boolean, default: false },
});

// Color de la serie de eficiencia (%): ambar, para que no se confunda con
// las series de nivel en ninguno de los dos layouts
const ACENTO = "#f2a93b";

const LAYOUTS = [
  { valor: "dual", texto: "Ejes por unidad" },
  { valor: "stacked", texto: "Paneles apilados" },
];

const layout = ref("dual");
const fixPct = ref(true);

// Ventana de datos a pedir: ultimos N dias (inicio/termino ISO)
const dias = ref(EFICIENCIA_DIAS_DEFAULT);

const {
  eficiencia: eficienciaA,
  isLoadingEficiencia: isLoadingA,
  refetchEficiencia: refetchA,
} = useEficienciaBombaA(dias);

const {
  eficiencia: eficienciaB,
  isLoadingEficiencia: isLoadingB,
  refetchEficiencia: refetchB,
} = useEficienciaBombaB(dias);

// Potencia neta/bruta del sistema (MW), tabla compartida, mismo contrato y
// ventana que eficiencia.
const {
  potencias,
  isLoadingPotencias,
  refetchPotencias,
} = usePotencias(dias);

// Colores de las series de eficiencia en la card "Sistema": convencion del
// proyecto (Bomba A azul, Bomba B purpura) para que se lean sin leyenda.
const COLOR_EFICIENCIA_A = "#3b82f6"; // blue-500
const COLOR_EFICIENCIA_B = "#a855f7"; // purple-500

// Card "Sistema" = eficiencia vs potencia. El eje de tiempo es el de
// potencias (1 fila/min, sin huecos); eficiencia A y B llegan submuestreadas
// (max_puntos) y con huecos cuando la bomba esta detenida, asi que se alinean
// al eje de potencias por vecino mas cercano con tolerancia adaptativa al
// intervalo real de cada serie. Fuera de tolerancia queda null = hueco.
const aSerieTiempo = (filas) =>
  filas
    .map((r) => ({ tiempoMs: tiempoMs(r.tiempo_ejecucion), valor: r.valor_sensor ?? null }))
    .filter((s) => s.tiempoMs !== null);

const datosSistema = computed(() => {
  const base = potencias.value;
  if (!base.length) return [];
  const tiemposBase = base.map((r) => tiempoMs(r.tiempo_ejecucion) ?? 0);

  const alinear = (filas) => {
    const serie = aSerieTiempo(filas);
    if (!serie.length) return base.map(() => null);
    const tolerancia = toleranciaAdaptativaMs(serie.map((s) => s.tiempoMs));
    return alinearPorTiempo(tiemposBase, serie, tolerancia);
  };

  const efA = alinear(eficienciaA.value);
  const efB = alinear(eficienciaB.value);

  return base.map((r, i) => ({
    tiempo_ejecucion: r.tiempo_ejecucion,
    tiempo_sensor: r.tiempo_sensor,
    potencia_neta_mw: r.valor_neto ?? r.valor_sensor ?? null,
    potencia_bruta_mw: r.valor_bruto ?? null,
    eficiencia_a: efA[i],
    eficiencia_b: efB[i],
  }));
});

// valor_bruto viene 0.0 en todas las filas mientras los tags de origen
// (12PEM.ZAJT01/02) no lleguen a gm_influx. Graficar una linea plana en cero
// como si fuera real confunde: la serie se oculta sola hasta que haya valores,
// sin aviso en pantalla (el usuario pidio quitarlo).
const brutaDisponible = computed(() =>
  potencias.value.some((r) => typeof r.valor_bruto === "number" && r.valor_bruto !== 0)
);

const nivelesSistema = computed(() => [
  { key: "potencia_neta_mw", nombre: "potencia neta (MW)", unidad: "MW" },
  ...(brutaDisponible.value
    ? [{ key: "potencia_bruta_mw", nombre: "potencia bruta (MW)", unidad: "MW" }]
    : []),
]);

const PCTS_SISTEMA = [
  { key: "eficiencia_a", nombre: "eficiencia A (%)", color: COLOR_EFICIENCIA_A },
  { key: "eficiencia_b", nombre: "eficiencia B (%)", color: COLOR_EFICIENCIA_B },
];

// Orden de las cards: Sistema (eficiencia vs potencia) arriba, luego Bomba A y B.
// niveles/pcts undefined/null en las bombas => GraficoEficiencia usa sus defaults
// (potencia kW, presion, flujo + eficiencia %), igual que antes.
const tarjetas = computed(() => [
  {
    id: "sistema",
    titulo: "Sistema",
    subtitulo: `eficiencia vs potencia - ${datosSistema.value.length} lecturas`,
    textoSinDatos: "sin datos de potencia",
    textoSinDatosGrafico: "Sin datos de potencia",
    datos: datosSistema.value,
    cargando: isLoadingPotencias.value,
    niveles: nivelesSistema.value,
    pcts: PCTS_SISTEMA,
  },
  {
    id: "A",
    titulo: "Bomba A",
    subtitulo: `eficiencia - ${eficienciaA.value.length} lecturas`,
    textoSinDatos: "sin datos de eficiencia",
    textoSinDatosGrafico: "Sin datos de eficiencia",
    datos: eficienciaA.value,
    cargando: isLoadingA.value,
    niveles: undefined,
    pcts: null,
  },
  {
    id: "B",
    titulo: "Bomba B",
    subtitulo: `eficiencia - ${eficienciaB.value.length} lecturas`,
    textoSinDatos: "sin datos de eficiencia",
    textoSinDatosGrafico: "Sin datos de eficiencia",
    datos: eficienciaB.value,
    cargando: isLoadingB.value,
    niveles: undefined,
    pcts: null,
  },
]);

// Una card sin lecturas se muestra colapsada: la caja vacia ocupaba el mismo
// alto que un grafico completo y estiraba toda la vision general.
const expandido = reactive({ sistema: false, A: false, B: false });

// Si la fuente vuelve a entregar datos, la card se abre sola
watch(tarjetas, (lista) => {
  lista.forEach((t) => {
    if (t.datos.length) expandido[t.id] = false;
  });
});

const refrescarDatos = () => {
  refetchPotencias();
  refetchA();
  refetchB();
};
</script>

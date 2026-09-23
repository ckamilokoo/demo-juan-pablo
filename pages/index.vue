<template>
  <div :class="[isDarkMode ? 'dark' : 'light', 'h-screen']">

    <div
      class="flex h-screen"
      :class="isDarkMode ? 'bg-[#F5F5F5]' : 'bg-[#F8F9FA]'"
    >
      <!-- Mobile Sidebar Overlay -->
      <div
        v-if="isSidebarOpen && isMobile"
        class="fixed inset-0 bg-black bg-opacity-50 z-30"
        @click="toggleSidebar"
      ></div>

      <!-- Sidebar -->
      <Sidebar
        :isDarkMode="isDarkMode"
        :isMobile="isMobile"
        :isSidebarOpen="isSidebarOpen"
        :isSidebarCollapsed="isSidebarCollapsed"
        :activeView="activeView"
        :navItems="navItems"
        @toggleSidebar="toggleSidebar"
        @toggleCollapse="toggleSidebarCollapse"
        @selectNavItem="selectNavItem"
      />

      <!-- Main Content -->
      <div
        class="flex-1 overflow-auto relative"
        :class="isDarkMode ? 'bg-[#F5F5F5]' : 'bg-[#F8F9FA]'"
      >
        <!-- Header -->
        <header
          class="shadow-sm px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sticky top-0 z-10"
          :class="
            isDarkMode ? 'bg-white' : 'bg-white border-b border-[#E9ECEF]'
          "
        >
          <!-- Mobile Menu Toggle -->
          <button
            v-if="isMobile"
            @click="toggleSidebar"
            :class="isDarkMode ? 'text-[#333333]' : 'text-[#2E4053]'"
            class="p-1 mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h2
            class="hidden sm:block min-w-0 text-lg font-medium truncate"
            :class="isDarkMode ? 'text-[#333333]' : 'text-[#2E4053]'"
          >
            {{ currentView.name }}
          </h2>

          <!-- Indicadores: se ocultan por ancho (el de última carga solo en pantallas grandes) -->
          <div class="flex min-w-0 items-center gap-2 sm:gap-3 ml-auto">
            <SimularEventoBoton @simular="simularEvento" @reiniciar="reiniciarDemo" @reporte="generarReporte(8)" />
            <UltimaCargaBadge class="hidden xl:flex" :is-dark-mode="isDarkMode" />
            <BombaActivaBadge class="hidden md:flex" :is-dark-mode="isDarkMode" />
            <button
              @click="toggleTheme"
              class="shrink-0 p-2 rounded-full transition-colors"
              :class="isDarkMode ? 'bg-white text-[#333333] ring-1 ring-gray-200' : 'bg-[#333333] text-white'"
              :aria-label="isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            >
              <svg
        v-if="isDarkMode"
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clip-rule="evenodd"
        />
      </svg>
              <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
        />
      </svg>
            </button>
          </div>
        </header>

        <!-- Dashboard Content with KeepAlive -->
        <main class="p-3 sm:p-6">
          <!-- :key remonta todas las vistas al reiniciar (gráficos limpios) -->
          <KeepAlive :key="resetKey">
            <component
              :is="currentComponent"
              :key="activeView"
              :currentView="currentView"
              :isDarkMode="isDarkMode"
              :sensorSeleccionado="sensorSeleccionadoAnomalia"
              :bomba="activeView === 'sensorsB' ? 'B' : 'A'"
              @navegar-anomalia="handleNavegarAnomalia"
            />
          </KeepAlive>
        </main>
      </div>
    </div>

    <!-- Notificaciones de alertas nuevas -->
    <AlertaToasts :key="resetKey" @navegar-anomalia="handleNavegarAnomalia" />

    <!-- Reporte de turno (lo abre el agente o el botón del header) -->
    <ReporteTurno :is-dark-mode="isDarkMode" />

    <!-- Agente de voz (OpenAI Realtime + LangGraph) -->
    <AgenteVoz :is-dark-mode="isDarkMode" />

    <!-- Panel oculto para quien presenta (Shift+D) -->
    <DemoPanel @reiniciar="reiniciarDemo" />
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, watch } from "vue";
import Sidebar from '../components/Sidebar.vue';
import BombaActivaBadge from '../components/BombaActivaBadge.vue';
import DemoPanel from '../components/DemoPanel.vue';
import SimularEventoBoton from '../components/SimularEventoBoton.vue';
import AlertaToasts from '../components/AlertaToasts.vue';
import AgenteVoz from '../components/AgenteVoz.vue';
import ReporteTurno from '../components/ReporteTurno.vue';
import { generarReporte, reporteAbierto } from "~/agente/reporteTurno";
import { useQueryClient } from "@tanstack/vue-query";
import { useEventoDemo } from "../composables/useEventoDemo";
import { useOrdenUI, estadoUI } from "../composables/useControlUI";
import { cambiarBombaActiva } from "~/mock/escenario";
import { useTheme } from "../composables/useTheme";
import { useResponsive } from "../composables/useResponsive";

// Usar composables para el tema y la responsividad
const { isDarkMode, toggleTheme } = useTheme();
const { isMobile, isSidebarOpen, isSidebarCollapsed, toggleSidebar, toggleSidebarCollapse } = useResponsive();

// Lazy loading de componentes
const Overview = defineAsyncComponent(() => import('../components/Overview.vue'));
const SensoresUnificado = defineAsyncComponent(() => import('../components/SensoresUnificado.vue'));
const AnalisisAnomaliasA = defineAsyncComponent(() => import('../components/AnalisisAnomaliasA.vue'));
const AnalisisAnomaliasB = defineAsyncComponent(() => import('../components/AnalisisAnomaliasB.vue'));

// Determinar qué componente mostrar basado en la vista activa
const currentComponent = computed(() => {
  switch (activeView.value) {
    case 'overview': return Overview;
    case 'sensors': return SensoresUnificado;
    case 'sensorsB': return SensoresUnificado;
    case 'anomaliasA': return AnalisisAnomaliasA;
    case 'anomaliasB': return AnalisisAnomaliasB;
    default: return Overview;
  }
});

// Handle navigation item selection (close sidebar on mobile)
const selectNavItem = (id) => {
  activeView.value = id;
  // Todas las vistas comparten el contenedor con scroll: volver arriba.
  document.querySelector('main')?.parentElement?.scrollTo({ top: 0 });
  if (isMobile.value) {
    isSidebarOpen.value = false;
  }
};

// Simulación guiada: el primer clic inicia la transmisión de datos; los
// siguientes disparan episodios nuevos. Se refrescan las queries al instante
// (y otra vez en cada detección) para no esperar al próximo refetch.
const queryClient = useQueryClient();
const evento = useEventoDemo();
// No cambia de vista: el evento se ve llegar donde esté el usuario.
const simularEvento = () => {
  evento.simular(() => queryClient.invalidateQueries());
  queryClient.invalidateQueries();
};

// Reinicio: la demo vuelve a vacío. Se vacía la caché de Vue Query y se
// remontan las vistas y las notificaciones para no arrastrar gráficos ni
// alertas de la simulación anterior.
const resetKey = ref(0);
const reiniciarDemo = async () => {
  evento.reiniciar();
  reporteAbierto.value = null;
  await queryClient.resetQueries();
  resetKey.value++;
  selectNavItem('overview');
};

// Manejar navegación desde alertas a gráficos de anomalías
const handleNavegarAnomalia = (datos) => {
  sensorSeleccionadoAnomalia.value = datos.sensorTipo;
  selectNavItem(datos.pagina);
};

// Navigation items - definidos fuera de cualquier función
const navItems = [
{
    section: "general",
    items: [
      { id: "overview", name: "Visión general", icon: "ChartBarIcon" },
    ]
  },
  {
    section: "Bomba A",
    items: [
      { id: "anomaliasA", name: "Análisis de Anomalías A", icon: "ExclamationTriangleIcon" },
      { id: "sensors", name: "Señales Bomba A", icon: "SignalIcon" },
    ]
  },
  {
    section: "Bomba B",
    items: [
      { id: "anomaliasB", name: "Análisis de Anomalías B", icon: "ExclamationTriangleIcon" },
      { id: "sensorsB", name: "Señales Bomba B", icon: "SignalIcon" },
    ]
  },
];

// Active view state
const activeView = ref("overview");

// Sensor seleccionado para anomalías
const sensorSeleccionadoAnomalia = ref(null);

// Definir la configuración de vistas fuera del componente para mejorar rendimiento
const viewConfigMap = {
  'overview': {
    chartTitle: "Visión general del sistema",
    chartDescription: "Rendimiento global del sistema y métricas",
  },
  'sensors': {
    chartTitle: "Lecturas de los sensores",
    chartDescription: "Visualización de datos agregados de sensores",
  },
  'performance': {
    chartTitle: "Métricas de rendimiento",
    chartDescription: "Indicadores de rendimiento del sistema",
  },
  'alerts': {
    chartTitle: "Historial de alertas",
    chartDescription: "Alertas y notificaciones recientes",
  }
};

// Resetear el sensor seleccionado al salir de las vistas de anomalías
// (timeout para dar tiempo a que el componente lo reciba)
watch(activeView, (nuevoValor) => {
  if (nuevoValor !== 'anomaliasA' && nuevoValor !== 'anomaliasB') {
    setTimeout(() => {
      sensorSeleccionadoAnomalia.value = null;
    }, 500);
  }
});

// Computed properties - optimizado con memoización implícita
// Función para aplanar los items y buscar el activo
function findNavItemById(id) {
  for (const section of navItems) {
    const found = section.items.find(item => item.id === id);
    if (found) return found;
  }
  return null;
}

const currentView = computed(() => {
  const view = findNavItemById(activeView.value);
  const viewConfig = viewConfigMap[view?.id] || {};
  return {
    ...view,
    ...viewConfig
  };
});

// --- Control por voz (agente) ---
const VISTAS_AGENTE = {
  vision_general: 'overview',
  senales_a: 'sensors',
  senales_b: 'sensorsB',
  anomalias_a: 'anomaliasA',
  anomalias_b: 'anomaliasB',
};

// Mantener al día lo que el agente "ve" en pantalla.
watch([activeView, isDarkMode], () => {
  estadoUI.vista = activeView.value;
  estadoUI.vistaNombre = currentView.value?.name || activeView.value;
  estadoUI.temaOscuro = isDarkMode.value;
}, { immediate: true });

useOrdenUI('navegar', ({ vista }) => {
  const id = VISTAS_AGENTE[vista];
  if (!id) return `Vista desconocida: ${vista}.`;
  selectNavItem(id);
  return `Mostrando ${findNavItemById(id)?.name}.`;
});

useOrdenUI('tema', ({ modo }) => {
  if ((modo === 'oscuro') !== isDarkMode.value) toggleTheme();
  return `Tema ${isDarkMode.value ? 'oscuro' : 'claro'} activado.`;
});

useOrdenUI('demo', async ({ accion, bomba }) => {
  if (accion === 'simular') {
    const transmitia = evento.transmitiendo.value;
    simularEvento();
    return transmitia
      ? 'Evento simulado: en unos segundos un sensor escalará aviso, alerta y crítica.'
      : 'Transmisión iniciada: llegan datos en vivo y en unos 10 segundos habrá un evento.';
  }
  if (accion === 'reiniciar') {
    await reiniciarDemo();
    return 'Demo reiniciada: la planta quedó sin datos.';
  }
  if (accion === 'bomba_activa' && ['A', 'B', 'A/B', 'O'].includes(bomba)) {
    cambiarBombaActiva(bomba);
    queryClient.invalidateQueries();
    return `Bomba en operación: ${bomba}.`;
  }
  return undefined;
});
</script>
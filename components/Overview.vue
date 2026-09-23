<template>
  <!--
    Layout: columna izquierda fija (Alertas arriba, Bitácoras abajo, separadas
    por gap-6) | Gráficos de eficiencia ocupando el ancho restante.
    overflow-x-auto + min-w en gráficos mantiene el scroll horizontal en
    pantallas angostas en vez de aplastar los charts.
  -->
  <div class="flex gap-6 mb-6 min-h-[600px] overflow-x-auto">
    <div class="flex-shrink-0 w-[420px] flex flex-col gap-6">
      <div class="flex-1 min-h-0">
        <AlertasPanel
          :is-dark-mode="isDarkMode"
          @navegar-anomalia="handleNavegarAnomalia"
          @filtro-dias-cambio="(dias) => emit('filtro-dias-cambio', dias)"
        />
      </div>

      <div class="flex-1 min-h-0">
        <BitacorasPanel :is-dark-mode="isDarkMode" />
      </div>
    </div>

    <div class="flex-1 min-w-[560px]">
      <GraficosEficiencia :is-dark-mode="isDarkMode" />
    </div>
  </div>
</template>

<script setup>
import AlertasPanel from "@/components/overview/AlertasPanel.vue";
import BitacorasPanel from "@/components/overview/BitacorasPanel.vue";
import GraficosEficiencia from "@/components/overview/GraficosEficiencia.vue";

const props = defineProps({
  currentView: {
    type: Object,
    default: () => ({
      chartTitle: "Visión general del sistema",
    }),
  },
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['navegar-anomalia', 'filtro-dias-cambio']);

// Manejar navegación a anomalías
const handleNavegarAnomalia = (payload) => {
  emit('navegar-anomalia', payload);
};
</script>

<template>
  <!--
    Layout responsivo:
    - xl (≥1280): columna izquierda de 420px (Alertas / Bitácoras) | gráficos de eficiencia.
    - md–lg: Alertas y Bitácoras lado a lado, gráficos debajo a todo el ancho.
    - celular: todo en una columna.
    Antes era siempre 420px + min 560px con scroll horizontal: en celular los
    gráficos quedaban fuera de la pantalla.
  -->
  <div class="flex flex-col xl:flex-row gap-6 mb-6 xl:min-h-[600px]">
    <div class="grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-col xl:w-[420px] xl:flex-shrink-0 gap-6">
      <div class="flex-1 min-h-[380px] xl:min-h-0" data-foco="alertas">
        <AlertasPanel
          :is-dark-mode="isDarkMode"
          @navegar-anomalia="handleNavegarAnomalia"
          @filtro-dias-cambio="(dias) => emit('filtro-dias-cambio', dias)"
        />
      </div>

      <div class="flex-1 min-h-[380px] xl:min-h-0" data-foco="bitacoras">
        <BitacorasPanel :is-dark-mode="isDarkMode" />
      </div>
    </div>

    <div class="flex-1 min-w-0">
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

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div
        v-if="abierto"
        class="fixed bottom-4 left-4 z-50 w-80 rounded-xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur"
        role="dialog"
        aria-label="Control de la demo"
      >
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest text-orange-400">Control de demo</p>
          <button class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar" @click="abierto = false">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Disparar anomalía -->
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <label class="text-xs text-slate-400">
              Bomba
              <select v-model="bomba" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white">
                <option value="A">Bomba A</option>
                <option value="B">Bomba B</option>
              </select>
            </label>
            <label class="text-xs text-slate-400">
              Nivel
              <select v-model="nivel" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white">
                <option value="CRÍTICA">Crítica</option>
                <option value="ALERTA">Alerta</option>
                <option value="AVISO">Aviso</option>
              </select>
            </label>
          </div>
          <label class="block text-xs text-slate-400">
            Sensor
            <select v-model="sensor" class="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white">
              <option v-for="s in sensores" :key="s.endpoint" :value="s.endpoint">{{ s.titulo }}</option>
            </select>
          </label>
          <button
            class="w-full rounded-md bg-gradient-to-r from-orange-500 to-red-500 py-2 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600"
            @click="disparar"
          >
            Disparar anomalía
          </button>
          <p v-if="ultimo" class="text-xs text-slate-400">{{ ultimo }}</p>
        </div>

        <!-- Bomba activa -->
        <div class="mt-4 border-t border-slate-700 pt-3">
          <p class="mb-2 text-xs text-slate-400">Bomba en operación</p>
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="e in ESTADOS"
              :key="e"
              class="rounded-md py-1.5 text-xs font-semibold transition"
              :class="estado === e ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              @click="setBomba(e)"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-slate-700 pt-3">
          <button class="text-xs text-slate-400 underline-offset-2 hover:text-white hover:underline" @click="reiniciar">
            Reiniciar escenario
          </button>
          <span class="text-[10px] text-slate-500">Shift+D mostrar/ocultar · Shift+X disparar</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// Panel oculto para quien presenta: dispara anomalías en vivo y cambia la
// bomba en operación. No aparece en ningún menú; se abre con Shift+D.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { getAllSensores } from '@/config/bombasConfig';
import { getAllSensores as getSensoresUI } from '@/config/sensoresConfig';
import { escenario, cambiarBombaActiva } from '~/mock/escenario';
import { useEventoDemo } from '@/composables/useEventoDemo';

const ESTADOS = ['A', 'B', 'A/B', 'O'];

const queryClient = useQueryClient();
const evento = useEventoDemo();
const abierto = ref(false);
const bomba = ref('A');
const nivel = ref('CRÍTICA');
const sensor = ref('corriente');
const estado = ref(escenario.bombaActiva);
// La transmisión cambia la bomba en operación: resincronizar al abrir.
watch(abierto, (v) => { if (v) estado.value = escenario.bombaActiva; });
const ultimo = ref('');

const sensores = computed(() => {
  const ui = getSensoresUI(bomba.value);
  return getAllSensores(bomba.value).map((s) => ({
    endpoint: s.endpoint,
    titulo: ui[s.localName]?.titulo || s.localName,
  }));
});

// Al cambiar de bomba el slug cambia de formato (guion vs guion bajo).
watch(bomba, () => {
  if (!sensores.value.some((s) => s.endpoint === sensor.value)) sensor.value = 'corriente';
});

// Refresca todo al instante en vez de esperar el próximo refetch.
const refrescar = () => queryClient.invalidateQueries();

const disparar = () => {
  const a = evento.anomaliaManual(bomba.value, sensor.value, nivel.value);
  const titulo = sensores.value.find((s) => s.endpoint === sensor.value)?.titulo || sensor.value;
  ultimo.value = `Anomalía #${a.id} en ${titulo} (Bomba ${a.bomba}). La alerta aparece en ~9 s.`;
  refrescar();
  // Segundo refresco cuando el modelo "la detecta" y se crea la alerta.
  setTimeout(refrescar, a.deteccion - Date.now() + 100);
};

const setBomba = (e) => {
  cambiarBombaActiva(e);
  estado.value = e;
  refrescar();
};

const reiniciar = () => {
  evento.reiniciar();
  estado.value = escenario.bombaActiva;
  ultimo.value = 'Escenario reiniciado: la app vuelve a quedar sin datos.';
  refrescar();
};

const onKey = (e) => {
  const enCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
  if (!e.shiftKey || enCampo) return;
  if (e.key === 'D') abierto.value = !abierto.value;
  if (e.key === 'X') disparar();
};

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

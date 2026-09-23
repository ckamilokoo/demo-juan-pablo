<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed z-50 flex flex-col gap-3 inset-x-3 bottom-24 sm:inset-x-auto sm:bottom-auto sm:top-20 sm:w-96"
      :class="panelVozVisible ? 'sm:right-[396px]' : 'sm:right-4'"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto overflow-hidden rounded-xl border-l-4 bg-white shadow-2xl ring-1 ring-black/5"
          :class="t.estilo.borde"
          role="alert"
        >
          <div class="flex items-start gap-3 p-4">
            <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" :class="t.estilo.icono">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" :class="t.estilo.badge">{{ t.nivel }}</span>
                <span class="text-xs text-gray-500">{{ t.origen }} · ahora</span>
              </div>
              <p class="mt-1 text-sm font-semibold text-gray-900">{{ t.titulo }}</p>
              <p class="mt-0.5 line-clamp-2 text-xs text-gray-600">{{ t.detalle }}</p>
              <button
                class="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                @click="verAnalisis(t)"
              >
                Ver análisis →
              </button>
            </div>
            <button class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Cerrar" @click="cerrar(t.id)">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <!-- Barra de tiempo restante -->
          <div class="toast-barra h-1 origin-left" :class="t.estilo.barra"></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
// Notificaciones emergentes cuando aparece una alerta nueva (simulación
// guiada o panel oculto). Compara contra las alertas ya conocidas: las que
// existían al cargar no se notifican.
import { ref, watch, computed } from "vue";
import { useAlertas } from "@/composables/useAlertas";
import { buscarConfigSensor } from "@/config/sensoresAnomaliasConfig";
import { useAgenteVoz } from "@/composables/useAgenteVoz";

// Con el panel de Atlas abierto, las notificaciones se corren a su izquierda
// para no taparlo. En celular van abajo y se muestra una a la vez.
const { panelAbierto, estado: estadoVoz } = useAgenteVoz();
const panelVozVisible = computed(() => panelAbierto.value && estadoVoz.value !== "inactivo");
const maxToasts = () => (window.innerWidth < 640 ? 1 : 3);

const emit = defineEmits(["navegar-anomalia"]);

const DURACION_MS = 12000;
const ESTILOS = {
  "CRÍTICA": { borde: "border-red-500", icono: "bg-red-100 text-red-600", badge: "bg-red-100 text-red-700", barra: "bg-red-500" },
  ALERTA: { borde: "border-blue-500", icono: "bg-blue-100 text-blue-600", badge: "bg-blue-100 text-blue-700", barra: "bg-blue-500" },
  AVISO: { borde: "border-teal-500", icono: "bg-teal-100 text-teal-600", badge: "bg-teal-100 text-teal-700", barra: "bg-teal-500" },
};

const { alertas, isLoading_alerta } = useAlertas(ref(1));
const conocidas = new Set();
let inicializado = false;
const toasts = ref([]);

const nivelDe = (a) => {
  const d = a.descripcion || "";
  if (d.includes("CRÍTICA")) return "CRÍTICA";
  if (d.includes("ALERTA")) return "ALERTA";
  return "AVISO";
};

const cerrar = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

// La línea base se toma con la primera respuesta (aunque venga vacía, como al
// arrancar la demo): así la primera alerta real sí se notifica.
watch(
  [alertas, isLoading_alerta],
  ([lista, cargando]) => {
    if (cargando) return;
    if (!inicializado) {
      lista.forEach((a) => conocidas.add(a.id));
      inicializado = true;
      return;
    }
    for (const a of lista) {
      if (conocidas.has(a.id)) continue;
      conocidas.add(a.id);
      const nivel = nivelDe(a);
      const cfg = buscarConfigSensor(a.tipo_sensor);
      toasts.value = [
        {
          id: a.id,
          alerta: a,
          nivel,
          estilo: ESTILOS[nivel],
          origen: a.origen,
          titulo: `${cfg.label} fuera de rango`,
          detalle: (a.descripcion || "").replace(/\s*Acci[oó]n recomendada[\s\S]*$/i, ""),
        },
        ...toasts.value,
      ].slice(0, maxToasts());
      setTimeout(() => cerrar(a.id), DURACION_MS);
    }
  },
  { immediate: true }
);

const verAnalisis = (t) => {
  emit("navegar-anomalia", {
    pagina: t.alerta.bomba_datos === "B" ? "anomaliasB" : "anomaliasA",
    sensorTipo: t.alerta.tipo_sensor,
  });
  cerrar(t.id);
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>

<style>
/* Sin scoped: Vue renombra los @keyframes de bloques scoped. */
.toast-barra {
  animation: toast-vaciar 12s linear forwards;
}
@keyframes toast-vaciar {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
</style>

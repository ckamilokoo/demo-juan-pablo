<template>
  <Teleport to="body">
    <Transition name="reporte">
      <div v-if="r" class="fixed inset-0 z-[45] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-8" @click.self="cerrar">
        <article
          class="reporte-imprimible w-full max-w-4xl rounded-2xl bg-white text-slate-800 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-reporte"
        >
          <!-- Encabezado -->
          <header class="flex flex-wrap items-start justify-between gap-3 rounded-t-2xl bg-slate-900 px-5 py-4 text-white sm:px-8">
            <div>
              <p class="text-[11px] font-bold tracking-[0.2em] text-orange-400">PLANTA DEMO · REPORTE DE TURNO</p>
              <h2 id="titulo-reporte" class="mt-1 text-xl font-bold sm:text-2xl">Reporte ejecutivo — últimas {{ r.periodo.horas }} h</h2>
              <p class="mt-1 text-xs text-slate-300">
                Periodo {{ fechaHora(r.periodo.desde) }} – {{ fechaHora(r.periodo.hasta) }}
                <template v-if="r.periodo.horasReales < r.periodo.horas"> · datos desde el inicio de la transmisión ({{ duracionLegible(r.periodo.horasReales) }})</template>
              </p>
            </div>
            <div class="no-imprimir flex items-center gap-2">
              <button class="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20" @click="imprimir">Imprimir / PDF</button>
              <button class="rounded-full p-2 hover:bg-white/10" aria-label="Cerrar reporte" @click="cerrar">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </header>

          <div class="space-y-6 px-5 py-5 sm:px-8 sm:py-6">
            <!-- 1. Estado operativo -->
            <section>
              <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Estado operativo</h3>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div v-for="k in kpis" :key="k.etiqueta" class="rounded-xl border border-slate-200 p-3">
                  <p class="text-xs text-slate-500">{{ k.etiqueta }}</p>
                  <p class="mt-1 text-lg font-bold">{{ k.valor }}</p>
                </div>
              </div>
            </section>

            <!-- 2. Resumen ejecutivo -->
            <section>
              <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Resumen ejecutivo</h3>
              <p v-if="r.narrativa" class="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed">{{ r.narrativa }}</p>
              <p v-else class="rounded-xl bg-slate-50 p-4 text-sm italic text-slate-500">Resumen no disponible (el modelo de lenguaje no respondió). Las tablas siguen siendo válidas.</p>
            </section>

            <!-- 3. Alertas -->
            <section>
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">Alertas del periodo</h3>
                <span v-for="(n, nivel) in r.alertas.por_nivel" :key="nivel" class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="CLASE_NIVEL[nivel]">{{ nivel }} {{ n }}</span>
              </div>
              <div class="overflow-x-auto rounded-xl border border-slate-200">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs text-slate-500">
                    <tr><th class="px-3 py-2">Nivel</th><th class="px-3 py-2">Sensor</th><th class="px-3 py-2">Bomba</th><th class="px-3 py-2">Hora</th><th class="px-3 py-2">Acción recomendada</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(a, i) in r.alertas.lista" :key="i" class="border-t border-slate-100">
                      <td class="px-3 py-2"><span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="CLASE_NIVEL[a.nivel]">{{ a.nivel }}</span></td>
                      <td class="px-3 py-2">{{ a.sensor }} <span class="text-xs text-slate-500">({{ a.deteccion_n }}.ª)</span></td>
                      <td class="px-3 py-2">{{ a.bomba }}</td>
                      <td class="px-3 py-2 whitespace-nowrap">{{ a.hora }}</td>
                      <td class="px-3 py-2 text-xs text-slate-600">{{ a.accion }}</td>
                    </tr>
                    <tr v-if="!r.alertas.lista.length"><td colspan="5" class="px-3 py-3 text-slate-400">Sin alertas en el periodo.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 4. Sensores -->
            <section>
              <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Sensores con lecturas anómalas</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-200">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs text-slate-500">
                    <tr><th class="px-3 py-2">Sensor</th><th class="px-3 py-2">Bomba</th><th class="px-3 py-2">Actual</th><th class="px-3 py-2">Mín – Máx</th><th class="px-3 py-2">Umbral</th><th class="px-3 py-2">Anómalas</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(s, i) in r.sensores" :key="i" class="border-t border-slate-100">
                      <td class="px-3 py-2">{{ s.sensor }}</td>
                      <td class="px-3 py-2">{{ s.bomba }}</td>
                      <td class="px-3 py-2 whitespace-nowrap">{{ fmt(s.actual) }} {{ s.unidad }}</td>
                      <td class="px-3 py-2 whitespace-nowrap">{{ fmt(s.min) }} – {{ fmt(s.max) }}</td>
                      <td class="px-3 py-2">{{ fmt(s.umbral) }}</td>
                      <td class="px-3 py-2">{{ s.lecturas_anomalas }}/{{ s.lecturas_totales }}</td>
                    </tr>
                    <tr v-if="!r.sensores.length"><td colspan="6" class="px-3 py-3 text-slate-400">Ningún sensor con lecturas anómalas.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 5. Bitácoras -->
            <section>
              <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Bitácoras del periodo</h3>
              <ul class="space-y-2">
                <li v-for="(b, i) in r.bitacoras" :key="i" class="rounded-xl border border-slate-200 p-3 text-sm">
                  <div class="mb-1 flex flex-wrap items-center gap-2 text-xs">
                    <span class="rounded-full px-2 py-0.5 font-semibold" :class="CLASE_NIVEL[b.nivel]">{{ b.nivel }}</span>
                    <span class="text-slate-500">Bomba {{ b.bomba }} · {{ b.fecha }}</span>
                  </div>
                  {{ b.texto }}
                </li>
                <li v-if="!r.bitacoras.length" class="text-sm text-slate-400">Sin bitácoras con alerta o aviso en el periodo.</li>
              </ul>
            </section>
          </div>

          <!-- Envío por correo (queda como borrador y se confirma en el panel de Atlas) -->
          <footer class="no-imprimir flex flex-wrap items-center gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-8">
            <form class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1" @submit.prevent="prepararCorreo">
              <label for="para-reporte" class="text-sm text-slate-600">Enviar a</label>
              <input
                id="para-reporte"
                v-model="para"
                list="agenda-reporte"
                placeholder="mantenimiento, correo@empresa.cl"
                class="min-w-0 flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
              />
              <datalist id="agenda-reporte">
                <option v-for="c in agenda" :key="c.nombre" :value="c.nombre">{{ c.correo }}</option>
              </datalist>
              <button type="submit" class="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" :disabled="!para.trim() || preparando">
                {{ preparando ? 'Preparando…' : 'Preparar correo' }}
              </button>
            </form>
            <p v-if="aviso" class="w-full text-xs" :class="avisoError ? 'text-red-600' : 'text-slate-500'">{{ aviso }}</p>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// Reporte de turno en pantalla. Lo abre el agente (generar_reporte) o el
// botón "Reporte" del header. El correo se prepara como borrador y se envía
// desde la vista previa del panel de Atlas (confirmación explícita).
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { reporteAbierto, duracionLegible } from "~/agente/reporteTurno";
import { correo } from "~/agente/correoAgente";
import { resolverDestinatarios, borradorDeReporte } from "~/agente/herramientasVoz";

defineProps({ isDarkMode: { type: Boolean, default: false } });

const r = reporteAbierto;

const CLASE_NIVEL = {
  "CRÍTICA": "bg-red-100 text-red-700",
  ALERTA: "bg-orange-100 text-orange-700",
  AVISO: "bg-teal-100 text-teal-700",
};

const fmt = (v) => (typeof v === "number" ? v.toLocaleString("es-CL", { maximumFractionDigits: 1 }) : "—");
const fechaHora = (iso) => new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

const kpis = computed(() => {
  const e = r.value?.estado ?? {};
  return [
    { etiqueta: "Bomba en operación", valor: e.bomba_activa ?? "—" },
    { etiqueta: "Eficiencia A", valor: e.eficiencia_a_pct != null ? `${fmt(e.eficiencia_a_pct)} %` : "—" },
    { etiqueta: "Eficiencia B", valor: e.eficiencia_b_pct != null ? `${fmt(e.eficiencia_b_pct)} %` : "—" },
    { etiqueta: "Potencia neta", valor: e.potencia_neta_mw != null ? `${fmt(e.potencia_neta_mw)} MW` : "—" },
  ];
});

const cerrar = () => {
  reporteAbierto.value = null;
};
const imprimir = () => window.print();

// --- Correo ---
const para = ref("");
const preparando = ref(false);
const aviso = ref("");
const avisoError = ref(false);
const agenda = ref([]);

watch(r, (nuevo) => {
  aviso.value = "";
  if (nuevo && !agenda.value.length) {
    $fetch("/api/correo/contactos").then((d) => (agenda.value = d.contactos)).catch(() => {});
  }
});

const prepararCorreo = async () => {
  preparando.value = true;
  aviso.value = "";
  try {
    const lista = para.value.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    const { para: correos, faltan } = await resolverDestinatarios(lista);
    if (!correos.length || faltan.length) {
      avisoError.value = true;
      aviso.value = `No reconocí: ${faltan.join(", ") || para.value}. Usa un nombre de la agenda o una dirección completa.`;
      return;
    }
    correo.borrador.value = borradorDeReporte(r.value, correos);
    avisoError.value = false;
    aviso.value = "Borrador listo en el panel de Atlas: revísalo y presiona Enviar correo.";
    cerrar();
  } finally {
    preparando.value = false;
  }
};

const onKey = (e) => {
  if (e.key === "Escape" && r.value) cerrar();
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.reporte-enter-active,
.reporte-leave-active {
  transition: opacity 0.2s ease;
}
.reporte-enter-from,
.reporte-leave-to {
  opacity: 0;
}
</style>

<style>
/* Imprimir / PDF: solo el reporte, sin el resto de la interfaz. */
@media print {
  body * {
    visibility: hidden !important;
  }
  .reporte-imprimible,
  .reporte-imprimible * {
    visibility: visible !important;
  }
  .reporte-imprimible {
    position: absolute !important;
    inset: 0 auto auto 0 !important;
    width: 100% !important;
    max-width: none !important;
    box-shadow: none !important;
  }
  .reporte-imprimible .no-imprimir {
    display: none !important;
  }
}
</style>

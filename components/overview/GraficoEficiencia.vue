<template>
  <div class="w-full">
    <div
      v-if="!tieneDatos"
      class="flex items-center justify-center rounded border border-dashed"
      :style="{ height: alturaPx + 'px' }"
      :class="isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'"
    >
      <span class="text-xs">{{ textoSinDatos }}</span>
    </div>
    <div v-else ref="el" class="w-full" :style="{ height: alturaPx + 'px' }"></div>

    <!-- Leyenda propia, replica la del prototipo -->
    <div
      v-if="tieneDatos"
      class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] font-mono"
      :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
    >
      <span v-for="s in leyenda" :key="s.nombre" class="inline-flex items-center gap-1.5">
        <span class="inline-block w-4 h-0.5" :style="estiloLeyenda(s)"></span>{{ s.nombre }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onActivated, onBeforeUnmount } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  datos: { type: Array, default: () => [] },
  isDarkMode: { type: Boolean, default: false },
  // dual = un eje Y por unidad | stacked = un panel por magnitud
  layout: { type: String, default: "dual" },
  // fijar el eje de eficiencia en 0-100
  fixPct: { type: Boolean, default: true },
  // color de la serie de eficiencia (%), distinto por bomba (fallback para pcts sin color propio)
  acento: { type: String, default: "#f2a93b" },
  // series de "nivel" (magnitudes con eje/panel propio). 1 a 3 entradas; con mas de 3
  // los colores de tema.niveles se reciclan (indice % length).
  niveles: {
    type: Array,
    default: () => [
      { key: "potencia_kw", nombre: "potencia (kW)", unidad: "kW" },
      { key: "presion_bar", nombre: "presion (bar)", unidad: "bar" },
      { key: "flujo_kg_h", nombre: "flujo (kg/h)", unidad: "kg/h" },
    ],
  },
  // series porcentuales, todas comparten un unico eje/panel de %. null = comportamiento
  // actual (una sola serie "eficiencia (%)" con el color de acento).
  pcts: { type: Array, default: null },
  textoSinDatos: { type: String, default: "Sin datos de eficiencia" },
});

const el = ref(null);
let chart = null;

const tieneDatos = computed(() => Array.isArray(props.datos) && props.datos.length > 0);

// --- Revelado progresivo (demo) ---
// Cuando llegan los primeros datos: spinner de carga y luego las series van
// apareciendo de a una, cada una dibujándose de izquierda a derecha.
const REVELAR_CARGA_MS = 1500;
const REVELAR_PASO_MS = 700;
const cargandoRevelado = ref(false);
const seriesVisibles = ref(Infinity);
let timersRevelado = [];
const limpiarRevelado = () => {
  timersRevelado.forEach(clearTimeout);
  timersRevelado = [];
};
const totalSeries = () => props.niveles.length + (props.pcts?.length || 1);
const iniciarRevelado = () => {
  limpiarRevelado();
  cargandoRevelado.value = true;
  seriesVisibles.value = 0;
  timersRevelado.push(setTimeout(() => (cargandoRevelado.value = false), REVELAR_CARGA_MS));
  for (let k = 1; k <= totalSeries(); k++) {
    timersRevelado.push(
      setTimeout(() => (seriesVisibles.value = k), REVELAR_CARGA_MS + (k - 1) * REVELAR_PASO_MS)
    );
  }
  timersRevelado.push(
    setTimeout(() => (seriesVisibles.value = Infinity), REVELAR_CARGA_MS + totalSeries() * REVELAR_PASO_MS)
  );
};
const revelando = computed(() => cargandoRevelado.value || seriesVisibles.value !== Infinity);
// Serie i (niveles primero, luego pcts) todavía oculta: se dibuja vacía.
const datosSerie = (i, data) => (i < seriesVisibles.value ? data : []);
// stacked: 1 panel de % + 1 panel por nivel, ~140px cada uno (4 paneles = 560px, igual que antes)
const alturaPx = computed(() =>
  props.layout === "stacked" ? 140 * (1 + props.niveles.length) : 340
);

// Paleta segun tema
const tema = computed(() =>
  props.isDarkMode
    ? {
        line: "#374151",
        ink: "#e5e7eb",
        inkDim: "#9ca3af",
        panel: "#1f2937",
        niveles: ["#6fb3d2", "#c78be0", "#5fd0a6"],
      }
    : {
        line: "#e5e7eb",
        ink: "#111827",
        inkDim: "#6b7280",
        panel: "#ffffff",
        niveles: ["#2b7fa5", "#8b5cf6", "#0f9b6c"],
      }
);

// Color de una serie de nivel por indice, reciclando la paleta si hay mas
// niveles que colores en tema.niveles.
const colorNivel = (i) => tema.value.niveles[i % tema.value.niveles.length];

// Las series de nivel pueden tener unidades y ordenes de magnitud muy distintos
// (bar ~200, kW ~1.100, kg/h ~95.000). Compartir un solo eje aplasta las mas
// chicas contra el cero, asi que cada una lleva su propio eje (dual) o su
// propio panel (stacked).

// Series porcentuales resueltas: si no llegan por prop, replica el comportamiento
// original (una sola serie "eficiencia (%)" con el color de acento). Cualquier
// entrada sin color propio tambien cae al acento.
const pctsResueltas = computed(() => {
  const base =
    props.pcts && props.pcts.length ? props.pcts : [{ key: "valor_sensor", nombre: "eficiencia (%)" }];
  return base.map((p) => ({ ...p, color: p.color || props.acento }));
});

// Eje X sin GMT: DD/MM HH:MM (misma convencion que utils/chartUtils.js)
const formatearFecha = (iso, horaFallback) => {
  if (!iso) return horaFallback || "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return horaFallback || String(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const labels = computed(() =>
  props.datos.map((r) => formatearFecha(r.tiempo_ejecucion, r.tiempo_sensor))
);
const nivelesData = computed(() =>
  props.niveles.map((n) => props.datos.map((r) => r[n.key] ?? null))
);
const pctsData = computed(() =>
  pctsResueltas.value.map((p) => props.datos.map((r) => r[p.key] ?? null))
);

const leyenda = computed(() => [
  ...props.niveles.map((n, i) => ({ nombre: n.nombre, tipo: "nivel", color: colorNivel(i) })),
  ...pctsResueltas.value.map((p) => ({ nombre: p.nombre, tipo: "pct", color: p.color })),
]);

const estiloLeyenda = (s) =>
  s.tipo === "pct"
    ? { background: `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 7px)` }
    : { background: s.color };

const fmt = (n) =>
  typeof n === "number" ? n.toLocaleString("es-CL", { maximumFractionDigits: 1 }) : n;

// Etiquetas cortas para no comerse el ancho del plot con varios ejes
const fmtCorto = (v) => {
  if (typeof v !== "number") return v;
  if (Math.abs(v) >= 1000) return (v / 1000).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "k";
  return v.toLocaleString("es-CL", { maximumFractionDigits: 1 });
};

// showMin/MaxLabel + hideOverlap: en el eje X de categorias ECharts ocultaba
// la ultima etiqueta por solapamiento y el rango real de fechas no se veia
// (parecia terminar 2 dias antes). Ahora primera y ultima fecha se muestran
// siempre y se ocultan las intermedias que choquen.
const axisBase = () => ({
  axisLine: { lineStyle: { color: tema.value.line } },
  axisLabel: {
    color: tema.value.inkDim,
    fontSize: 10,
    hideOverlap: true,
    showMinLabel: true,
    showMaxLabel: true,
  },
  splitLine: { lineStyle: { color: tema.value.line } },
  nameTextStyle: { color: tema.value.inkDim, fontSize: 10 },
});

// sampling lttb: con 14 dias de datos hay miles de puntos por serie; ECharts
// reduce a ~1 punto por pixel conservando picos/valles (no promedia).
const nivelSeries = () =>
  props.niveles.map((n, i) => ({
    name: n.nombre,
    type: "line",
    data: datosSerie(i, nivelesData.value[i]),
    showSymbol: false,
    smooth: false,
    sampling: "lttb",
    lineStyle: { width: 1.5, color: colorNivel(i) },
    itemStyle: { color: colorNivel(i) },
  }));

// Una serie por cada pct, todas en el mismo eje/panel de %. No usa connectNulls:
// los huecos (null) son bomba detenida y deben verse como huecos.
const pctSeriesList = () =>
  pctsResueltas.value.map((p, i) => ({
    name: p.nombre,
    type: "line",
    data: datosSerie(props.niveles.length + i, pctsData.value[i]),
    showSymbol: false,
    sampling: "lttb",
    lineStyle: { width: 2, type: "dashed", color: p.color },
    itemStyle: { color: p.color },
  }));

const tooltip = () => {
  const nombresPct = pctsResueltas.value.map((p) => p.nombre);
  return {
    trigger: "axis",
    backgroundColor: tema.value.panel,
    borderColor: tema.value.line,
    textStyle: { color: tema.value.ink, fontSize: 11 },
    formatter: (params) => {
      const rows = params.map((s) => {
        const esPct = nombresPct.includes(s.seriesName);
        const val =
          s.value === null || s.value === undefined ? "—" : fmt(s.value) + (esPct ? " %" : "");
        return `${s.marker} ${s.seriesName} <b>${val}</b>`;
      });
      return `<b>${params[0].axisValue}</b><br/>${rows.join("<br/>")}`;
    },
  };
};

const dataZoomBase = (extra = {}) => [
  { type: "inside", ...extra },
  {
    type: "slider",
    height: 16,
    bottom: 6,
    borderColor: tema.value.line,
    backgroundColor: "transparent",
    fillerColor: "rgba(111,179,210,.15)",
    handleStyle: { color: tema.value.inkDim },
    textStyle: { color: tema.value.inkDim, fontSize: 9 },
    ...extra,
  },
];

const animacion = () =>
  revelando.value
    ? { animationDuration: 1100, animationEasing: "cubicOut", animationDurationUpdate: 1100 }
    : { animationDuration: 250, animationDurationUpdate: 300 };

const buildOption = () => {
  const t = tema.value;

  if (props.layout === "dual") {
    // Un eje Y por unidad. Niveles 0 y 1 a la izquierda (offset 0 y 54), niveles
    // 2+ a la derecha (offset 0, 54, ...) y el eje de % (unico, compartido por
    // todas las pcts) a la derecha, con offset 54 por cada nivel que ya este ahi.
    // Cada eje va pintado del color de su serie para poder aparearlos.
    const nivelesRightCount = Math.max(props.niveles.length - 2, 0);
    const nLeft = Math.min(props.niveles.length, 2);
    const nRight = nivelesRightCount + 1; // +1 por el eje de %, siempre a la derecha
    const gridLeft = nLeft >= 2 ? 108 : 62;
    const gridRight = nRight >= 2 ? 106 : 60;

    const ejeNivel = (n, i) => ({
      type: "value",
      name: n.unidad,
      position: i < 2 ? "left" : "right",
      offset: (i % 2) * 54,
      ...axisBase(),
      axisLine: { show: true, lineStyle: { color: colorNivel(i) } },
      axisLabel: { ...axisBase().axisLabel, color: colorNivel(i), formatter: fmtCorto },
      nameTextStyle: { color: colorNivel(i), fontSize: 10 },
      // Una sola reja: con varios ejes, varias rejas es ruido puro
      splitLine: { show: i === 0, lineStyle: { color: t.line } },
    });

    const colorEjePct = pctsResueltas.value[0].color;

    return {
      ...animacion(),
      tooltip: tooltip(),
      grid: { left: gridLeft, right: gridRight, top: 28, bottom: 50 },
      dataZoom: dataZoomBase(),
      xAxis: { type: "category", data: labels.value, ...axisBase(), boundaryGap: false },
      yAxis: [
        ...props.niveles.map(ejeNivel),
        {
          type: "value",
          name: "%",
          position: "right",
          offset: 54 * nivelesRightCount,
          ...axisBase(),
          splitLine: { show: false },
          ...(props.fixPct ? { min: 0, max: 100 } : {}),
          axisLine: { show: true, lineStyle: { color: colorEjePct } },
          axisLabel: { ...axisBase().axisLabel, formatter: "{value}%", color: colorEjePct },
          nameTextStyle: { color: colorEjePct, fontSize: 10 },
        },
      ],
      series: [
        ...nivelSeries().map((s, i) => ({ ...s, yAxisIndex: i })),
        ...pctSeriesList().map((s) => ({ ...s, yAxisIndex: props.niveles.length })),
      ],
    };
  }

  // Paneles apilados: panel 0 = todas las pcts juntas (eje %), paneles 1..n = un
  // panel por nivel. X compartida por axisPointer.link y un solo dataZoom. Cada
  // escala se autoescala sin aplastar a las demas.
  const paneles = [
    { nombre: pctsResueltas.value.map((p) => p.nombre).join(" / "), color: pctsResueltas.value[0].color, pct: true },
    ...props.niveles.map((n, i) => ({ nombre: n.nombre, color: colorNivel(i), pct: false })),
  ];
  const TOP = 4;
  // PASO/ALTO escalan con el numero de paneles: con 4 paneles (1 pct + 3 niveles)
  // da PASO=22, ALTO=16, identico a las constantes originales.
  const PASO = (100 - TOP - 8) / paneles.length;
  const ALTO = PASO - 6;
  const idx = paneles.map((_, i) => i);

  return {
    ...animacion(),
    tooltip: tooltip(),
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    grid: paneles.map((_, i) => ({
      left: 62,
      right: 20,
      top: `${TOP + i * PASO}%`,
      height: `${ALTO}%`,
    })),
    dataZoom: dataZoomBase({ xAxisIndex: idx }),
    xAxis: paneles.map((_, i) => ({
      type: "category",
      gridIndex: i,
      data: labels.value,
      ...axisBase(),
      boundaryGap: false,
      // Solo el ultimo panel muestra las horas
      axisLabel: i === paneles.length - 1 ? axisBase().axisLabel : { show: false },
    })),
    yAxis: paneles.map((p, i) => ({
      type: "value",
      gridIndex: i,
      name: p.nombre,
      nameGap: 8,
      ...axisBase(),
      ...(p.pct && props.fixPct ? { min: 0, max: 100 } : {}),
      axisLabel: {
        ...axisBase().axisLabel,
        color: p.color,
        formatter: p.pct ? "{value}%" : fmtCorto,
      },
      nameTextStyle: { color: p.color, fontSize: 10, align: "left" },
    })),
    series: [
      ...pctSeriesList().map((s, i) => ({
        ...s,
        xAxisIndex: 0,
        yAxisIndex: 0,
        areaStyle: { color: pctsResueltas.value[i].color + "1a" },
      })),
      ...nivelSeries().map((s, i) => ({ ...s, xAxisIndex: i + 1, yAxisIndex: i + 1 })),
    ],
  };
};

const render = async () => {
  if (!import.meta.client) return;
  await nextTick();
  if (!tieneDatos.value) {
    if (chart) {
      chart.dispose();
      chart = null;
    }
    return;
  }
  if (!el.value) return;
  let nuevo = false;
  if (!chart || chart.getDom() !== el.value) {
    if (chart) chart.dispose();
    chart = echarts.init(el.value, null, { renderer: "canvas" });
    nuevo = true;
  }
  // Reemplazo completo solo si cambia la estructura (layout, tema, series);
  // los refrescos de datos se fusionan para que las líneas visibles no se
  // vuelvan a dibujar desde cero cada vez.
  const estructura = JSON.stringify([
    props.layout, props.isDarkMode, props.fixPct, props.acento,
    props.niveles.map((n) => n.key), (props.pcts || []).map((p) => p.key),
  ]);
  const reemplazar = nuevo || estructura !== ultimaEstructura;
  ultimaEstructura = estructura;
  chart.setOption(buildOption(), reemplazar);
  if (cargandoRevelado.value) {
    const t = tema.value;
    chart.showLoading("default", {
      text: "Cargando datos…",
      color: "#f2a93b",
      textColor: t.inkDim,
      maskColor: props.isDarkMode ? "rgba(17,24,39,0.55)" : "rgba(255,255,255,0.7)",
      fontSize: 12,
    });
  } else {
    chart.hideLoading();
  }
  chart.resize();
};
let ultimaEstructura = "";

const handleResize = () => chart && chart.resize();

onMounted(() => {
  if (!import.meta.client) return;
  render();
  window.addEventListener("resize", handleResize);
});

// KeepAlive: al volver a la vista el contenedor recupera dimensiones
onActivated(() => {
  if (!import.meta.client) return;
  nextTick(() => {
    if (chart) chart.resize();
    else render();
  });
});

// Primer lote de datos (o tras reiniciar la demo): revelar progresivamente.
watch(
  tieneDatos,
  (hay, habia) => {
    if (hay && !habia) iniciarRevelado();
    else if (!hay) {
      limpiarRevelado();
      cargandoRevelado.value = false;
      seriesVisibles.value = Infinity;
    }
  },
  { immediate: true }
);
watch([cargandoRevelado, seriesVisibles], () => render());

watch(
  () => [
    props.datos,
    props.isDarkMode,
    props.layout,
    props.fixPct,
    props.acento,
    props.niveles,
    props.pcts,
  ],
  () => render(),
  { deep: true }
);

onBeforeUnmount(() => {
  limpiarRevelado();
  if (!import.meta.client) return;
  window.removeEventListener("resize", handleResize);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

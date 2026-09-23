// Cálculo compartido del intervalo mediano entre muestras de un dataset y de
// la tolerancia temporal adaptativa derivada de él. Única fuente de verdad:
// lo usan tanto el modo de interacción custom 'nearestPorDataset'
// (plugins/chartjs.js, selección del punto más cercano por dataset al mover
// el cursor) como el callback `label`/`labelColor`/`labelTextColor` del
// tooltip en modo Conjunto (utils/chartUtils.js → crearGraficoNormalizado),
// que la reutiliza para decidir si el punto seleccionado está "fuera de
// tolerancia" (sensor con muestreo más lento que no tiene dato cerca del
// instante bajo el cursor) y pintarlo en rojo en vez de mostrar un valor.
//
// NO dupliques este cálculo en otro archivo — si hace falta ajustarlo,
// ajústalo aquí.
//
// Fórmula: tolerancia = clamp(intervaloMediano * 2, MIN, MAX)
//   - *2 para tolerar hasta media muestra de "jitter" a cada lado del punto
//     más cercano sin perder el dataset.
//   - MIN evita que datasets de muestreo muy denso (o sin ritmo conocido,
//     <2 puntos) queden con una tolerancia irrisoria.
//   - MAX evita aceptar un punto separado del cursor por un hueco real de
//     datos (sensor caído, ventana sin lecturas) como si fuera "el más
//     cercano válido".
// 1 min: piso, y valor usado como fallback cuando el dataset tiene <2 puntos
// (sin ritmo calculable). El comentario va arriba y no al final de la línea:
// el escáner de auto-imports de Nuxt leía la coma de "piso, y valor" como otra
// declaración y registraba un export fantasma `y` que rompía otros módulos.
export const TOLERANCIA_MINIMA_MS = 60 * 1000;
export const TOLERANCIA_MAXIMA_MS = 60 * 60 * 1000; // 1 h: tope absoluto

// Cache del intervalo mediano por dataset, keyeada por la referencia del
// array `data` de cada dataset (WeakMap). crearGraficoNormalizado arma un
// array `data` nuevo cada vez que redibuja el gráfico, así que la cache se
// invalida sola al cambiar esa referencia (y los arrays viejos se liberan
// solos, sin fugas). El modo de interacción corre en cada movimiento del
// mouse y el tooltip recalcula en cada callback, así que el cálculo (sort +
// medianas) solo debe pagarse una vez por dataset entre redibujos.
const cacheIntervaloMediano = new WeakMap();

// Convierte el `x` de un punto {x, y} a epoch ms. En crearGraficoNormalizado
// `x` ya es un objeto Date, pero se admite también number/string por si se
// reutiliza con datos parseados de otra forma.
export function aTiempoMs(x) {
  const t = x instanceof Date ? x.getTime() : +new Date(x);
  return Number.isNaN(t) ? null : t;
}

function calcularIntervaloMediano(datosDataset) {
  const tiempos = datosDataset
    .map((punto) => aTiempoMs(punto?.x))
    .filter((t) => t !== null)
    .sort((a, b) => a - b);

  if (tiempos.length < 2) return null;

  const diffs = [];
  for (let i = 1; i < tiempos.length; i++) {
    diffs.push(tiempos[i] - tiempos[i - 1]);
  }
  diffs.sort((a, b) => a - b);
  const mitad = Math.floor(diffs.length / 2);
  return diffs.length % 2 !== 0
    ? diffs[mitad]
    : (diffs[mitad - 1] + diffs[mitad]) / 2;
}

export function obtenerIntervaloMediano(datosDataset) {
  if (cacheIntervaloMediano.has(datosDataset)) {
    return cacheIntervaloMediano.get(datosDataset);
  }
  const intervalo = calcularIntervaloMediano(datosDataset);
  cacheIntervaloMediano.set(datosDataset, intervalo);
  return intervalo;
}

// Tolerancia (ms) para el array `data` (puntos {x, y}) de un dataset de
// Chart.js. Es el helper reutilizable: plugins/chartjs.js lo consume para
// el modo de interacción, utils/chartUtils.js lo consume para el callback
// `label` del tooltip.
export function obtenerToleranciaDataset(datosDataset) {
  const intervaloMediano = obtenerIntervaloMediano(datosDataset);
  if (intervaloMediano === null) return TOLERANCIA_MINIMA_MS;
  return Math.min(Math.max(intervaloMediano * 2, TOLERANCIA_MINIMA_MS), TOLERANCIA_MAXIMA_MS);
}

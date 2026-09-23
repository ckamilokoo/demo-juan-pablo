/**
 * Utilidades puras (sin Vue) para alinear series de tiempo de distinta
 * frecuencia de muestreo sobre un eje X común. Usado para combinar
 * eficiencia (submuestreada por max_puntos) con potencias (1 fila/min).
 */

/**
 * Convierte un ISO string a epoch ms. Devuelve null si no es una fecha
 * válida (Date.parse -> NaN).
 */
export const tiempoMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/**
 * Mediana de las diferencias entre muestras consecutivas de un arreglo de
 * tiempos (ms) ya ordenado ascendente. Devuelve null si hay menos de 2
 * muestras (no hay intervalo que calcular).
 */
export const intervaloMedianoMs = (tiemposMs: number[]): number | null => {
  if (tiemposMs.length < 2) return null;

  const diffs: number[] = [];
  for (let i = 1; i < tiemposMs.length; i++) {
    diffs.push(tiemposMs[i] - tiemposMs[i - 1]);
  }
  diffs.sort((a, b) => a - b);

  const mid = Math.floor(diffs.length / 2);
  if (diffs.length % 2 === 0) {
    return (diffs[mid - 1] + diffs[mid]) / 2;
  }
  return diffs[mid];
};

/**
 * Tolerancia adaptativa para emparejar dos series de distinta frecuencia.
 *
 * Motivo: eficiencia llega submuestreada a max_puntos=2000 (stride ~6 min en
 * 14 días, mayor si hay más filas), mientras que potencias llega a 1
 * fila/min. Con una tolerancia fija chica, al alinear potencias contra el
 * eje X de eficiencia la mayoría de las muestras de potencias quedarían
 * fuera de rango y la serie combinada quedaría llena de nulls. Por eso la
 * tolerancia se deriva del intervalo real de la serie base (mitad del
 * intervalo mediano, redondeado hacia arriba, más un margen de 1 min) con un
 * piso mínimo.
 */
export const toleranciaAdaptativaMs = (
  tiemposMs: number[],
  minimoMs = 4 * 60_000
): number => {
  const intervalo = intervaloMedianoMs(tiemposMs);
  if (intervalo === null) return minimoMs;
  return Math.max(minimoMs, Math.ceil(intervalo / 2) + 60_000);
};

/**
 * Alinea una serie sobre un arreglo de tiempos base, por cercanía temporal.
 *
 * Para cada tiempo base devuelve el valor de la muestra de `serie` más
 * cercana en el tiempo, siempre que |Δt| <= toleranciaMs; si no, null.
 *
 * Ambos arreglos deben venir ordenados ascendente. Implementación de barrido
 * de dos punteros (O(n+m)): para cada tiempo base se avanza el puntero de
 * `serie` mientras la siguiente muestra esté más cerca que la actual, y solo
 * entonces se compara la candidata resultante contra la tolerancia.
 */
export const alinearPorTiempo = (
  tiemposBaseMs: number[],
  serie: Array<{ tiempoMs: number; valor: number | null }>,
  toleranciaMs: number
): Array<number | null> => {
  const resultado: Array<number | null> = new Array(tiemposBaseMs.length).fill(null);
  if (serie.length === 0) return resultado;

  let puntero = 0;

  for (let i = 0; i < tiemposBaseMs.length; i++) {
    const base = tiemposBaseMs[i];

    // Avanza mientras la SIGUIENTE muestra de la serie esté más cerca (o
    // igual) del tiempo base que la actual.
    while (
      puntero < serie.length - 1 &&
      Math.abs(serie[puntero + 1].tiempoMs - base) <= Math.abs(serie[puntero].tiempoMs - base)
    ) {
      puntero++;
    }

    const candidata = serie[puntero];
    const delta = Math.abs(candidata.tiempoMs - base);
    resultado[i] = delta <= toleranciaMs ? candidata.valor : null;
  }

  return resultado;
};

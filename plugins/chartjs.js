import { Chart, Interaction, registerables } from "chart.js";
import { getRelativePosition } from "chart.js/helpers";
import "chartjs-adapter-date-fns";
import { aTiempoMs } from "@/utils/toleranciaDataset";

// Modo de interacción custom, usado por crearGraficoNormalizado (modo
// "Conjunto" en utils/chartUtils.js). Ese gráfico usa eje X de tiempo real
// donde cada dataset trae su propio muestreo de puntos {x, y} — no comparten
// índices/timestamps como en un eje categórico. El modo nativo 'x' de
// Chart.js selecciona TODOS los elementos cuyo hit-range en X cubre el
// cursor, así que si un dataset tiene 2 muestras cercanas al cursor, ambas
// entran y el tooltip repite el mismo sensor con valores distintos.
// Este modo en cambio recorre cada dataset visible y se queda con un único
// punto: el de menor distancia temporal al cursor.
//
// Antes este modo descartaba el dataset del tooltip si esa distancia
// superaba una tolerancia adaptativa (derivada del intervalo mediano de
// muestreo del propio dataset, ver utils/toleranciaDataset.js) — el sensor
// desaparecía del tooltip sin explicación cuando no tenía dato cerca del
// cursor. Ahora SIEMPRE devuelve el punto más cercano de cada dataset
// visible (uno por dataset, como antes), sin filtrar por tolerancia: es
// utils/chartUtils.js (callback `label`/`labelColor`/`labelTextColor` del
// tooltip) quien recalcula esa misma tolerancia con
// obtenerToleranciaDataset() para decidir si el punto está "fuera de
// tolerancia" y, en ese caso, mostrarlo en rojo con un mensaje de "sin dato
// aquí" en vez de un valor.
// eslint-disable-next-line no-unused-vars -- firma fija por Chart.js: getElementsAtEventForMode(e, mode, options, useFinalPosition)
Interaction.modes.nearestPorDataset = (chart, e, options, useFinalPosition) => {
  const posicion = getRelativePosition(e, chart);
  const escalaX = chart.scales.x;
  const tiempoCursor = escalaX ? escalaX.getValueForPixel(posicion.x) : null;
  const seleccionados = [];

  if (tiempoCursor == null || Number.isNaN(tiempoCursor)) return seleccionados;

  for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
    if (!chart.isDatasetVisible(datasetIndex)) continue;

    const meta = chart.getDatasetMeta(datasetIndex);
    const datosDataset = chart.data.datasets[datasetIndex].data;

    let mejorElemento = null;
    let mejorIndex = -1;
    let mejorDistancia = Infinity;

    meta.data.forEach((elemento, index) => {
      if (!elemento || elemento.skip) return;
      const tiempoElemento = aTiempoMs(datosDataset[index]?.x);
      if (tiempoElemento === null) return;
      const distancia = Math.abs(tiempoElemento - tiempoCursor);
      if (distancia < mejorDistancia) {
        mejorDistancia = distancia;
        mejorElemento = elemento;
        mejorIndex = index;
      }
    });

    if (mejorElemento) {
      seleccionados.push({ element: mejorElemento, datasetIndex, index: mejorIndex });
    }
  }

  return seleccionados;
};

export default defineNuxtPlugin(() => {
  // Registro global determinista: todos los controllers, elements, scales y
  // plugins core de Chart.js (incluye LineController, que ningún módulo
  // registraba globalmente y causaba "line is not a registered controller"
  // si el usuario entraba a una vista con gráfico de línea antes de que se
  // evaluara algún chunk lazy que hiciera Chart.register(...registerables)).
  // chartjs-plugin-datalabels NO se registra aquí a propósito: mostraría
  // labels en todos los gráficos por defecto.
  Chart.register(...registerables);
});

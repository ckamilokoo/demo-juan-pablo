import { Chart } from 'chart.js';
import { obtenerToleranciaDataset } from '@/utils/toleranciaDataset';

// Color usado para marcar, dentro del tooltip del modo Conjunto, la línea de
// un sensor que no tiene dato cerca del instante bajo el cursor (ver
// crearGraficoNormalizado más abajo). Legible en fondo claro y oscuro del
// tooltip (fondo oscuro por defecto de Chart.js).
const ROJO_SIN_DATO = '#ef4444';

// Colores de clasificación: 1=Normal, -1=Anomalía, null/undefined=Sin clasificar
export function colorClasificacion(c) {
  if (c === 1) return 'green';
  if (c === -1) return 'red';
  return '#9CA3AF';
}

export function colorClasificacionHex(c) {
  if (c === 1) return '#22C55E';
  if (c === -1) return '#EF4444';
  return '#9CA3AF';
}

// Función para muestrear datos si son demasiados
function muestrearDatos(datos, maxPuntos = 100) {
  if (!datos || !Array.isArray(datos) || datos.length <= maxPuntos) return datos;
  
  console.log(`Muestreando datos: ${datos.length} puntos -> máximo ${maxPuntos} puntos`);
  const factor = Math.ceil(datos.length / maxPuntos);
  return datos.filter((_, index) => index % factor === 0);
}

// Función para destruir un gráfico existente
// Usa el registro propio de Chart.js (por instancia de canvas, no por id) para
// que canvas sin id (o con id duplicado por KeepAlive) no colisionen entre si
export function destruirGrafico(canvas) {
  if (!canvas) return;
  Chart.getChart(canvas)?.destroy();
  const ctx = canvas.getContext('2d');
  ctx?.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el contexto del canvas
}

// Función para crear el gráfico
export function crearGrafico(canvas, data) {
  console.log("Creando gráfico con canvas:", canvas, "y datos:", data?.length || 0, "puntos");
  
  if (!canvas) {
    console.error('Canvas no encontrado');
    return;
  }
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Datos inválidos para el gráfico');
    return;
  }
  
  try {
    // Muestrear datos si son demasiados
    const datosOptimizados = muestrearDatos(data);
    console.log(`Usando ${datosOptimizados.length} puntos para el gráfico`);

    // Destruir gráfico existente antes de crear uno nuevo
    destruirGrafico(canvas);

    const formatearTiempo = (t) => {
      try {
        const fecha = new Date(t);
        if (isNaN(fecha.getTime())) return t;
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const hora = fecha.getHours().toString().padStart(2, '0');
        const min = fecha.getMinutes().toString().padStart(2, '0');
        return `${dia}/${mes} ${hora}:${min}`;
      } catch {
        return t;
      }
    };

    const tiempos = datosOptimizados.map((d) => formatearTiempo(d.tiempo_sensor));
    const valores = datosOptimizados.map((d) => d.valor_sensor);
    const colores = datosOptimizados.map((d) => colorClasificacion(d.clasificacion));

    // Configurar opciones optimizadas para grandes conjuntos de datos
    const pointRadius = datosOptimizados.length > 50 ? 3 : 6;
    const borderWidth = datosOptimizados.length > 50 ? 1 : 2;
    
    console.log('Inicializando nuevo gráfico');
    const chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: tiempos,
        datasets: [
          {
            label: 'Corriente',
            data: valores,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: borderWidth,
            pointRadius: pointRadius,
            pointBackgroundColor: colores,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: datosOptimizados.length > 100 ? 0 : 1000 // Desactivar animación para conjuntos grandes
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              generateLabels: () => [
                { text: 'Normal', fillStyle: 'green' },
                { text: 'Anomalía', fillStyle: 'red' },
                { text: 'Sin clasificar', fillStyle: '#9CA3AF' },
              ],
            },
          },
          tooltip: {
            enabled: datosOptimizados.length <= 200 // Desactivar tooltips para conjuntos muy grandes
          }
        },
        scales: {
          y: {
            ticks: {
              stepSize: undefined,
            },
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 20 // Limitar número de etiquetas en el eje X
            }
          }
        },
      },
    });
    console.log('Gráfico creado exitosamente');
  } catch (error) {
    console.error('Error al crear el gráfico:', error);
  }
}

// Paleta de colores para gráficos combinados
const COLORES_SENSORES = [
  { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.2)' },   // Azul
  { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.2)' },     // Verde
  { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.2)' },   // Púrpura
  { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.2)' },   // Naranja
  { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.2)' },   // Rosa
  { border: 'rgb(6, 182, 212)', bg: 'rgba(6, 182, 212, 0.2)' },     // Cian
  { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.2)' },   // Ámbar
  { border: 'rgb(20, 184, 166)', bg: 'rgba(20, 184, 166, 0.2)' },   // Teal
];

// Estilos de puntos para diferenciar cada sensor
const ESTILOS_PUNTOS = [
  'circle',        // Círculo
  'rect',          // Cuadrado
  'triangle',      // Triángulo
  'rectRot',       // Diamante (cuadrado rotado)
  'star',          // Estrella
  'cross',         // Cruz
  'rectRounded',   // Cuadrado redondeado
  'crossRot',      // Cruz rotada (x)
];

/**
 * Crea un gráfico combinado con múltiples datasets y ejes Y
 * @param {HTMLCanvasElement} canvas - El elemento canvas
 * @param {Array} datasets - Array de datasets con formato:
 *   { label, data: [{tiempo, valor, esAnomalia}], unidad, color (opcional) }
 * @param {Object} opciones - Opciones adicionales (isDarkMode, etc)
 */
export function crearGraficoCombinado(canvas, datasets, opciones = {}) {
  console.log("Creando gráfico combinado con", datasets?.length || 0, "datasets");

  if (!canvas) {
    console.error('Canvas no encontrado');
    return null;
  }

  if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
    console.error('Datasets inválidos para el gráfico combinado');
    return null;
  }

  try {
    // Destruir gráfico existente
    destruirGrafico(canvas);

    const isDarkMode = opciones.isDarkMode || false;
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#f3f4f6' : '#333333';

    // Agrupar sensores por unidad para compartir ejes
    const unidadesUnicas = [...new Set(datasets.map(d => d.unidad || 'valor'))];
    const maxEjes = Math.min(unidadesUnicas.length, 4); // Máximo 4 ejes

    // Crear mapeo de unidad a eje Y
    const unidadAEje = {};
    unidadesUnicas.slice(0, maxEjes).forEach((unidad, index) => {
      unidadAEje[unidad] = `y${index === 0 ? '' : index}`;
    });
    // Si hay más de 4 unidades, las extras usan el primer eje
    unidadesUnicas.slice(maxEjes).forEach(unidad => {
      unidadAEje[unidad] = 'y';
    });

    // Obtener todos los timestamps únicos y ordenarlos
    const todosLosTiempos = new Set();
    datasets.forEach(ds => {
      ds.data.forEach(d => todosLosTiempos.add(d.tiempo));
    });
    const tiemposOrdenados = Array.from(todosLosTiempos).sort();

    // Muestrear si hay demasiados puntos
    const tiemposMuestreados = muestrearDatos(tiemposOrdenados, 150);

    // Crear datasets de Chart.js
    const chartDatasets = datasets.map((ds, index) => {
      const color = ds.color || COLORES_SENSORES[index % COLORES_SENSORES.length];
      const unidad = ds.unidad || 'valor';
      const yAxisID = unidadAEje[unidad];
      const estiloPunto = ESTILOS_PUNTOS[index % ESTILOS_PUNTOS.length];

      // Mapear datos a los timestamps muestreados
      const dataMap = new Map(ds.data.map(d => [d.tiempo, d]));
      const valores = tiemposMuestreados.map(t => {
        const dato = dataMap.get(t);
        return dato ? dato.valor : null;
      });

      // Tamaño de puntos: más grandes para anomalías
      const tamañoBase = tiemposMuestreados.length > 50 ? 4 : 6;
      const tamañosPuntos = tiemposMuestreados.map(t => {
        const dato = dataMap.get(t);
        if (!dato) return tamañoBase;
        return dato.esAnomalia ? tamañoBase + 4 : tamañoBase;
      });

      // Color de fondo de puntos: color sólido del sensor, blanco si es anomalía
      const coloresFondoPuntos = tiemposMuestreados.map(t => {
        const dato = dataMap.get(t);
        if (!dato) return color.border;
        return dato.esAnomalia ? '#ffffff' : color.border;
      });

      // Color de borde de puntos: siempre el color del sensor (para identificar)
      // pero más grueso y con marca especial si es anomalía
      const coloresBordePuntos = tiemposMuestreados.map(t => {
        const dato = dataMap.get(t);
        if (!dato) return color.border;
        // Para anomalías: borde del color del sensor pero con efecto visual diferente
        return dato.esAnomalia ? color.border : color.border;
      });

      // Ancho de borde de puntos: más grueso para anomalías
      const anchoBordePuntos = tiemposMuestreados.map(t => {
        const dato = dataMap.get(t);
        if (!dato) return 2;
        return dato.esAnomalia ? 4 : 2;
      });

      return {
        label: `${ds.label} (${unidad})`,
        data: valores,
        borderColor: color.border,
        backgroundColor: color.bg,
        yAxisID: yAxisID,
        tension: 0.3,
        fill: false,
        borderWidth: 3,
        pointStyle: estiloPunto,
        pointRadius: tamañosPuntos,
        pointBackgroundColor: coloresFondoPuntos,
        pointBorderColor: coloresBordePuntos,
        pointBorderWidth: anchoBordePuntos,
        pointHoverRadius: 10,
        spanGaps: true,
      };
    });

    // Configurar escalas Y
    const scales = {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
          color: textColor,
        },
        grid: { color: gridColor },
      }
    };

    // Crear ejes Y para cada unidad única (máximo 4) - todos a la izquierda
    unidadesUnicas.slice(0, maxEjes).forEach((unidad, index) => {
      const yAxisId = `y${index === 0 ? '' : index}`;

      scales[yAxisId] = {
        type: 'linear',
        display: true,
        position: index % 2 === 0 ? 'left' : 'right',
        title: {
          display: true,
          text: unidad,
          color: COLORES_SENSORES[index % COLORES_SENSORES.length].border,
          font: { weight: 'bold', size: 12 }
        },
        ticks: {
          color: COLORES_SENSORES[index % COLORES_SENSORES.length].border,
        },
        grid: {
          color: index === 0 ? gridColor : 'transparent',
          drawOnChartArea: index === 0,
        },
      };
    });

    // Crear el gráfico
    const chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: tiemposMuestreados.map(t => {
          // Formatear timestamp mostrando día/mes y hora:minuto
          try {
            const fecha = new Date(t);
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const hora = fecha.getHours().toString().padStart(2, '0');
            const min = fecha.getMinutes().toString().padStart(2, '0');
            return `${dia}/${mes} ${hora}:${min}`;
          } catch {
            return t;
          }
        }),
        datasets: chartDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: tiemposMuestreados.length > 100 ? 0 : 800
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 15,
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(tooltipItems) {
                // Mostrar fecha completa en el título del tooltip
                if (tooltipItems.length > 0) {
                  const index = tooltipItems[0].dataIndex;
                  const timestamp = tiemposMuestreados[index];
                  if (timestamp) {
                    try {
                      const fecha = new Date(timestamp);
                      return fecha.toLocaleString('es-ES', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      });
                    } catch { /* fallback al label */ }
                  }
                }
                return tooltipItems[0]?.label || '';
              },
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (value === null) return null;
                return `${label}: ${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: scales,
      },
    });

    console.log('Gráfico combinado creado exitosamente');
    return chartInstance;
  } catch (error) {
    console.error('Error al crear el gráfico combinado:', error);
    return null;
  }
}

// Formatea un timestamp a DD/MM HH:MM (sin zona horaria)
function formatearTiempoEjeX(t) {
  try {
    const fecha = new Date(t);
    if (isNaN(fecha.getTime())) return t;
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const hora = fecha.getHours().toString().padStart(2, '0');
    const min = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes} ${hora}:${min}`;
  } catch {
    return t;
  }
}

/**
 * Crea un gráfico "conjunto" con múltiples datasets, en uno de dos sub-modos:
 * - normalizado (default): min-max por dataset a un único eje Y de 0-100%,
 *   para comparar la forma/correlación de sensores con unidades y escalas
 *   muy distintas (ej. corriente vs temperatura).
 * - valores reales (opciones.normalizar === false): valor crudo de cada
 *   sensor, todos en un único eje Y lineal auto-escalado (unidades mixtas).
 *
 * Eje X de tiempo real (`type: 'time'`, adapter date-fns): cada dataset lleva
 * sus propios puntos `{x, y}` con `x` = timestamp del dato. A diferencia de
 * crearGraficoCombinado, NO se unen los timestamps de todos los datasets en
 * un eje categórico compartido — cada serie se ubica en su posición temporal
 * real, así que huecos/ventanas distintas entre series se respetan visualmente
 * (no se comprimen) y series con distinta cantidad de puntos igual se pueden
 * correlacionar correctamente por posición en el tiempo.
 * @param {HTMLCanvasElement} canvas - El elemento canvas
 * @param {Array} datasets - Mismo shape que crearGraficoCombinado:
 *   { label, data: [{tiempo, valor, esAnomalia}], unidad, color (opcional) }
 * @param {Object} opciones - Opciones adicionales (isDarkMode, normalizar (default true), etc)
 */
export function crearGraficoNormalizado(canvas, datasets, opciones = {}) {
  console.log("Creando gráfico normalizado con", datasets?.length || 0, "datasets");

  if (!canvas) {
    console.error('Canvas no encontrado');
    return null;
  }

  if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
    console.error('Datasets inválidos para el gráfico normalizado');
    return null;
  }

  try {
    // Destruir gráfico existente
    destruirGrafico(canvas);

    const isDarkMode = opciones.isDarkMode || false;
    const normalizar = opciones.normalizar !== false; // default true
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#f3f4f6' : '#333333';

    // Crear datasets de Chart.js normalizados (min-max por dataset, sobre sus
    // propios valores reales, no sobre los muestreados). Muestreo POR DATASET
    // (no sobre una unión de timestamps: cada serie tiene su propia ventana).
    const chartDatasets = datasets.map((ds, index) => {
      const color = ds.color || COLORES_SENSORES[index % COLORES_SENSORES.length];
      const unidad = ds.unidad || 'valor';
      const estiloPunto = ESTILOS_PUNTOS[index % ESTILOS_PUNTOS.length];

      const valoresReales = ds.data
        .map(d => d.valor)
        .filter(v => v !== null && v !== undefined && !Number.isNaN(v));
      const min = valoresReales.length > 0 ? Math.min(...valoresReales) : 0;
      const max = valoresReales.length > 0 ? Math.max(...valoresReales) : 0;

      const puntosMuestreados = muestrearDatos(ds.data, 300);
      const tamañoBase = puntosMuestreados.length > 50 ? 4 : 6;

      // Puntos {x, y} independientes: x = timestamp real del dato (parseado
      // como hora local, sin conversión de zona horaria), y = valor
      // normalizado (0-100%) o crudo según el sub-modo. valorReal/esAnomalia
      // viajan en el propio punto para que el tooltip y el estilo de puntos
      // (radio/color de anomalía) no dependan de arreglos paralelos por índice.
      const puntos = puntosMuestreados
        .filter(d => d.valor !== null && d.valor !== undefined && !Number.isNaN(d.valor))
        .map(d => ({
          x: new Date(d.tiempo),
          y: normalizar
            ? (max === min ? 50 : ((d.valor - min) / (max - min)) * 100)
            : d.valor,
          valorReal: d.valor,
          esAnomalia: !!d.esAnomalia,
        }));

      // Dataset "principal" (modo Conjunto): borde más grueso y se dibuja por
      // encima de las demás series (order más bajo = encima en Chart.js).
      const esPrincipal = !!ds.esPrincipal;

      return {
        label: `${ds.label} (${unidad})`,
        data: puntos,
        borderColor: color.border,
        backgroundColor: color.bg,
        yAxisID: 'y',
        tension: 0.3,
        fill: false,
        borderWidth: esPrincipal ? 3.5 : 2,
        order: esPrincipal ? 0 : 1,
        pointStyle: estiloPunto,
        pointRadius: (ctx) => ctx.raw?.esAnomalia ? tamañoBase + 4 : tamañoBase,
        pointBackgroundColor: (ctx) => ctx.raw?.esAnomalia ? '#ffffff' : color.border,
        pointBorderColor: color.border,
        pointBorderWidth: (ctx) => ctx.raw?.esAnomalia ? 4 : 2,
        pointHoverRadius: 10,
        spanGaps: true,
        _unidad: unidad,
      };
    });

    // Un solo eje Y: 0-100% normalizado, o lineal auto-escalado con valores reales
    const scales = {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'dd/MM HH:mm',
          displayFormats: {
            minute: 'dd/MM HH:mm',
            hour: 'dd/MM HH:mm',
            day: 'dd/MM',
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
          color: textColor,
        },
        grid: { color: gridColor },
      },
      y: normalizar
        ? {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Rango relativo (%)',
              color: textColor,
              font: { weight: 'bold', size: 12 }
            },
            ticks: {
              color: textColor,
              callback: (value) => `${value}%`,
            },
            grid: { color: gridColor },
          }
        : {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: false,
            title: {
              display: true,
              text: 'Valor (unidades mixtas)',
              color: textColor,
              font: { weight: 'bold', size: 12 }
            },
            ticks: {
              color: textColor,
              callback: (value) => value.toLocaleString('es-ES'),
            },
            grid: { color: gridColor },
          },
    };

    // Total de puntos (suma de todos los datasets) solo para decidir si animar
    const totalPuntos = chartDatasets.reduce((acc, ds) => acc + ds.data.length, 0);

    // Timestamp mostrado en el título del tooltip activo. Chart.js calcula
    // `title` antes que `body` (que dispara los callbacks `label`) dentro de
    // un mismo update síncrono, así que el callback `title` deja aquí el
    // valor y `label` lo lee para saber si su propio instante se aleja del
    // título. OJO: no usar `context.chart.tooltip.dataPoints` para esto — esa
    // propiedad recién se asigna DESPUÉS de calcular el body, así que durante
    // el callback `label` todavía tendría el valor del tooltip anterior.
    let tituloTooltipTs = null;

    // true si el punto de este item del tooltip está "fuera de tolerancia"
    // respecto al instante del título (tituloTooltipTs): el dataset SÍ tiene
    // datos en la ventana (si no, ni siquiera llegaría hasta acá — ver Caso A
    // en GraficoConjunto.vue, que ya no lo agrega como dataset de Chart.js),
    // pero su muestra más cercana al cursor está más lejos que su propia
    // tolerancia adaptativa (obtenerToleranciaDataset, compartida con el modo
    // de interacción 'nearestPorDataset' de plugins/chartjs.js). Se recalcula
    // en cada callback (title/labelColor/labelTextColor) en vez de guardarse
    // en una variable compartida entre callbacks para no depender del orden
    // en que Chart.js los invoca; el cálculo es barato porque el intervalo
    // mediano por dataset queda cacheado en un WeakMap.
    const fueraDeTolerancia = (context) => {
      const tsPunto = context.parsed?.x;
      if (tsPunto == null || tituloTooltipTs == null) return false;
      const tolerancia = obtenerToleranciaDataset(context.dataset.data);
      return Math.abs(tsPunto - tituloTooltipTs) > tolerancia;
    };

    // Crear el gráfico. Sin "labels" en data: al ser eje de tiempo, cada punto
    // trae su propio x y Chart.js posiciona/genera los ticks a partir de eso.
    const chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: chartDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Modo custom 'nearestPorDataset' (registrado en plugins/chartjs.js),
        // no 'index' ni 'x': los datasets ya NO comparten un mismo arreglo de
        // índices/timestamps (cada uno tiene su propia cantidad de puntos y su
        // propia ventana temporal). El modo 'x' nativo de Chart.js devuelve
        // TODOS los puntos cercanos al cursor en X, así que si una serie tiene
        // dos muestras próximas entran ambas y el tooltip la repite con dos
        // valores distintos. 'nearestPorDataset' selecciona como máximo un
        // punto por dataset (el más cercano en X, dentro de un umbral en px).
        interaction: {
          mode: 'nearestPorDataset',
          intersect: false,
        },
        animation: {
          duration: totalPuntos > 400 ? 0 : 800
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 15,
            }
          },
          tooltip: {
            enabled: true,
            mode: 'nearestPorDataset',
            intersect: false,
            callbacks: {
              title: function(tooltipItems) {
                if (tooltipItems.length > 0 && tooltipItems[0].parsed?.x != null) {
                  tituloTooltipTs = tooltipItems[0].parsed.x;
                  return formatearTiempoEjeX(tituloTooltipTs);
                }
                tituloTooltipTs = null;
                return '';
              },
              label: function(context) {
                const label = context.dataset.label || '';
                const unidad = context.dataset._unidad || '';

                // Caso B: el dataset SÍ tiene datos en la ventana, pero
                // ninguno cerca del instante bajo el cursor (más lejos que su
                // propia tolerancia adaptativa). En vez de que el sensor
                // desaparezca del tooltip sin explicación, se muestra en rojo
                // (ver labelColor/labelTextColor abajo) indicando cuándo fue
                // su muestra más cercana.
                if (fueraDeTolerancia(context)) {
                  const fecha = new Date(context.parsed.x);
                  const horaMuestra = !isNaN(fecha.getTime())
                    ? `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`
                    : '?';
                  return `${label}: sin dato aquí (última muestra ${horaMuestra})`;
                }

                // Con 'nearestPorDataset' cada item puede venir de un instante
                // ligeramente distinto al del título (cada dataset se muestrea
                // por separado). Si este punto difiere del título en más de un
                // minuto (y sigue DENTRO de tolerancia, ver arriba), se aclara
                // su propia hora al final del label para que no se lea como si
                // fuera el mismo instante que los demás.
                const tsPunto = context.parsed?.x;
                const tsTitulo = tituloTooltipTs;
                let sufijoHora = '';
                if (tsPunto != null && tsTitulo != null && Math.abs(tsPunto - tsTitulo) > 60000) {
                  const fecha = new Date(tsPunto);
                  if (!isNaN(fecha.getTime())) {
                    const hora = fecha.getHours().toString().padStart(2, '0');
                    const min = fecha.getMinutes().toString().padStart(2, '0');
                    sufijoHora = ` (${hora}:${min})`;
                  }
                }

                if (normalizar) {
                  const pct = context.parsed.y;
                  if (pct === null || pct === undefined) return null;
                  const valorReal = context.raw?.valorReal;
                  const valorTexto = (valorReal === null || valorReal === undefined)
                    ? 'sin dato'
                    : `${valorReal.toFixed(2)} ${unidad}`.trim();
                  return `${label}: ${valorTexto} (${pct.toFixed(0)}%)${sufijoHora}`;
                }
                const valor = context.parsed.y;
                if (valor === null || valor === undefined) return null;
                return `${label}: ${valor.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${unidad}`.trim() + sufijoHora;
              },
              // Pinta la cajita de color de ESTA línea del tooltip en rojo
              // cuando el punto está fuera de tolerancia (Caso B), dejando el
              // resto de líneas con el color normal del sensor.
              labelColor: function(context) {
                if (fueraDeTolerancia(context)) {
                  return {
                    borderColor: ROJO_SIN_DATO,
                    backgroundColor: ROJO_SIN_DATO,
                    borderWidth: 2,
                    borderRadius: 0,
                  };
                }
                // Caso normal: replica el color por defecto de Chart.js (lee
                // el estilo YA resuelto del punto — context.element.options —
                // en vez del color de línea del dataset) para que la cajita
                // conserve, por ejemplo, el relleno blanco de los puntos
                // anómalos en vez de mostrar siempre el color translúcido de
                // la línea.
                const opcionesPunto = context.element?.options;
                return {
                  borderColor: opcionesPunto?.borderColor || context.dataset.borderColor,
                  backgroundColor: opcionesPunto?.backgroundColor || context.dataset.backgroundColor,
                  borderWidth: 2,
                  borderRadius: 0,
                };
              },
              // Pinta el TEXTO de esa misma línea en rojo. '#fff' es el
              // bodyColor por defecto de Chart.js (tooltip con fondo oscuro
              // por defecto, sin overridear background/bodyColor acá).
              labelTextColor: function(context) {
                return fueraDeTolerancia(context) ? ROJO_SIN_DATO : '#fff';
              }
            }
          }
        },
        scales: scales,
      },
    });

    console.log('Gráfico normalizado creado exitosamente');
    return chartInstance;
  } catch (error) {
    console.error('Error al crear el gráfico normalizado:', error);
    return null;
  }
}
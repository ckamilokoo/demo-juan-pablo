// Parámetros globales de la demo (datos simulados en tiempo real).

// Cada cuánto Vue Query vuelve a pedir datos "en vivo" (sensores, alertas,
// bomba activa). Coincide con el paso de muestreo del simulador para que cada
// refetch traiga exactamente un punto nuevo.
export const REFRESCO_DEMO_MS = 3000;

// Reloj de planta acelerado: el sistema real registra 1 dato por minuto. Para
// que la demo se vea "en vivo" sin esperar un minuto por punto, cada 3 s
// reales avanzan 60 s de planta (factor 20). Cada refetch trae así un punto
// nuevo y los ejes muestran minutos distintos (20:34, 20:35, ...).
export const FACTOR_TIEMPO = 20;

// Paso de muestreo de las señales, en segundos de PLANTA (1 minuto, como producción).
export const PASO_VIVO_S = 60;

// Eficiencia/potencia cubren una ventana de días: se refrescan un poco menos.
export const REFRESCO_EFICIENCIA_MS = 6000;

// Latencia simulada de la "API", para que se vean los estados de carga.
export const LATENCIA_MS = 120;

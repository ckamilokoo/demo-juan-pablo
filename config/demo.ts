// Parámetros globales de la demo (datos simulados en tiempo real).

// Cada cuánto Vue Query vuelve a pedir datos "en vivo" (sensores, alertas,
// bomba activa). Coincide con el paso de muestreo del simulador para que cada
// refetch traiga exactamente un punto nuevo.
export const REFRESCO_DEMO_MS = 3000;

// Paso de muestreo de las señales en vivo, en segundos.
export const PASO_VIVO_S = 3;

// Eficiencia/potencia cubren una ventana de días: se refrescan un poco menos.
export const REFRESCO_EFICIENCIA_MS = 6000;

// Latencia simulada de la "API", para que se vean los estados de carga.
export const LATENCIA_MS = 120;

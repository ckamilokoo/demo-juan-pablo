// Bus de control de la interfaz: el agente de voz emite órdenes ("navegar",
// "senales", "anomalias", ...) y los componentes que saben ejecutarlas se
// suscriben. Cada handler devuelve un resultado (texto para el agente) o
// `undefined` si la orden no le corresponde (p. ej. otra bomba).
import { onBeforeUnmount, reactive } from "vue";

export type TipoOrden = "navegar" | "senales" | "anomalias" | "eficiencia" | "tema" | "demo";
type Handler = (payload: any) => string | undefined | Promise<string | undefined>;

// En globalThis para que exista una sola instancia aunque la recarga en
// caliente (HMR) cargue dos copias de este módulo: si no, los componentes se
// registraban en una y el agente emitía en la otra.
const g = globalThis as any;
const handlers: Map<TipoOrden, Set<Handler>> = (g.__ordenesUI ??= new Map());

// Estado visible de la interfaz, para que el agente sepa qué hay en pantalla.
export const estadoUI: { vista: string; vistaNombre: string; temaOscuro: boolean } = (g.__estadoUI ??= reactive({
  vista: "overview",
  vistaNombre: "Visión general",
  temaOscuro: true,
}));

/** Registra un handler mientras el componente esté montado. */
export const useOrdenUI = (tipo: TipoOrden, handler: Handler) => {
  if (!handlers.has(tipo)) handlers.set(tipo, new Set());
  handlers.get(tipo)!.add(handler);
  onBeforeUnmount(() => handlers.get(tipo)?.delete(handler));
};

/** Ejecuta la orden en el primer handler que la acepte. */
export const emitirOrden = async (tipo: TipoOrden, payload: unknown): Promise<string | undefined> => {
  for (const h of handlers.get(tipo) ?? []) {
    const r = await h(payload);
    if (r !== undefined) return r;
  }
  return undefined;
};

/**
 * Igual que emitirOrden pero reintenta hasta `esperaMs`: tras navegar, la
 * vista destino se carga async y su handler aparece unos cientos de ms después.
 */
export const emitirOrdenCuandoListo = async (
  tipo: TipoOrden,
  payload: unknown,
  esperaMs = 4000
): Promise<string | undefined> => {
  const limite = Date.now() + esperaMs;
  while (Date.now() < limite) {
    const r = await emitirOrden(tipo, payload);
    if (r !== undefined) return r;
    await new Promise((res) => setTimeout(res, 150));
  }
  return undefined;
};

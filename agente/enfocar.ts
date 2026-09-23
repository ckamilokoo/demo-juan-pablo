// Lleva a la vista la sección de la que se está hablando y la resalta unos
// segundos. Las secciones se marcan en la interfaz con data-foco="…".

export const SECCIONES_FOCO = [
  "alertas",
  "bitacoras",
  "eficiencia_sistema",
  "eficiencia_a",
  "eficiencia_b",
  "anomalias_graficos",
  "anomalias_sensores",
] as const;
export type SeccionFoco = (typeof SECCIONES_FOCO)[number];

const DURACION_RESALTE_MS = 2600;

/** Resalta un elemento ya encontrado (scroll suave + borde animado). */
export const resaltar = (el: Element, bloque: ScrollLogicalPosition = "start") => {
  el.scrollIntoView({ behavior: "smooth", block: bloque });
  el.classList.remove("foco-agente");
  // Forzar reflow para reiniciar la animación si ya estaba resaltado.
  void (el as HTMLElement).offsetWidth;
  el.classList.add("foco-agente");
  setTimeout(() => el.classList.remove("foco-agente"), DURACION_RESALTE_MS);
};

/**
 * Busca la sección (reintentando mientras la vista termina de montarse) y la
 * enfoca. Devuelve false si no apareció a tiempo.
 */
export const enfocarSeccion = async (seccion: SeccionFoco, esperaMs = 4000): Promise<boolean> => {
  const limite = Date.now() + esperaMs;
  while (Date.now() < limite) {
    const el = document.querySelector(`main [data-foco="${seccion}"]`);
    if (el && (el as HTMLElement).offsetHeight > 0) {
      resaltar(el);
      return true;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
};

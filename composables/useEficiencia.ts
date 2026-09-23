// Composables de eficiencia por bomba (GET /sensores/eficiencia, /sensores_b/eficiencia)

import { createUseEficiencia } from "./factories/createUseEficiencia";

export const useEficienciaBombaA = createUseEficiencia('A');
export const useEficienciaBombaB = createUseEficiencia('B');

export type { RegistroEficiencia, UseEficienciaReturn } from "./factories/createUseEficiencia";

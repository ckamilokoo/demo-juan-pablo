// Re-export de sensores usando la factory function
// Este archivo mantiene compatibilidad con los imports existentes

import { createUseSensores } from "./factories/createUseSensores";

// Composable para Bomba A
export const useSensores = createUseSensores('A');

// Composable para Bomba B (tambien disponible aqui para conveniencia)
export const useSensoresB = createUseSensores('B');

// Re-export de tipos
export type { UseSensoresReturn } from "./factories/createUseSensores";

// Re-export de bitacoras usando la factory function
// Este archivo mantiene compatibilidad con los imports existentes

import { createUseBitacoras } from "./factories/createUseBitacoras";

// Composable para Bomba A
export const useBitacoras = createUseBitacoras('A');

// Composable para Bomba B (tambien disponible aqui para conveniencia)
export const useBitacorasB = createUseBitacoras('B');

// Re-export de tipos
export type { UseBitacorasReturn } from "./factories/createUseBitacoras";

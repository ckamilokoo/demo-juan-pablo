// En la demo no se registran eventos de uso: misma interfaz, sin efecto.
export const useTracking = () => {
  const push = (_evento?: unknown) => {}
  const flush = async () => {}
  return { push, flush }
}

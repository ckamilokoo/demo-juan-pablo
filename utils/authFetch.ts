// Versión demo de authFetch: misma firma que la del sistema real, pero en vez
// de ir a la red responde el simulador en el navegador (mock/simulador.ts).
// Todos los composables pasan por aquí, así que la UI no se entera del cambio.
import { responder } from '~/mock/simulador'
import { LATENCIA_MS } from '~/config/demo'

export const authFetch = async (url: string, _options: RequestInit = {}) => {
  await new Promise((r) => setTimeout(r, LATENCIA_MS))
  const { status, body } = responder(url)
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

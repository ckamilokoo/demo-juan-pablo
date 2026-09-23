// Protege el dashboard: sin sesión demo se vuelve al login.
import { sesionValida } from '~/utils/sesion'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return
  if (import.meta.server) return
  if (!sesionValida()) return navigateTo('/login')
})

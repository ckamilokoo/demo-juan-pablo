// $auth de la demo: misma interfaz que el plugin real (isAuthenticated,
// userInfo, login, logout) pero sin Entra ID.
import { ref } from 'vue'
import { leerSesion, guardarSesion, limpiarSesion } from '~/utils/sesion'

// "ana.rojas@planta.demo" -> "Ana Rojas"
const nombreDesde = (usuario) => {
  const base = usuario.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Operador Demo'
}

export default defineNuxtPlugin(() => {
  const inicial = leerSesion()
  const isAuthenticated = ref(!!inicial)
  const userInfo = ref(inicial)

  const auth = {
    isAuthenticated,
    userInfo,
    login: (usuario = '') => {
      const u = usuario.trim() || 'operador@planta.demo'
      const info = {
        name: nombreDesde(u),
        email: u.includes('@') ? u : `${u}@planta.demo`,
      }
      guardarSesion(info)
      userInfo.value = info
      isAuthenticated.value = true
    },
    logout: () => {
      limpiarSesion()
      userInfo.value = null
      isAuthenticated.value = false
      navigateTo('/login?sesion=cerrada')
    },
    isTokenValid: () => isAuthenticated.value,
  }

  return { provide: { auth } }
})

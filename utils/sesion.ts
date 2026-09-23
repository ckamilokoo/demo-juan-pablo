// Sesión de la demo: una marca en localStorage con el usuario que ingresó.
// No hay tokens ni backend; cualquier credencial es válida.
const CLAVE = 'demo_sesion'

export interface UsuarioDemo {
  name: string
  email: string
}

export const leerSesion = (): UsuarioDemo | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CLAVE)
    return raw ? (JSON.parse(raw) as UsuarioDemo) : null
  } catch {
    return null
  }
}

export const guardarSesion = (usuario: UsuarioDemo) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(usuario))
  } catch { /* modo privado: la sesión dura lo que la pestaña */ }
}

export const limpiarSesion = () => {
  try {
    localStorage.removeItem(CLAVE)
  } catch { /* sin almacenamiento disponible */ }
}

export const sesionValida = () => leerSesion() !== null

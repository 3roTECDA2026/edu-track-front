// Usuario logueado, leído del token (CRM-059).
// Solo sirve para mostrar u ocultar acciones: el back valida igual los permisos en cada pedido.
export interface CurrentUser {
  userId: string | null
  role: string | null
}

export function currentUser(): CurrentUser {
  // Mismo orden que fetchApi: primero la sesión actual, después la recordada
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  if (!token) return { userId: null, role: null }
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const data = JSON.parse(atob(payload)) as { userId?: string; role?: string }
    return { userId: data.userId ?? null, role: data.role ?? null }
  } catch {
    return { userId: null, role: null }
  }
}

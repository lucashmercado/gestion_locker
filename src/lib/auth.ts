import GoTrue from 'gotrue-js'

// En producción Netlify, la URL de Identity es automáticamente el mismo sitio.
// En desarrollo local con `netlify dev`, también funciona en el mismo puerto.
const identityUrl =
  (import.meta.env.VITE_NETLIFY_URL || window.location.origin) +
  '/.netlify/identity'

export const goTrue = new GoTrue({
  APIUrl:    identityUrl,
  audience:  '',
  setCookie: true,
})

/** Obtiene el token de acceso del usuario actual */
export function getToken(): string | null {
  return goTrue.currentUser()?.token?.access_token ?? null
}

/** Obtiene el usuario actual */
export function currentUser() {
  return goTrue.currentUser()
}

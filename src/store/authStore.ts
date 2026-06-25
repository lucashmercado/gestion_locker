import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { goTrue, getToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { Gym } from '@/types'

export type UserRol = 'admin' | 'empleado'

interface AuthState {
  user:    any | null
  gym:     Gym | null
  rol:     UserRol | null
  loading: boolean

  initialize:  () => Promise<void>
  signIn:      (email: string, password: string) => Promise<{ error: any }>
  signUp:      (email: string, password: string, nombreGym: string) => Promise<{ error: any }>
  signInDemo:  () => void
  signOut:     () => Promise<void>
  setGym:      (gym: Gym) => void

  isAdmin:     () => boolean
  canDelete:   () => boolean
  canSettings: () => boolean
}

function parseUser(nlUser: any): { user: any; rol: UserRol | null } {
  if (!nlUser) return { user: null, rol: null }
  const rol = (nlUser.app_metadata?.rol as UserRol) ?? null
  return { user: nlUser, rol }
}

/** Determina el rol efectivo: si hay gym y rol es null, asume admin (propietario reciente) */
function resolveRol(rol: UserRol | null, gym: any, user: any): UserRol | null {
  if (rol) return rol
  if (!gym) return null
  // Si el gym existe: puede ser admin (owner) o empleado. 
  // Si app_metadata.rol es 'empleado', respetamos eso.
  if (user?.app_metadata?.rol === 'empleado') return 'empleado'
  // Sin rol definido pero con gym => admin (propietario que aún no tiene JWT actualizado)
  return 'admin'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:    null,
      gym:     null,
      rol:     null,
      loading: true,

      initialize: async () => {
        set({ loading: true })
        const nlUser = goTrue.currentUser()
        if (nlUser) {
          const { user, rol } = parseUser(nlUser)
          // Cargar el gym desde la API
          try {
            const gym = await api.get('/gyms')
            // Si el rol en el JWT no está definido aún pero hay gym, asumir admin
            const rolEfectivo = resolveRol(rol, gym, nlUser)
            set({ user, gym, rol: rolEfectivo, loading: false })
          } catch {
            set({ user, gym: null, rol, loading: false })
          }
        } else {
          // Si ya teníamos cargado un demo user en localStorage de authState, lo mantenemos cargado
          const localUser = get().user
          if (localUser?.email === 'demo@gimnasio.com') {
            set({ loading: false })
          } else {
            set({ user: null, gym: null, rol: null, loading: false })
          }
        }
      },

      signIn: async (email, password) => {
        try {
          const nlUser = await goTrue.login(email, password, true)
          const { user, rol } = parseUser(nlUser)

          // Intentar cargar el gym del usuario
          let gym = await api.get('/gyms').catch(() => null)

          // Si no tiene gym aún, ver si hay un nombre pendiente del registro
          if (!gym) {
            const pendingGymName = localStorage.getItem('pending_gym_name')
            if (pendingGymName) {
              try {
                gym = await api.post('/gyms', { nombre: pendingGymName })
                localStorage.removeItem('pending_gym_name')
              } catch (gymErr) {
                console.error('Error creando gym pendiente:', gymErr)
              }
            }
          }

          // Resolver rol efectivo
          const rolEfectivo = resolveRol(rol, gym, nlUser)
          set({ user, gym, rol: rolEfectivo })
          return { error: null }
        } catch (e: any) {
          return { error: e }
        }
      },

      signUp: async (email, password, nombreGym) => {
        try {
          // 1. Crear usuario en Netlify Identity
          await goTrue.signup(email, password, { nombre: nombreGym })

          // Guardar el nombre del gym para cuando el usuario confirme y haga login
          localStorage.setItem('pending_gym_name', nombreGym)

          // 2. Intentar auto-login (solo funciona si no requiere confirmación de email)
          try {
            const logged = await goTrue.login(email, password, true)
            const { user, rol } = parseUser(logged)
            // 3. Crear gym vía API inmediatamente
            const gym = await api.post('/gyms', { nombre: nombreGym })
            localStorage.removeItem('pending_gym_name')
            set({ user, gym, rol: 'admin' })
          } catch {
            // Email confirmation requerida — el gym se creará al hacer login después de confirmar
          }
          return { error: null }
        } catch (e: any) {
          return { error: e }
        }
      },

      signInDemo: () => {
        set({
          user: { email: 'demo@gimnasio.com', user_metadata: { nombre: 'Gimnasio Demo' } },
          gym: { id: 'demo', owner_id: 'demo-owner', nombre: 'Gimnasio Demo', direccion: 'Calle Demo 123', telefono: '555-DEMO', fecha_creacion: '' },
          rol: 'admin',
          loading: false,
        })
      },

      signOut: async () => {
        const u = goTrue.currentUser()
        if (u) await u.logout()
        set({ user: null, gym: null, rol: null })
      },

      setGym: (gym) => set({ gym }),

      isAdmin:     () => get().rol === 'admin',
      canDelete:   () => get().rol === 'admin',
      canSettings: () => get().rol === 'admin',
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, gym: s.gym, rol: s.rol }),
    }
  )
)

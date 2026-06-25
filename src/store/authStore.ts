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
            set({ user, gym, rol, loading: false })
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
          const gym = await api.get('/gyms').catch(() => null)
          set({ user, gym, rol })
          return { error: null }
        } catch (e: any) {
          return { error: e }
        }
      },

      signUp: async (email, password, nombreGym) => {
        try {
          // 1. Crear usuario en Netlify Identity
          const nlUser = await goTrue.signup(email, password, { nombre: nombreGym })
          // 2. Auto-login (si el proyecto no tiene email confirmation)
          try {
            const logged = await goTrue.login(email, password, true)
            const { user, rol } = parseUser(logged)
            // 3. Crear gym vía API
            const gym = await api.post('/gyms', { nombre: nombreGym })
            set({ user, gym, rol: 'admin' })
          } catch {
            // Email confirmation requerida — usuario creado pero no logueado aún
            set({ user: nlUser, gym: null, rol: null })
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

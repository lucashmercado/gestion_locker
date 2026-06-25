import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Locker, EstadoLocker, LockerOcupadoDetalle } from '@/types'

interface LockerState {
  lockers:         Locker[]
  lockersOcupados: LockerOcupadoDetalle[]
  loading: boolean
  error:   string | null

  fetchLockers:         (gymId: string) => Promise<void>
  fetchLockersOcupados: (gymId: string) => Promise<void>
  addLocker:            (locker: Omit<Locker, 'id'>) => Promise<{ error: any }>
  updateLocker:         (id: string, updates: Partial<Locker>) => Promise<{ error: any }>
  deleteLocker:         (id: string) => Promise<{ error: any }>
  cambiarEstado:        (id: string, estado: EstadoLocker) => Promise<void>
}

export const useLockerStore = create<LockerState>((set, get) => ({
  lockers:         [],
  lockersOcupados: [],
  loading: false,
  error:   null,

  fetchLockers: async (_gymId) => {
    set({ loading: true, error: null })
    try {
      const data = await api.get('/lockers')
      set({ lockers: data || [] })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchLockersOcupados: async (_gymId) => {
    try {
      const data = await api.get('/lockers')
      const ocupados = (data || []).filter((l: Locker) =>
        l.estado === 'ocupado' || l.estado === 'vencido'
      )
      set({ lockersOcupados: ocupados })
    } catch { /* silencioso */ }
  },

  addLocker: async (locker) => {
    try {
      const created = await api.post('/lockers', locker)
      set((s) => ({ lockers: [...s.lockers, created] }))
      return { error: null }
    } catch (e: any) {
      return { error: { message: e.message } }
    }
  },

  updateLocker: async (id, updates) => {
    try {
      const updated = await api.put(`/lockers?id=${id}`, updates)
      set((s) => ({ lockers: s.lockers.map((l) => (l.id === id ? { ...l, ...updated } : l)) }))
      return { error: null }
    } catch (e: any) {
      return { error: { message: e.message } }
    }
  },

  deleteLocker: async (id) => {
    try {
      await api.delete(`/lockers?id=${id}`)
      set((s) => ({ lockers: s.lockers.filter((l) => l.id !== id) }))
      return { error: null }
    } catch (e: any) {
      return { error: { message: e.message } }
    }
  },

  cambiarEstado: async (id, estado) => {
    await get().updateLocker(id, { estado } as any)
  },
}))

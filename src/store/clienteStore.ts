import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Cliente } from '@/types'

interface ClienteState {
  clientes: Cliente[]
  loading: boolean
  error:   string | null

  fetchClientes:  (gymId: string) => Promise<void>
  addCliente:     (cliente: Omit<Cliente, 'id' | 'fecha_creacion'>) => Promise<{ data: Cliente | null; error: any }>
  updateCliente:  (id: string, updates: Partial<Cliente>) => Promise<{ error: any }>
  deleteCliente:  (id: string) => Promise<{ error: any }>
  buscarClientes: (gymId: string, query: string) => Promise<Cliente[]>
}

export const useClienteStore = create<ClienteState>((set) => ({
  clientes: [],
  loading:  false,
  error:    null,

  fetchClientes: async (_gymId) => {
    set({ loading: true, error: null })
    try {
      const data = await api.get('/clientes')
      set({ clientes: data || [] })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  addCliente: async (cliente) => {
    try {
      const created = await api.post('/clientes', cliente)
      set((s) => ({ clientes: [...s.clientes, created] }))
      return { data: created, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  },

  updateCliente: async (id, updates) => {
    try {
      const updated = await api.put(`/clientes?id=${id}`, updates)
      set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? { ...c, ...updated } : c)) }))
      return { error: null }
    } catch (e: any) {
      return { error: { message: e.message } }
    }
  },

  deleteCliente: async (id) => {
    try {
      await api.delete(`/clientes?id=${id}`)
      set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) }))
      return { error: null }
    } catch (e: any) {
      return { error: { message: e.message } }
    }
  },

  buscarClientes: async (_gymId, query) => {
    try {
      return await api.get(`/clientes?q=${encodeURIComponent(query)}`)
    } catch {
      return []
    }
  },
}))

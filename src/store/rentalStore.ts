import { create } from 'zustand'
import { api } from '@/lib/api'
import type {
  Alquiler, CrearAlquilerParams, RenovarAlquilerParams,
  DashboardMetricas, VencimientoDetectado,
} from '@/types'

interface AlquilerState {
  alquileres:  Alquiler[]
  metricas:    DashboardMetricas | null
  vencimientos: VencimientoDetectado[]
  loading: boolean
  error:   string | null

  fetchAlquileres:     (gymId: string) => Promise<void>
  fetchMetricas:       (gymId: string) => Promise<void>
  crearAlquiler:       (params: CrearAlquilerParams) => Promise<{ data: Alquiler | null; error: any }>
  renovarAlquiler:     (params: RenovarAlquilerParams) => Promise<{ data: Alquiler | null; error: any }>
  finalizarAlquiler:   (alquilerId: string) => Promise<{ error: any }>
  detectarVencimientos:(gymId: string) => Promise<VencimientoDetectado[]>
}

export const useAlquilerStore = create<AlquilerState>((set, get) => ({
  alquileres:  [],
  metricas:    null,
  vencimientos: [],
  loading: false,
  error:   null,

  fetchAlquileres: async (_gymId) => {
    set({ loading: true, error: null })
    try {
      const data = await api.get('/alquileres')
      set({ alquileres: data || [] })
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchMetricas: async (_gymId) => {
    try {
      const data = await api.get('/metrics')
      if (data) {
        set({
          metricas: {
            total_lockers:     Number(data.lockers?.total     ?? 0),
            lockers_libres:    Number(data.lockers?.libres    ?? 0),
            lockers_ocupados:  Number(data.lockers?.ocupados  ?? 0),
            lockers_vencidos:  Number(data.lockers?.vencidos  ?? 0),
            ingresos_mes:      Number(data.ingresosMes        ?? 0),
            ingresos_por_mes:  data.ingresosPorMes ?? [],
          } as any,
          alquileres: data.alquileresActivos ?? get().alquileres,
          vencimientos: data.porVencer ?? [],
        })
      }
    } catch { /* silencioso */ }
  },

  crearAlquiler: async (params) => {
    try {
      const created = await api.post('/alquileres', {
        lockerId:         params.locker_id,
        clienteId:        params.cliente_id,
        fechaInicio:      params.fecha_inicio,
        fechaVencimiento: params.fecha_vencimiento,
        tipoAlquiler:     params.tipo_alquiler,
        montoPagado:      params.monto_pagado,
        metodoPago:       params.metodo_pago,
      })
      await get().fetchAlquileres(params.gym_id)
      return { data: created, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  },

  renovarAlquiler: async (params) => {
    try {
      const updated = await api.put(`/alquileres?id=${params.alquiler_id}&action=renovar`, {
        fechaVencimiento: params.nueva_vencimiento,
        montoPagado:      params.monto_pagado,
        metodoPago:       params.metodo_pago,
      })
      set((s) => ({
        alquileres: s.alquileres.map((a) =>
          a.id === params.alquiler_id
            ? { ...a, fecha_vencimiento: params.nueva_vencimiento, monto_pagado: params.monto_pagado, estado: 'activo' as const }
            : a
        ),
      }))
      return { data: updated, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  },

  finalizarAlquiler: async (alquilerId) => {
    try {
      await api.put(`/alquileres?id=${alquilerId}&action=finalizar`, {})
      set((s) => ({
        alquileres: s.alquileres.map((a) =>
          a.id === alquilerId ? { ...a, estado: 'finalizado' as const } : a
        ),
      }))
      return { error: null }
    } catch (e: any) {
      return { error: { message: e.message } }
    }
  },

  detectarVencimientos: async (_gymId) => {
    // La detección es automática en GET /lockers — refrescamos métricas
    await get().fetchMetricas(_gymId)
    return get().vencimientos
  },
}))

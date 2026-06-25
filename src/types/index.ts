// Locker Manager — TypeScript Types v2 (esquema en español)

// ─── ESTADOS ─────────────────────────────────────────────────
export type EstadoLocker = 'libre' | 'ocupado' | 'vencido' | 'mantenimiento'
export type EstadoAlquiler = 'activo' | 'vencido' | 'finalizado'
export type TipoAlquiler = 'dia' | 'semana' | 'mes'
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

// ─── ENTIDADES ────────────────────────────────────────────────
export interface Gym {
  id: string
  owner_id: string
  nombre: string
  direccion?: string
  telefono?: string
  fecha_creacion: string
}

export interface Locker {
  id: string
  gym_id: string
  numero: string
  estado: EstadoLocker
  observaciones?: string
}

export interface Cliente {
  id: string
  gym_id: string
  nombre: string
  telefono?: string
  email?: string
  fecha_creacion: string
}

export interface Alquiler {
  id: string
  gym_id: string
  cliente_id: string
  locker_id: string
  fecha_inicio: string
  fecha_vencimiento: string
  tipo_alquiler: TipoAlquiler
  monto_pagado: number
  metodo_pago: MetodoPago
  estado: EstadoAlquiler
  fecha_creacion: string
  // Joined (cuando se usa alquileres_completo o join manual)
  locker?: Locker
  cliente?: Cliente
  locker_numero?: string
  locker_estado?: string
  cliente_nombre?: string
  cliente_telefono?: string
  cliente_email?: string
  dias_restantes?: number
}

// ─── FUNCIONES ────────────────────────────────────────────────
export interface CrearAlquilerParams {
  gym_id: string
  cliente_id: string
  locker_id: string
  fecha_inicio: string
  fecha_vencimiento: string
  tipo_alquiler: TipoAlquiler
  monto_pagado: number
  metodo_pago: MetodoPago
}

export interface RenovarAlquilerParams {
  alquiler_id: string
  nueva_vencimiento: string
  monto_pagado: number
  metodo_pago?: MetodoPago
}

// ─── DASHBOARD ────────────────────────────────────────────────
export interface DashboardMetricas {
  total_lockers: number
  lockers_libres: number
  lockers_ocupados: number
  lockers_vencidos: number
  lockers_mantenimiento: number
  tasa_ocupacion: number
  ingresos_mes_actual: number
  alquileres_activos: number
  vencen_esta_semana: number
  vencen_hoy: number
}

export interface VencimientoDetectado {
  alquiler_id: string
  locker_numero: string
  cliente_nombre: string
  dias_vencido: number
}

export interface LockerOcupadoDetalle {
  locker_id: string
  numero: string
  observaciones?: string
  cliente_nombre: string
  cliente_telefono?: string
  fecha_inicio: string
  fecha_vencimiento: string
  tipo_alquiler: TipoAlquiler
  monto_pagado: number
  metodo_pago: MetodoPago
  alquiler_id: string
  dias_restantes: number
}

import { format, isAfter, isBefore, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EstadoLocker, EstadoAlquiler } from '@/types'

// ─── FECHAS ──────────────────────────────────────────────────
export function formatFecha(date: string | Date): string {
  return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es })
}

export function formatFechaCorta(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

// ─── MONEDA ──────────────────────────────────────────────────
export function formatMoneda(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ─── ALQUILER ─────────────────────────────────────────────────
export function venceProximamente(fechaVencimiento: string): boolean {
  const end = new Date(fechaVencimiento)
  const soon = addDays(new Date(), 7)
  return isBefore(end, soon) && isAfter(end, new Date())
}

export function estaVencido(fechaVencimiento: string): boolean {
  return isBefore(new Date(fechaVencimiento), new Date())
}

export function diasRestantes(fechaVencimiento: string): number {
  const diff = new Date(fechaVencimiento).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── LOCKERS ──────────────────────────────────────────────────
export function colorEstadoLocker(estado: EstadoLocker): string {
  switch (estado) {
    case 'libre':         return '#10b981'
    case 'ocupado':       return '#3b82f6'
    case 'vencido':       return '#ef4444'
    case 'mantenimiento': return '#f59e0b'
    default:              return '#94a3b8'
  }
}

export function labelEstadoLocker(estado: EstadoLocker): string {
  switch (estado) {
    case 'libre':         return 'Libre'
    case 'ocupado':       return 'Ocupado'
    case 'vencido':       return 'Vencido'
    case 'mantenimiento': return 'Mantenimiento'
    default:              return estado
  }
}

export function claseEstadoLocker(estado: EstadoLocker): string {
  switch (estado) {
    case 'libre':         return 'locker-available'
    case 'ocupado':       return 'locker-rented'
    case 'vencido':       return 'locker-expired'
    case 'mantenimiento': return 'locker-maintenance'
    default:              return ''
  }
}

// ─── ALQUILERES ───────────────────────────────────────────────
export function labelEstadoAlquiler(estado: EstadoAlquiler): string {
  switch (estado) {
    case 'activo':     return 'Activo'
    case 'vencido':    return 'Vencido'
    case 'finalizado': return 'Finalizado'
    default:           return estado
  }
}

export function badgeEstadoAlquiler(estado: EstadoAlquiler): string {
  switch (estado) {
    case 'activo':     return 'badge-success'
    case 'vencido':    return 'badge-danger'
    case 'finalizado': return 'badge-muted'
    default:           return 'badge-muted'
  }
}

export function labelTipoAlquiler(tipo: string): string {
  switch (tipo) {
    case 'dia':    return 'Por día'
    case 'semana': return 'Por semana'
    case 'mes':    return 'Por mes'
    default:       return tipo
  }
}

export function labelMetodoPago(metodo: string): string {
  switch (metodo) {
    case 'efectivo':      return 'Efectivo'
    case 'transferencia': return 'Transferencia'
    case 'tarjeta':       return 'Tarjeta'
    case 'otro':          return 'Otro'
    default:              return metodo
  }
}

// ─── CLASES CSS ───────────────────────────────────────────────
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

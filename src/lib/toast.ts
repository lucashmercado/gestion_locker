/**
 * Toast notifications y ConfirmDialog
 * Centraliza todos los feedbacks de usuario
 */
import toast from 'react-hot-toast'

// ─── Configuración por defecto ────────────────────────────────
const BASE_STYLE = {
  background: '#111827',
  color: '#f8fafc',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: '500',
  padding: '12px 16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
}

// ─── Helpers tipados ──────────────────────────────────────────
export const toastSuccess = (msg: string) =>
  toast.success(msg, {
    style: { ...BASE_STYLE, border: '1px solid rgba(16,185,129,0.35)' },
    iconTheme: { primary: '#10b981', secondary: '#111827' },
    duration: 3000,
  })

export const toastError = (msg: string) =>
  toast.error(msg, {
    style: { ...BASE_STYLE, border: '1px solid rgba(239,68,68,0.35)' },
    iconTheme: { primary: '#ef4444', secondary: '#111827' },
    duration: 5000,
  })

export const toastWarning = (msg: string) =>
  toast(msg, {
    icon: '⚠️',
    style: { ...BASE_STYLE, border: '1px solid rgba(245,158,11,0.35)' },
    duration: 4000,
  })

export const toastLoading = (msg: string) =>
  toast.loading(msg, { style: BASE_STYLE })

export const toastDismiss = (id: string) => toast.dismiss(id)

export const toastPromise = <T>(
  promise: Promise<T>,
  msgs: { loading: string; success: string; error: string }
) =>
  toast.promise(promise, msgs, {
    style: BASE_STYLE,
    success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
    error:   { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
  })

export { toast }

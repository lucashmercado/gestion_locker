import { useState, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'

// ─── Context ─────────────────────────────────────────────────
type ConfirmOptions = {
  title:       string
  description: string
  confirmText?: string
  cancelText?:  string
  danger?:      boolean
}

type ConfirmContextType = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: async () => false })

export function useConfirm() {
  return useContext(ConfirmContext)
}

// ─── Provider ────────────────────────────────────────────────
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions
    resolve: (v: boolean) => void
  } | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ opts, resolve })
    })
  }, [])

  const handleChoice = (value: boolean) => {
    state?.resolve(value)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="glass rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              style={{ border: state.opts.danger ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(59,130,246,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: state.opts.danger ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    border: `1px solid ${state.opts.danger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                  {state.opts.danger
                    ? <Trash2 size={26} style={{ color: '#ef4444' }} />
                    : <AlertTriangle size={26} style={{ color: '#f59e0b' }} />}
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">{state.opts.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {state.opts.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleChoice(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  <X size={15} />
                  {state.opts.cancelText || 'Cancelar'}
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleChoice(true)}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: state.opts.danger
                      ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                      : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    boxShadow: state.opts.danger
                      ? '0 0 20px rgba(239,68,68,0.3)'
                      : '0 0 20px rgba(59,130,246,0.3)',
                  }}
                >
                  {state.opts.danger ? <Trash2 size={15} /> : <AlertTriangle size={15} />}
                  {state.opts.confirmText || 'Confirmar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

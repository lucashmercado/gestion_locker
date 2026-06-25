import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-8"
        style={{ background: 'var(--color-bg-primary)' }}>
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={36} style={{ color: '#ef4444' }} />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-3">Algo salió mal</h1>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Ocurrió un error inesperado. Por favor recargá la página.
          </p>

          {this.state.error && (
            <details className="mb-6 text-left">
              <summary className="text-xs cursor-pointer mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Detalles del error
              </summary>
              <pre className="text-xs p-3 rounded-lg overflow-auto"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}

          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            className="btn-primary px-6 py-3 gap-2"
          >
            <RefreshCw size={16} />
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }
}

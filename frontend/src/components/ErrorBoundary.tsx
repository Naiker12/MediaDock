import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10 shadow-lg shadow-danger/5">
            <AlertCircle className="h-10 w-10 text-danger" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-zinc-100">
            Algo sali\u00f3 mal
          </h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-zinc-400">
            {this.state.error?.message || 'Ha ocurrido un error inesperado.'}
          </p>
          <Button onClick={this.handleReset} variant="secondary" size="lg" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

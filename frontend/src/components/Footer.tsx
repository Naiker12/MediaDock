import { Download } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-background py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-zinc-400">
            VideoDownloader
          </span>
        </div>
        <p className="text-xs text-zinc-600">
          Solo para uso con contenido permitido o de dominio p&uacute;blico.
        </p>
      </div>
    </footer>
  )
}

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { VideoInput } from '@/components/VideoInput'
import { Footer } from '@/components/Footer'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Loading } from '@/components/Loading'
import { useAppStore } from '@/store/useAppStore'
import { Download, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

const VideoPreview = lazy(() => import('@/components/VideoPreview').then(m => ({ default: m.VideoPreview })))
const DownloadSection = lazy(() => import('@/components/DownloadSection').then(m => ({ default: m.DownloadSection })))
const ClipSection = lazy(() => import('@/components/ClipSection').then(m => ({ default: m.ClipSection })))
const ErrorState = lazy(() => import('@/components/ErrorState').then(m => ({ default: m.ErrorState })))

const TABS = [
  { id: 'download', label: 'Descargar', icon: Download },
  { id: 'clips', label: 'Clips', icon: Scissors },
] as const

type TabId = (typeof TABS)[number]['id']

function Fallback() {
  return (
    <div className="py-10"><Loading label="Preparando el espacio" detail="Un momento, estamos cargando esta sección" /></div>
  )
}

export function Home() {
  const status = useAppStore((s) => s.status)
  const videoInfo = useAppStore((s) => s.videoInfo)
  const [activeTab, setActiveTab] = useState<TabId>('download')
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'loading' || status === 'success' || status === 'error') {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [status])

  const hasVideo = status === 'success'

  return (
    <div className="app-shell flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6">
          <section className="hero-grid mb-8 rounded-3xl border border-zinc-800/70 px-5 py-8 sm:px-8 sm:py-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">MediaDock</p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">Tu video, listo para descargar o convertir en clips.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Pega un enlace para ver los formatos disponibles. Sin menús innecesarios ni pasos confusos.</p>
          </section>
          <div className="mb-7">
            <VideoInput />
          </div>

          <div className="mx-auto w-full">
            <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={resultsRef}>
            <Suspense fallback={<Fallback />}>
              {status === 'loading' && !videoInfo && <Loading />}
              <AnimatePresence mode="wait" initial={false}>
                {status === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                    <ErrorState />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {activeTab === 'download' && (
                  <motion.div
                    key="download"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {hasVideo && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <VideoPreview />
                      </motion.div>
                    )}
                    <DownloadSection />
                  </motion.div>
                )}
                {activeTab === 'clips' && (
                  <motion.div
                    key="clips"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6"
                  >
                    <ClipSection />
                  </motion.div>
                )}
              </AnimatePresence>
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
      <KeyboardShortcuts />
      <SettingsPanel />
    </div>
  )
}

import { lazy, Suspense, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { VideoInput } from '@/components/VideoInput'
import { Footer } from '@/components/Footer'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { SettingsPanel } from '@/components/SettingsPanel'
import { useAppStore } from '@/store/useAppStore'

const Loading = lazy(() => import('@/components/Loading').then(m => ({ default: m.Loading })))
const VideoPreview = lazy(() => import('@/components/VideoPreview').then(m => ({ default: m.VideoPreview })))
const DownloadSection = lazy(() => import('@/components/DownloadSection').then(m => ({ default: m.DownloadSection })))
const ErrorState = lazy(() => import('@/components/ErrorState').then(m => ({ default: m.ErrorState })))

function Fallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export function Home() {
  const status = useAppStore((s) => s.status)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'loading' || status === 'success' || status === 'error') {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [status])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16">
          <div className="mb-6 mt-4">
            <VideoInput />
          </div>

          <div ref={resultsRef}>
            <Suspense fallback={<Fallback />}>
              <AnimatePresence mode="sync">
                {status === 'loading' && (
                  <div key="loading">
                    <Loading />
                  </div>
                )}
                {status === 'success' && (
                  <div key="success">
                    <VideoPreview />
                    <DownloadSection />
                  </div>
                )}
                {status === 'error' && (
                  <div key="error">
                    <ErrorState />
                  </div>
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

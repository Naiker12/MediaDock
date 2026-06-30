import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VideoInfo, AppStatus, DownloadItem, DownloadProgress } from '@/types'

interface AppState {
  status: AppStatus
  videoInfo: VideoInfo | null
  videoUrl: string | null
  error: string | null
  errorCode: string | null
  selectedQuality: string | null
  showPreviewModal: boolean
  downloadProgress: DownloadProgress | null
  isDownloading: boolean
  history: DownloadItem[]
  showSettings: boolean

  setStatus: (status: AppStatus) => void
  setVideoInfo: (info: VideoInfo | null) => void
  setVideoUrl: (url: string | null) => void
  setError: (error: string | null, code?: string | null) => void
  setSelectedQuality: (quality: string | null) => void
  setShowPreviewModal: (show: boolean) => void
  setDownloadProgress: (progress: DownloadProgress | null) => void
  setIsDownloading: (downloading: boolean) => void
  addToHistory: (item: DownloadItem) => void
  clearHistory: () => void
  reset: () => void
  setShowSettings: (show: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      status: 'idle',
      videoInfo: null,
      videoUrl: null,
      error: null,
      errorCode: null,
      selectedQuality: null,
      showPreviewModal: false,
      downloadProgress: null,
      isDownloading: false,
      history: [],
      showSettings: false,

      setStatus: (status) => set({ status }),
      setVideoInfo: (info) => set({ videoInfo: info, error: null, errorCode: null }),
      setVideoUrl: (url) => set({ videoUrl: url }),
      setError: (error, code = null) => set({ error, errorCode: code, videoInfo: null }),
      setSelectedQuality: (quality) => set({ selectedQuality: quality }),
      setShowPreviewModal: (show) => set({ showPreviewModal: show }),
      setDownloadProgress: (progress) => set({ downloadProgress: progress }),
      setIsDownloading: (downloading) => set({ isDownloading: downloading }),
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history].slice(0, 10),
        })),
      clearHistory: () => set({ history: [] }),
      setShowSettings: (show) => set({ showSettings: show }),
      reset: () =>
        set({
          status: 'idle',
          videoInfo: null,
          videoUrl: null,
          error: null,
          errorCode: null,
          selectedQuality: null,
          downloadProgress: null,
          isDownloading: false,
        }),
    }),
    {
      name: 'video-downloader-storage',
      partialize: (state) => ({ history: state.history }),
    },
  ),
)

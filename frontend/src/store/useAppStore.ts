import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VideoInfo, AppStatus, DownloadItem, DownloadProgress, ClipResult, ClipStatus } from '@/types'

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
  clipStatus: ClipStatus
  clipResult: ClipResult | null
  clipError: string | null

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
  setClipStatus: (status: ClipStatus) => void
  setClipResult: (result: ClipResult | null) => void
  setClipError: (error: string | null) => void
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
      clipStatus: 'idle',
      clipResult: null,
      clipError: null,

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
      setClipStatus: (clipStatus) => set({ clipStatus }),
      setClipResult: (clipResult) => set({ clipResult, clipStatus: clipResult ? 'done' : 'idle' }),
      setClipError: (clipError) => set({ clipError, clipStatus: clipError ? 'error' : 'idle' }),
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
          clipStatus: 'idle',
          clipResult: null,
          clipError: null,
        }),
    }),
    {
      name: 'video-downloader-storage',
      partialize: (state) => ({ history: state.history }),
    },
  ),
)

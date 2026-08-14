import { useMutation } from '@tanstack/react-query'
import { analyzeVideo } from '@/services/api'
import { ApiRequestError } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'

export function useVideoInfo() {
  const { setStatus, setVideoInfo, setVideoReady, setError } = useAppStore()

  return useMutation({
    mutationFn: (url: string) => analyzeVideo(url).then(r => r.info),
    onMutate: () => {
      setStatus('loading')
      setVideoInfo(null)
      setError(null)
    },
    onSuccess: (data) => {
      setVideoReady(data)
    },
    onError: (err: Error) => {
      const code = err instanceof ApiRequestError ? err.code : null
      const message = err.message || 'No se pudo obtener información del video. Verifica la URL.'
      setError(message, code)
      setStatus('error')
      toast.error(message)
    },
  })
}

let currentAbort: AbortController | null = null

export function setAbortController(controller: AbortController | null) {
  currentAbort = controller
}

export function cancelDownload() {
  if (currentAbort) {
    currentAbort.abort()
    currentAbort = null
  }
}

export function getAbortSignal(): AbortSignal | undefined {
  return currentAbort?.signal
}

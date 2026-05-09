import { useEffect, useRef, useCallback, useState } from 'react'

export function useInactivity(timeoutMs: number, onReset: () => void, active = true) {
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const clearAll = useCallback(() => {
    if (timerRef.current)    clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCountdown(null)
  }, [])

  const restart = useCallback(() => {
    if (!active) return
    clearAll()
    timerRef.current = setTimeout(() => {
      let secs = 10
      setCountdown(secs)
      intervalRef.current = setInterval(() => {
        secs--
        if (secs <= 0) { clearAll(); onReset() }
        else setCountdown(secs)
      }, 1000)
    }, timeoutMs)
  }, [active, timeoutMs, onReset, clearAll])

  useEffect(() => {
    if (!active) { clearAll(); return }
    const events = ['touchstart', 'mousedown', 'click']
    const handler = () => restart()
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    restart()
    return () => {
      clearAll()
      events.forEach(e => window.removeEventListener(e, handler))
    }
  }, [active, restart, clearAll])

  return { countdown, cancelReset: clearAll }
}

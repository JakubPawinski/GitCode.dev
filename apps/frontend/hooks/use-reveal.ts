'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * One-shot "has this entered the viewport yet" flag, backed by
 * IntersectionObserver rather than a scroll listener, so it costs nothing per
 * frame. Returns a boolean (not a continuous value), so the single re-render
 * it triggers is intentional.
 *
 * Visitors who ask for reduced motion get `true` immediately and never see a
 * transition.
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, shown }
}

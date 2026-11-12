import { useEffect, useRef } from 'react'

/** Adds `.in` to the element (and flips `data-in`) once it enters the viewport. */
export function useReveal<T extends HTMLElement>(once = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          if (once) io.disconnect()
        } else if (!once) el.classList.remove('in')
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])
  return ref
}

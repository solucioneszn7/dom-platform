// ===== Hook de Animaciones GSAP — DOM Platform =====
// Uso: importa el hook que necesites en cualquier componente
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// ─── 1. Entrada de página (fadeSlide) ───────────────────────────────────────
// Reemplaza el animate-page-enter de CSS por una versión GSAP más suave
export function useEntradaPagina() {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
    )
  }, [])

  return ref
}

// ─── 2. Stagger de tarjetas (cuando datos llegan de Firebase) ────────────────
// Uso: llama a animarTarjetas(containerRef) justo después de setState con datos
export function useStaggerTarjetas() {
  const ref = useRef(null)

  const animar = () => {
    if (!ref.current) return
    const items = ref.current.querySelectorAll('[data-animar]')
    if (!items.length) return

    gsap.fromTo(
      items,
      { opacity: 0, y: 16, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.07,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }
    )
  }

  return { ref, animar }
}

// ─── 3. Contador animado para números (stats del dashboard) ──────────────────
// Uso: <span ref={contadorRef} /> — anima desde 0 hasta `valor`
export function useContador(valor, activo = true) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !activo || typeof valor !== 'number') return
    const obj = { n: 0 }
    gsap.to(obj, {
      n: valor,
      duration: 0.8,
      ease: 'power1.out',
      onUpdate() {
        if (ref.current) ref.current.textContent = Math.round(obj.n)
      },
    })
  }, [valor, activo])

  return ref
}

// ─── 4. Hover en tarjetas (elevación suave) ──────────────────────────────────
// Uso: añade onMouseEnter/onMouseLeave a cualquier <div> de tarjeta
export function hoverTarjeta(el) {
  gsap.to(el, { y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', duration: 0.2, ease: 'power1.out' })
}
export function hoverTarjetaSalir(el) {
  gsap.to(el, { y: 0, boxShadow: '0 0px 0px rgba(0,0,0,0)', duration: 0.2, ease: 'power1.in' })
}

// ─── 5. Apertura del sidebar (slide-in) ──────────────────────────────────────
// Uso: llama a animarSidebar(el) cuando el sidebar aparece en mobile
export function animarSidebar(el) {
  gsap.fromTo(el, { x: -260 }, { x: 0, duration: 0.28, ease: 'power3.out' })
}

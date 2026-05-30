"use client"

import { useEffect, useRef } from "react"

type Drop = { x: number; y: number; length: number; speed: number; opacity: number }

export function RainCanvas({ intensity = 0.35 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let drops: Drop[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDrops()
    }

    const initDrops = () => {
      const count = Math.max(8, Math.floor(canvas.width * intensity * 0.18))
      drops = Array.from({ length: count }, () => makeDrop(true))
    }

    const makeDrop = (randomY = false): Drop => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -20,
      length: 6 + Math.random() * 14,
      speed: (1.5 + Math.random() * 3) * (0.6 + intensity * 0.8),
      opacity: 0.06 + Math.random() * (0.1 + intensity * 0.15),
    })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i]
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - 0.8, d.y + d.length)
        ctx.strokeStyle = `rgba(58, 111, 201, ${d.opacity})`
        ctx.lineWidth = 0.7
        ctx.stroke()
        d.y += d.speed
        if (d.y > canvas.height + 20) drops[i] = makeDrop(false)
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize) }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

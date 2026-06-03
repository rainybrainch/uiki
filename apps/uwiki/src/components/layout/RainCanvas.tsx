"use client"

import { useEffect, useRef } from "react"

type Drop = {
  x: number; y: number
  length: number; speed: number; opacity: number
  tilt: number      // 傾き（風）
  layer: 0 | 1      // 0=背景 1=前景
  width: number
}

type Splash = {
  x: number; y: number
  particles: { vx: number; vy: number; life: number }[]
  opacity: number
}

export function RainCanvas({ intensity = 0.35 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let drops: Drop[] = []
    let splashes: Splash[] = []
    let wind = 0
    let windTarget = 0
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDrops()
    }

    const initDrops = () => {
      const total = Math.max(10, Math.floor(canvas.width * intensity * 0.22))
      // 背景層（70%） + 前景層（30%）
      drops = Array.from({ length: total }, (_, i) =>
        makeDrop(true, i < total * 0.7 ? 0 : 1)
      )
    }

    const makeDrop = (randomY = false, layer: 0 | 1 = 0): Drop => {
      const isFg = layer === 1
      return {
        x: Math.random() * canvas.width,
        y: randomY ? Math.random() * canvas.height : -30,
        length: isFg
          ? 10 + Math.random() * 18
          :  5 + Math.random() * 10,
        speed: isFg
          ? (2.5 + Math.random() * 3.5) * (0.7 + intensity * 0.8)
          : (1.2 + Math.random() * 2.0) * (0.5 + intensity * 0.6),
        opacity: isFg
          ? 0.10 + Math.random() * (0.12 + intensity * 0.18)
          : 0.03 + Math.random() * (0.05 + intensity * 0.07),
        tilt: (Math.random() - 0.5) * 0.6,
        layer,
        width: isFg ? 0.9 : 0.55,
      }
    }

    const addSplash = (x: number, y: number, intensity_: number) => {
      if (Math.random() > 0.25) return
      splashes.push({
        x, y,
        opacity: 0.18 * intensity_,
        particles: Array.from({ length: 3 }, () => ({
          vx: (Math.random() - 0.5) * 1.8,
          vy: -(0.5 + Math.random() * 1.2),
          life: 1,
        })),
      })
    }

    const draw = () => {
      t++
      // 風をゆっくり変化
      if (t % 120 === 0) windTarget = (Math.random() - 0.5) * 1.2
      wind += (windTarget - wind) * 0.008

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景層を先に描画
      for (const layer of [0, 1] as const) {
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i]
          if (d.layer !== layer) continue

          const totalTilt = d.tilt + wind * (d.layer === 1 ? 1.2 : 0.6)
          const dx = totalTilt * d.length
          const endX = d.x + dx
          const endY = d.y + d.length

          // グラデーション雨粒
          const grad = ctx.createLinearGradient(d.x, d.y, endX, endY)
          grad.addColorStop(0, `rgba(58, 111, 201, 0)`)
          grad.addColorStop(0.4, `rgba(58, 111, 201, ${d.opacity})`)
          grad.addColorStop(1, `rgba(100, 150, 220, ${d.opacity * 0.7})`)

          ctx.beginPath()
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(endX, endY)
          ctx.strokeStyle = grad
          ctx.lineWidth = d.width
          ctx.lineCap = "round"
          ctx.stroke()

          d.x += wind * (d.layer === 1 ? 0.3 : 0.15)
          d.y += d.speed
          if (d.y > canvas.height + 10) {
            addSplash(d.x, canvas.height, d.opacity * 3)
            drops[i] = makeDrop(false, d.layer)
          }
          // 画面外に出たらラップ
          if (d.x < -20) d.x = canvas.width + 10
          if (d.x > canvas.width + 20) d.x = -10
        }
      }

      // スプラッシュ
      splashes = splashes.filter((s) => s.opacity > 0.005)
      for (const s of splashes) {
        s.opacity *= 0.85
        for (const p of s.particles) {
          p.life -= 0.06
          p.vx *= 0.92
          p.vy += 0.08
          const px = s.x + p.vx * (1 - p.life) * 12
          const py = s.y + p.vy * (1 - p.life) * 12
          ctx.beginPath()
          ctx.arc(px, py, 0.8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(58, 111, 201, ${s.opacity * p.life})`
          ctx.fill()
        }
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

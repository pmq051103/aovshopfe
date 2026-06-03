import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + 10
        this.size = Math.random() * 2 + 0.5
        this.speedY = -(Math.random() * 0.8 + 0.3)
        this.speedX = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.1
        this.hue = Math.random() > 0.5 ? 340 : Math.random() > 0.5 ? 270 : 195
      }
      update() {
        this.y += this.speedY
        this.x += this.speedX
        this.opacity -= 0.001
        if (this.y < -10 || this.opacity <= 0) this.reset()
      }
      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`
        ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    for (let i = 0; i < 60; i++) {
      const p = new Particle()
      p.y = Math.random() * canvas.height
      particles.push(p)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
    />
  )
}
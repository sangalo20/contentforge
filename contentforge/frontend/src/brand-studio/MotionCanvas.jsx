// Motion engine: canvas animations exported as WebM (real-time capture) or a
// deterministic 30 fps PNG sequence (straight alpha for edit timelines). Every
// frame is a pure function of t in [0,1], so preview, WebM, and PNG frames
// stay identical.
import { useEffect, useRef } from 'react'
import { mixHex, hash01, loadImageEl, downloadBlob } from './helpers'

const MOTION_DUR = { lower: 4000, sting: 2600 }

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const mseg = (t, a, b) => clamp01((t - a) / (b - a))
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInCubic = (t) => t * t * t
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }

function drawMotionFrame(ctx, kind, t, d, brand, logo, opts) {
  const W = 1920, H = 1080
  ctx.clearRect(0, 0, W, H)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  if (kind === 'lower') {
    if (opts.preview) {
      // checkerboard communicates transparency in the editor preview
      for (let y = 0; y < H; y += 40) for (let x = 0; x < W; x += 40) {
        ctx.fillStyle = ((x + y) / 40) % 2 === 0 ? '#232326' : '#2c2c30'
        ctx.fillRect(x, y, 40, 40)
      }
    } else if (!opts.alpha) {
      ctx.fillStyle = d.bgColor
      ctx.fillRect(0, 0, W, H)
    }
    const edgeIn = easeOutCubic(mseg(t, 0.02, 0.16))
    const barIn = easeOutCubic(mseg(t, 0.08, 0.28))
    const nameIn = easeOutCubic(mseg(t, 0.2, 0.36))
    const roleIn = easeOutCubic(mseg(t, 0.26, 0.42))
    const chipIn = easeOutCubic(mseg(t, 0.32, 0.48))
    const out = easeInCubic(mseg(t, 0.86, 0.98))
    const gone = 1 - out

    ctx.font = `800 46px ${brand.fonts.heading}`
    const nameW = ctx.measureText(d.author || 'Speaker').width
    ctx.letterSpacing = '2.3px'
    ctx.font = `700 19px ${brand.fonts.mono}`
    const roleW = ctx.measureText(d.role || '').width
    ctx.font = `700 15px ${brand.fonts.mono}`
    const url = (d.url || brand.url).toUpperCase()
    const urlW = ctx.measureText(url).width
    ctx.letterSpacing = '0px'

    const barW = Math.max(nameW, roleW) + 72
    const barH = 118
    const baseX = 96 - out * 700
    const baseY = H - 96 - barH
    ctx.globalAlpha = gone

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 26
    ctx.shadowOffsetY = 10
    // accent edge grows upward
    ctx.fillStyle = d.accentColor
    ctx.fillRect(baseX, baseY + barH * (1 - edgeIn), 10, barH * edgeIn)
    // bar reveals rightward from the edge
    ctx.fillStyle = d.bgColor + 'f2'
    ctx.fillRect(baseX + 10, baseY, barW * barIn, barH)
    // url chip trails the bar
    if (chipIn > 0.01) {
      ctx.fillStyle = d.accentColor
      ctx.fillRect(baseX + 10 + barW * barIn, baseY, (urlW + 56) * chipIn, barH)
    }
    ctx.restore()

    // texts clipped to the revealed bar
    ctx.save()
    ctx.beginPath()
    ctx.rect(baseX + 10, baseY, barW * barIn, barH)
    ctx.clip()
    ctx.globalAlpha = gone * nameIn
    ctx.fillStyle = d.textColor
    ctx.font = `800 46px ${brand.fonts.heading}`
    ctx.fillText(d.author || 'Speaker', baseX + 46 + (1 - nameIn) * 34, baseY + 56)
    ctx.globalAlpha = gone * roleIn
    ctx.fillStyle = d.accentColor
    ctx.letterSpacing = '2.3px'
    ctx.font = `700 19px ${brand.fonts.mono}`
    ctx.fillText(d.role || '', baseX + 46 + (1 - roleIn) * 34, baseY + 92)
    ctx.letterSpacing = '0px'
    ctx.restore()
    if (chipIn > 0.01) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(baseX + 10 + barW * barIn, baseY, (urlW + 56) * chipIn, barH)
      ctx.clip()
      ctx.globalAlpha = gone * chipIn
      ctx.fillStyle = mixHex(d.accentColor, '#000000', 0.85)
      ctx.font = `700 15px ${brand.fonts.mono}`
      ctx.fillText(url, baseX + 10 + barW * barIn + 28, baseY + barH / 2 + 5)
      ctx.restore()
    }
    // logo bug top-right
    if (logo) {
      const bugIn = easeOutCubic(mseg(t, 0.12, 0.28))
      ctx.globalAlpha = gone * bugIn * 0.92
      const lh = 52
      const lw = lh * (logo.width / Math.max(logo.height, 1))
      ctx.drawImage(logo, W - 64 - lw, 56 + (1 - bugIn) * -18, lw, lh)
    }
    ctx.globalAlpha = 1
    return
  }

  // sting: opaque brand intro/outro
  ctx.fillStyle = d.bgColor
  ctx.fillRect(0, 0, W, H)
  const cell = 80
  for (let cy = 0; cy < H / cell; cy++) for (let cx = 0; cx < W / cell; cx++) {
    const r = hash01(cx * 3 + 1, cy * 7 + 2)
    if (r < 0.74) continue
    const delay = hash01(cx + 9, cy + 4) * 0.3
    const appear = easeOutCubic(mseg(t, 0.04 + delay, 0.16 + delay))
    const vanish = easeInCubic(mseg(t, 0.68 + delay * 0.6, 0.82 + delay * 0.6))
    const a = appear * (1 - vanish) * (r > 0.92 ? 0.3 : 0.14)
    if (a <= 0.004) continue
    ctx.globalAlpha = a
    ctx.fillStyle = d.accentColor
    const grow = 0.55 + 0.45 * appear
    ctx.fillRect(cx * cell + (cell * (1 - grow)) / 2, cy * cell + (cell * (1 - grow)) / 2, cell * grow, cell * grow)
  }
  const logoIn = easeOutBack(mseg(t, 0.26, 0.52))
  const fadeOut = easeInCubic(mseg(t, 0.86, 0.98))
  const alive = 1 - fadeOut
  if (logo && logoIn > 0.01) {
    const scale = 0.92 + 0.08 * logoIn
    const lw = 560 * scale
    const lh = lw * (logo.height / Math.max(logo.width, 1))
    ctx.globalAlpha = clamp01(logoIn) * alive
    ctx.drawImage(logo, (W - lw) / 2, H / 2 - lh / 2 - 60 * (1 - (logoIn - 1) * 0.2) + 0, lw, lh)
  } else if (logoIn > 0.01) {
    // no logo file yet: the wordmark carries the sting
    ctx.globalAlpha = clamp01(logoIn) * alive
    ctx.fillStyle = d.textColor
    ctx.letterSpacing = '6px'
    ctx.font = `800 110px ${brand.fonts.heading}`
    ctx.textAlign = 'center'
    ctx.fillText(brand.wordmark, W / 2, H / 2 + 20)
    ctx.textAlign = 'left'
    ctx.letterSpacing = '0px'
  }
  const rule = easeOutCubic(mseg(t, 0.48, 0.66))
  if (rule > 0.01) {
    ctx.globalAlpha = alive
    ctx.fillStyle = d.accentColor
    ctx.fillRect(W / 2 - 170 * rule, H / 2 + 130, 340 * rule, 6)
  }
  const wordIn = easeOutCubic(mseg(t, 0.56, 0.72))
  if (wordIn > 0.01) {
    ctx.globalAlpha = wordIn * alive
    ctx.fillStyle = d.textColor
    ctx.letterSpacing = '10px'
    ctx.font = `700 30px ${brand.fonts.mono}`
    ctx.textAlign = 'center'
    ctx.fillText(d.subtitle || brand.wordmark, W / 2, H / 2 + 200 + (1 - wordIn) * 16)
    ctx.globalAlpha = wordIn * alive * 0.55
    ctx.font = `700 17px ${brand.fonts.mono}`
    ctx.letterSpacing = '4px'
    ctx.fillText((d.url || brand.url).toUpperCase(), W / 2, H / 2 + 244)
    ctx.letterSpacing = '0px'
    ctx.textAlign = 'left'
  }
  ctx.globalAlpha = 1
}

export default function MotionCanvas({ d, brand, kind, apiRef }) {
  const cRef = useRef(null)
  const logoRef = useRef(null)
  // Latest-value refs so the preview loop and exports always read current
  // inputs without re-arming their effects on every keystroke.
  const dRef = useRef(d)
  const brandRef = useRef(brand)
  useEffect(() => { dRef.current = d; brandRef.current = brand })

  useEffect(() => {
    let live = true
    if (!d.logoSrc) { logoRef.current = null; return }
    loadImageEl(d.logoSrc).then(img => { if (live) logoRef.current = img }).catch(() => { logoRef.current = null })
    return () => { live = false }
  }, [d.logoSrc])

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const loop = (now) => {
      const ctx = cRef.current?.getContext('2d')
      if (ctx) drawMotionFrame(ctx, kind, ((now - start) % MOTION_DUR[kind]) / MOTION_DUR[kind], dRef.current, brandRef.current, logoRef.current, { alpha: true, preview: true })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [kind])

  useEffect(() => {
    apiRef.current = {
      // real-time capture of one clean cycle
      exportWebm: async () => {
        const logo = logoRef.current ?? (dRef.current.logoSrc ? await loadImageEl(dRef.current.logoSrc).catch(() => null) : null)
        const c = document.createElement('canvas')
        c.width = 1920; c.height = 1080
        const ctx = c.getContext('2d')
        if (!ctx) throw new Error('Canvas unavailable')
        const stream = c.captureStream(60)
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 })
        const chunks = []
        rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
        const stopped = new Promise(resolve => { rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' })) })
        rec.start()
        const dur = MOTION_DUR[kind]
        const t0 = performance.now()
        await new Promise(resolve => {
          const step = (now) => {
            const t = (now - t0) / dur
            drawMotionFrame(ctx, kind, Math.min(t, 1), dRef.current, brandRef.current, logo, { alpha: false, preview: false })
            if (t >= 1) resolve()
            else requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        })
        rec.stop()
        const name = `${brandRef.current.id}-${kind === 'lower' ? 'lower-third' : 'logo-sting'}-${Date.now()}.webm`
        downloadBlob(await stopped, name)
        return 'WebM downloaded'
      },
      // deterministic 30fps frames with straight alpha for the edit timeline
      exportPngSeq: async () => {
        const logo = logoRef.current ?? (dRef.current.logoSrc ? await loadImageEl(dRef.current.logoSrc).catch(() => null) : null)
        const c = document.createElement('canvas')
        c.width = 1920; c.height = 1080
        const ctx = c.getContext('2d')
        if (!ctx) throw new Error('Canvas unavailable')
        const fps = 30
        const frames = Math.round((MOTION_DUR[kind] / 1000) * fps)
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        const stem = kind === 'lower' ? 'lower-third' : 'logo-sting'
        for (let f = 0; f < frames; f++) {
          drawMotionFrame(ctx, kind, f / (frames - 1), dRef.current, brandRef.current, logo, { alpha: kind === 'lower', preview: false })
          const blob = await new Promise(resolve => c.toBlob(resolve, 'image/png'))
          if (!blob) throw new Error('Frame encoding failed')
          zip.file(`frames/${stem}-${String(f).padStart(4, '0')}.png`, blob)
        }
        zip.file('README.txt', [
          `${brandRef.current.name.toUpperCase()} · ${stem.toUpperCase()} · PNG SEQUENCE`,
          `${frames} frames · ${fps} fps · 1920x1080 · ${kind === 'lower' ? 'straight alpha (transparent background)' : 'opaque brand background'}`,
          'Import: drag the frames folder into your editor as an image sequence at 30 fps.',
        ].join('\n'))
        const blob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(blob, `${brandRef.current.id}-${stem}-frames-${Date.now()}.zip`)
        return `${frames} frames downloaded`
      },
    }
    return () => { apiRef.current = null }
  }, [kind, apiRef])

  return <canvas ref={cRef} width={1920} height={1080} className="w-full h-full" />
}

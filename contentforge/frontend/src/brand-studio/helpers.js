// Pure helpers for the Brand Studio, ported from the original studio's image
// machinery. No brand knowledge lives here.

export const mixHex = (hex, target, t) => {
  const p = (s, i) => parseInt(s.replace('#', '').slice(i, i + 2), 16)
  const c = (i) => Math.round(p(hex, i) + (p(target, i) - p(hex, i)) * t).toString(16).padStart(2, '0')
  return `#${c(0)}${c(2)}${c(4)}`
}

export const hexLuma = (hex) => {
  const m = hex.replace('#', '')
  if (m.length < 6) return 0
  return (0.2126 * parseInt(m.slice(0, 2), 16) + 0.7152 * parseInt(m.slice(2, 4), 16) + 0.0722 * parseInt(m.slice(4, 6), 16)) / 255
}

// Deterministic 0..1 hash used for procedural textures (mosaics, motion sting)
export const hash01 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }

export const blobToDataURL = (b) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = reject
  r.readAsDataURL(b)
})

// Opens a file picker with the input kept in the DOM until it settles —
// a detached input can be garbage-collected before change fires (WebKit),
// which made uploads intermittently do nothing.
export const pickImageFile = () => new Promise((resolve) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'
  document.body.appendChild(input)
  const done = (f) => { input.remove(); resolve(f) }
  input.onchange = () => done(input.files?.[0] ?? null)
  input.oncancel = () => done(null)
  input.click()
})

// Caps an upload's pixel size before it enters state or the matting model.
// Phone photos arrive at 12MP+, but the model infers at ~1kpx and every
// canvas here renders far smaller — the extra pixels only cost time and
// memory. Re-encoding also rejects formats the browser can't display (HEIC).
export const downscaleUpload = async (file, maxDim) => {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImageEl(url)
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    if (scale === 1 && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return { blob: file, dataUrl: await blobToDataURL(file) }
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const keepAlpha = file.type !== 'image/jpeg'
    const blob = await new Promise((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error('Image encoding failed')), keepAlpha ? 'image/png' : 'image/jpeg', 0.92))
    return { blob, dataUrl: await blobToDataURL(blob) }
  } finally { URL.revokeObjectURL(url) }
}

// publicPath must point at imgly's CDN explicitly: the library's default
// resolves assets relative to its own module URL, which under Vite's dep
// pre-bundling is a path that serves nothing — the fetch hangs forever.
// Version segment must match the @imgly/background-removal dependency.
const IMGLY_ASSETS = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/'

// Matting configs in preference order: WebGPU when the browser has it, then
// the quantized model on CPU (quarter the download, much faster WASM)
const mattingConfigs = () => {
  const configs = []
  if ('gpu' in navigator) configs.push({ device: 'gpu', model: 'isnet_fp16', publicPath: IMGLY_ASSETS })
  configs.push({ device: 'cpu', model: 'isnet_quint8', publicPath: IMGLY_ASSETS })
  return configs
}

// Warms the model download in the background so the first cutout doesn't
// pay tens of megabytes of assets on top of inference
export const preloadMattingModel = () => {
  import('@imgly/background-removal').then(m => m.preload(mattingConfigs()[0])).catch(() => {})
}

// First run downloads the model; guard each attempt with a timeout so a
// dead network can never hang the upload spinner.
const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('background removal timed out')), ms)),
])

// AI matting cutout; falls back to the original image if every backend fails
export const removeImageBackground = async (image) => {
  try {
    const { removeBackground } = await import('@imgly/background-removal')
    for (const config of mattingConfigs()) {
      try {
        return await blobToDataURL(await withTimeout(removeBackground(image, config), 90000))
      } catch (err) {
        console.error(`Background removal failed on ${config.device}`, err)
      }
    }
  } catch (err) {
    console.error('Background removal module failed to load', err)
  }
  alert('Background removal failed — using the original image.')
  return blobToDataURL(image)
}

// Grayscale cutout with a pixel-dissolved silhouette: boundary blocks are
// notched out and scattered outward as floating squares, so the subject melts
// into the poster.
export const stylizePortrait = (dataUrl) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, 900 / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { resolve(dataUrl); return }
    ctx.drawImage(img, 0, 0, w, h)
    const image = ctx.getImageData(0, 0, w, h)
    const p = image.data
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 24) { p[i + 3] = 0; continue }
      const lum = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]
      const v = Math.max(0, Math.min(255, (lum - 128) * 1.18 + 136))
      p[i] = p[i + 1] = p[i + 2] = v
    }
    ctx.putImageData(image, 0, 0)

    const B = Math.max(8, Math.round(w / 40))
    const cols = Math.ceil(w / B)
    const rows = Math.ceil(h / B)
    const alphaAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : p[(y * w + x) * 4 + 3]
    const solidRatio = (bx, by) => {
      if (bx < 0 || by < 0 || bx >= cols || by >= rows) return 0
      let solid = 0, total = 0
      for (let y = by * B; y < Math.min((by + 1) * B, h); y += 2)
        for (let x = bx * B; x < Math.min((bx + 1) * B, w); x += 2) { total++; if (alphaAt(x, y) > 128) solid++ }
      return total ? solid / total : 0
    }
    const snapshot = document.createElement('canvas')
    snapshot.width = w
    snapshot.height = h
    snapshot.getContext('2d').drawImage(canvas, 0, 0)
    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        const r = solidRatio(bx, by)
        if (r <= 0.05 || r >= 0.95) continue
        const rand = hash01(bx, by)
        let out = [0, -1]
        let best = 1
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const rr = solidRatio(bx + dx, by + dy)
          if (rr < best) { best = rr; out = [dx, dy] }
        }
        if (rand < 0.34) {
          ctx.clearRect(bx * B, by * B, B, B)
        } else if (rand < 0.62) {
          const k = 1 + Math.round(hash01(by, bx) * 2)
          ctx.drawImage(snapshot, bx * B, by * B, B, B, (bx + out[0] * k) * B, (by + out[1] * k) * B, B, B)
        }
      }
    }
    resolve(canvas.toDataURL('image/png'))
  }
  img.onerror = () => resolve(dataUrl)
  img.src = dataUrl
})

export const loadImageEl = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = src
})

export const downloadBlob = (blob, name) => {
  const link = document.createElement('a')
  link.download = name
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

export const EMPTY_MEDIA = { uploadedImage: undefined, uploadedBackground: undefined, generatedImage: undefined, generatedBackground: undefined, uploadedCoHosts: undefined }

// ── Design Library serialization ─────────────────────────────────────────────
// A saved design splits into a small JSON recipe (Firestore) and its heavy
// image bytes (Storage). Image values are recognized generically — any input
// that is an image data URL (or an array of them, e.g. uploadedCoHosts) —
// so new templates and media slots persist without touching this code.

const isImageDataUrl = (v) => typeof v === 'string' && v.startsWith('data:image/')

// { fields, images } — fields carry everything renderable-from-JSON; images
// map field keys (array items as `key[i]`) to their data URLs.
export const splitDesignInputs = (inputs) => {
  const fields = {}
  const images = {}
  for (const [key, val] of Object.entries(inputs || {})) {
    if (val === undefined) continue
    if (isImageDataUrl(val)) images[key] = val
    else if (Array.isArray(val) && val.length && val.every(isImageDataUrl)) {
      val.forEach((v, i) => { images[`${key}[${i}]`] = v })
    } else fields[key] = val
  }
  return { fields, images }
}

// The inverse: fold fetched image data URLs (keyed as above) back into the
// fields object, reassembling `key[i]` entries into ordered arrays.
export const mergeDesignInputs = (fields, images) => {
  const merged = { ...fields }
  const arrays = {}
  for (const [key, dataUrl] of Object.entries(images || {})) {
    const m = /^(.+)\[(\d+)\]$/.exec(key)
    if (m) (arrays[m[1]] ??= [])[Number(m[2])] = dataUrl
    else merged[key] = dataUrl
  }
  for (const [key, arr] of Object.entries(arrays)) merged[key] = arr.filter(Boolean)
  return merged
}

// Fetch a same-origin proxy URL back into a data URL (canvas export needs
// data URLs, and state stays consistent with fresh uploads).
export const fetchAsDataUrl = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load image (${res.status})`)
  return blobToDataURL(await res.blob())
}

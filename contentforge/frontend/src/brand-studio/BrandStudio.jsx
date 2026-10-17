// Brand Studio shell: brand picker, template browser, content/style/media
// editors, live canvas, and PNG/SVG/motion exports. Adapted from the studio
// this feature was ported from, re-centered on the Belrose brand registry.
import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng, toSvg } from 'html-to-image'
import { Link } from 'react-router-dom'
import { API_BASE, authFetch } from '@/lib/api'
import { BRANDS, brandById, buildDefaults } from './brands'
import { LIVEEVENT_VARIANTS, TEMPLATES, TEMPLATE_GROUPS, SPLIT_VARIANTS, THUMB_VARIANTS, SEAL_VARIANTS, CHART_VARIANTS, ANNOUNCE_VARIANTS, PARTNER_VARIANTS, SPEAKING_VARIANTS, OFFICE_VARIANTS, S101_VARIANTS, MYTH_VARIANTS, BLOG_VARIANTS, EDITORIAL_VARIANTS, QUOTE_VARIANTS, NEWSLETTER_VARIANTS, PODCAST_VARIANTS, WEBINAR_VARIANTS, EPISODE_VARIANTS, AD_VARIANTS, EMAIL_VARIANTS, BIGNUM_VARIANTS, REPORT_VARIANTS, PORTRAIT_TEMPLATES } from './registry'

// templates with a Design picker: variant list + the default variant id
const VARIANT_SETS = {
  announcement: { list: ANNOUNCE_VARIANTS, def: 'notice' },
  partnership: { list: PARTNER_VARIANTS, def: 'contract' },
  speaking: { list: SPEAKING_VARIANTS, def: 'bill' },
  officehours: { list: OFFICE_VARIANTS, def: 'marquee' },
  storage101: { list: S101_VARIANTS, def: 'primer' },
  mythfact: { list: MYTH_VARIANTS, def: 'classic' },
  blogcover: { list: BLOG_VARIANTS, def: 'front' },
  editorial: { list: EDITORIAL_VARIANTS, def: 'field' },
  quote: { list: QUOTE_VARIANTS, def: 'mark' },
  newsletter: { list: NEWSLETTER_VARIANTS, def: 'issue' },
  podcastannounce: { list: PODCAST_VARIANTS, def: 'numeral' },
  webinar: { list: WEBINAR_VARIANTS, def: 'ticket' },
  liveevent: { list: LIVEEVENT_VARIANTS, def: 'bill' },
  podcast: { list: EPISODE_VARIANTS, def: 'feature' },
  displayad: { list: AD_VARIANTS, def: 'ribbon' },
  emailhero: { list: EMAIL_VARIANTS, def: 'hero' },
  bignumber: { list: BIGNUM_VARIANTS, def: 'total' },
  report: { list: REPORT_VARIANTS, def: 'plate' },
}
import { SWAG_PRODUCTS, SWAG_COLORWAYS, SWAG_PRINTS } from './swagData'
import MotionCanvas from './MotionCanvas'
import SocialCarouselCanvas from './SocialCarouselCanvas'
import { CAROUSEL_DESIGNS, SLIDE_W, SLIDE_H } from './socialCarouselDesigns'
import { DownloadIcon, Field, ColorField, UploadButton } from './atoms'
import { removeImageBackground, stylizePortrait, pickImageFile, downscaleUpload, preloadMattingModel, EMPTY_MEDIA, splitDesignInputs, mergeDesignInputs, fetchAsDataUrl } from './helpers'
import './brand-studio.css'

const TABS = [
  { id: 'templates', label: 'Templates', icon: '⊞' },
  { id: 'content', label: 'Content', icon: '✎' },
  { id: 'style', label: 'Style', icon: '◐' },
  { id: 'media', label: 'Media', icon: '⧫' },
  { id: 'designs', label: 'Designs', icon: '▤' },
]

const INITIAL_TEMPLATE = 'seal'

// A fresh Carousel Deck starts as a real, postable 10-page deck (operator
// voice, one idea per page) — seed content shows each design set the way it
// will actually be used, not as lorem ipsum.
const DEFAULT_DECK_SLIDES = [
  { kind: 'hook', heading: "You don't need $1M to buy a $1M storage facility", body: 'The real math, page by page.' },
  { kind: 'point', heading: 'The down payment', body: 'SBA 7(a) gets you in for 10% down. That is $100K on the sticker price — the bank carries the rest.' },
  { kind: 'point', heading: 'Closing costs', body: 'Budget 3–5%: lender fees, title, inspections, environmental. Call it $40K on a $1M deal. Nobody skips this line twice.' },
  { kind: 'point', heading: 'Working capital', body: 'Ninety days of operating expenses in the bank before day one. Facilities do not stabilize on your schedule.' },
  { kind: 'point', heading: 'Where the deals hide', body: 'The best facilities are owned by tired operators, not listed on LoopNet. Drive the route. Make the calls. Repeat.' },
  { kind: 'point', heading: 'Underwrite the street', body: 'Your rents come from the three competitors within ten minutes — never from the seller’s pro forma.' },
  { kind: 'point', heading: 'The value-add levers', body: 'Push rents to market. Clear the delinquents. Add truck rental and fees. Every 10% of NOI is roughly $150K of value.' },
  { kind: 'point', heading: 'The refinance', body: 'Stabilize, reappraise, pull your capital back out. Now the facility bought itself — and you are hunting the next one.' },
  { kind: 'point', heading: 'What kills first deals', body: 'Overpaying for “potential.” You make your money at the buy, not the exit.' },
  { kind: 'cta', heading: 'Follow Storage Moguls', body: 'Real people. Real deals. Real results.' },
]

// Deep-link prefill: the forge links here with content from a library item,
// e.g. /brand-studio?template=quote&title=...&author=...&brand=storagemoguls.
// Unknown templates/brands fall back to the defaults; field params overlay the
// brand's copy seeds so the operator lands on a filled-in canvas.
const PREFILL_KEYS = ['title', 'subtitle', 'body', 'metric', 'author', 'role', 'date', 'url', 'features', 'variant', 'partnerName', 'ctaUrl', 'dataJson']
function readDeepLink() {
  const p = new URLSearchParams(window.location.search)
  const t = p.get('template')
  const template = TEMPLATES.some(x => x.id === t) ? t : null
  const b = BRANDS.find(x => x.id === p.get('brand') && !x.comingSoon)
  const fields = {}
  for (const k of PREFILL_KEYS) {
    const val = p.get(k)
    if (val != null && val !== '') fields[k] = val
  }
  // `item` carries a library item id: the render can be saved back as that
  // article's cover image.
  return { template, brandId: b?.id ?? null, fields, itemId: p.get('item') || null }
}

const BASE_INPUTS = {
  title: '', subtitle: '', body: '', metric: '', author: '', role: '', date: '', url: '',
  features: '', disclaimer: '', variant: 'panes', logoSrc: '', dataJson: '', partnerName: '', ctaUrl: '',
  garment: '#16161A', print: 'mark',
  bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5',
  hideCrosshairs: false,
}

export default function BrandStudio() {
  const [brandId, setBrandId] = useState(() => readDeepLink().brandId ?? BRANDS[0].id)
  const brand = brandById(brandId)
  const [activeId, setActiveId] = useState(() => readDeepLink().template ?? INITIAL_TEMPLATE)
  const [inputs, setInputs] = useState(() => {
    const dl = readDeepLink()
    const b = brandById(dl.brandId ?? BRANDS[0].id)
    const t = dl.template ?? INITIAL_TEMPLATE
    return { ...BASE_INPUTS, ...buildDefaults(b)[t], ...dl.fields }
  })
  const [resolution, setResolution] = useState(() => {
    const dl = readDeepLink()
    return TEMPLATES.find(x => x.id === (dl.template ?? INITIAL_TEMPLATE))?.res || '1080x1080'
  })
  // A deep-linked visit lands on Content, ready to fine-tune the prefill.
  const [activeTab, setActiveTab] = useState(() => (readDeepLink().template ? 'content' : 'templates'))
  // When the forge sent us here from a library item, the render can be saved
  // back as that article's cover.
  const [deepItemId] = useState(() => readDeepLink().itemId)
  const [coverSaveState, setCoverSaveState] = useState('idle') // idle | saving | saved | error
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiPromptType, setAiPromptType] = useState('artistic')
  const [aiError, setAiError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCutting, setIsCutting] = useState(false)
  const [isMotionExporting, setIsMotionExporting] = useState(false)
  const [motionStatus, setMotionStatus] = useState('')
  const motionApi = useRef(null)
  const canvasRef = useRef(null)
  // Media is scoped per template so uploads and generations never leak across templates
  const mediaByTemplate = useRef({})

  // Track the canvas pane's size so the preview always fits inside it.
  const paneRef = useRef(null)
  const [paneSize, setPaneSize] = useState(null)
  useEffect(() => {
    const el = paneRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setPaneSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fetch the matting model shortly after load, while the user is still browsing templates
  useEffect(() => {
    const timer = window.setTimeout(preloadMattingModel, 3000)
    return () => window.clearTimeout(timer)
  }, [])

  const activeMeta = TEMPLATES.find(t => t.id === activeId)
  // ── Carousel Deck (multi-page template) ──
  const isDeck = !!activeMeta?.deck
  const deckSlides = Array.isArray(inputs.deckSlides) && inputs.deckSlides.length ? inputs.deckSlides : DEFAULT_DECK_SLIDES
  const deckDesign = inputs.deckDesign || CAROUSEL_DESIGNS[0].id
  const [deckPageRaw, setDeckPage] = useState(0)
  const deckPage = Math.min(deckPageRaw, deckSlides.length - 1)
  const deckRefs = useRef([])
  const [isDeckExporting, setIsDeckExporting] = useState(false)
  const setDeckSlide = (i, patch) =>
    setInputs(prev => {
      const slides = (Array.isArray(prev.deckSlides) && prev.deckSlides.length ? prev.deckSlides : DEFAULT_DECK_SLIDES).map(
        (s, idx) => (idx === i ? { ...s, ...patch } : s)
      )
      return { ...prev, deckSlides: slides }
    })
  const addDeckSlide = () =>
    setInputs(prev => {
      const slides = Array.isArray(prev.deckSlides) && prev.deckSlides.length ? prev.deckSlides : DEFAULT_DECK_SLIDES
      if (slides.length >= 10) return prev
      // New pages slot in before a closing CTA page, if there is one.
      const at = slides[slides.length - 1]?.kind === 'cta' ? slides.length - 1 : slides.length
      const next = [...slides.slice(0, at), { kind: 'point', heading: 'New point', body: '' }, ...slides.slice(at)]
      return { ...prev, deckSlides: next }
    })
  const removeDeckSlide = (i) =>
    setInputs(prev => {
      const slides = Array.isArray(prev.deckSlides) && prev.deckSlides.length ? prev.deckSlides : DEFAULT_DECK_SLIDES
      if (slides.length <= 1) return prev
      return { ...prev, deckSlides: slides.filter((_, idx) => idx !== i) }
    })

  // Bind every deck page (rendered full-res offscreen) into a PDF download.
  const exportDeckPdf = async () => {
    if (isDeckExporting) return
    setIsDeckExporting(true)
    try {
      const nodes = deckRefs.current.slice(0, deckSlides.length).filter(Boolean)
      if (!nodes.length) throw new Error('No pages rendered')
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'px', format: [SLIDE_W, SLIDE_H], orientation: 'portrait', hotfixes: ['px_scaling'] })
      for (let i = 0; i < nodes.length; i++) {
        const dataUrl = await toPng(nodes[i], { cacheBust: true, pixelRatio: 1.5 })
        if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], 'portrait')
        pdf.addImage(dataUrl, 'PNG', 0, 0, SLIDE_W, SLIDE_H)
      }
       
      pdf.save(`${brand.id}-deck-${Date.now()}.pdf`)
    } catch (err) { console.error('Deck export failed', err) }
    finally { setIsDeckExporting(false) }
  }
  // Fields the active template actually renders; templates without a
  // declaration show the full stack.
  const hasField = (f) => !activeMeta?.fields || activeMeta.fields.includes(f)
  // Media slots the template renders ('image' centerpiece, 'background').
  const hasMedia = (m) => !!activeMeta?.media?.includes(m)
  const anyMedia = hasMedia('image') || hasMedia('background')

  const stashMedia = (prev) => {
    mediaByTemplate.current[activeId] = {
      uploadedImage: prev.uploadedImage, uploadedBackground: prev.uploadedBackground,
      generatedImage: prev.generatedImage, generatedBackground: prev.generatedBackground,
      uploadedCoHosts: prev.uploadedCoHosts,
    }
  }

  // Selecting a template stays on the Templates tab — the user moves to
  // Content themselves when ready to edit.
  const selectTemplate = (id) => {
    if (id === activeId) return
    const meta = TEMPLATES.find(t => t.id === id)
    if (meta?.res) setResolution(meta.res)
    setInputs(prev => {
      stashMedia(prev)
      return { ...prev, ...buildDefaults(brand)[id], ...EMPTY_MEDIA, ...(mediaByTemplate.current[id] ?? {}) }
    })
    setActiveId(id)
    setLoadedDesign(null) // manual template switch: no longer editing a saved design
  }

  const selectBrand = (id) => {
    if (id === brandId) return
    const next = brandById(id)
    if (next.comingSoon) return
    setBrandId(id)
    // Re-seed the active template in the new brand's voice and palette; keep media.
    setInputs(prev => ({ ...prev, ...buildDefaults(next)[activeId] }))
    setLoadedDesign(null)
  }

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setInputs(prev => ({ ...prev, [key]: val }))
  }

  const setDirect = useCallback((key, val) => setInputs(prev => ({ ...prev, [key]: val })), [])

  const handleImageUpload = useCallback(async (key) => {
    const file = await pickImageFile()
    if (!file) return
    try {
      if (key === 'uploadedImage' && PORTRAIT_TEMPLATES.includes(activeId)) {
        setIsCutting(true)
        try {
          const { blob } = await downscaleUpload(file, 1600)
          const cutout = await removeImageBackground(blob)
          setDirect(key, await stylizePortrait(cutout))
        } finally { setIsCutting(false) }
      } else if (key === 'uploadedImage' && activeId === 'youtubethumb' && !['tutorial', 'demo'].includes(inputs.variant)) {
        // Face thumbnails keep full color with the background removed; tutorial/demo take raw screenshots
        setIsCutting(true)
        try {
          const { blob } = await downscaleUpload(file, 1600)
          setDirect(key, await removeImageBackground(blob))
        } finally { setIsCutting(false) }
      } else {
        setDirect(key, (await downscaleUpload(file, 2560)).dataUrl)
      }
    } catch (err) {
      console.error('Image upload failed', err)
      alert('Could not read that image — the browser may not support its format (e.g. HEIC). Try a JPEG or PNG.')
    }
  }, [activeId, inputs.variant, setDirect])

  // Additional speaker photos (multi-speaker bills): same cutout pipeline.
  const handleCoHostUpload = useCallback(async () => {
    const file = await pickImageFile()
    if (!file) return
    setIsCutting(true)
    try {
      const { blob } = await downscaleUpload(file, 1600)
      const url = await stylizePortrait(await removeImageBackground(blob))
      setInputs(prev => {
        // bills max out at three people — refuse a fourth photo
        const total = (prev.uploadedImage ? 1 : 0) + (prev.uploadedCoHosts?.length ?? 0)
        if (total >= 3) return prev
        return { ...prev, uploadedCoHosts: [...(prev.uploadedCoHosts || []), url] }
      })
    } catch (err) {
      console.error('Image upload failed', err)
      alert('Could not read that image — the browser may not support its format (e.g. HEIC). Try a JPEG or PNG.')
    } finally { setIsCutting(false) }
  }, [])

  const removeCoHost = (i) => setInputs(prev => ({ ...prev, uploadedCoHosts: prev.uploadedCoHosts?.filter((_, idx) => idx !== i) }))

  const exportImage = async (format) => {
    if (!canvasRef.current) return
    const method = format === 'png' ? toPng : toSvg
    try {
      const dataUrl = await method(canvasRef.current, { cacheBust: true, style: { transform: 'scale(1)', transformOrigin: 'top left' } })
      const link = document.createElement('a')
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      link.download = `${brand.id}-${activeId}-${Date.now()}.${format}`
      link.href = dataUrl
      link.click()
    } catch (err) { console.error('Export failed', err) }
  }

  // Save the current render back to the deep-linked library item as its
  // cover image (Firebase Storage via the existing cover route).
  const saveAsCover = async () => {
    if (!canvasRef.current || !deepItemId || coverSaveState === 'saving') return
    setCoverSaveState('saving')
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left' } })
      const res = await authFetch(`${API_BASE}/api/library/${deepItemId}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: dataUrl }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save the cover')
      }
      setCoverSaveState('saved')
    } catch (err) {
      console.error('Save as cover failed', err)
      setCoverSaveState('error')
    }
  }

  // PDF export: the rendered canvas as a single-page PDF. If the template
  // marks a CTA ([data-cta]) and a CTA link is set, a clickable link
  // annotation is laid over it — links survive in PDFs (e.g. LinkedIn
  // document posts), unlike flat PNG uploads.
  const exportPdf = async () => {
    if (!canvasRef.current) return
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left' } })
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'px', format: [w, h], orientation: w >= h ? 'landscape' : 'portrait', hotfixes: ['px_scaling'] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
      const ctaEl = canvasRef.current.querySelector('[data-cta]')
      const link = (inputs.ctaUrl || '').trim()
      if (ctaEl && link) {
        const canvasRect = canvasRef.current.getBoundingClientRect()
        const ctaRect = ctaEl.getBoundingClientRect()
        const k = w / canvasRect.width // undo the preview scale
        const withProto = /^https?:\/\//i.test(link) ? link : `https://${link}`
        pdf.link((ctaRect.left - canvasRect.left) * k, (ctaRect.top - canvasRect.top) * k, ctaRect.width * k, ctaRect.height * k, { url: withProto })
      }
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      pdf.save(`${brand.id}-${activeId}-${Date.now()}.pdf`)
    } catch (err) { console.error('PDF export failed', err) }
  }

  const runMotionExport = async (mode) => {
    if (!motionApi.current) return
    setIsMotionExporting(true); setMotionStatus(mode === 'png' ? 'Rendering frames…' : 'Recording…')
    try {
      setMotionStatus(mode === 'webm' ? await motionApi.current.exportWebm() : await motionApi.current.exportPngSeq())
    } catch (err) { setMotionStatus(err instanceof Error ? err.message : String(err)) }
    finally { setIsMotionExporting(false) }
  }

  const generateAIArt = async () => {
    if (!aiPrompt) return
    // Target a slot the active template actually renders.
    const type = (aiPromptType === 'artistic' && hasMedia('background')) || !hasMedia('image') ? 'artistic' : 'centerpiece'
    setIsGenerating(true); setAiError('')
    try {
      const res = await authFetch(`${API_BASE}/api/brand-studio/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, aspectRatio: '1:1', type, brandId }),
      })
      const data = await res.json()
      if (res.ok && data.image) {
        if (type === 'artistic') setDirect('generatedBackground', data.image)
        else setDirect('generatedImage', data.image)
      } else setAiError(data.error || 'Generation failed')
    } catch (e) { setAiError(String(e)) }
    setIsGenerating(false)
  }

  const applyPalette = (p) => setInputs(prev => ({ ...prev, bgColor: p.bg, accentColor: p.accent, textColor: p.text }))

  const [w, h] = resolution.split('x').map(Number)
  // The preview scales to fit the pane (with breathing room for the size
  // pill), capped at the original studio's 800px max. transform doesn't
  // shrink the layout box, so the wrapper takes the scaled dimensions —
  // the canvas pane never scrolls.
  const capScale = 900 / Math.max(w, h)
  const fitScale = paneSize
    ? Math.min((paneSize.w - 24) / w, (paneSize.h - 44) / h)
    : capScale
  const scale = Math.max(0.05, Math.min(1, capScale, fitScale))
  const ActiveTpl = activeMeta?.component

  // ── Design Library: saved recipes + thumbnails, backed by the backend ──
  const [designs, setDesigns] = useState(null) // null = not fetched yet
  const [designsBusy, setDesignsBusy] = useState(false)
  // The design currently loaded in the editor; Save offers to update it.
  const [loadedDesign, setLoadedDesign] = useState(null) // { id, name } | null
  const [designSaveState, setDesignSaveState] = useState('idle') // idle | saving | saved | error

  // No synchronous setState here — this also runs from the tab-open effect.
  const refreshDesigns = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/brand-studio/designs`)
      const data = await res.json()
      setDesigns(res.ok ? data.designs : [])
    } catch { setDesigns([]) }
    finally { setDesignsBusy(false) }
  }, [])
  useEffect(() => {
    if (activeTab !== 'designs' || designs !== null) return
    // Deferred a tick: the lint rule (rightly) refuses synchronous setState
    // chains inside effects, and the fetch's state writes are all async anyway.
    const t = window.setTimeout(refreshDesigns, 0)
    return () => window.clearTimeout(t)
  }, [activeTab, designs, refreshDesigns])

  const saveDesign = async () => {
    if (!canvasRef.current || designSaveState === 'saving') return
    // Update the loaded design, or save a new one (also on Cancel of the update prompt).
    const updating = loadedDesign && window.confirm(`Update "${loadedDesign.name}"?\n\nOK updates it in place · Cancel saves a new design.`)
    let name = updating ? loadedDesign.name
      : window.prompt('Name this design:', `${activeMeta?.name || activeId} — ${(inputs.title || '').slice(0, 40) || new Date().toLocaleDateString()}`)
    if (!name || !name.trim()) return
    name = name.trim()
    setDesignSaveState('saving')
    try {
      const thumbnail = await toPng(canvasRef.current, {
        cacheBust: true, pixelRatio: Math.min(1, 420 / w),
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
      })
      const { fields, images } = splitDesignInputs(inputs)
      const payload = { name, templateId: activeId, brandId, resolution, fields, images, thumbnail }
      const res = await authFetch(
        updating ? `${API_BASE}/api/brand-studio/designs/${loadedDesign.id}` : `${API_BASE}/api/brand-studio/designs`,
        { method: updating ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setLoadedDesign({ id: updating ? loadedDesign.id : data.design.id, name })
      setDesignSaveState('saved')
      setDesigns(null) // stale — refetch on next gallery visit
      window.setTimeout(() => setDesignSaveState('idle'), 2500)
    } catch (err) {
      console.error('Design save failed', err)
      setDesignSaveState('error')
      window.setTimeout(() => setDesignSaveState('idle'), 3500)
    }
  }

  const loadDesign = async (summary) => {
    setDesignsBusy(true)
    try {
      const res = await authFetch(`${API_BASE}/api/brand-studio/designs/${summary.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Load failed')
      const d = data.design
      const nextBrand = brandById(d.brandId)
      if (nextBrand.comingSoon) throw new Error(`${nextBrand.name} is not available yet.`)
      // Rehydrate stored images into data URLs (canvas export needs them).
      const images = Object.fromEntries(await Promise.all(
        Object.entries(d.imageUrls || {}).map(async ([key, url]) => [key, await fetchAsDataUrl(`${API_BASE}${url}`)])
      ))
      const meta = TEMPLATES.find(t => t.id === d.templateId)
      setBrandId(d.brandId)
      setActiveId(d.templateId)
      setResolution(d.resolution || meta?.res || '1080x1080')
      setInputs(prev => {
        stashMedia(prev)
        return { ...prev, ...buildDefaults(nextBrand)[d.templateId], ...EMPTY_MEDIA, ...mergeDesignInputs(d.fields, images) }
      })
      setLoadedDesign({ id: d.id, name: d.name })
      setActiveTab('content')
    } catch (err) {
      console.error('Design load failed', err)
      alert(err instanceof Error ? err.message : 'Could not load that design.')
    } finally { setDesignsBusy(false) }
  }

  const deleteDesign = async (summary) => {
    if (!window.confirm(`Delete "${summary.name}"? This cannot be undone.`)) return
    try {
      const res = await authFetch(`${API_BASE}/api/brand-studio/designs/${summary.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      if (loadedDesign?.id === summary.id) setLoadedDesign(null)
      refreshDesigns()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete that design.')
    }
  }


  return (
    <div className="flex flex-1 min-h-0 bg-neutral-100 overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside className="w-[380px] bg-white border-r border-neutral-200 flex flex-col shrink-0 shadow-sm z-10">
        <header className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold tracking-tight text-neutral-900 leading-none">
              <Link to="/" className="text-neutral-300 hover:text-neutral-500 mr-1.5" title="Back to workspaces">←</Link>
              Brand Studio
            </div>
            <div className="text-[10px] text-neutral-400 tracking-widest mt-1 uppercase">{brand.name}</div>
          </div>
          <div className="flex gap-1.5">
            {deepItemId && (
              <button onClick={saveAsCover} disabled={coverSaveState === 'saving'}
                className={`px-2.5 py-1.5 text-[10px] font-bold rounded transition-colors inline-flex items-center gap-1.5 ${
                  coverSaveState === 'saved' ? 'bg-emerald-600 text-white'
                  : coverSaveState === 'error' ? 'bg-red-600 text-white'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}>
                {coverSaveState === 'saving' ? 'Saving…' : coverSaveState === 'saved' ? '✓ Cover Saved' : coverSaveState === 'error' ? 'Retry Cover Save' : 'Set as Article Cover'}
              </button>
            )}
            <button onClick={saveDesign} disabled={designSaveState === 'saving'}
              title={loadedDesign ? `Editing "${loadedDesign.name}" — Save updates it (or saves a copy)` : 'Save this design to the library'}
              className={`px-2.5 py-1.5 text-[10px] font-bold rounded transition-colors inline-flex items-center gap-1.5 ${
                designSaveState === 'saved' ? 'bg-emerald-600 text-white'
                : designSaveState === 'error' ? 'bg-red-600 text-white'
                : 'bg-neutral-900 text-white hover:bg-neutral-700'
              }`}>
              {designSaveState === 'saving' ? 'Saving…' : designSaveState === 'saved' ? '✓ Saved' : designSaveState === 'error' ? 'Retry Save' : 'Save'}
            </button>
            <button onClick={() => exportImage('png')} className="px-2.5 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"><DownloadIcon /> PNG</button>
            <button onClick={() => exportImage('svg')} className="px-2.5 py-1.5 bg-white text-blue-600 border border-blue-200 text-[10px] font-bold rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5"><DownloadIcon /> SVG</button>
            <button onClick={isDeck ? exportDeckPdf : exportPdf} disabled={isDeckExporting}
              title={isDeck ? 'Every page bound into one PDF (post as a LinkedIn document)' : 'Single-page PDF; CTA link stays clickable (post as a LinkedIn document)'}
              className="px-2.5 py-1.5 bg-white text-blue-600 border border-blue-200 text-[10px] font-bold rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5"><DownloadIcon /> {isDeckExporting ? 'PDF…' : 'PDF'}</button>
          </div>
        </header>

        {/* Brand Picker */}
        <div className="px-4 py-3 border-b border-neutral-100">
          <div className="grid grid-cols-5 gap-1">
            {BRANDS.map(b => (
              <button key={b.id} onClick={() => selectBrand(b.id)} disabled={b.comingSoon}
                title={b.comingSoon ? `${b.name} — coming soon` : b.name}
                className={`py-1.5 rounded-md border text-[9px] font-bold uppercase tracking-wide leading-tight transition-all ${
                  b.comingSoon
                    ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
                    : brandId === b.id ? 'text-white border-transparent' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                }`}
                style={brandId === b.id ? { backgroundColor: b.palettes[0].bg } : undefined}>
                <span style={brandId === b.id ? { color: b.palettes[0].accent } : undefined}>{b.shortName || b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-neutral-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center transition-all relative ${
                activeTab === tab.id ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
              }`}>
              <div className="text-lg leading-none mb-0.5">{tab.icon}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase">{tab.label}</div>
              {activeTab === tab.id && <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bs-scrollbar-thin">
          {activeTab === 'templates' && (
            <div className="p-4 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Canvas Size</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['1080x1080', 'Square'], ['1080x1350', 'Feed 4:5'], ['1080x1920', 'Story'], ['1920x1080', 'Landscape'], ['1280x720', 'YouTube'], ['1200x628', 'Ad']].map(([val, label]) => (
                    <button key={val} onClick={() => setResolution(val)}
                      className={`py-2 rounded-md text-[11px] font-semibold border transition-all ${
                        resolution === val ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:border-neutral-300'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              {TEMPLATE_GROUPS.map(group => (
                <div key={group}>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{group}</div>
                  <div className="space-y-1">
                    {TEMPLATES.filter(t => t.group === group).map(t => (
                      <button key={t.id} onClick={() => selectTemplate(t.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                          activeId === t.id
                            ? 'bg-blue-50/50 text-neutral-900 border-blue-200'
                            : 'bg-white text-neutral-700 border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}>
                        <div className="font-semibold text-[13px] leading-tight">{t.name}</div>
                        <div className={`text-[10px] mt-0.5 ${activeId === t.id ? 'text-blue-600' : 'text-neutral-400'}`}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'designs' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Saved Designs</label>
                <button onClick={() => { setDesignsBusy(true); refreshDesigns() }} disabled={designsBusy}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 disabled:text-neutral-300">
                  {designsBusy ? 'LOADING…' : 'REFRESH'}
                </button>
              </div>
              {designs === null || (designsBusy && !designs?.length) ? (
                <div className="text-[12px] text-neutral-400 py-6 text-center">Loading designs…</div>
              ) : designs.length === 0 ? (
                <div className="text-[12px] text-neutral-400 py-6 text-center leading-relaxed">
                  Nothing saved yet.<br />Hit <span className="font-bold text-neutral-600">Save</span> in the header to keep the current design — content, photos and all — editable forever.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {designs.map(d => (
                    <div key={d.id} className={`group rounded-lg border overflow-hidden transition-all ${
                      loadedDesign?.id === d.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-neutral-200 hover:border-neutral-400'
                    }`}>
                      <button onClick={() => loadDesign(d)} disabled={designsBusy} className="block w-full text-left">
                        <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                          {d.thumbnailUrl
                            ? <img src={`${API_BASE}${d.thumbnailUrl}`} alt={d.name} className="w-full h-full object-cover" />
                            : <span className="text-neutral-300 text-2xl">▤</span>}
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="text-[11px] font-semibold text-neutral-800 leading-tight truncate">{d.name}</div>
                          <div className="text-[9px] text-neutral-400 uppercase tracking-wide mt-0.5 truncate">
                            {brandById(d.brandId)?.shortName || d.brandId} · {TEMPLATES.find(t => t.id === d.templateId)?.name || d.templateId}
                          </div>
                        </div>
                      </button>
                      <button onClick={() => deleteDesign(d)} title="Delete design"
                        className="w-full py-1 text-[9px] font-bold uppercase tracking-wide text-neutral-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && isDeck && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Design Set</label>
                <div className="flex flex-wrap gap-1.5">
                  {CAROUSEL_DESIGNS.map(dsg => (
                    <button key={dsg.id} onClick={() => setDirect('deckDesign', dsg.id)}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                        deckDesign === dsg.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                      }`}>{dsg.label}</button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">One template family per set — hook and CTA pages wear its boldest variant, points its workhorse.</p>
              </div>
              <div className="space-y-3">
                {deckSlides.map((s, i) => (
                  <div key={i} onClick={() => setDeckPage(i)}
                    className={`rounded-lg border p-3 space-y-2 cursor-pointer transition-all ${deckPage === i ? 'border-blue-300 bg-blue-50/40' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400">PAGE {i + 1}</span>
                        <select value={s.kind} onClick={(e) => e.stopPropagation()} onChange={(e) => setDeckSlide(i, { kind: e.target.value })}
                          className="text-[10px] font-bold uppercase tracking-wide border border-neutral-200 rounded px-1.5 py-0.5 bg-white text-neutral-600">
                          <option value="hook">hook</option>
                          <option value="point">point</option>
                          <option value="cta">cta</option>
                        </select>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeDeckSlide(i) }} disabled={deckSlides.length <= 1}
                        className="text-[10px] font-bold text-neutral-300 hover:text-red-500 disabled:opacity-30">REMOVE</button>
                    </div>
                    <input value={s.heading || ''} onChange={(e) => setDeckSlide(i, { heading: e.target.value })}
                      placeholder="Heading"
                      className="w-full text-[13px] font-semibold border border-neutral-200 rounded px-2 py-1.5 bg-white" />
                    <textarea value={s.body || ''} onChange={(e) => setDeckSlide(i, { body: e.target.value })}
                      placeholder="Body (hooks and CTAs often need none)" rows={2}
                      className="w-full text-[12px] border border-neutral-200 rounded px-2 py-1.5 bg-white resize-y" />
                  </div>
                ))}
                <button onClick={addDeckSlide} disabled={deckSlides.length >= 10}
                  className="w-full py-2 rounded-lg border border-dashed border-neutral-300 text-[11px] font-bold text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 disabled:opacity-40 transition-all">
                  + ADD PAGE
                </button>
              </div>
            </div>
          )}

          {activeTab === 'content' && !isDeck && (
            <div className="p-4 space-y-3">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{activeMeta?.name}</div>
              {/* Only the fields this template actually renders (registry `fields`) */}
              {hasField('title') && <Field label={activeId === 'seal' ? 'Top Arc Text' : activeId === 'quote' ? 'The Quote' : activeId === 'mythfact' ? 'The Myth' : 'Title'} value={inputs.title} onChange={set('title')} />}
              {hasField('subtitle') && <Field label={activeId === 'seal' ? 'Bottom Arc Text' : 'Subtitle / Tag'} value={inputs.subtitle} onChange={set('subtitle')} />}
              {hasField('body') && <Field label={activeId === 'mythfact' ? 'The Fact' : activeId === 'chart' ? 'Source Line' : activeId === 'liveevent' ? 'Standfirst, then the callout (two paragraphs)' : 'Body Copy'} value={inputs.body} onChange={set('body')} area />}
              {hasField('metric') && (
                <Field
                  label={{
                    displayad: 'CTA Text', emailhero: 'CTA Text', announcement: 'CTA Text',
                    youtubethumb: 'Badge / Episode', newsletter: 'Issue Number',
                    chart: 'Delta / Stat Chip', bignumber: 'The Big Number', report: 'Report No.',
                    webinar: 'Admission (e.g. FREE)', officehours: 'Chip (e.g. FREE)',
                    storage101: 'Lesson No.', mythfact: 'Myth No.', liveevent: 'Price · Note (e.g. $349 · FOR TWO PEOPLE)',
                  }[activeId] || 'Episode #'}
                  value={inputs.metric} onChange={set('metric')} />
              )}
              {activeId === 'partnership' && <Field label="Partner Name" value={inputs.partnerName} onChange={set('partnerName')} />}
              {['announcement', 'displayad', 'emailhero', 'liveevent'].includes(activeId) && (
                <div>
                  <Field label={activeId === 'liveevent' ? 'Register Link (the QR code target)' : 'CTA Link'} value={inputs.ctaUrl} onChange={set('ctaUrl')} />
                  <div className="text-[9px] text-neutral-400 mt-1">{activeId === 'liveevent' ? 'Encoded into the QR code on the canvas; leave blank to use https:// + the URL field.' : 'Clickable in the PDF export (post PDFs as LinkedIn documents to keep the link live). PNG exports are flat pixels — no image upload keeps links.'}</div>
                </div>
              )}
              {VARIANT_SETS[activeId] && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Design</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {VARIANT_SETS[activeId].list.map(v => (
                      <button key={v.id} onClick={() => setDirect('variant', v.id)}
                        className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          (inputs.variant || VARIANT_SETS[activeId].def) === v.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                        }`}>{v.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {['newsletter', 'storage101', 'podcastannounce', 'liveevent'].includes(activeId) && (
                <Field label={activeId === 'newsletter' ? 'Story Teasers (one per line)' : activeId === 'storage101' ? 'Lesson Points (one per line)' : activeId === 'liveevent' ? 'Agenda (one per line, up to five)' : 'Platforms (one per line)'} value={inputs.features} onChange={set('features')} area />
              )}
              {activeId === 'chart' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Chart Type</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CHART_VARIANTS.map(v => (
                        <button key={v.id} onClick={() => setDirect('variant', v.id)}
                          className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            inputs.variant === v.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                          }`}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Data (JSON: label + value)</label>
                    <textarea value={inputs.dataJson} onChange={set('dataJson')}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-[12px] text-neutral-800 h-32 resize-none focus:border-neutral-400 focus:outline-none font-mono" />
                  </div>
                </>
              )}
              {activeId === 'swag' && (
                <>
                  <Field label="Tagline (for Tagline print)" value={inputs.metric} onChange={set('metric')} />
                  <div className="text-[10px] text-neutral-400 leading-relaxed p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    Product, colorway, and print live in the <span className="font-bold">Style</span> tab.
                  </div>
                </>
              )}
              {activeId === 'seal' && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Seal Finish</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SEAL_VARIANTS.map(v => (
                      <button key={v.id} onClick={() => setDirect('variant', v.id)}
                        className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          inputs.variant === v.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                        }`}>{v.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {hasField('author') && <Field label={activeId === 'speaking' ? 'Speaker(s) — comma separated for a panel' : activeId === 'podcastannounce' ? 'Host & Guest(s) — comma separated' : activeId === 'liveevent' ? 'Who it’s for (· separated, two cells)' : 'Author / Speaker'} value={inputs.author} onChange={set('author')} />}
              {hasField('role') && <Field label={activeId === 'liveevent' ? 'Included (· separated)' : 'Role / Title'} value={inputs.role} onChange={set('role')} />}
              {hasField('date') && <Field label={activeId === 'liveevent' ? 'Day · Time · Venue (· separated)' : 'Date / Event'} value={inputs.date} onChange={set('date')} />}
              {hasField('url') && <Field label="URL / Footer" value={inputs.url} onChange={set('url')} />}
              {(activeId === 'splitpanel' || activeId === 'youtubethumb') && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{activeId === 'youtubethumb' ? 'Thumbnail Style' : 'Right Panel Art'}</label>
                  <div className={`grid gap-1.5 ${activeId === 'youtubethumb' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {(activeId === 'youtubethumb' ? THUMB_VARIANTS : SPLIT_VARIANTS).map(v => (
                      <button key={v.id} onClick={() => setDirect('variant', v.id)}
                        className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          (inputs.variant || 'panes') === v.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                        }`}>{v.label}</button>
                    ))}
                  </div>
                  {activeId === 'splitpanel' && <div className="text-[9px] text-neutral-400 mt-1.5">Uploading an image replaces the art panel.</div>}
                  {activeId === 'youtubethumb' && <div className="text-[9px] text-neutral-400 mt-1.5">Punch and Live take a face upload. Tutorial and Demo take a screenshot.</div>}
                </div>
              )}
              {(activeId === 'motionlower' || activeId === 'logosting') && (
                <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50 space-y-2">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Motion Export · {activeId === 'motionlower' ? '4s' : '2.6s'}</div>
                  <div className="text-[9px] text-neutral-400 leading-relaxed">{activeId === 'motionlower' ? 'WebM renders over the background color. The PNG sequence carries true alpha for the edit timeline.' : 'Opaque brand sting for intros and outros. PNG sequence imports as a 30 fps image sequence.'}</div>
                  <button onClick={() => runMotionExport('webm')} disabled={isMotionExporting}
                    className="w-full py-2 bg-blue-600 text-white font-bold text-[11px] rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    {isMotionExporting ? 'WORKING…' : 'EXPORT WEBM'}
                  </button>
                  <button onClick={() => runMotionExport('png')} disabled={isMotionExporting}
                    className="w-full py-2 bg-white text-blue-600 border border-blue-200 font-bold text-[11px] rounded-md hover:bg-blue-50 disabled:opacity-40 transition-colors">
                    PNG SEQUENCE{activeId === 'motionlower' ? ' (ALPHA)' : ''}
                  </button>
                  {motionStatus && <div className="text-[10px] font-semibold text-neutral-500">{motionStatus}</div>}
                </div>
              )}
              <Field label="Footer Disclaimer" value={inputs.disclaimer} onChange={set('disclaimer')} />
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={inputs.hideCrosshairs} onChange={set('hideCrosshairs')} className="rounded border-neutral-300 accent-neutral-900" />
                  <span className="text-[11px] text-neutral-500 font-medium">Hide grid overlays</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="p-4 space-y-5">
              {activeId === 'swag' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Product</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SWAG_PRODUCTS.map(p => (
                        <button key={p.id} onClick={() => setDirect('variant', p.id)}
                          className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            inputs.variant === p.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                          }`}>{p.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Product Colorway</label>
                    <div className="flex gap-2">
                      {SWAG_COLORWAYS.map(c => (
                        <button key={c.hex} title={c.name} onClick={() => setDirect('garment', c.hex)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${inputs.garment === c.hex ? 'border-blue-500' : 'border-neutral-200'}`}
                          style={{ backgroundColor: c.hex }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Print</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SWAG_PRINTS.map(p => (
                        <button key={p.id} onClick={() => setDirect('print', p.id)}
                          className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            (inputs.print || 'mark') === p.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                          }`}>{p.label}</button>
                      ))}
                    </div>
                    <div className="text-[9px] text-neutral-400 mt-1.5">Print ink auto-contrasts against the colorway.</div>
                  </div>
                  <Link to="/brand-studio/kit" className="block w-full py-2 text-center bg-white text-blue-600 border border-blue-200 font-bold text-[11px] rounded-md hover:bg-blue-50 no-underline tracking-wider">
                    VIEW FULL LINE SHEET →
                  </Link>
                  <div className="border-t border-neutral-100" />
                </>
              )}
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">{activeId === 'swag' ? 'Card Background' : `${brand.name} Palettes`}</div>
                <div className="grid grid-cols-4 gap-2">
                  {brand.palettes.map(p => (
                    <button key={p.id} onClick={() => applyPalette(p)}
                      className={`group relative rounded-lg border-2 p-2 transition-all hover:scale-105 ${
                        inputs.bgColor === p.bg && inputs.accentColor === p.accent
                          ? 'border-blue-400 shadow-md' : 'border-neutral-200 hover:border-neutral-400'
                      }`}>
                      <div className="w-full h-10 rounded-md mb-1.5 flex items-center justify-center overflow-hidden" style={{ backgroundColor: p.bg }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                      </div>
                      <div className="text-[9px] font-bold text-neutral-500 text-center truncate">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Custom Colors</div>
                <div className="space-y-2">
                  <ColorField label="Background" value={inputs.bgColor} onChange={(v) => setDirect('bgColor', v)} />
                  <ColorField label="Accent" value={inputs.accentColor} onChange={(v) => setDirect('accentColor', v)} />
                  <ColorField label="Text" value={inputs.textColor} onChange={(v) => setDirect('textColor', v)} />
                </div>
              </div>

              {activeMeta?.logo && (
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Logo</div>
                {brand.logos.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 leading-relaxed p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    No logo files loaded for {brand.name} yet — templates use the typographic wordmark until the brand's logo set is added to <span className="font-mono">public/logos/{brand.id}/</span>.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto bs-scrollbar-thin">
                    {brand.logos.map(logo => (
                      <button key={logo.src} onClick={() => setDirect('logoSrc', logo.src)}
                        className={`rounded-lg border-2 p-2 flex flex-col items-center transition-all hover:scale-105 ${
                          inputs.logoSrc === logo.src ? 'border-blue-300 bg-blue-50/40 shadow-sm' : 'border-neutral-100 hover:border-neutral-300'
                        }`}>
                        <div className="w-full h-10 bg-neutral-100 rounded flex items-center justify-center overflow-hidden">
                          <img src={logo.src} alt={logo.label} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="text-[8px] text-neutral-400 mt-1 text-center truncate w-full">{logo.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {activeTab === 'media' && !anyMedia && (
            <div className="p-4">
              <div className="text-[11px] text-neutral-400 leading-relaxed p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="font-bold text-neutral-500">{activeMeta?.name}</span> doesn't take imagery — its art is drawn from the brand system (type, rules, seal, chart marks). Pick a template with a photo or image slot (episode card, blog cover, editorial, report…) to use uploads and AI generation.
              </div>
            </div>
          )}
          {activeTab === 'media' && anyMedia && (
            <div className="p-4 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Upload Images</div>
                  {isCutting && <span className="text-[10px] font-semibold text-blue-600 animate-pulse">Removing background…</span>}
                </div>
                <div className="space-y-2">
                  {hasMedia('image') && <UploadButton label="Centerpiece Image" desc="Guest photo, screenshot, diagram" current={inputs.uploadedImage} onUpload={() => handleImageUpload('uploadedImage')} onClear={() => setDirect('uploadedImage', undefined)} />}
                  {hasMedia('background') && <UploadButton label="Background Image" desc="Full-bleed cover photo" current={inputs.uploadedBackground} onUpload={() => handleImageUpload('uploadedBackground')} onClear={() => setDirect('uploadedBackground', undefined)} />}
                  {PORTRAIT_TEMPLATES.includes(activeId) && (
                    <>
                      <div className="border-2 border-dashed rounded-xl p-3 border-neutral-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-600">{activeId === 'podcastannounce' ? 'Additional Guests' : 'Additional Speakers'}</div>
                            <div className="text-[9px] text-neutral-400 mt-0.5">
                              {(inputs.uploadedImage ? 1 : 0) + (inputs.uploadedCoHosts?.length ?? 0) >= 3
                                ? 'Max three people — remove one to add another'
                                : 'For panels — add names comma-separated in Content'}
                            </div>
                          </div>
                          {(inputs.uploadedImage ? 1 : 0) + (inputs.uploadedCoHosts?.length ?? 0) >= 3 ? (
                            <span className="text-[10px] font-semibold text-neutral-300">Max 3</span>
                          ) : (
                            <button onClick={handleCoHostUpload} className="text-[10px] font-semibold text-blue-600 hover:underline">Add</button>
                          )}
                        </div>
                        {(inputs.uploadedCoHosts?.length ?? 0) > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {inputs.uploadedCoHosts.map((src, i) => (
                              <div key={i} className="relative group">
                                <img src={src} className="w-12 h-12 object-cover rounded-md bg-neutral-100" />
                                <button onClick={() => removeCoHost(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[9px] text-neutral-400 leading-relaxed">Portrait uploads get an AI cutout. The first upload downloads the model (~40MB) — allow up to a minute; it's cached after that.</div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">✦ AI Generation</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[hasMedia('background') && 'artistic', hasMedia('image') && 'centerpiece'].filter(Boolean).map(t => (
                      <button key={t} onClick={() => setAiPromptType(t)}
                        className={`py-1.5 rounded-md text-[10px] font-bold border transition-all ${
                          aiPromptType === t ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-neutral-500 border-neutral-200'
                        }`}>
                        {t === 'artistic' ? '◎ Background' : '◉ Centerpiece'}
                      </button>
                    ))}
                  </div>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Describe the concept…"
                    className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-[12px] text-neutral-700 h-16 resize-none focus:border-neutral-400 focus:outline-none" />
                  <button onClick={generateAIArt} disabled={isGenerating || !aiPrompt}
                    className="w-full py-2 bg-blue-600 text-white font-bold text-[11px] rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    {isGenerating ? '◌ GENERATING…' : `✦ GENERATE IN ${brand.name.toUpperCase()} STYLE`}
                  </button>
                  {aiError && <div className="text-[10px] font-semibold text-red-500">{aiError}</div>}
                </div>
              </div>

              {(inputs.generatedImage || inputs.generatedBackground) && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Generated Assets</div>
                  <div className="space-y-2">
                    {inputs.generatedImage && (
                      <div className="relative group">
                        <img src={inputs.generatedImage} className="w-full h-24 object-cover rounded-lg border border-neutral-200" />
                        <button onClick={() => setDirect('generatedImage', undefined)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        <div className="text-[9px] text-neutral-400 mt-1">Centerpiece</div>
                      </div>
                    )}
                    {inputs.generatedBackground && (
                      <div className="relative group">
                        <img src={inputs.generatedBackground} className="w-full h-24 object-cover rounded-lg border border-neutral-200" />
                        <button onClick={() => setDirect('generatedBackground', undefined)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        <div className="text-[9px] text-neutral-400 mt-1">Background</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ─── Canvas ─── */}
      <main ref={paneRef} className="flex-1 flex flex-col items-center justify-center bg-neutral-200 overflow-hidden p-12 relative bs-pattern-dots">
        <div className="absolute top-5 font-mono text-[10px] text-neutral-500 tracking-widest bg-white/60 px-4 py-1.5 rounded-full border border-neutral-300 shadow-sm backdrop-blur-sm">
          {brand.name} · {activeMeta?.name} · {w} × {h}
        </div>
        <div className="shrink-0 relative" style={{ width: w * scale, height: h * scale }}>
          <div className="shadow-2xl" style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div ref={canvasRef} className="w-full h-full relative overflow-hidden">
            {(inputs.uploadedBackground || inputs.generatedBackground) && hasMedia('background') && activeId !== 'blogcover' && (
              <img src={inputs.uploadedBackground || inputs.generatedBackground} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
            )}
            {activeMeta?.motion
              ? <MotionCanvas d={inputs} brand={brand} kind={activeMeta.motion} apiRef={motionApi} />
              : isDeck
                ? <SocialCarouselCanvas slide={deckSlides[deckPage]} index={deckPage} count={deckSlides.length} design={deckDesign} brandId={brandId} scale={1} />
                : ActiveTpl ? <ActiveTpl d={inputs} brand={brand} canvas={{ w, h }} /> : null}
            {inputs.disclaimer && !activeMeta?.motion && (
              <div className="absolute bottom-4 left-0 right-0 text-center font-mono text-[9px] tracking-widest z-50 pointer-events-none" style={{ color: inputs.textColor, opacity: 0.35 }}>
                {inputs.disclaimer}
              </div>
            )}
            </div>
          </div>
        </div>
        {/* Deck pager — flip through pages; the PDF button binds them all. */}
        {isDeck && (
          <div className="absolute bottom-5 flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-neutral-300 shadow-sm backdrop-blur-sm">
            <button onClick={() => setDeckPage(Math.max(0, deckPage - 1))} disabled={deckPage === 0}
              className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30 font-bold px-1">‹</button>
            {deckSlides.map((s, i) => (
              <button key={i} onClick={() => setDeckPage(i)} title={`${s.kind}: ${s.heading || ''}`}
                className={`w-2 h-2 rounded-full transition-all ${deckPage === i ? 'bg-blue-600 scale-125' : 'bg-neutral-300 hover:bg-neutral-400'}`} />
            ))}
            <button onClick={() => setDeckPage(Math.min(deckSlides.length - 1, deckPage + 1))} disabled={deckPage === deckSlides.length - 1}
              className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30 font-bold px-1">›</button>
            <span className="font-mono text-[10px] text-neutral-500 ml-1">{deckPage + 1}/{deckSlides.length}</span>
          </div>
        )}
        {/* Offscreen full-res pages: what the PDF export captures. */}
        {isDeck && (
          <div aria-hidden style={{ position: 'fixed', left: -20000, top: 0 }}>
            {deckSlides.map((s, i) => (
              <SocialCarouselCanvas key={i} slide={s} index={i} count={deckSlides.length} design={deckDesign} brandId={brandId} scale={1}
                canvasRef={(el) => { deckRefs.current[i] = el }} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

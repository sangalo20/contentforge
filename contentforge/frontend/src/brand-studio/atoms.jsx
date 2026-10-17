// Shared UI atoms for the Brand Studio: sidebar form controls and the small
// canvas-side primitives templates compose from.
import { useId, useState } from 'react'
import { hexLuma } from './helpers'
import qrcode from 'qrcode-generator'

export function DownloadIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export function Field({ label, value, onChange, area }) {
  const cls = 'w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-[12px] text-neutral-800 focus:border-neutral-400 focus:outline-none placeholder-neutral-300'
  return (
    <div>
      <label className="block text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">{label}</label>
      {area ? <textarea value={value} onChange={onChange} className={cls + ' h-16 resize-none'} /> : <input value={value} onChange={onChange} className={cls} />}
    </div>
  )
}

export function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-md border border-neutral-200 cursor-pointer appearance-none bg-transparent p-0" style={{ WebkitAppearance: 'none' }} />
      <div className="flex-1">
        <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="text-[11px] text-neutral-600 bg-transparent border-none p-0 w-full focus:outline-none font-mono" />
      </div>
    </div>
  )
}

export function UploadButton({ label, desc, current, onUpload, onClear }) {
  return (
    <div className={`border-2 border-dashed rounded-xl p-3 transition-all ${current ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
      {current ? (
        <div className="flex items-center gap-3">
          <img src={current} className="w-12 h-12 object-cover rounded-md" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-neutral-700">{label}</div>
            <button onClick={onClear} className="text-[10px] text-red-500 hover:underline mt-0.5">Remove</button>
          </div>
          <button onClick={onUpload} className="text-[10px] text-neutral-500 hover:text-neutral-900 font-semibold">Replace</button>
        </div>
      ) : (
        <button onClick={onUpload} className="w-full text-center py-3">
          <div className="text-[11px] font-semibold text-neutral-600">{label}</div>
          <div className="text-[9px] text-neutral-400 mt-0.5">{desc}</div>
        </button>
      )}
    </div>
  )
}

// Brand mark. Renders the logo file when one exists and loads; otherwise falls
// back to the brand wordmark set in the brand's heading face, so every
// template stays presentable before logo files are delivered.
export function LogoImg({ brand, src, tone, className = 'h-8' }) {
  // Track which src failed so a new src gets a fresh attempt without an effect.
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = failedSrc === src
  if (!src || failed) {
    return (
      <span className={`inline-flex items-center font-bold leading-none whitespace-nowrap ${className}`}
        style={{ fontFamily: brand.fonts.heading, letterSpacing: '0.1em', color: tone || 'currentColor', fontSize: '1.35em' }}>
        {brand.wordmark}
      </span>
    )
  }
  return <img src={src} alt={brand.name} onError={() => setFailedSrc(src)} className={`object-contain ${className}`} />
}

// Grayscale cutout that melts into the poster: screen on dark grounds,
// multiply on light.
export function BlendPortrait({ src, bg, className = '', pos = 'bottom' }) {
  const mode = hexLuma(bg) > 0.5 ? 'multiply' : 'screen'
  return (
    <div className={className}>
      <img src={src} alt="" className={`absolute inset-0 w-full h-full object-contain ${pos === 'center' ? 'object-center' : 'object-bottom'}`} style={{ mixBlendMode: mode }} />
    </div>
  )
}

// Deterministic pixel-block mosaic texture
export function PixelMosaic({ color, cols = 12, rows = 8, className = '' }) {
  const cells = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    if (h - Math.floor(h) > 0.72) cells.push({ x, y })
  }
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none" className={className}>
      {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width="1" height="1" fill={color} />)}
    </svg>
  )
}

// ─── Moguls-era brand atoms ───

// Circular brand seal — the mark of the house. Reeded tick ring, circular
// text arcs (top = wordmark, bottom = masthead), a drawn facility glyph at
// center, diamond separators at 9 and 3 o'clock. `tone` is a hex color or
// 'gold' for a foil gradient. Text is overridable per use.
export function BrandSeal({ brand, tone = 'blue', size = 320, topText, bottomText, className = '' }) {
  const uid = useId().replace(/[:]/g, '')
  const foil = tone === 'gold' || tone === 'blue'
  const ink = foil ? `url(#${uid}-foil)` : tone
  const top = (topText || brand.wordmark).toUpperCase()
  const bottom = (bottomText || brand.masthead).toUpperCase()
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180
    return <line key={i} x1={Math.cos(a) * 96} y1={Math.sin(a) * 96} x2={Math.cos(a) * 102} y2={Math.sin(a) * 102} stroke={ink} strokeWidth={i % 6 === 0 ? 2 : 1} opacity={i % 6 === 0 ? 0.9 : 0.5} />
  })
  return (
    <svg viewBox="-160 -160 320 320" width={size} height={size} className={className}>
      <defs>
        {tone === 'gold' && (
          <linearGradient id={`${uid}-foil`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F6D06B" />
            <stop offset="45%" stopColor="#E8B23C" />
            <stop offset="100%" stopColor="#B9821F" />
          </linearGradient>
        )}
        {tone === 'blue' && (
          <linearGradient id={`${uid}-foil`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8FC0FF" />
            <stop offset="45%" stopColor="#2E7DF6" />
            <stop offset="100%" stopColor="#1747A8" />
          </linearGradient>
        )}
        {/* top arc runs clockwise over the crown; bottom arc counterclockwise so its text reads upright */}
        <path id={`${uid}-top`} d="M -124,0 A 124,124 0 0 1 124,0" fill="none" />
        <path id={`${uid}-bot`} d="M -124,0 A 124,124 0 0 0 124,0" fill="none" />
      </defs>
      <circle r="152" fill="none" stroke={ink} strokeWidth="3" />
      <circle r="145" fill="none" stroke={ink} strokeWidth="1" opacity="0.6" />
      {ticks}
      <circle r="88" fill="none" stroke={ink} strokeWidth="1.5" />
      <text fontFamily={brand.fonts.heading} fontWeight="700" fontSize="24" letterSpacing="6" fill={ink}>
        <textPath href={`#${uid}-top`} startOffset="50%" textAnchor="middle">{top}</textPath>
      </text>
      <text fontFamily={brand.fonts.heading} fontWeight="600" fontSize="17" letterSpacing="5" fill={ink} opacity="0.9">
        <textPath href={`#${uid}-bot`} startOffset="50%" textAnchor="middle">{bottom}</textPath>
      </text>
      {[-124, 124].map(x => (
        <path key={x} d={`M ${x},0 m 0,-7 l 6,7 l -6,7 l -6,-7 Z`} fill={ink} />
      ))}
      {/* facility glyph — same massing as the ledger mark: tall center
          volume, two lower wings, slatted doors, ground line */}
      <g stroke={ink} fill="none" strokeLinejoin="miter">
        <rect x="-17" y="-36" width="34" height="66" strokeWidth="3" />
        <line x1="-22" y1="-36" x2="22" y2="-36" strokeWidth="4" />
        <rect x="-49" y="-14" width="26" height="44" strokeWidth="2.5" />
        <line x1="-52" y1="-14" x2="-23" y2="-14" strokeWidth="3" />
        <rect x="23" y="-14" width="26" height="44" strokeWidth="2.5" />
        <line x1="23" y1="-14" x2="52" y2="-14" strokeWidth="3" />
        {[-24, -14, -4, 6, 16].map(y => <line key={y} x1="-10" y1={y} x2="10" y2={y} strokeWidth="2.5" />)}
        {[-2, 8, 18].map(y => <g key={y}><line x1="-43" y1={y} x2="-29" y2={y} strokeWidth="2.25" /><line x1="29" y1={y} x2="43" y2={y} strokeWidth="2.25" /></g>)}
        <line x1="-58" y1="30" x2="58" y2="30" strokeWidth="4" />
      </g>
      <rect x="-4" y="-43" width="8" height="3.5" fill={ink} />
    </svg>
  )
}

// Repeating brand line used as a rail along edges — the ledger's running head.
export function TickerRail({ brand, color, className = '' }) {
  const seq = (brand.ticker || `${brand.wordmark} · ${brand.masthead} · `).repeat(8)
  return (
    <div className={`overflow-hidden whitespace-nowrap text-[12px] tracking-[0.28em] leading-relaxed select-none uppercase ${className}`}
      style={{ color, fontFamily: brand.fonts.heading }}>
      {seq}
    </div>
  )
}

// Roll-up-door slats: the house texture. Horizontal ribbed lines.
export function DoorSlats({ color, count = 14, className = '' }) {
  return (
    <svg viewBox={`0 0 100 ${count * 8}`} preserveAspectRatio="none" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <line x1="0" y1={i * 8 + 5} x2="100" y2={i * 8 + 5} stroke={color} strokeWidth="2.2" />
          <line x1="0" y1={i * 8 + 7} x2="100" y2={i * 8 + 7} stroke={color} strokeWidth="0.6" opacity="0.5" />
        </g>
      ))}
    </svg>
  )
}

// Editorial masthead row: wordmark with an accent full stop, and a mono lane
// tag on the right ("OPERATOR DATA", "STORAGE 101", ...).
export function Masthead({ brand, ink, accent, tag, className = '' }) {
  return (
    <div className={`flex items-baseline justify-between ${className}`}>
      <div className="text-[30px] font-bold tracking-[0.06em] leading-none" style={{ color: ink, fontFamily: brand.fonts.heading }}>
        {brand.wordmark}<span style={{ color: accent }}>.</span>
      </div>
      {tag && <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: accent }}>{tag}</div>}
    </div>
  )
}

// Ledger double rule — the document detail that separates sections.
export function LedgerRule({ color, className = '' }) {
  return (
    <div className={className}>
      <div style={{ height: 2, backgroundColor: color }} />
      <div style={{ height: 1, backgroundColor: color, opacity: 0.45, marginTop: 3 }} />
    </div>
  )
}

// Scannable QR code as crisp SVG modules. Type number is auto-sized, so a
// long URL just yields a denser grid; a two-module quiet zone is painted in
// `bg` so the code stays readable when it sits on a busy surface.
export function QrCode({ value, size = 120, fg = '#000000', bg = 'transparent', level = 'M', className = '' }) {
  let qr
  try {
    qr = qrcode(0, level)
    qr.addData(value || ' ')
    qr.make()
  } catch {
    return null
  }
  const n = qr.getModuleCount()
  const q = 2
  let path = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`
  return (
    <svg viewBox={`${-q} ${-q} ${n + 2 * q} ${n + 2 * q}`} width={size} height={size} shapeRendering="crispEdges" className={className} aria-label={value}>
      <rect x={-q} y={-q} width={n + 2 * q} height={n + 2 * q} fill={bg} />
      <path d={path} fill={fg} />
    </svg>
  )
}

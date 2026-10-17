// Brand Kit: merch mockups in the ledger design language. Garments are
// layered SVG illustrations — fabric gradients, radial sheen, soft-blurred
// wrinkles, ribbed trims, stitched seams, ground shadows — with the identity
// carried in each product's print window (ledger mark, refined lockup, seal,
// tagline, or slat band), auto-inked for contrast against the colorway.
// The stage is drag-to-orbit 3D with studio-light sheen; double-click resets.
import { useId, useRef, useState } from 'react'
import { hexLuma, mixHex } from './helpers'
import { BrandSeal, DoorSlats, Masthead, LedgerRule } from './atoms'
import { SWAG_PRODUCTS, SWAG_COLORWAYS, SWAG_PRINTS } from './swagData'

// Print windows in the garment SVG's 560×640 coordinate space.
const WINDOWS = {
  tshirt: { x: 198, y: 240, w: 164, h: 200 },
  hoodie: { x: 212, y: 236, w: 136, h: 160 },
  sweatshirt: { x: 208, y: 210, w: 144, h: 180 },
  cap: { x: 216, y: 226, w: 128, h: 92 },
  mug: { x: 212, y: 252, w: 140, h: 150 },
  notebook: { x: 212, y: 205, w: 130, h: 165 },
  bottle: { x: 216, y: 246, w: 128, h: 180 },
}

function tonesOf(g) {
  const dark = hexLuma(g) < 0.55
  return {
    dark,
    gLight: mixHex(g, '#ffffff', 0.16),
    gDark: mixHex(g, '#000000', 0.24),
    gDeep: mixHex(g, '#000000', 0.45),
    rib: mixHex(g, dark ? '#ffffff' : '#000000', 0.1),
    edge: mixHex(g, dark ? '#ffffff' : '#000000', 0.3),
    seam: mixHex(g, dark ? '#ffffff' : '#000000', 0.18),
  }
}

// Shared defs: fabric/arm/cylinder gradients, sheen, and blur filters.
function GarmentDefs({ uid, g, t }) {
  return (
    <defs>
      <linearGradient id={`${uid}-fab`} x1="0" y1="0" x2="0.55" y2="1">
        <stop offset="0%" stopColor={t.gLight} /><stop offset="52%" stopColor={g} /><stop offset="100%" stopColor={t.gDark} />
      </linearGradient>
      <linearGradient id={`${uid}-arm`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor={g} /><stop offset="100%" stopColor={t.gDeep} />
      </linearGradient>
      <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={t.gDeep} /><stop offset="20%" stopColor={g} /><stop offset="42%" stopColor={t.gLight} /><stop offset="62%" stopColor={g} /><stop offset="100%" stopColor={t.gDeep} />
      </linearGradient>
      <radialGradient id={`${uid}-sheen`} cx="0.35" cy="0.22" r="0.95">
        <stop offset="0%" stopColor="#ffffff" stopOpacity={t.dark ? 0.09 : 0.32} /><stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}-soft`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" /></filter>
      <filter id={`${uid}-softer`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="13" /></filter>
    </defs>
  )
}

const Ground = ({ uid, cx = 280, cy = 606, rx = 175 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry="15" fill="#000000" opacity="0.32" filter={`url(#${uid}-softer)`} />
)

// Original Moguls silhouettes: boxy drop-shoulder cuts, storage-vernacular
// details (slat ribbing, unit patches, ledger corner protectors). Rendering
// technique (gradients/sheen/blur) is shared craft; the drawings are ours.

// Small woven "unit number" patch — the Moguls tell on every garment.
function UnitPatch({ x, y, ink, bg, n = '№ 001' }) {
  return (
    <g>
      <rect x={x} y={y} width="52" height="18" rx="2" fill={bg} stroke={ink} strokeWidth="1.25" opacity="0.9" />
      <text x={x + 26} y={y + 13} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="1.5" fill={ink}>{n}</text>
    </g>
  )
}

function Tee({ g, accent }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  // boxy drop-shoulder cut: straight wide body, angled shoulder wedge sleeves
  const tee = 'M 246,128 C 254,150 306,150 314,128 L 386,140 L 466,196 C 476,204 478,216 470,226 L 442,262 C 436,270 426,272 418,266 L 398,252 L 398,540 C 398,554 388,562 374,562 L 186,562 C 172,562 162,554 162,540 L 162,252 L 142,266 C 134,272 124,270 118,262 L 90,226 C 82,216 84,204 94,196 L 174,140 Z'
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <Ground uid={uid} cy="596" />
      <path d={tee} fill={`url(#${uid}-fab)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      {/* drop-shoulder seams + sleeve hems */}
      <path d="M 174,140 L 162,252 M 386,140 L 398,252" stroke={t.seam} strokeWidth="1.5" opacity="0.8" />
      <path d="M 104,238 L 132,274 M 456,238 L 428,274" stroke={t.seam} strokeWidth="1.5" strokeDasharray="4,4" />
      {/* soft body folds */}
      <path d="M 398,270 C 392,330 392,400 396,470 M 162,270 C 168,330 168,400 164,470" stroke={t.gDeep} strokeWidth="9" opacity="0.35" fill="none" filter={`url(#${uid}-soft)`} />
      <path d="M 210,480 C 246,470 268,474 288,484" stroke={t.gDeep} strokeWidth="5" opacity="0.3" fill="none" filter={`url(#${uid}-soft)`} />
      {/* split hem with stitch + side vents */}
      <path d="M 162,534 H 398" stroke={t.seam} strokeWidth="1.5" strokeDasharray="4,4" />
      <path d="M 162,538 L 162,562 M 398,538 L 398,562" stroke={t.edge} strokeWidth="2.5" />
      {/* tight crew collar */}
      <path d="M 246,128 C 254,148 306,148 314,128 C 302,118 258,118 246,128 Z" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      <path d="M 251,130 C 260,144 300,144 309,130" fill="none" stroke={t.gDeep} strokeWidth="1" opacity="0.6" />
      {/* accent flag label at the side seam + unit patch at the hem */}
      <rect x="158" y="498" width="12" height="22" fill={accent} opacity="0.95" />
      <UnitPatch x={330} y={536} ink={t.dark ? t.gLight : t.gDeep} bg={t.rib} />
      <path d={tee} fill={`url(#${uid}-sheen)`} />
    </svg>
  )
}

function Hoodie({ g, accent }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  // Moguls cut: straight-drop slim arms with squared cuffs, wide angular
  // hood, square kangaroo pocket — boxier and quieter than a classic flare.
  const body = 'M 232,126 C 246,112 314,112 328,126 L 386,150 C 398,156 404,166 404,180 L 404,540 C 404,554 394,562 380,562 L 180,562 C 166,562 156,554 156,540 L 156,180 C 156,166 162,156 174,150 Z'
  const armL = 'M 174,150 C 146,166 134,190 130,220 L 122,424 C 121,438 129,446 142,444 L 164,441 C 175,439 181,432 181,420 L 181,212 Z'
  const armR = 'M 386,150 C 414,166 426,190 430,220 L 438,424 C 439,438 431,446 418,444 L 396,441 C 385,439 379,432 379,420 L 379,212 Z'
  const hood = 'M 232,126 L 226,64 C 224,46 240,34 258,34 L 302,34 C 320,34 336,46 334,64 L 328,126 C 310,144 250,144 232,126 Z'
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <Ground uid={uid} cy="600" />
      <path d={armL} fill={`url(#${uid}-arm)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={armR} fill={`url(#${uid}-arm)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      {/* squared ribbed arm cuffs */}
      <rect x="118" y="444" width="50" height="26" rx="5" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      <rect x="392" y="444" width="50" height="26" rx="5" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      {Array.from({ length: 4 }, (_, i) => <line key={`cl${i}`} x1={126 + i * 10} y1="448" x2={126 + i * 10} y2="466" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />)}
      {Array.from({ length: 4 }, (_, i) => <line key={`cr${i}`} x1={400 + i * 10} y1="448" x2={400 + i * 10} y2="466" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />)}
      <path d={body} fill={`url(#${uid}-fab)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      {/* shoulder seams + body folds */}
      <path d="M 174,150 L 181,212 M 386,150 L 379,212" stroke={t.seam} strokeWidth="1.5" opacity="0.8" />
      <path d="M 214,230 C 218,330 218,430 214,510 M 346,230 C 342,330 342,430 346,510" stroke={t.gDeep} strokeWidth="9" opacity="0.3" fill="none" filter={`url(#${uid}-soft)`} />
      {/* wide angular hood + dark interior */}
      <path d={hood} fill={`url(#${uid}-fab)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 244,122 L 240,72 C 239,58 250,50 262,50 L 298,50 C 310,50 321,58 320,72 L 316,122 C 300,136 260,136 244,122 Z" fill={t.gDeep} stroke={t.edge} strokeWidth="1.5" />
      {/* accent drawcords, squared aglets */}
      <path d="M 258,132 L 253,190 M 302,132 L 307,190" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="248" y="190" width="9" height="13" fill={mixHex(accent, '#000000', 0.3)} />
      <rect x="303" y="190" width="9" height="13" fill={mixHex(accent, '#000000', 0.3)} />
      {/* square kangaroo pocket */}
      <path d="M 206,428 L 354,428 L 354,532 L 206,532 Z" fill={mixHex(g, '#000000', 0.1)} stroke={t.seam} strokeWidth="1.5" />
      <path d="M 214,434 L 222,526 M 346,434 L 338,526" stroke={t.seam} strokeWidth="1.25" strokeDasharray="3,4" />
      {/* ribbed hem band */}
      <rect x="156" y="538" width="248" height="24" rx="7" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      {Array.from({ length: 19 }, (_, i) => <line key={i} x1={166 + i * 12.4} y1="542" x2={166 + i * 12.4} y2="558" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />)}
      <UnitPatch x={298} y={402} ink={t.dark ? t.gLight : t.gDeep} bg={t.rib} />
      <path d={body} fill={`url(#${uid}-sheen)`} />
    </svg>
  )
}

function Crewneck({ g, accent }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  // same Moguls cut as the hoodie, no hood: ribbed crew collar + V-insert
  const body = 'M 232,126 C 246,112 314,112 328,126 L 386,150 C 398,156 404,166 404,180 L 404,540 C 404,554 394,562 380,562 L 180,562 C 166,562 156,554 156,540 L 156,180 C 156,166 162,156 174,150 Z'
  const armL = 'M 174,150 C 146,166 134,190 130,220 L 122,424 C 121,438 129,446 142,444 L 164,441 C 175,439 181,432 181,420 L 181,212 Z'
  const armR = 'M 386,150 C 414,166 426,190 430,220 L 438,424 C 439,438 431,446 418,444 L 396,441 C 385,439 379,432 379,420 L 379,212 Z'
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <Ground uid={uid} cy="600" />
      <path d={armL} fill={`url(#${uid}-arm)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={armR} fill={`url(#${uid}-arm)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="118" y="444" width="50" height="26" rx="5" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      <rect x="392" y="444" width="50" height="26" rx="5" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      {Array.from({ length: 4 }, (_, i) => <line key={`cl${i}`} x1={126 + i * 10} y1="448" x2={126 + i * 10} y2="466" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />)}
      {Array.from({ length: 4 }, (_, i) => <line key={`cr${i}`} x1={400 + i * 10} y1="448" x2={400 + i * 10} y2="466" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />)}
      <path d={body} fill={`url(#${uid}-fab)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 174,150 L 181,212 M 386,150 L 379,212" stroke={t.seam} strokeWidth="1.5" opacity="0.8" />
      <path d="M 214,230 C 218,330 218,430 214,510 M 346,230 C 342,330 342,430 346,510" stroke={t.gDeep} strokeWidth="9" opacity="0.3" fill="none" filter={`url(#${uid}-soft)`} />
      {/* ribbed crew collar with accent tipping + V-insert */}
      <path d="M 232,126 C 246,146 314,146 328,126 C 314,114 246,114 232,126 Z" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      <path d="M 236,127 C 249,144 311,144 324,127" fill="none" stroke={accent} strokeWidth="2.5" opacity="0.9" />
      <path d="M 238,128 C 250,142 310,142 322,128" fill="none" stroke={t.gDeep} strokeWidth="1" opacity="0.6" />
      <path d="M 258,142 L 280,176 L 302,142" fill={t.rib} stroke={t.seam} strokeWidth="1.5" opacity="0.95" />
      <path d="M 280,176 L 280,148" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />
      {/* ribbed hem band */}
      <rect x="156" y="538" width="248" height="24" rx="7" fill={t.rib} stroke={t.edge} strokeWidth="2" />
      {Array.from({ length: 19 }, (_, i) => <line key={i} x1={166 + i * 12.4} y1="542" x2={166 + i * 12.4} y2="558" stroke={t.gDeep} strokeWidth="1" opacity="0.5" />)}
      <UnitPatch x={330} y={512} ink={t.dark ? t.gLight : t.gDeep} bg={t.rib} />
      <path d={body} fill={`url(#${uid}-sheen)`} />
    </svg>
  )
}

function Cap({ g, accent }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  // flat-top boxy crown + FLAT brim (not curved): the operator snapback
  const crown = 'M 148,336 C 148,240 176,178 280,178 C 384,178 412,240 412,336 L 412,348 L 148,348 Z'
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <ellipse cx="285" cy="452" rx="190" ry="15" fill="#000000" opacity="0.3" filter={`url(#${uid}-softer)`} />
      <path d={crown} fill={`url(#${uid}-fab)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      {/* six-panel seams + eyelets */}
      <path d="M 280,178 C 276,238 274,294 274,348 M 208,196 C 194,244 188,296 188,348 M 352,196 C 366,244 372,296 372,348" fill="none" stroke={t.seam} strokeWidth="1.5" strokeDasharray="5,4" />
      <circle cx="234" cy="232" r="4.5" fill={t.gDeep} stroke={t.seam} strokeWidth="1.5" />
      <circle cx="326" cy="232" r="4.5" fill={t.gDeep} stroke={t.seam} strokeWidth="1.5" />
      {/* flat visor: straight slab with accent underside edge */}
      <path d="M 128,348 L 432,348 L 444,368 C 446,374 442,380 434,380 L 126,380 C 118,380 114,374 116,368 Z" fill={`url(#${uid}-arm)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 116,372 C 220,380 340,380 444,372 L 444,376 C 446,382 440,386 434,386 L 126,386 C 120,386 114,382 116,376 Z" fill={mixHex(accent, '#000000', 0.25)} stroke={t.edge} strokeWidth="1.5" />
      {/* brim sticker — the operator detail */}
      <circle cx="376" cy="364" r="7" fill={accent} opacity="0.9" />
      <path d={crown} fill={`url(#${uid}-sheen)`} />
    </svg>
  )
}

function Mug({ g, accent }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  const body = 'M 178,192 L 178,488 C 178,516 214,530 280,530 C 346,530 382,516 382,488 L 382,192 Z'
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <clipPath id={`${uid}-clip`}><path d={body} /></clipPath>
      <ellipse cx="290" cy="576" rx="150" ry="14" fill="#000000" opacity="0.3" filter={`url(#${uid}-softer)`} />
      {/* squared industrial handle */}
      <path d="M 382,258 L 448,258 C 460,258 466,264 466,276 L 466,388 C 466,400 460,406 448,406 L 382,406" stroke={t.edge} strokeWidth="36" fill="none" strokeLinejoin="round" />
      <path d="M 382,258 L 448,258 C 460,258 466,264 466,276 L 466,388 C 466,400 460,406 448,406 L 382,406" stroke={`url(#${uid}-arm)`} strokeWidth="26" fill="none" strokeLinejoin="round" />
      <path d={body} fill={`url(#${uid}-cyl)`} stroke={t.edge} strokeWidth="2.5" />
      <ellipse cx="280" cy="192" rx="102" ry="22" fill={t.gDeep} stroke={t.edge} strokeWidth="2.5" />
      <ellipse cx="280" cy="195" rx="89" ry="16" fill={mixHex(g, '#000000', 0.6)} />
      <path d="M 178,214 C 178,228 382,228 382,214" fill="none" stroke={accent} strokeWidth="5" clipPath={`url(#${uid}-clip)`} />
      {/* roll-up-door slat ribbing on the lower third, embossed in the glaze */}
      <g clipPath={`url(#${uid}-clip)`}>
        {[432, 448, 464, 480].map(y => (
          <g key={y}>
            <line x1="178" y1={y} x2="382" y2={y} stroke={t.gDeep} strokeWidth="2.5" opacity="0.5" />
            <line x1="178" y1={y + 3} x2="382" y2={y + 3} stroke={t.gLight} strokeWidth="1" opacity="0.5" />
          </g>
        ))}
      </g>
      <path d="M 206,230 L 206,410" stroke="#ffffff" strokeOpacity={t.dark ? 0.2 : 0.45} strokeWidth="15" strokeLinecap="round" filter={`url(#${uid}-soft)`} />
      <path d={body} fill={`url(#${uid}-sheen)`} />
    </svg>
  )
}

function Notebook({ g, accent }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <ellipse cx="296" cy="512" rx="150" ry="13" fill="#000000" opacity="0.3" filter={`url(#${uid}-softer)`} />
      {/* page block */}
      <rect x="198" y="134" width="204" height="334" rx="6" fill={t.dark ? '#e9e6de' : '#dcd9d0'} stroke={t.edge} strokeWidth="1.5" />
      {/* spine */}
      <rect x="178" y="126" width="18" height="338" rx="7" fill={t.gDeep} stroke={t.edge} strokeWidth="2" />
      {/* hard cover with a debossed double ledger rule frame */}
      <rect x="190" y="126" width="206" height="338" rx="8" fill={`url(#${uid}-fab)`} stroke={t.edge} strokeWidth="2.5" />
      <rect x="204" y="142" width="178" height="306" fill="none" stroke={t.seam} strokeWidth="1.5" />
      <rect x="209" y="147" width="168" height="296" fill="none" stroke={t.seam} strokeWidth="0.75" />
      {/* ledger corner protectors */}
      {[[190, 126, 1, 1], [396, 126, -1, 1], [190, 464, 1, -1], [396, 464, -1, -1]].map(([x, y, sx, sy], i) => (
        <path key={i} d={`M ${x},${y + 26 * sy} L ${x},${y} L ${x + 26 * sx},${y}`} fill="none" stroke={t.dark ? t.gLight : t.gDeep} strokeWidth="6" opacity="0.85" />
      ))}
      {/* accent elastic + page-marker */}
      <rect x="352" y="122" width="8" height="346" fill={accent} opacity="0.95" />
      <path d="M 300,464 L 300,500 L 310,490 L 320,500 L 320,464 Z" fill={mixHex(accent, '#000000', 0.25)} />
      <rect x="190" y="126" width="206" height="338" rx="8" fill={`url(#${uid}-sheen)`} />
    </svg>
  )
}

function Bottle({ g, accent, url }) {
  const uid = useId().replace(/:/g, '')
  const t = tonesOf(g)
  // angular shoulder, slab-sided steel bottle with slat grip band
  const body = 'M 206,196 L 354,196 L 354,528 C 354,558 330,572 280,572 C 230,572 206,558 206,528 Z'
  return (
    <svg viewBox="0 0 560 640" className="w-full h-full">
      <GarmentDefs uid={uid} g={g} t={t} />
      <Ground uid={uid} cy="600" rx="120" />
      {/* squared cap with a single knurl reveal */}
      <rect x="252" y="52" width="56" height="34" rx="5" fill={t.gDeep} stroke={t.edge} strokeWidth="2" />
      <line x1="252" y1="78" x2="308" y2="78" stroke={mixHex(t.gDeep, '#ffffff', 0.2)} strokeWidth="2" />
      {/* hard angular shoulder */}
      <path d="M 252,86 L 308,86 L 354,178 L 354,196 L 206,196 L 206,178 Z" fill={`url(#${uid}-cyl)`} stroke={t.edge} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={body} fill={`url(#${uid}-cyl)`} stroke={t.edge} strokeWidth="2.5" />
      {/* roll-up-door slat grip band */}
      {[448, 464, 480, 496].map(y => (
        <g key={y}>
          <line x1="206" y1={y} x2="354" y2={y} stroke={t.gDeep} strokeWidth="2.5" opacity="0.55" />
          <line x1="206" y1={y + 3} x2="354" y2={y + 3} stroke={t.gLight} strokeWidth="1" opacity="0.5" />
        </g>
      ))}
      <path d="M 232,110 L 232,540" stroke="#ffffff" strokeOpacity={t.dark ? 0.25 : 0.5} strokeWidth="13" strokeLinecap="round" filter={`url(#${uid}-soft)`} />
      {/* accent shoulder band + micro url */}
      <rect x="206" y="206" width="148" height="7" fill={accent} />
      <text x="344" y="430" fill={t.seam} fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="2.5" transform="rotate(-90 344 430)">{(url || '').toUpperCase()}</text>
    </svg>
  )
}

const GARMENTS = { tshirt: Tee, hoodie: Hoodie, sweatshirt: Crewneck, cap: Cap, mug: Mug, notebook: Notebook, bottle: Bottle }

// ── Print art placed in the product's window ───────────────────────────
function PrintArt({ brand, print, ink, dark, tagline }) {
  const markSrc = brand.logoFor?.[dark ? 'dark' : 'light']
  const lockupSrc = brand.logos?.find(l => l.id.includes('stacked') && (dark ? l.luma > 0.5 : l.luma <= 0.5))?.src
  if (print === 'seal') {
    return <BrandSeal brand={brand} tone={ink} size={300} className="w-full h-full" />
  }
  if (print === 'tagline') {
    const words = (tagline || brand.tagline).split('·').map(s => s.trim()).filter(Boolean)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
        {words.map((w, i) => (
          <div key={i} className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: brand.fonts.heading, color: i === Math.floor(words.length / 2) ? ink : ink + 'b3', fontSize: 26, letterSpacing: '0.14em' }}>{w}</div>
        ))}
      </div>
    )
  }
  if (print === 'monogram') {
    const initials = brand.wordmark.split(/\s+/).map(w => w[0]).slice(0, 2).join('')
    return (
      <div className="flex items-center justify-center" style={{ border: `3px solid ${ink}`, padding: 4 }}>
        <div className="flex items-center justify-center" style={{ border: `1.5px solid ${ink}`, width: 66, height: 66 }}>
          <span style={{ fontFamily: brand.fonts.heading, fontWeight: 700, fontSize: 38, color: ink, letterSpacing: '0.02em' }}>{initials}</span>
        </div>
      </div>
    )
  }
  if (print === 'bignum') {
    const raw = (tagline || '').trim()
    const num = /^[0-9]{1,3}$/.test(raw) ? raw.padStart(3, '0') : '001'
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="leading-none font-black" style={{ fontFamily: brand.fonts.display, fontSize: 104, color: ink, letterSpacing: '0.02em' }}>{num}</div>
        <div className="font-bold whitespace-nowrap" style={{ fontFamily: brand.fonts.heading, fontSize: 17, color: ink, letterSpacing: '0.28em', marginTop: 6 }}>{brand.wordmark}</div>
      </div>
    )
  }
  if (print === 'stamp') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ transform: 'rotate(-9deg)', border: `3.5px solid ${ink}`, borderRadius: 10, padding: 4, opacity: 0.92 }}>
          <div className="flex flex-col items-center px-4 py-2" style={{ border: `1.5px solid ${ink}`, borderRadius: 6 }}>
            <div className="font-mono whitespace-nowrap" style={{ fontSize: 10, letterSpacing: '0.3em', color: ink }}>★ CERTIFIED ★</div>
            <div className="font-bold whitespace-nowrap leading-none" style={{ fontFamily: brand.fonts.heading, fontSize: 24, color: ink, letterSpacing: '0.08em', margin: '4px 0' }}>{brand.wordmark}</div>
            <div className="font-mono whitespace-nowrap" style={{ fontSize: 9, letterSpacing: '0.24em', color: ink }}>OPERATOR · № 001</div>
          </div>
        </div>
      </div>
    )
  }
  if (print === 'unitgrid') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <svg viewBox="0 0 100 76" style={{ width: '82%' }}>
          {Array.from({ length: 12 }, (_, i) => {
            const x = (i % 4) * 25 + 1.5
            const y = Math.floor(i / 4) * 25 + 1.5
            const yours = i === 6
            return (
              <g key={i}>
                <rect x={x} y={y} width="22" height="22" fill={yours ? ink : 'none'} stroke={ink} strokeWidth="2" />
                {!yours && <line x1={x + 4} y1={y + 15} x2={x + 18} y2={y + 15} stroke={ink} strokeWidth="1.25" opacity="0.6" />}
              </g>
            )
          })}
        </svg>
        <div className="font-mono whitespace-nowrap" style={{ fontSize: 10, letterSpacing: '0.26em', color: ink }}>YOUR UNIT HERE</div>
      </div>
    )
  }
  if (print === 'spine') {
    // SVG textLength keeps the vertical run fitted to any window height.
    return (
      <svg viewBox="0 0 44 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <text x="30" y="150" transform="rotate(90 30 150)" textAnchor="middle" textLength="286" lengthAdjust="spacingAndGlyphs"
          fontFamily={brand.fonts.heading} fontWeight="700" fontSize="24" letterSpacing="4" fill={ink}>
          {brand.wordmark} · {brand.masthead}
        </text>
      </svg>
    )
  }
  if (print === 'slats') {
    return (
      <div className="w-full h-full flex flex-col justify-center">
        <DoorSlats color={ink} count={6} className="w-full h-[70%]" />
      </div>
    )
  }
  if (print === 'lockup' && lockupSrc) {
    return <img src={lockupSrc} className="w-full h-full object-contain" />
  }
  if (print === 'mark' && markSrc) {
    return <img src={markSrc} className="w-full h-full object-contain" />
  }
  // brands without files fall back to the wordmark
  return (
    <div className="w-full h-full flex items-center justify-center text-center font-bold leading-tight" style={{ fontFamily: brand.fonts.heading, color: ink, fontSize: 30, letterSpacing: '0.1em' }}>
      {brand.wordmark}
    </div>
  )
}

// ── The Brand Kit template: product card in the ledger language ────────
export function TplSwag({ d, brand }) {
  const productId = SWAG_PRODUCTS.some(p => p.id === d.variant) ? d.variant : 'tshirt'
  const product = SWAG_PRODUCTS.find(p => p.id === productId)
  const g = d.garment || '#16161A'
  const dark = hexLuma(g) < 0.55
  const ink = dark ? '#F5F3EE' : '#10182B'
  const Garment = GARMENTS[productId]
  const win = WINDOWS[productId]
  const W = 540, H = 617 // 560×640 viewBox at stage scale
  const k = W / 560

  // Drag to orbit, double-click to reset. Studio sheen tracks the rotation.
  const [rot, setRot] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragFrom = useRef(null)

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag="BRAND KIT" />
      <LedgerRule color={d.textColor} className="mt-5" />
      <div className="relative flex-1 flex items-center justify-center min-h-0">
        <div className="absolute rounded-full border" style={{ width: 660, height: 660, borderColor: d.accentColor + '33' }} />
        <div className="absolute rounded-full border border-dashed" style={{ width: 570, height: 570, borderColor: d.textColor + '26' }} />
        <div
          className="relative"
          style={{ width: W, height: H, perspective: '1400px', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
          title="Drag to rotate. Double-click to reset."
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); dragFrom.current = { px: e.clientX, py: e.clientY, rx: rot.x, ry: rot.y }; setDragging(true) }}
          onPointerMove={e => {
            if (!dragFrom.current) return
            const dx = e.clientX - dragFrom.current.px
            const dy = e.clientY - dragFrom.current.py
            setRot({
              x: Math.max(-26, Math.min(26, dragFrom.current.rx - dy * 0.25)),
              y: Math.max(-44, Math.min(44, dragFrom.current.ry + dx * 0.3)),
            })
          }}
          onPointerUp={() => { dragFrom.current = null; setDragging(false) }}
          onPointerCancel={() => { dragFrom.current = null; setDragging(false) }}
          onDoubleClick={() => setRot({ x: 0, y: 0 })}
        >
          <div className="w-full h-full relative" style={{
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)${dragging ? ' scale(1.02)' : ''}`,
            transformStyle: 'preserve-3d',
            transition: dragging ? 'none' : 'transform 0.55s cubic-bezier(0.2, 0.9, 0.3, 1)',
            filter: `drop-shadow(${-rot.y * 0.55}px ${12 + Math.abs(rot.x) * 0.5}px 26px rgba(0,0,0,0.30))`,
          }}>
            <Garment g={g} accent={d.accentColor} url={d.url || brand.url} />
            <div className="absolute flex items-center justify-center" style={{ left: win.x * k, top: win.y * k, width: win.w * k, height: win.h * k }}>
              <PrintArt brand={brand} print={d.print || 'mark'} ink={ink} dark={dark} tagline={d.metric} />
            </div>
            {(rot.x !== 0 || rot.y !== 0) && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(${100 + rot.y * 1.6}deg, transparent 34%, rgba(255,255,255,${Math.min(0.16, 0.03 + Math.abs(rot.y) * 0.003)}) 50%, transparent 66%)` }} />
            )}
          </div>
        </div>
        <div className="absolute left-0 bottom-2 flex items-center gap-3">
          <div className="flex gap-2">
            {SWAG_COLORWAYS.map(c => (
              <span key={c.hex} className="inline-block w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex, boxShadow: c.hex === g ? `0 0 0 2px ${d.bgColor}, 0 0 0 3.5px ${d.accentColor}` : `inset 0 0 0 1px ${d.textColor}33` }} />
            ))}
          </div>
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '73' }}>
            {(SWAG_COLORWAYS.find(c => c.hex === g)?.name || 'CUSTOM').toUpperCase()}
          </span>
        </div>
        <div className="absolute right-0 bottom-2 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: d.textColor + '73' }}>
          PRINT · {(SWAG_PRINTS.find(p => p.id === (d.print || 'mark'))?.label || '').toUpperCase()}
        </div>
      </div>
      <LedgerRule color={d.textColor + '66'} />
      <div className="flex justify-between items-baseline pt-5">
        <div>
          <span className="text-[30px] font-bold tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{product.name}</span>
          <span className="font-mono text-[13px] tracking-[0.12em] ml-6" style={{ color: d.textColor + '8c' }}>{product.spec}</span>
        </div>
        <span className="font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
      </div>
    </div>
  )
}

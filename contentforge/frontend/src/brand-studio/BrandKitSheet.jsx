// The Brand Kit line sheet: every product in its signature colorway/print,
// on one scrolling page — the shareable entry point for reviewing the merch
// range. Lives at /brand-studio/kit behind the normal app auth.
import { Link } from 'react-router-dom'
import { BRANDS, buildDefaults } from './brands'
import { TplSwag } from './swag'
import { SWAG_PRODUCTS } from './swagData'
import './brand-studio.css'

// Signature presentation per product: colorway + print chosen to show the
// range (dark/light garments, all five print styles).
const SIGNATURE = {
  tshirt: { garment: '#16161A', print: 'mark' },
  hoodie: { garment: '#10182B', print: 'seal' },
  sweatshirt: { garment: '#F5F3EE', print: 'lockup' },
  cap: { garment: '#14337E', print: 'mark' },
  mug: { garment: '#F7F7F5', print: 'mark' },
  notebook: { garment: '#10182B', print: 'tagline' },
  bottle: { garment: '#E4E2DC', print: 'slats' },
}

const CELL = 470

export default function BrandKitSheet() {
  const brand = BRANDS[0]
  const defaults = buildDefaults(brand)
  const scale = CELL / 1080
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-neutral-200 bs-pattern-dots">
      <div className="max-w-[1520px] mx-auto px-10 py-10">
        <div className="flex items-end justify-between pb-5" style={{ borderBottom: '2px solid #10182B' }}>
          <div>
            <div className="text-[34px] font-bold tracking-[0.05em] leading-none text-neutral-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {brand.wordmark}<span className="text-blue-600">.</span>
            </div>
            <div className="font-mono text-[12px] tracking-[0.3em] text-neutral-500 mt-2 uppercase">Brand Kit · Line Sheet · {SWAG_PRODUCTS.length} products</div>
          </div>
          <Link to="/brand-studio" className="px-4 py-2 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 no-underline tracking-wider">
            OPEN IN STUDIO →
          </Link>
        </div>
        <div className="grid gap-8 mt-8 justify-center" style={{ gridTemplateColumns: `repeat(auto-fill, ${CELL}px)` }}>
          {SWAG_PRODUCTS.map(p => {
            const d = { ...defaults.swag, variant: p.id, ...(SIGNATURE[p.id] || {}) }
            return (
              <div key={p.id}>
                <div className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 mb-2 uppercase">
                  SM-{p.id.slice(0, 4).toUpperCase()} · {p.label}
                </div>
                <div className="shadow-xl" style={{ width: CELL, height: CELL, overflow: 'hidden' }}>
                  <div style={{ width: 1080, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
                    <TplSwag d={d} brand={brand} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="font-mono text-[11px] tracking-[0.2em] text-neutral-400 uppercase text-center py-10">
          {brand.tagline} · {brand.url}
        </div>
      </div>
    </div>
  )
}

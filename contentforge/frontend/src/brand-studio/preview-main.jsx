// Dev-only template gallery: renders every Brand Studio template with the
// active brand's seed content at true resolution, scaled into a grid — for
// visual QA without signing in. Served via preview.html (never linked in-app).
/* eslint-disable react-refresh/only-export-components -- entry module, mounts once */
import { createRoot } from 'react-dom/client'
import '../index.css'
import './brand-studio.css'
import { BRANDS, buildDefaults } from './brands'
import { TEMPLATES } from './registry'

import { TplSwag } from './swag'
import SocialCarouselCanvas from './SocialCarouselCanvas'
import { CAROUSEL_DESIGNS } from './socialCarouselDesigns'

const brand = BRANDS[0]
const defaults = buildDefaults(brand)
const CELL_W = 460

// ?partner renders the six partnership designs.
const PARTNER_QA = ['contract', 'venn', 'plaque', 'wire', 'split', 'memo']

function PartnerGallery() {
  return (
    <div style={{ background: '#e5e5e5', padding: 24, fontFamily: 'sans-serif', display: 'grid', gridTemplateColumns: `repeat(3, 470px)`, gap: 20 }}>
      {PARTNER_QA.map(v => {
        const d = { ...defaults.partnership, variant: v }
        const scale = 470 / 1080
        return (
          <div key={v}>
            <div style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', color: '#333' }}>{v}</div>
            <div style={{ width: 470, height: 470, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
              <div style={{ width: 1080, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
                {(() => { const T = TEMPLATES.find(t => t.id === 'partnership').component; return <T d={d} brand={brand} /> })()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ?chart renders the six operator chart forms.
const CHART_QA = ['bars', 'line', 'area', 'dots', 'rows', 'donut']

function ChartGallery() {
  return (
    <div style={{ background: '#e5e5e5', padding: 24, fontFamily: 'sans-serif', display: 'grid', gridTemplateColumns: `repeat(3, 470px)`, gap: 20 }}>
      {CHART_QA.map(v => {
        const d = { ...defaults.chart, variant: v }
        const scale = 470 / 1080
        return (
          <div key={v}>
            <div style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', color: '#333' }}>{v}</div>
            <div style={{ width: 470, height: 470, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
              <div style={{ width: 1080, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
                {(() => { const T = TEMPLATES.find(t => t.id === 'chart').component; return <T d={d} brand={brand} /> })()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ?announce renders the four announcement designs.
const ANNOUNCE_QA = ['notice', 'decree', 'poster', 'wire', 'gate', 'folio', 'marquee', 'split']

function AnnounceGallery() {
  return (
    <div style={{ background: '#e5e5e5', padding: 24, fontFamily: 'sans-serif', display: 'grid', gridTemplateColumns: `repeat(2, 620px)`, gap: 24 }}>
      {ANNOUNCE_QA.map(v => {
        const d = { ...defaults.announcement, variant: v }
        const scale = 620 / 1080
        return (
          <div key={v}>
            <div style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', color: '#333' }}>{v}</div>
            <div style={{ width: 620, height: 620, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
              <div style={{ width: 1080, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
                {(() => { const T = TEMPLATES.find(t => t.id === 'announcement').component; return <T d={d} brand={brand} /> })()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ?swag renders the Brand Kit product line across colorways and prints.
const SWAG_COMBOS = [
  { variant: 'tshirt', garment: '#16161A', print: 'mark' },
  { variant: 'hoodie', garment: '#10182B', print: 'seal' },
  { variant: 'sweatshirt', garment: '#F5F3EE', print: 'lockup' },
  { variant: 'cap', garment: '#14337E', print: 'mark' },
  { variant: 'mug', garment: '#F5F3EE', print: 'lockup' },
  { variant: 'notebook', garment: '#10182B', print: 'tagline' },
  { variant: 'bottle', garment: '#E4E2DC', print: 'mark' },
  { variant: 'tshirt', garment: '#F5F3EE', print: 'bignum' },
  { variant: 'hoodie', garment: '#16161A', print: 'stamp' },
  { variant: 'cap', garment: '#F7F7F5', print: 'monogram' },
  { variant: 'tshirt', garment: '#14337E', print: 'unitgrid' },
  { variant: 'bottle', garment: '#10182B', print: 'spine' },
  { variant: 'sweatshirt', garment: '#16161A', print: 'tagline' },
]

function SwagGallery() {
  return (
    <div style={{ background: '#e5e5e5', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${CELL_W}px)`, gap: 24 }}>
        {SWAG_COMBOS.map((combo, i) => {
          const d = { ...defaults.swag, ...combo }
          const scale = CELL_W / 1080
          return (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', color: '#333' }}>{combo.variant} · {combo.print}</div>
              <div style={{ width: 1080 * scale, height: 1080 * scale, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                <div style={{ width: 1080, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
                  <TplSwag d={d} brand={brand} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ?only=<templateId> renders a single template at full size.
function OnlyOne({ id }) {
  const t = TEMPLATES.find(x => x.id === id && x.component)
  if (!t) return <div style={{ padding: 40, fontFamily: 'monospace' }}>unknown template: {id}</div>
  const res = new URLSearchParams(window.location.search).get('res')
  const [w, h] = (res || t.res || '1080x1080').split('x').map(Number)
  const scale = 900 / Math.max(w, h)
  const T = t.component
  const qp = new URLSearchParams(window.location.search)
  const overrides = {}
  const nFake = parseInt(qp.get('fakephoto') || '0', 10)
  if (nFake > 0) {
    const fakePhotos = Array.from({ length: nFake }, () => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 460
      const x = c.getContext('2d')
      // simple person silhouettes on transparent ground
      const persons = nFake === 1 ? Math.min(3, (qp.get('author') || '').split(',').length) : 1
      for (let p = 0; p < persons; p++) {
        const cx = persons === 1 ? 200 : 80 + p * (240 / (persons - 1 || 1)) + 40
        x.fillStyle = ['#555', '#777', '#666'][p % 3]
        x.beginPath(); x.arc(cx, 160, 58, 0, 7); x.fill()
        x.beginPath(); x.ellipse(cx, 340, 95, 130, 0, 3.14, 0); x.fill()
      }
      return c.toDataURL('image/png')
    })
    overrides.uploadedImage = fakePhotos[0]
    if (nFake > 1) overrides.uploadedCoHosts = fakePhotos.slice(1)
  }
  for (const k of ['title', 'author', 'role', 'date', 'variant', 'metric']) if (qp.has(k)) overrides[k] = qp.get(k)
  return (
    <div style={{ background: '#e5e5e5', padding: 24 }}>
      <div style={{ width: w * scale, height: h * scale, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
        <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
          <T d={{ ...defaults[t.id], ...overrides }} brand={brand} canvas={{ w, h }} />
        </div>
      </div>
    </div>
  )
}

function Gallery() {
  return (
    <div style={{ background: '#e5e5e5', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${CELL_W}px)`, gap: 24 }}>
        {TEMPLATES.filter(t => t.component).map(t => {
          const res = new URLSearchParams(window.location.search).get('res')
  const [w, h] = (res || t.res || '1080x1080').split('x').map(Number)
          const scale = CELL_W / w
          const d = { ...defaults[t.id] }
          const Tpl = t.component
          return (
            <div key={t.id}>
              <div style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', color: '#333' }}>{t.name} · {w}×{h}</div>
              <div style={{ width: w * scale, height: h * scale, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
                  <Tpl d={d} brand={brand} canvas={{ w, h }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ?deck renders the carousel design SETS through the real pipeline renderer
// (SocialCarouselCanvas): one row per set, hook/point/cta pages wearing real
// deck content — visual QA for socialCarouselDesigns.js.
const DECK_SLIDE_QA = [
  { kind: 'hook', heading: "You don't need $1M to buy a $1M storage facility", body: 'The real math, page by page.' },
  { kind: 'point', heading: 'Underwrite the street', body: 'Your rents come from the three competitors within ten minutes — never from the seller’s pro forma.' },
  { kind: 'point', heading: 'The value-add levers', body: 'Push rents to market. Clear the delinquents. Add truck rental and fees. Every 10% of NOI is roughly $150K of value.' },
  { kind: 'cta', heading: 'Follow Storage Moguls', body: 'Real people. Real deals. Real results.' },
]
function DeckGallery() {
  return (
    <div style={{ background: '#e5e5e5', padding: 24, fontFamily: 'sans-serif' }}>
      {CAROUSEL_DESIGNS.map(dsg => (
        <div key={dsg.id} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px', color: '#333' }}>{dsg.label} ({dsg.id})</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {DECK_SLIDE_QA.map((s, i) => (
              <div key={i} style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.25)' }}>
                <SocialCarouselCanvas slide={s} index={i} count={DECK_SLIDE_QA.length} design={dsg.id} brandId={brand.id} scale={300 / 1080} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const onlyId = new URLSearchParams(window.location.search).get('only')
createRoot(document.getElementById('root')).render(
  onlyId ? <OnlyOne id={onlyId} /> : new URLSearchParams(window.location.search).has('deck') ? <DeckGallery /> : new URLSearchParams(window.location.search).has('partner') ? <PartnerGallery /> : new URLSearchParams(window.location.search).has('chart') ? <ChartGallery /> : new URLSearchParams(window.location.search).has('announce') ? <AnnounceGallery /> : new URLSearchParams(window.location.search).has('swag') ? <SwagGallery /> : <Gallery />
)

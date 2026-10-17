// Renders ONE pipeline carousel slide (Loki's hook/point/cta pages) through a
// Brand Studio design set, so carousels wear the house design system instead
// of the legacy server-side PDF renderer. Pure mapping: Loki keeps writing
// the words; the studio owns how they look. The syndication page renders one
// canvas per slide and binds them into a PDF with jspdf at approval.
import { brandById, buildDefaults } from './brands'
import { carouselDesignById, SLIDE_W, SLIDE_H } from './socialCarouselDesigns'

// The full-resolution slide. Wrap it yourself for scaling; pass canvasRef to
// capture it with html-to-image (use style: { transform: 'scale(1)' } to
// undo any preview scale, as the studio's own exports do).
export default function SocialCarouselCanvas({ slide, index = 0, count = 1, design, brandId = 'storagemoguls', scale = 1, canvasRef }) {
  const brand = brandById(brandId)
  const entry = carouselDesignById(design)
  const seeds = buildDefaults(brand)[entry.seed] || {}
  const kind = String(slide.kind || 'point').toLowerCase()
  const d = {
    ...seeds,
    variant: entry.kinds[kind] || entry.kinds.point,
    title: slide.heading || '',
    body: slide.body || '',
    // Deck position rides the family's small metadata slot.
    date: `${index + 1} / ${count}`,
    subtitle: seeds.subtitle || '',
    // Seed-only content must never bleed onto deck pages: storage101's
    // features list and announcement's metric-labelled button are template
    // furniture for their standalone use, not carousel content.
    features: '',
    metric: '',
  }
  const Tpl = entry.tpl
  return (
    <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, overflow: 'hidden' }}>
      <div ref={canvasRef} style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <Tpl d={d} brand={brand} canvas={{ w: SLIDE_W, h: SLIDE_H }} />
      </div>
    </div>
  )
}

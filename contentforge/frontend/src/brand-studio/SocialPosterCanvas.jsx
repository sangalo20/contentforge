// Renders pipeline poster content (Loki's stat/statement posters) through
// Brand Studio templates, so social posters wear the house design system
// instead of the legacy server-side renderer. Pure mapping: Loki keeps
// writing the words; the studio owns how they look.
import { brandById, buildDefaults } from './brands'
import { posterDesigns, POSTER_W, POSTER_H } from './socialPosterDesigns'

// Stamped once at module load — live renders show the current month, and the
// bytes stored at approval freeze it (react-compiler forbids Date in render).
const RENDER_DATE = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

// The full-resolution poster. Wrap it yourself for scaling; pass canvasRef to
// capture it with html-to-image (use style: { transform: 'scale(1)' } to
// undo any preview scale, as the studio's own exports do).
export default function SocialPosterCanvas({ poster, design, brandId = 'storagemoguls', scale = 1, canvasRef }) {
  const brand = brandById(brandId)
  const list = posterDesigns(poster.posterType)
  const entry = list.find(x => x.id === design) || list[0]
  const seeds = buildDefaults(brand)[entry.seed] || {}
  const d = {
    ...seeds,
    variant: entry.variant,
    date: RENDER_DATE,
    title: poster.headline || '',
    body: poster.subline || '',
    ...(String(poster.posterType).toLowerCase() === 'stat' ? { metric: poster.stat || '' } : {}),
  }
  const Tpl = entry.tpl
  return (
    <div style={{ width: POSTER_W * scale, height: POSTER_H * scale, overflow: 'hidden' }}>
      <div ref={canvasRef} style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <Tpl d={d} brand={brand} canvas={{ w: POSTER_W, h: POSTER_H }} />
      </div>
    </div>
  )
}

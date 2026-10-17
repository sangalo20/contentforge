// Design registry for pipeline social carousels: which Brand Studio template
// family (and per-slide-kind variants) a Loki-written carousel can wear. Each
// design set keeps every page in ONE family so the deck reads cohesively —
// hook and CTA pages get the family's boldest variant, point pages its
// workhorse. Data only — the rendering component is SocialCarouselCanvas.jsx.
import { TplStorage101, TplAnnouncement } from './templates'

// Slide canvas matches the legacy renderer (and the posters): Feed 4:5.
export const SLIDE_W = 1080
export const SLIDE_H = 1350

// kinds: slide kind (hook | point | cta) -> template variant within the family.
// Screenshot-verified (preview.html?deck): only families that render
// title+body cleanly with no media slot survive — hook/CTA pages take the
// family's boldest variant as bookends, points its cleanest workhorse.
export const CAROUSEL_DESIGNS = [
  {
    id: 'storage101:primer', label: 'Primer', tpl: TplStorage101, seed: 'storage101',
    kinds: { hook: 'chalk', point: 'primer', cta: 'chalk' },
  },
  {
    id: 'storage101:blueprint', label: 'Blueprint', tpl: TplStorage101, seed: 'storage101',
    // syllabus points looked right in theory but swallow the body text —
    // 'card' keeps it (screenshot-verified).
    kinds: { hook: 'blueprint', point: 'card', cta: 'blueprint' },
  },
  {
    id: 'storage101:notes', label: 'Notes', tpl: TplStorage101, seed: 'storage101',
    kinds: { hook: 'folder', point: 'notes', cta: 'folder' },
  },
  {
    id: 'announcement:poster', label: 'Poster', tpl: TplAnnouncement, seed: 'announcement',
    kinds: { hook: 'poster', point: 'notice', cta: 'poster' },
  },
  {
    id: 'announcement:marquee', label: 'Marquee', tpl: TplAnnouncement, seed: 'announcement',
    kinds: { hook: 'marquee', point: 'decree', cta: 'marquee' },
  },
]

export const carouselDesignById = (id) => CAROUSEL_DESIGNS.find((d) => d.id === id) || CAROUSEL_DESIGNS[0]

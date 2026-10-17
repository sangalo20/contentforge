// Design registry for pipeline social posters: which Brand Studio templates
// (and variants) a Loki-written poster can wear. Data only — the rendering
// component lives in SocialPosterCanvas.jsx.
import { TplBigNumber, TplQuote, TplEditorial } from './templates'

// Poster canvas matches the legacy renderer (and the Feed 4:5 preset).
export const POSTER_W = 1080
export const POSTER_H = 1350

// Stat posters ({stat, headline, subline}) read as Big Number pieces.
const STAT_DESIGNS = [
  ['total', 'Total'], ['outline', 'Outline'], ['counter', 'Counter'],
  ['sum', 'Sum'], ['roundel', 'Roundel'], ['delta', 'Delta'],
].map(([v, label]) => ({ id: `bignumber:${v}`, label, tpl: TplBigNumber, seed: 'bignumber', variant: v }))

// Statement posters ({headline, subline}) read as editorial/quote pieces.
const STATEMENT_DESIGNS = [
  { id: 'editorial:type', label: 'Type', tpl: TplEditorial, seed: 'editorial', variant: 'type' },
  { id: 'editorial:letter', label: 'Letter', tpl: TplEditorial, seed: 'editorial', variant: 'letter' },
  { id: 'editorial:grid', label: 'Grid', tpl: TplEditorial, seed: 'editorial', variant: 'grid' },
  { id: 'editorial:dossier', label: 'Dossier', tpl: TplEditorial, seed: 'editorial', variant: 'dossier' },
  { id: 'quote:marquee', label: 'Marquee', tpl: TplQuote, seed: 'quote', variant: 'marquee' },
  { id: 'quote:highlight', label: 'Highlight', tpl: TplQuote, seed: 'quote', variant: 'highlight' },
]

export function posterDesigns(posterType) {
  return String(posterType).toLowerCase() === 'stat' ? STAT_DESIGNS : STATEMENT_DESIGNS
}

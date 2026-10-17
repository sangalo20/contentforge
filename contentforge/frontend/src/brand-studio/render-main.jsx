// Dev-only headless renderer served via render.html:
//   /render.html?template=liveevent&brand=storagemoguls&variant=bill&title=...
// Renders exactly one template at its true canvas size (no scaling) so a
// headless browser screenshot of the viewport is the export. Every prefill
// field the studio accepts is honored; "\n" in a value becomes a newline.
/* eslint-disable react-refresh/only-export-components -- entry module, mounts once */
import { createRoot } from 'react-dom/client'
import '../index.css'
import './brand-studio.css'
import { BRANDS, buildDefaults } from './brands'
import { TEMPLATES } from './registry'

const qp = new URLSearchParams(window.location.search)
const brand = BRANDS.find(b => b.id === qp.get('brand')) || BRANDS[0]
const defaults = buildDefaults(brand)
const t = TEMPLATES.find(x => x.id === qp.get('template') && x.component)

const FIELD_KEYS = ['title', 'subtitle', 'body', 'metric', 'author', 'role', 'date', 'url', 'features', 'variant',
  'partnerName', 'ctaUrl', 'dataJson', 'bgColor', 'accentColor', 'textColor', 'logoSrc', 'disclaimer']

function Render() {
  if (!t) return <div style={{ padding: 40, fontFamily: 'monospace' }}>unknown template: {qp.get('template')}</div>
  const [w, h] = (qp.get('res') || t.res || '1080x1080').split('x').map(Number)
  const overrides = {}
  for (const k of FIELD_KEYS) if (qp.has(k) && qp.get(k) !== '') overrides[k] = qp.get(k).replace(/\\n/g, '\n')
  const T = t.component
  return (
    <div id="canvas" style={{ width: w, height: h, position: 'relative', overflow: 'hidden' }}>
      <T d={{ ...defaults[t.id], ...overrides }} brand={brand} canvas={{ w, h }} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Render />)

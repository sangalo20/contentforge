// Dev-only logo lab: candidate refinements of the Storage Moguls identity,
// each shown on light and dark grounds. Open /logo-lab.html directly.
/* eslint-disable react-refresh/only-export-components -- entry module, mounts once */
import { createRoot } from 'react-dom/client'
import '../index.css'
import './brand-studio.css'

const NAVY = '#10182B'
const CREAM = '#F5F3EE'
const BLUE = '#2E7DF6'
const GOLD = '#E8B23C'

const HEAD = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

// ── Refined facility mark: three solid volumes, roll-up doors knocked out
// as slat gaps. Bold silhouette that survives small sizes. ──
function LedgerMark({ ink, accent, size = 96 }) {
  const s = size / 96
  return (
    <svg width={170 * s} height={96 * s} viewBox="0 0 170 96">
      {/* solid massing */}
      <rect x="57" y="6" width="56" height="80" fill={ink} />
      <rect x="10" y="30" width="43" height="56" fill={ink} />
      <rect x="117" y="30" width="43" height="56" fill={ink} />
      {/* parapet reveals (thin gaps under the cap lines) */}
      <rect x="57" y="14" width="56" height="3" fill="var(--lab-bg, transparent)" />
      {/* center door knockout: slat gaps */}
      <g fill="var(--lab-bg, #fff)">
        {[30, 41, 52, 63, 74].map(y => <rect key={y} x="66" y={y} width="38" height="5" />)}
        {[46, 56, 66, 76].map(y => <rect key={`l${y}`} x="18" y={y} width="27" height="4.5" />)}
        {[46, 56, 66, 76].map(y => <rect key={`r${y}`} x="125" y={y} width="27" height="4.5" />)}
      </g>
      {/* ground line + accent keystone */}
      <rect x="0" y="90" width="170" height="6" fill={ink} />
      <rect x="80" y="0" width="10" height="4" fill={accent} />
    </svg>
  )
}

// Shared typography block
function WordBlock({ ink, accent, size = 38, tagSize = 10, align = 'flex-start', accentWord = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: '0.04em', color: ink, whiteSpace: 'nowrap' }}>
        STORAGE{accentWord ? <span style={{ color: accent }}> MOGULS</span> : ' MOGULS'}
      </div>
      <div style={{ fontFamily: MONO, fontSize: tagSize, letterSpacing: '0.32em', color: ink, opacity: 0.75, marginTop: 8, whiteSpace: 'nowrap' }}>
        REAL PEOPLE <span style={{ color: accent, opacity: 1 }}>·</span> REAL DEALS <span style={{ color: accent, opacity: 1 }}>·</span> REAL RESULTS
      </div>
    </div>
  )
}

/* A. Flat salvage: the kit's own line-art icon + retypeset words */
function CandidateA({ ink, accent, dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
      <img src={`/logos/storagemoguls/icon-${dark ? 'white' : 'black'}.svg`} style={{ height: 72 }} />
      <div style={{ width: 1.5, alignSelf: 'stretch', backgroundColor: ink, opacity: 0.35 }} />
      <WordBlock ink={ink} accent={accent} size={34} tagSize={9} />
    </div>
  )
}

/* B. Ledger mark: redrawn flat geometric facility + words, horizontal */
function CandidateB({ ink, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <LedgerMark ink={ink} accent={accent} size={92} />
      <WordBlock ink={ink} accent={accent} />
    </div>
  )
}

/* B2. Ledger mark, stacked with rules — masthead style */
function CandidateB2({ ink, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
        <div style={{ flex: 1, height: 2, backgroundColor: ink }} />
        <LedgerMark ink={ink} accent={accent} size={74} />
        <div style={{ flex: 1, height: 2, backgroundColor: ink }} />
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 42, lineHeight: 1, letterSpacing: '0.1em', color: ink, marginTop: 12, whiteSpace: 'nowrap' }}>
        STORAGE MOGULS
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: ink, opacity: 0.75, marginTop: 10, whiteSpace: 'nowrap' }}>
        REAL PEOPLE · REAL DEALS · REAL RESULTS
      </div>
    </div>
  )
}

/* C. Monogram: SM in a double-rule plate + words */
function CandidateC({ ink, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ border: `3px solid ${ink}`, padding: 4 }}>
        <div style={{ border: `1.5px solid ${ink}`, width: 78, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 46, color: ink, letterSpacing: '0.02em' }}>
            S<span style={{ color: accent }}>M</span>
          </span>
        </div>
      </div>
      <WordBlock ink={ink} accent={accent} />
    </div>
  )
}

/* D. Type-first: wordmark with slat motif under STORAGE */
function CandidateD({ ink, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, lineHeight: 0.95, letterSpacing: '0.05em', color: ink }}>STORAGE</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 5 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, lineHeight: 0.95, letterSpacing: '0.05em', color: accent }}>MOGULS</div>
        <svg width="96" height="34" viewBox="0 0 96 34">
          {[3, 11, 19, 27].map(y => <line key={y} x1="0" y1={y} x2="96" y2={y} stroke={ink} strokeWidth="3" />)}
        </svg>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: ink, opacity: 0.75, marginTop: 12, whiteSpace: 'nowrap' }}>
        REAL PEOPLE · REAL DEALS · REAL RESULTS
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 34 }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.2em', color: '#555', margin: '0 0 8px 2px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 600px)', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Cell({ bg, children }) {
  return (
    <div style={{ backgroundColor: bg, '--lab-bg': bg, padding: '40px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 190, boxShadow: '0 1px 6px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function Lab() {
  return (
    <div style={{ background: '#dddad4', padding: 28, minHeight: '100vh' }}>
      <Row label="A · Flat salvage — the kit's own line icon, retypeset">
        <Cell bg={CREAM}><CandidateA ink={NAVY} accent={BLUE} dark={false} /></Cell>
        <Cell bg={NAVY}><CandidateA ink={CREAM} accent={BLUE} dark /></Cell>
        <Cell bg={NAVY}><CandidateA ink={GOLD} accent={GOLD} dark /></Cell>
      </Row>
      <Row label="B · Ledger mark — redrawn flat facility, horizontal lockup">
        <Cell bg={CREAM}><CandidateB ink={NAVY} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateB ink={CREAM} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateB ink={GOLD} accent={GOLD} /></Cell>
      </Row>
      <Row label="B2 · Ledger mark — stacked masthead with rules">
        <Cell bg={CREAM}><CandidateB2 ink={NAVY} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateB2 ink={CREAM} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateB2 ink={GOLD} accent={GOLD} /></Cell>
      </Row>
      <Row label="C · Monogram plate — SM in double rules">
        <Cell bg={CREAM}><CandidateC ink={NAVY} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateC ink={CREAM} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateC ink={GOLD} accent={GOLD} /></Cell>
      </Row>
      <Row label="D · Type-first — slat motif in the wordmark">
        <Cell bg={CREAM}><CandidateD ink={NAVY} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateD ink={CREAM} accent={BLUE} /></Cell>
        <Cell bg={NAVY}><CandidateD ink={GOLD} accent={GOLD} /></Cell>
      </Row>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Lab />)

// Brand Studio templates. Each template is a pure function of
// { d (inputs), brand } — colors come from d.bgColor/accentColor/textColor,
// type comes from the brand's font stacks, and every wordmark/URL falls back
// to the brand record, never to a hardcoded string.
import { LogoImg, BlendPortrait, PixelMosaic, BrandSeal, TickerRail, DoorSlats, Masthead, LedgerRule, QrCode } from './atoms'
import { mixHex, hash01, hexLuma } from './helpers'

export function TplQuote({ d, brand }) {
  const v = ['mark', 'marquee', 'press', 'highlight', 'plaque', 'testimony', 'social', 'byline'].includes(d.variant) ? d.variant : 'mark'
  const ink = d.textColor
  const initials = (d.author || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('')
  const big = (d.title || '').length > 100

  if (v === 'marquee') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag="ON THE RECORD" />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <h1 className={`font-black uppercase tracking-tight leading-[1.04] ${big ? 'text-[56px]' : 'text-[72px]'} max-w-[96%]`} style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <div className="mt-8 w-24 h-2" style={{ backgroundColor: d.accentColor }} />
          <div className="mt-8 flex items-baseline gap-4">
            <span className="text-[26px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</span>
            {d.role && <span className="font-mono text-[14px] tracking-[0.15em]" style={{ color: ink + '8c' }}>{d.role}</span>}
          </div>
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.signoff.toUpperCase()}</span>
          <span style={{ color: d.accentColor }}>{brand.url.toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'press') {
    const orn = <div className="flex items-center justify-center gap-3" style={{ color: d.accentColor }}>{[0, 1, 2].map(i => <span key={i} className={i === 1 ? 'text-[16px]' : 'text-[10px]'}>&#9670;</span>)}</div>
    return (
      <div className="w-full h-full relative overflow-hidden p-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center px-16" style={{ border: `1.5px solid ${ink}59` }}>
          <div className="font-mono text-[12px] tracking-[0.45em] uppercase" style={{ color: ink + '8c' }}>{brand.wordmark}</div>
          <div className="mt-10">{orn}</div>
          <h1 className={`mt-10 italic ${big ? 'text-[40px]' : 'text-[50px]'} leading-[1.35] max-w-[82%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
          <div className="mt-10">{orn}</div>
          <div className="mt-10 text-[20px] font-bold tracking-[0.14em] uppercase" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
          {d.role && <div className="font-mono text-[12px] tracking-[0.2em] mt-2 uppercase" style={{ color: ink + '8c' }}>{d.role}</div>}
        </div>
      </div>
    )
  }

  if (v === 'highlight') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-baseline font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: ink + '8c' }}>
          <span>WORTH KEEPING</span>
          <span>{brand.wordmark}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className={`${big ? 'text-[44px]' : 'text-[54px]'} leading-[1.5] max-w-[94%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>
            <span style={{ backgroundColor: d.accentColor + '4d', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', padding: '0.06em 0.18em' }}>{d.title}</span>
          </h1>
          <div className="mt-12 pl-7" style={{ borderLeft: `5px solid ${d.accentColor}` }}>
            <div className="text-[26px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
            {d.role && <div className="font-mono text-[13px] mt-1 tracking-[0.15em]" style={{ color: ink + '8c' }}>{d.role}</div>}
          </div>
        </div>
        <div className="flex justify-end"><LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" /></div>
      </div>
    )
  }

  if (v === 'plaque') {
    const plate = mixHex(d.bgColor, d.accentColor, 0.14)
    const screw = <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: ink + '59', boxShadow: `inset 1px 1px 1px ${d.bgColor}` }} />
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '0a'} count={20} className="absolute inset-0 w-full h-full" />
        <div className="relative w-full max-w-[880px] px-16 py-14 text-center" style={{ backgroundColor: plate, border: `2px solid ${ink}66`, boxShadow: `0 22px 44px ${ink}33` }}>
          <div className="absolute inset-[10px] pointer-events-none" style={{ border: `1px solid ${ink}40` }} />
          <div className="absolute top-4 left-4">{screw}</div>
          <div className="absolute top-4 right-4">{screw}</div>
          <div className="absolute bottom-4 left-4">{screw}</div>
          <div className="absolute bottom-4 right-4">{screw}</div>
          <BrandSeal brand={brand} tone={d.accentColor} size={84} className="mx-auto" />
          <h1 className={`mt-8 ${big ? 'text-[32px]' : 'text-[38px]'} leading-[1.4] tracking-[0.02em]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>&ldquo;{d.title}&rdquo;</h1>
          <div className="mt-9 font-mono text-[14px] tracking-[0.25em] uppercase" style={{ color: ink + 'a6' }}>&mdash; {d.author}{d.role ? `, ${d.role}` : ''}</div>
        </div>
      </div>
    )
  }

  if (v === 'testimony') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>ON THE RECORD &middot; EXHIBIT A</span>
            <span>{brand.wordmark.toUpperCase()}</span>
          </div>
          <div className="relative flex-1 flex items-center">
            <div className="pl-8" style={{ borderLeft: `5px solid ${d.accentColor}` }}>
              <h1 className={`${big ? 'text-[36px]' : 'text-[44px]'} leading-[1.35] max-w-[94%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>&ldquo;{d.title}&rdquo;</h1>
            </div>
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[320px]">
              <div className="text-[34px] italic leading-none mb-2" style={{ fontFamily: brand.fonts.serif, color: ink + 'd9' }}>{d.author}</div>
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.22em] mt-2 uppercase" style={{ color: ink + '80' }}>{d.author}{d.role ? ` · ${d.role}` : ''}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>WITNESSED &middot; {brand.url.toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'social') {
    const handle = '@' + brand.wordmark.replace(/\s+/g, '').toLowerCase()
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <PixelMosaic color={d.accentColor + '1a'} cols={14} rows={9} className="absolute right-0 top-0 w-[380px] h-[250px]" />
        <div className="relative w-full max-w-[860px] px-12 py-11" style={{ backgroundColor: ink + '0d', border: `1.5px solid ${ink}33`, boxShadow: `12px 12px 0 ${d.accentColor}33` }}>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-[24px] shrink-0" style={{ backgroundColor: d.accentColor, color: '#FFFFFF', fontFamily: brand.fonts.heading }}>{initials}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold truncate" style={{ fontFamily: brand.fonts.heading }}>{d.author}</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>&#10003;</span>
              </div>
              <div className="font-mono text-[13px] mt-0.5" style={{ color: ink + '8c' }}>{d.role || handle}</div>
            </div>
          </div>
          <p className={`mt-8 ${big ? 'text-[30px]' : 'text-[36px]'} leading-[1.4]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</p>
          <div className="mt-8 pt-5 flex justify-between items-center font-mono text-[12px] tracking-[0.2em] uppercase" style={{ borderTop: `1px solid ${ink}33`, color: ink + '8c' }}>
            <span>{handle}</span>
            <span style={{ color: d.accentColor }}>{brand.tagline}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'byline') {
    const names = (d.author || '').split(/\s+/)
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-baseline font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: ink + '8c' }}>
          <span>IN THEIR WORDS</span>
          <span>{brand.wordmark}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          {names.map((w, i) => (
            <div key={i} className="font-black leading-[0.95] tracking-tight text-[96px]" style={{ fontFamily: brand.fonts.display, color: i === names.length - 1 ? d.accentColor : ink }}>{w.toUpperCase()}</div>
          ))}
          {d.role && <div className="font-mono text-[13px] tracking-[0.2em] mt-4" style={{ color: ink + '99' }}>{d.role}</div>}
          <p className={`mt-10 pl-7 ${big ? 'text-[28px]' : 'text-[34px]'} leading-[1.4] max-w-[88%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500, borderLeft: `5px solid ${d.accentColor}` }}>&ldquo;{d.title}&rdquo;</p>
        </div>
        <div className="flex justify-end"><LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" /></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <div className="absolute top-0 left-8 text-[600px] leading-none select-none" style={{ color: d.accentColor + '12', fontFamily: brand.fonts.serif }}>&ldquo;</div>
      <PixelMosaic color={d.accentColor + '1a'} cols={14} rows={9} className="absolute right-0 top-0 w-[420px] h-[280px]" />
      <div className="relative z-10 p-20 flex flex-col h-full justify-center">
        <h1 className="font-semibold text-[62px] leading-[1.25] tracking-tight mb-16 max-w-[90%]" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>&ldquo;{d.title}&rdquo;</h1>
        <div className="pl-8" style={{ borderLeft: `6px solid ${d.accentColor}` }}>
          <div className="text-[36px] font-bold" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.author}</div>
          <div className="font-mono text-[22px] mt-1" style={{ color: d.textColor + '80' }}>{d.role}</div>
        </div>
      </div>
      <div className="absolute bottom-12 right-12 z-20"><LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} /></div>
    </div>
  )
}

// Blog cover: eight editorial covers in the house style. The Media tab's
// background image is optional — every design has a texture fallback so a
// cover ships fine without art.
export function TplBlogCover({ d, brand }) {
  const v = ['front', 'band', 'panel', 'frame', 'ticker', 'folio', 'slats', 'seal'].includes(d.variant) ? d.variant : 'front'
  const ink = d.textColor
  const art = d.uploadedBackground || d.generatedBackground
  const artOr = (cls) => (
    <div className={`overflow-hidden relative ${cls}`} style={{ backgroundColor: ink + '0d', border: `1.5px solid ${ink}33` }}>
      {art
        ? <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <DoorSlats color={d.accentColor + '30'} count={12} className="absolute inset-0 w-full h-full" />}
    </div>
  )
  const byline = (
    <div className="flex items-center gap-4">
      <span className="text-[20px] font-semibold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</span>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.accentColor }} />
      <span className="font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '99' }}>{d.date}</span>
    </div>
  )
  const words = (d.title || '').split(/\s+/)

  if (v === 'band') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative flex-1 min-h-0">
          {art
            ? <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${mixHex(d.bgColor, d.accentColor, 0.35)}, ${d.bgColor})` }}>
                <DoorSlats color={d.accentColor + '30'} count={16} className="absolute inset-0 w-full h-full" />
              </div>}
          <div className="absolute top-0 left-0 px-6 py-3" style={{ backgroundColor: d.accentColor }}>
            <span className="font-mono text-[13px] font-bold tracking-[0.25em] uppercase" style={{ color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</span>
          </div>
        </div>
        <div className="px-16 pt-10 pb-12">
          <h1 className="text-[58px] leading-[1.06] tracking-tight max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <LedgerRule color={ink + '66'} className="mt-8" />
          <div className="flex justify-between items-center pt-5">
            {byline}
            <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'panel') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-[46%] shrink-0 flex flex-col px-14 py-12 min-w-0">
          <Masthead brand={brand} ink={ink} accent={d.accentColor} />
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="mt-6 text-[62px] leading-[1.04] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          </div>
          <LedgerRule color={ink + '66'} />
          <div className="pt-5">{byline}</div>
        </div>
        <div className="relative flex-1">
          {art
            ? <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <DoorSlats color={d.accentColor + '30'} count={18} className="absolute inset-0 w-full h-full" />}
          <div className="absolute inset-y-0 left-0 w-2" style={{ backgroundColor: d.accentColor }} />
        </div>
      </div>
    )
  }

  if (v === 'frame') {
    return (
      <div className="w-full h-full relative overflow-hidden p-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col items-center text-center px-16 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative font-mono text-[13px] tracking-[0.4em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
          <div className="relative flex-1 min-h-0 w-full flex flex-col items-center justify-center">
            {artOr('w-[46%] aspect-[16/9]')}
            <h1 className="mt-9 text-[54px] leading-[1.1] tracking-tight max-w-[85%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          </div>
          <LedgerRule color={ink + '66'} className="relative w-[38%]" />
          <div className="relative pt-5 flex justify-center">{byline}</div>
        </div>
      </div>
    )
  }

  if (v === 'ticker') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {art && <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.14]" />}
        <TickerRail brand={brand} color={ink + '59'} className="py-4" />
        <div style={{ height: 1.5, backgroundColor: ink + '40' }} />
        <div className="relative flex-1 flex flex-col justify-center px-20">
          <div className="font-mono text-[14px] tracking-[0.4em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="mt-7 font-black uppercase tracking-tight leading-[0.98] text-[96px]" style={{ fontFamily: brand.fonts.heading }}>
            {words.map((w, i) => (
              <span key={i} style={i === words.length - 1 ? { color: d.accentColor } : undefined}>{w} </span>
            ))}
          </h1>
          <div className="mt-9">{byline}</div>
        </div>
        <div style={{ height: 1.5, backgroundColor: ink + '40' }} />
        <TickerRail brand={brand} color={ink + '59'} className="py-4" />
      </div>
    )
  }

  if (v === 'folio') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-[120px] shrink-0 relative" style={{ borderRight: `1.5px solid ${ink}40` }}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-mono text-[15px] tracking-[0.45em] uppercase" style={{ color: ink + '99' }}>
            {d.date} &middot; {brand.wordmark}
          </div>
        </div>
        <div className="flex-1 flex flex-col px-16 py-12 min-w-0">
          <div className="flex items-start justify-between gap-10">
            <div className="pt-4">
              <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
              <div className="mt-4 font-black text-[110px] leading-none" style={{ fontFamily: brand.fonts.display, color: ink + '26' }}>FOLIO</div>
            </div>
            {artOr('w-[38%] aspect-square shrink-0')}
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <h1 className="text-[64px] leading-[1.05] tracking-tight max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <LedgerRule color={ink + '66'} className="mt-8" />
            <div className="flex justify-between items-center pt-5">
              {byline}
              <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'slats') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '12'} count={20} className="absolute inset-0 w-full h-full" />
        <div className="relative flex items-center justify-between">
          <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-8" />
          <span className="font-mono text-[12px] tracking-[0.35em]" style={{ color: ink + '8c' }}>{d.date}</span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="self-start px-5 py-2.5 font-mono text-[13px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</div>
          <h1 className="mt-8 font-black uppercase leading-[0.95] tracking-tight text-[104px] max-w-[95%]" style={{ fontFamily: brand.fonts.display }}>
            {words.map((w, i) => (
              <span key={i} style={i >= words.length - 2 ? { color: d.accentColor } : undefined}>{w} </span>
            ))}
          </h1>
        </div>
        <div className="relative">
          <LedgerRule color={ink + '66'} />
          <div className="pt-5">{byline}</div>
        </div>
      </div>
    )
  }

  if (v === 'seal') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 opacity-[0.16]">
          <BrandSeal brand={brand} tone={d.accentColor} size={640} />
        </div>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.date} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="relative flex-1 flex flex-col justify-center max-w-[68%]">
          <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="mt-6 text-[68px] leading-[1.06] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        </div>
        <div className="relative">
          <LedgerRule color={ink + '66'} />
          <div className="pt-5">{byline}</div>
        </div>
      </div>
    )
  }

  // front — the newspaper front page (default)
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
      <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
      <LedgerRule color={ink} className="mt-5" />
      <div className="flex-1 min-h-0 flex gap-12 items-center pt-4">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '80' }}>{d.date}</div>
          <h1 className="mt-5 text-[74px] leading-[1.04] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-9">{byline}</div>
        </div>
        <div className="w-[36%] shrink-0 self-stretch my-4 flex flex-col">
          {artOr('flex-1 min-h-0')}
          <div className="font-mono text-[11px] tracking-[0.2em] mt-3 uppercase" style={{ color: ink + '73' }}>Figure 01 &middot; {d.subtitle}</div>
        </div>
      </div>
      <LedgerRule color={ink + '66'} />
      <div className="flex justify-between items-center pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
        <span>{brand.signoff.toUpperCase()}</span>
        <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-6" />
        <span>{(d.url || brand.url).toUpperCase()}</span>
      </div>
    </div>
  )
}

export function TplEditorial({ d, brand }) {
  const v = ['field', 'cover', 'type', 'quote', 'plate', 'dossier', 'grid', 'letter'].includes(d.variant) ? d.variant : 'field'
  const ink = d.textColor
  const art = d.uploadedImage || d.generatedImage
  const artOr = (cls) => (
    <div className={`overflow-hidden relative ${cls}`} style={{ backgroundColor: ink + '0d', border: `1.5px solid ${ink}33` }}>
      {art
        ? <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <DoorSlats color={d.accentColor + '30'} count={12} className="absolute inset-0 w-full h-full" />}
    </div>
  )
  const footer = (
    <div className="flex justify-between items-center pt-5 font-mono text-[12px] tracking-[0.18em] uppercase" style={{ borderTop: `1.5px solid ${ink}` }}>
      <span>{brand.wordmark}</span>
      <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-6" />
      <span>{(d.url || brand.url).toUpperCase()}</span>
    </div>
  )

  if (v === 'cover') {
    // the newsstand glossy: masthead logotype, full-bleed art, barcode
    const bars = Array.from({ length: 26 }, (_, i) => 1 + Math.round(hash01(i, 3) * 3))
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {art
          ? <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, ${mixHex(d.bgColor, d.accentColor, 0.3)}, ${d.bgColor})` }}>
              <DoorSlats color={d.accentColor + '26'} count={18} className="absolute inset-0 w-full h-full" />
            </div>}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${d.bgColor}e6, transparent 40%, transparent 58%, ${d.bgColor}f2)` }} />
        <div className="relative h-full flex flex-col px-16 py-11">
          <div className="text-[86px] font-black tracking-tight leading-none" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}<span style={{ color: d.accentColor }}>.</span></div>
          <div className="mt-3 font-mono text-[13px] tracking-[0.35em] uppercase" style={{ color: d.accentColor }}>{d.subtitle} &middot; {d.date}</div>
          <div className="mt-auto flex items-end justify-between gap-10">
            <div className="max-w-[72%]">
              <h1 className="text-[54px] leading-[1.08] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
              <p className="mt-4 text-[18px] leading-relaxed" style={{ color: ink + 'b3' }}>{d.body}</p>
            </div>
            <div className="shrink-0 bg-white px-3 pt-2 pb-1 flex flex-col items-center">
              <div className="flex items-end gap-[2px] h-12">
                {bars.map((w, i) => <div key={i} style={{ width: w, height: '100%', backgroundColor: '#151515' }} />)}
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-neutral-800 mt-1">{(d.date || '').replace(/\s/g, '')}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'type') {
    // pure typography: accent initial, headline set huge, ruled standfirst
    const t = d.title || ''
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-baseline font-mono text-[12px] tracking-[0.18em] pb-5 uppercase" style={{ borderBottom: `1.5px solid ${ink}` }}>
          <span>{d.subtitle}</span>
          <span style={{ color: ink + '99' }}>{d.date}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-black leading-none text-[40px]" style={{ fontFamily: brand.fonts.display, color: ink + '40' }}>&#8470; {(d.date || '').replace(/\D/g, '') || '01'}</div>
          <h1 className="mt-6 text-[96px] leading-[1.0] tracking-tight max-w-[96%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>
            <span style={{ color: d.accentColor }}>{t.slice(0, 1)}</span>{t.slice(1)}
          </h1>
          <p className="mt-10 pl-7 text-[24px] leading-[1.5] max-w-[70%]" style={{ borderLeft: `5px solid ${d.accentColor}`, color: ink + 'a6' }}>{d.body}</p>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'quote') {
    // the standfirst as a pull-quote page
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-baseline font-mono text-[12px] tracking-[0.18em] pb-5 uppercase" style={{ borderBottom: `1.5px solid ${ink}` }}>
          <span>{d.subtitle}</span>
          <span style={{ color: ink + '99' }}>{d.date}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-[88%]">
          <div className="leading-none select-none text-[170px] -mb-16" style={{ fontFamily: brand.fonts.serif, color: d.accentColor }}>&ldquo;</div>
          <p className="text-[44px] leading-[1.3]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.body}</p>
          <div className="mt-10 flex items-center gap-5">
            <div className="w-14" style={{ height: 3, backgroundColor: d.accentColor }} />
            <div>
              <div className="text-[24px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.title}</div>
              <div className="font-mono text-[12px] tracking-[0.2em] mt-1 uppercase" style={{ color: ink + '8c' }}>{brand.wordmark} &middot; {d.date}</div>
            </div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'plate') {
    // the museum catalog: a framed full-width plate over the caption block
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative flex-1 min-h-0 p-3" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[9px] pointer-events-none z-10" style={{ border: `1px solid ${ink}66` }} />
          {artOr('w-full h-full')}
        </div>
        <div className="font-mono text-[11px] tracking-[0.25em] mt-4 uppercase" style={{ color: ink + '73' }}>PLATE 01 &middot; {d.subtitle}</div>
        <div className="mt-6 flex items-end justify-between gap-12">
          <div className="min-w-0">
            <h1 className="text-[46px] leading-[1.08] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <p className="mt-4 text-[18px] leading-relaxed max-w-[85%]" style={{ color: ink + 'a6' }}>{d.body}</p>
          </div>
          <div className="shrink-0 text-right">
            <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7 ml-auto" />
            <div className="font-mono text-[11px] tracking-[0.2em] mt-3 uppercase" style={{ color: ink + '8c' }}>{d.date}</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'dossier') {
    // the typewritten field dossier, photo clipped in at an angle
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14 font-mono" style={{ backgroundColor: d.bgColor, color: ink }}>
        <div className="flex justify-between items-center pb-5" style={{ borderBottom: `2px solid ${ink}` }}>
          <span className="text-[14px] tracking-[0.3em]">DOSSIER &middot; {d.date}</span>
          <span className="px-4 py-1.5 border-2 text-[13px] font-bold tracking-[0.3em] -rotate-2" style={{ borderColor: d.accentColor, color: d.accentColor }}>FIELD NOTES</span>
        </div>
        <div className="flex-1 min-h-0 flex gap-14 items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] tracking-[0.25em]" style={{ color: ink + '80' }}>SUBJECT &middot;</div>
            <h1 className="mt-4 text-[44px] font-bold leading-[1.15] uppercase tracking-[0.02em]">{d.title}</h1>
            <div className="mt-8 text-[13px] tracking-[0.25em]" style={{ color: ink + '80' }}>SUMMARY &middot;</div>
            <p className="mt-3 text-[17px] leading-[1.7] max-w-[95%]" style={{ color: ink + 'd9' }}>{d.body}</p>
          </div>
          <div className="w-[30%] shrink-0 rotate-2 relative">
            <div className="p-3 pb-10" style={{ backgroundColor: mixHex(d.bgColor, '#FFFFFF', 0.5), boxShadow: `0 16px 32px ${ink}40` }}>
              {artOr('w-full aspect-[4/5]')}
            </div>
            <svg viewBox="0 0 24 60" className="absolute -top-5 left-8 w-6" fill="none" stroke={ink + 'a6'} strokeWidth="2.5">
              <path d="M 12,4 C 18,4 19,10 19,14 L 19,44 C 19,50 15,53 12,53 C 9,53 5,50 5,44 L 5,16 C 5,12 7,9 10,9 C 13,9 15,12 15,16 L 15,42" />
            </svg>
          </div>
        </div>
        <div className="flex justify-between items-center pt-5 text-[12px] tracking-[0.2em] uppercase" style={{ borderTop: `2px solid ${ink}`, color: ink + '8c' }}>
          <span>{brand.signoff.toUpperCase()}</span>
          <span>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'grid') {
    // swiss survey poster: drafting grid, coordinates, headline low-left
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-12" style={{
        backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body,
        backgroundImage: `repeating-linear-gradient(to right, transparent, transparent 95px, ${ink}14 95px, ${ink}14 96px), repeating-linear-gradient(to bottom, transparent, transparent 95px, ${ink}14 95px, ${ink}14 96px)`,
      }}>
        <div className="flex justify-between font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{d.subtitle}</span>
          <span>{d.date}</span>
        </div>
        <div className="relative flex-1 min-h-0 flex">
          <div className="absolute top-8 right-0">{artOr('w-[320px] aspect-square')}</div>
          <div className="mt-auto max-w-[78%]">
            <div className="w-16 h-1.5 mb-8" style={{ backgroundColor: d.accentColor }} />
            <h1 className="font-extrabold text-[84px] leading-[0.98] tracking-tight" style={{ fontFamily: brand.fonts.serif }}>{d.title}</h1>
            <p className="mt-6 text-[19px] leading-relaxed max-w-[80%]" style={{ color: ink + 'a6' }}>{d.body}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-6 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark}</span>
          <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'letter') {
    // the editor's letter: narrow centered column, seal, serif voice
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-20 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <BrandSeal brand={brand} tone={d.accentColor} size={96} />
        <div className="mt-6 font-mono text-[13px] tracking-[0.4em] uppercase" style={{ color: ink + '8c' }}>{d.subtitle} &middot; {d.date}</div>
        <LedgerRule color={ink + '66'} className="w-[34%] mt-6" />
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <h1 className="text-[52px] leading-[1.12] tracking-tight max-w-[72%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="mt-8 text-[24px] leading-[1.6] italic max-w-[62%]" style={{ fontFamily: brand.fonts.serif, color: ink + 'a6' }}>{d.body}</p>
        </div>
        <div className="w-[240px]">
          <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
          <div className="font-mono text-[11px] tracking-[0.28em] mt-3 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-16 pt-14 pb-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div className="flex justify-between items-baseline font-mono text-[12px] tracking-[0.18em] pb-5 uppercase" style={{ borderBottom: `1.5px solid ${d.textColor}` }}>
        <span>{d.subtitle}</span>
        <span style={{ color: d.textColor + '99' }}>{d.date}</span>
      </div>
      <div className="flex flex-1 gap-12 pt-12 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <h1 className="font-extrabold text-[82px] leading-[0.98] tracking-tight" style={{ fontFamily: brand.fonts.serif }}>{d.title}</h1>
          <p className="mt-8 text-[24px] leading-[1.5] max-w-[92%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
          <div className="mt-auto font-black text-[130px] leading-none select-none" style={{ color: d.accentColor }}>&#8600;</div>
        </div>
        <div className="w-[36%] shrink-0 flex flex-col">
          <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: d.textColor + '0d' }}>
            {(d.uploadedImage || d.generatedImage)
              ? <img src={d.uploadedImage || d.generatedImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[0.2em]" style={{ color: d.textColor + '40' }}>ADD IMAGE VIA MEDIA TAB</div>}
          </div>
          <div className="font-mono text-[10px] tracking-[0.15em] mt-3 uppercase" style={{ color: d.textColor + '73' }}>Figure 01 · {d.subtitle}</div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-5 mt-8 font-mono text-[12px] tracking-[0.18em] uppercase" style={{ borderTop: `1.5px solid ${d.textColor}` }}>
        <span>{brand.wordmark}</span>
        <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-6" />
        <span>{(d.url || brand.url).toUpperCase()}</span>
      </div>
    </div>
  )
}

export function TplSplitPanel({ d, brand }) {
  const img = d.uploadedImage || d.generatedImage
  const variant = d.variant || 'panes'
  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ fontFamily: brand.fonts.body }}>
      <div className="w-[46%] p-14 flex flex-col relative z-10" style={{ backgroundColor: d.bgColor }}>
        <div className="font-mono text-[12px] tracking-[0.25em]" style={{ color: d.textColor + '99' }}>{d.subtitle}</div>
        <h1 className="font-extrabold text-[60px] leading-[1.02] tracking-tight mt-10" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.title}</h1>
        <div className="mt-auto space-y-4">
          <div className="font-mono text-[12px] tracking-[0.15em]" style={{ color: d.textColor + '99' }}>{d.date}</div>
          <div className="font-mono text-[12px] tracking-[0.15em]" style={{ color: d.textColor + '99' }}>{(d.url || brand.url).toUpperCase()}</div>
          <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} />
        </div>
      </div>
      <div className="flex-1 relative" style={{ background: `linear-gradient(140deg, ${d.accentColor}26 0%, ${d.bgColor} 120%)` }}>
        {img ? (
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : variant === 'mosaic' ? (
          <>
            <PixelMosaic color={d.accentColor + '40'} cols={18} rows={22} className="absolute inset-0 w-full h-full" />
            <PixelMosaic color={d.textColor + '14'} cols={9} rows={11} className="absolute inset-0 w-full h-full" />
          </>
        ) : variant === 'ribbons' ? (
          <svg viewBox="0 0 600 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="bs-sp-rib-a" x1="0" y1="0" x2="1" y2="0.4">
                <stop offset="0%" stopColor={d.accentColor} stopOpacity="0.75" />
                <stop offset="100%" stopColor={d.accentColor} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="bs-sp-rib-b" x1="1" y1="0" x2="0" y2="0.6">
                <stop offset="0%" stopColor={d.textColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={d.textColor} stopOpacity="0.02" />
              </linearGradient>
              <filter id="bs-sp-rib-blur"><feGaussianBlur stdDeviation="18" /></filter>
            </defs>
            <path d="M -60,780 C 160,700 240,940 660,830 L 660,1000 C 260,1090 140,860 -60,940 Z" fill={d.accentColor + '2b'} filter="url(#bs-sp-rib-blur)" />
            <path d="M -60,180 C 200,120 320,360 660,260 L 660,380 C 320,470 210,240 -60,310 Z" fill="url(#bs-sp-rib-a)" />
            <path d="M -60,420 C 240,340 300,600 660,500 L 660,580 C 300,670 230,420 -60,510 Z" fill="url(#bs-sp-rib-b)" />
            <path d="M -60,640 C 180,560 340,800 660,700 L 660,760 C 340,850 190,620 -60,710 Z" fill="url(#bs-sp-rib-a)" opacity="0.7" />
            <path d="M -60,205 C 200,145 320,385 660,285" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
            <path d="M -60,665 C 180,585 340,825 660,725" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.25" />
          </svg>
        ) : variant === 'prisms' ? (
          <svg viewBox="0 0 600 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="bs-sp-pri-a" x1="0" y1="0" x2="0.7" y2="1">
                <stop offset="0%" stopColor={d.accentColor} stopOpacity="0.65" />
                <stop offset="100%" stopColor={d.accentColor} stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="bs-sp-pri-b" x1="0.6" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d.textColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={d.textColor} stopOpacity="0.03" />
              </linearGradient>
            </defs>
            {[[90, -40, 210, 0.95, 'a'], [255, 60, 165, 0.8, 'b'], [385, -70, 235, 0.9, 'a'], [510, 40, 150, 0.65, 'b'], [175, 520, 190, 0.75, 'a'], [420, 560, 210, 0.85, 'b'], [60, 610, 140, 0.6, 'a']].map(([x, y, s, o, g], i) => (
              <g key={i} transform={`translate(${x}, ${y}) rotate(24)`} opacity={o}>
                <polygon points={`0,0 ${s * 0.42},${s * 0.14} ${s * 0.34},${s * 2.1} ${-s * 0.08},${s * 1.96}`} fill={`url(#bs-sp-pri-${g})`} stroke={d.accentColor + '40'} strokeWidth="1" />
                <line x1="0" y1="0" x2={-s * 0.08} y2={s * 1.96} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" />
              </g>
            ))}
          </svg>
        ) : variant === 'stack' ? (
          <svg viewBox="-220 -240 440 480" className="absolute inset-0 w-full h-full">
            <line x1="0" y1="-215" x2="0" y2="215" stroke={d.accentColor + '40'} strokeWidth="1" strokeDasharray="4,6" />
            {Array.from({ length: 5 }, (_, i) => {
              const y = (i - 2) * 68
              const isAccent = i === 2
              return (
                <polygon key={i} points={`0,${y - 58} 170,${y} 0,${y + 58} -170,${y}`}
                  fill={isAccent ? d.accentColor + '26' : d.textColor + '0d'}
                  stroke={isAccent ? d.accentColor : d.textColor + '4d'} strokeWidth={isAccent ? 2 : 1.25}
                  filter={isAccent ? `drop-shadow(0 0 16px ${d.accentColor}59)` : undefined} />
              )
            })}
          </svg>
        ) : variant === 'slats' ? (
          <div className="absolute inset-0">
            <DoorSlats color={d.accentColor + '30'} count={20} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-x-8 bottom-10 flex gap-3 h-[30%]">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex-1 relative overflow-hidden"
                  style={{
                    border: `1.5px solid ${i === 2 ? d.accentColor : d.textColor + '4d'}`,
                    backgroundColor: i === 2 ? mixHex(d.bgColor, d.accentColor, 0.22) : mixHex(d.bgColor, d.textColor, 0.05),
                    boxShadow: i === 2 ? `0 0 24px ${d.accentColor}59` : undefined,
                  }}>
                  <DoorSlats color={i === 2 ? d.accentColor + '8c' : d.textColor + '40'} count={7} className="absolute inset-x-0 top-0 w-full h-[74%]" />
                  <div className="absolute bottom-1.5 inset-x-0 text-center font-mono text-[11px] tracking-[0.2em]" style={{ color: i === 2 ? d.accentColor : d.textColor + '66' }}>{String(101 + i)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : variant === 'radar' ? (
          <svg viewBox="0 0 600 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="bs-sp-rad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={d.accentColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={d.accentColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[80, 150, 220, 290, 360].map(r => (
              <circle key={r} cx="300" cy="540" r={r} fill="none" stroke={d.textColor + (r === 220 ? '40' : '26')} strokeWidth="1.2" />
            ))}
            <line x1="300" y1="160" x2="300" y2="920" stroke={d.textColor + '26'} strokeWidth="1" />
            <line x1="-60" y1="540" x2="660" y2="540" stroke={d.textColor + '26'} strokeWidth="1" />
            <path d="M 300,540 L 300,180 A 360,360 0 0 1 600,340 Z" fill="url(#bs-sp-rad)" />
            <line x1="300" y1="540" x2="300" y2="180" stroke={d.accentColor} strokeWidth="1.5" strokeOpacity="0.8" />
            {[[382, 424, 6, 1], [214, 664, 5, 0.7], [434, 706, 5, 0.55], [246, 366, 4, 0.5]].map(([x, y, r, o], i) => (
              <g key={i} opacity={o}>
                <circle cx={x} cy={y} r={r} fill={d.accentColor} />
                {i === 0 && <circle cx={x} cy={y} r={16} fill="none" stroke={d.accentColor} strokeWidth="1.5" strokeOpacity="0.6" />}
              </g>
            ))}
            <text x="404" y="418" fill={d.accentColor} fontSize="15" fontFamily="ui-monospace, monospace" letterSpacing="2">DEAL 042</text>
            <circle cx="300" cy="540" r="5" fill={d.accentColor} />
          </svg>
        ) : variant === 'contour' ? (
          <svg viewBox="0 0 600 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i}
                d="M 0,-120 C 80,-112 132,-62 142,8 C 152,78 92,132 12,142 C -68,152 -138,92 -148,12 C -158,-68 -80,-128 0,-120 Z"
                transform={`translate(330, 640) scale(${0.45 + i * 0.42}) rotate(${i * 5})`}
                fill="none" stroke={i === 4 ? d.accentColor : d.accentColor + (i < 4 ? '8c' : '40')}
                strokeWidth={i === 4 ? 2 : 1.2} vectorEffect="non-scaling-stroke" />
            ))}
            <circle cx="330" cy="640" r="5" fill={d.accentColor} />
            <path d="M 330,640 L 448,522" stroke={d.accentColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x="456" y="518" fill={d.accentColor} fontSize="15" fontFamily="ui-monospace, monospace" letterSpacing="2">PEAK 042</text>
            {[[70, 130], [520, 210], [90, 950], [500, 890]].map(([x, y], i) => (
              <path key={`m${i}`} d={`M ${x - 9},${y} H ${x + 9} M ${x},${y - 9} V ${y + 9}`} stroke={d.textColor + '4d'} strokeWidth="1" />
            ))}
          </svg>
        ) : (
          <div className="absolute inset-0">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="absolute rounded-sm"
                style={{
                  left: `${12 + i * 17}%`, top: `${15 + (i % 2) * 9}%`, width: '30%', height: '62%',
                  transform: 'skewY(-8deg)',
                  background: `linear-gradient(160deg, ${d.accentColor}${['40', '2b', '33', '1f'][i]}, transparent 85%)`,
                  border: `1px solid ${d.accentColor}40`,
                }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function TplPodcast({ d, brand, canvas }) {
  const photo = d.uploadedImage || d.generatedImage
  // strictly taller than wide: story ratio stacks; square keeps the split
  const tall = (canvas?.h ?? 1080) > (canvas?.w ?? 1080)
  const v = ['feature', 'duotone', 'arch', 'ring', 'sticker', 'band', 'frame', 'noir', 'halftone', 'bauhaus', 'glitch', 'riso'].includes(d.variant) ? d.variant : 'feature'
  const ink = d.textColor
  const initials = (d.author || '?').split(/\s+/).map(x => x[0]).slice(0, 2).join('')
  const noPhoto = (cls = 'w-40 h-40 text-[44px]') => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`${cls} rounded-full border-2 flex items-center justify-center font-bold`} style={{ borderColor: d.accentColor + '80', color: d.accentColor, fontFamily: brand.fonts.heading }}>{initials}</div>
    </div>
  )

  if (v === 'halftone') {
    // print-screen art: the portrait behind a dot screen, ink field
    const field = mixHex(d.bgColor, '#000000', 0.3)
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: field, fontFamily: brand.fonts.body, color: '#F2F2F0' }}>
        <div className="absolute -right-10 top-0 bottom-0 w-[72%] -skew-x-3" style={{ backgroundColor: d.accentColor }} />
        {photo && <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 mix-blend-luminosity" />}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, ${field} 1.4px, transparent 1.4px)`,
          backgroundSize: '9px 9px',
        }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${field}f2, transparent 45%)` }} />
        <div className="relative h-full flex flex-col px-16 py-14">
          <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em]">
            <span style={{ color: '#F2F2F0b3' }}>{d.subtitle}</span>
            <span className="px-3 py-1.5 font-bold" style={{ backgroundColor: '#F2F2F0', color: field }}>EP {d.metric}</span>
          </div>
          <div className="mt-auto">
            <h1 className="text-[56px] leading-[1.06] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <div className="mt-5 font-mono text-[13px] tracking-[0.2em]" style={{ color: '#F2F2F099' }}>{d.author} &middot; {d.role} &middot; {d.date}</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'bauhaus') {
    // geometric poster: circle-cropped portrait among primitive forms
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="absolute -left-24 -bottom-24 w-[46%] aspect-square rounded-full" style={{ backgroundColor: d.accentColor + '33' }} />
        <div className="absolute left-0 top-0 w-[26%] aspect-square" style={{ backgroundColor: d.accentColor, borderBottomRightRadius: '100%' }} />
        <div className="absolute right-[8%] bottom-[12%] w-[13%] aspect-square rotate-45" style={{ border: `3px solid ${ink}59` }} />
        <div className="absolute left-[38%] top-[10%] right-[8%] bottom-[38%]">
          <div className="relative w-full h-full rounded-full overflow-hidden" style={{ backgroundColor: ink + '0d', border: `3px solid ${ink}` }}>
            {photo ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover grayscale" /> : (
              <DoorSlats color={d.accentColor + '30'} count={12} className="absolute inset-0 w-full h-full" />
            )}
            <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: d.accentColor + '26' }} />
          </div>
        </div>
        <div className="absolute left-[10%] top-[42%] font-black leading-none text-[130px]" style={{ fontFamily: brand.fonts.display, color: 'transparent', WebkitTextStroke: `3px ${ink}` }}>{d.metric}</div>
        <div className="absolute left-14 right-14 bottom-12">
          <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="mt-4 text-[44px] leading-[1.08] tracking-tight max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-4 font-mono text-[12px] tracking-[0.2em]" style={{ color: ink + '8c' }}>{d.author} &middot; {d.date}</div>
        </div>
      </div>
    )
  }

  if (v === 'glitch') {
    // transmission art: the portrait sliced into shifted scanlines
    const strips = Array.from({ length: 9 }, (_, i) => ({
      shift: Math.round((hash01(i, 13) - 0.5) * 36),
      hot: i === 3 || i === 6,
    }))
    const field = mixHex(d.bgColor, '#000000', 0.35)
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: field, fontFamily: brand.fonts.body, color: '#F2F2F0' }}>
        {photo && (
          <div className="absolute inset-x-0 top-0 h-[68%]">
            {strips.map((s, i) => (
              <div key={i} className="absolute inset-x-0 overflow-hidden" style={{ top: `${(i * 100) / 9}%`, height: `${100 / 9}%`, transform: `translateX(${s.shift}px)` }}>
                <img src={photo} alt="" className="absolute inset-x-0 w-full object-cover grayscale"
                  style={{ height: '900%', top: `${-i * 100}%`, filter: s.hot ? 'grayscale(1) brightness(1.3) sepia(1) saturate(6) hue-rotate(180deg)' : undefined }} />
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-[68%]" style={{ background: `linear-gradient(to top, ${field}, transparent 30%)` }} />
        <div className="relative h-full flex flex-col px-16 py-12">
          <div className="flex justify-between font-mono text-[13px] tracking-[0.3em]" style={{ color: '#F2F2F0b3' }}>
            <span>{d.subtitle}</span>
            <span style={{ color: d.accentColor }}>&#9646;&#9646; SIGNAL &middot; EP {d.metric}</span>
          </div>
          <div className="mt-auto">
            <h1 className="relative font-black uppercase leading-[1.0] tracking-tight text-[72px] max-w-[96%]" style={{ fontFamily: brand.fonts.heading, textShadow: `4px 0 0 ${d.accentColor}99, -4px 0 0 ${mixHex(d.accentColor, '#FFFFFF', 0.4)}66` }}>{d.title}</h1>
            <div className="mt-5 font-mono text-[13px] tracking-[0.2em]" style={{ color: '#F2F2F099' }}>{d.author} &middot; {d.role} &middot; {d.date}</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'riso') {
    // misregistered two-ink print: accent pass slips off the black pass
    const lightBg = hexLuma(d.bgColor) > 0.5
    const blend = lightBg ? 'multiply' : 'screen'
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {photo && (
          <div className="absolute inset-x-0 top-[6%] h-[64%]">
            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-contain object-bottom"
              style={{ transform: 'translate(-12px, -8px)', mixBlendMode: blend, filter: 'grayscale(1) brightness(1.35) sepia(1) saturate(6) hue-rotate(185deg)' }} />
            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-contain object-bottom grayscale"
              style={{ mixBlendMode: blend, opacity: 0.9 }} />
          </div>
        )}
        <div className="absolute top-12 left-14 right-14 flex justify-between items-center font-mono text-[13px] tracking-[0.3em]" style={{ color: ink + '8c' }}>
          <span>{d.subtitle}</span>
          <span style={{ color: d.accentColor }}>EP {d.metric}</span>
        </div>
        <div className="absolute left-14 right-14 bottom-12">
          <div className="relative">
            <h1 className="absolute inset-0 text-[52px] leading-[1.08] tracking-tight max-w-[92%] select-none" aria-hidden="true" style={{ fontFamily: brand.fonts.serif, fontWeight: 600, color: d.accentColor + '99', transform: 'translate(-4px, -3px)' }}>{d.title}</h1>
            <h1 className="relative text-[52px] leading-[1.08] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          </div>
          <div className="mt-5 flex justify-between items-end">
            <div className="font-mono text-[12px] tracking-[0.2em]" style={{ color: ink + '8c' }}>{d.author} &middot; {d.role} &middot; {d.date}</div>
            <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-6" />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'duotone') {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.accentColor, fontFamily: brand.fonts.body }}>
        {photo
          ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover grayscale contrast-110 mix-blend-luminosity" />
          : <DoorSlats color={mixHex(d.accentColor, '#000000', 0.35) + '66'} count={20} className="absolute inset-0 w-full h-full" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${mixHex(d.accentColor, '#000000', 0.75)}e6, transparent 55%)` }} />
        <div className="absolute top-10 left-12 right-12 flex justify-between items-start">
          <div className="font-mono text-[13px] tracking-[0.3em]" style={{ color: '#FFFFFFcc' }}>{d.subtitle}</div>
          <div className="font-black leading-none text-[110px]" style={{ fontFamily: brand.fonts.display, color: 'transparent', WebkitTextStroke: '2.5px #FFFFFFb3' }}>{d.metric}</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-12 pb-11" style={{ color: '#FFFFFF' }}>
          <h1 className="text-[54px] leading-[1.06] tracking-tight max-w-[94%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-5 flex justify-between items-end">
            <div>
              <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[12px] mt-1" style={{ color: '#FFFFFF99' }}>{d.role} &middot; {d.date}</div>
            </div>
            <LogoImg brand={brand} src={d.logoSrc} tone="#FFFFFF" className="h-7" />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'arch') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-16 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[13px] tracking-[0.4em]" style={{ color: d.accentColor }}>{d.subtitle} &middot; EP {d.metric}</div>
        <LedgerRule color={ink} className="w-full mt-5" />
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="relative w-[42%] h-[52%] overflow-hidden rounded-t-full" style={{ backgroundColor: ink + '0a', border: `2px solid ${ink}40` }}>
            {photo ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
              <>
                <DoorSlats color={d.accentColor + '2b'} count={10} className="absolute inset-0 w-full h-full" />
                {noPhoto('w-24 h-24 text-[28px]')}
              </>
            )}
          </div>
          <h1 className="mt-8 text-[40px] leading-[1.14] tracking-tight max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-5 text-[20px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
          <div className="font-mono text-[12px] mt-1" style={{ color: ink + '8c' }}>{d.role}</div>
        </div>
        <div className="w-full">
          <LedgerRule color={ink + '66'} />
          <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-6" />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'ring') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-16 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-full flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark}</span>
          <span style={{ color: d.accentColor }}>EP {d.metric}</span>
        </div>
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="relative w-[40%] aspect-square rounded-full p-2" style={{ border: `2px dashed ${d.accentColor}66` }}>
            <div className="relative w-full h-full rounded-full overflow-hidden" style={{ border: `4px solid ${d.accentColor}`, backgroundColor: ink + '0a' }}>
              {photo ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
                <>
                  <DoorSlats color={d.accentColor + '2b'} count={9} className="absolute inset-0 w-full h-full" />
                  {noPhoto('w-24 h-24 text-[28px]')}
                </>
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 font-mono text-[11px] font-bold tracking-[0.25em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.date}</div>
          </div>
          <h1 className="mt-9 text-[40px] leading-[1.14] tracking-tight max-w-[84%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-4 font-mono text-[13px] tracking-[0.15em]" style={{ color: ink + '99' }}>{d.author} &middot; {d.role}</div>
        </div>
        <div className="w-full flex items-end gap-[3px] h-8">
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="flex-1" style={{ height: `${20 + 70 * Math.abs(Math.sin(i * 0.7))}%`, backgroundColor: (i > 22 && i < 34 ? d.accentColor : ink + '33') }} />
          ))}
        </div>
      </div>
    )
  }

  if (v === 'sticker') {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: mixHex(d.bgColor, d.accentColor, 0.12), color: ink, fontFamily: brand.fonts.body }}>
        <PixelMosaic color={d.accentColor + '26'} cols={14} rows={9} className="absolute left-0 bottom-0 w-[420px] h-[280px]" />
        <div className="absolute top-12 left-14 right-14">
          <div className="inline-flex px-4 py-2 font-mono text-[13px] font-bold tracking-[0.3em]" style={{ backgroundColor: ink, color: d.bgColor }}>{d.subtitle} &middot; EP {d.metric}</div>
          <h1 className="mt-7 font-black uppercase leading-[0.98] tracking-tight text-[84px] max-w-[80%]" style={{ fontFamily: brand.fonts.display }}>{d.title}</h1>
        </div>
        {d.uploadedImage ? (
          <img src={d.uploadedImage} alt="" className="absolute bottom-0 right-6 h-[62%] object-contain object-bottom"
            style={{ filter: `drop-shadow(4px 0 0 ${d.bgColor}) drop-shadow(-4px 0 0 ${d.bgColor}) drop-shadow(0 4px 0 ${d.bgColor}) drop-shadow(0 -4px 0 ${d.bgColor})` }} />
        ) : photo ? (
          <img src={photo} alt="" className="absolute bottom-0 right-6 h-[62%] object-contain object-bottom" />
        ) : null}
        <div className="absolute bottom-10 left-14">
          <div className="text-[24px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
          <div className="font-mono text-[13px] mt-1" style={{ color: ink + '99' }}>{d.role} &middot; {d.date}</div>
        </div>
      </div>
    )
  }

  if (v === 'band') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative h-[52%] shrink-0">
          {photo ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
            <>
              <DoorSlats color={d.accentColor + '30'} count={14} className="absolute inset-0 w-full h-full" />
              {noPhoto()}
            </>
          )}
          <div className="absolute top-8 left-10 px-4 py-2 font-mono text-[13px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>EP {d.metric}</div>
        </div>
        <div className="flex items-end gap-[3px] h-9 px-10 -mt-9 relative z-10">
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="flex-1" style={{ height: `${20 + 70 * Math.abs(Math.sin(i * 0.7))}%`, backgroundColor: d.accentColor + (i % 3 ? '8c' : 'ff') }} />
          ))}
        </div>
        <div className="flex-1 flex flex-col px-14 pt-8 pb-12 min-h-0">
          <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="mt-4 text-[42px] leading-[1.1] tracking-tight max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-auto flex justify-between items-end">
            <div>
              <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[12px] mt-1" style={{ color: ink + '99' }}>{d.role} &middot; {d.date}</div>
            </div>
            <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'frame') {
    return (
      <div className="w-full h-full relative overflow-hidden p-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>{d.subtitle}</span>
            <span style={{ color: d.accentColor }}>EPISODE {d.metric}</span>
          </div>
          <div className="relative flex-1 min-h-0 my-8 overflow-hidden" style={{ backgroundColor: ink + '0a', border: `1.5px solid ${ink}33` }}>
            {d.uploadedImage ? (
              <BlendPortrait src={d.uploadedImage} bg={d.bgColor} className="absolute inset-x-4 inset-y-4" pos="center" />
            ) : photo ? (
              <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <DoorSlats color={d.accentColor + '2b'} count={12} className="absolute inset-0 w-full h-full" />
                {noPhoto()}
              </>
            )}
          </div>
          <h1 className="relative text-[38px] leading-[1.14] tracking-tight max-w-[94%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="relative mt-5 flex justify-between items-end">
            <div className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{d.author} &middot; {d.role}</div>
            <div className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.accentColor }}>{d.date}</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'noir') {
    const field = mixHex(d.bgColor, '#000000', 0.45)
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: field, fontFamily: brand.fonts.body, color: '#F2F2F0' }}>
        {photo && <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-30" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${field}f2, transparent 60%)` }} />
        <div className="relative h-full flex flex-col px-16 py-14">
          <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em]" style={{ color: '#F2F2F080' }}>
            <span>{d.subtitle}</span>
            <span style={{ color: d.accentColor }}>EP {d.metric}</span>
          </div>
          <div className="mt-auto">
            <h1 className="font-black uppercase leading-[0.98] tracking-tight text-[86px] max-w-[96%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
            <div className="mt-7 flex justify-between items-end">
              <div>
                <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
                <div className="font-mono text-[12px] mt-1" style={{ color: '#F2F2F099' }}>{d.role} &middot; {d.date}</div>
              </div>
              <LogoImg brand={brand} src={d.logoSrc} tone="#F2F2F0" className="h-7" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const waveform = (barColor) => (
    <div className="absolute bottom-8 left-8 right-8 flex items-end gap-[3px] h-10">
      {Array.from({ length: 48 }, (_, i) => (
        <div key={i} className="flex-1" style={{ height: `${20 + 70 * Math.abs(Math.sin(i * 0.7))}%`, backgroundColor: barColor + (i % 3 ? '59' : 'cc') }} />
      ))}
    </div>
  )
  if (tall) {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col p-16" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
        <div className="flex items-center gap-3 font-mono text-[15px] tracking-[0.25em]" style={{ color: d.accentColor }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.accentColor }} />
          {d.subtitle}
        </div>
        <div className="flex items-end gap-7 mt-9">
          <div>
            <div className="font-mono text-[13px] tracking-[0.3em] mb-2" style={{ color: d.textColor + '66' }}>EPISODE</div>
            <div className="font-black text-[120px] leading-none tracking-tight" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{d.metric}</div>
          </div>
          <h1 className="font-extrabold text-[46px] leading-[1.06] tracking-tight pb-2 min-w-0" style={{ color: d.textColor, fontFamily: brand.fonts.display }}>{d.title}</h1>
        </div>
        {/* photo band fills the middle */}
        <div className="relative flex-1 min-h-0 my-10 overflow-hidden" style={{ border: `1.5px solid ${d.textColor}26` }}>
          {d.uploadedImage ? (
            <BlendPortrait src={d.uploadedImage} bg={d.bgColor} className="absolute inset-x-4 inset-y-4" pos="center" />
          ) : photo ? (
            <div className="absolute inset-0" style={{ backgroundColor: d.accentColor }}>
              <img src={photo} alt="" className="absolute inset-0 w-full h-full object-contain object-bottom grayscale contrast-110 mix-blend-luminosity" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(circle at 50% 40%, ${d.accentColor}26, transparent 60%)` }}>
              <div className="w-56 h-56 rounded-full border-2 flex items-center justify-center font-mono text-[12px] tracking-[0.2em]"
                style={{ borderColor: d.accentColor + '66', color: d.textColor + '66' }}>GUEST PHOTO</div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: `linear-gradient(to top, ${d.bgColor}, transparent)` }} />
          {waveform(photo && !d.uploadedImage ? d.bgColor : d.accentColor)}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-bold text-[30px]" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.author}</div>
            <div className="font-mono text-[14px] tracking-[0.08em] mt-1" style={{ color: d.textColor + '99' }}>{d.role}</div>
            <div className="font-mono text-[13px] tracking-[0.15em] mt-4" style={{ color: d.textColor + '73' }}>{d.date}</div>
          </div>
          <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-9" />
        </div>
      </div>
    )
  }
  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <div className="w-[55%] p-16 flex flex-col relative z-10">
        <div className="flex items-center gap-3 font-mono text-[13px] tracking-[0.25em]" style={{ color: d.accentColor }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.accentColor }} />
          {d.subtitle}
        </div>
        <div className="mt-10">
          <div className="font-mono text-[13px] tracking-[0.3em] mb-2" style={{ color: d.textColor + '66' }}>EPISODE</div>
          <div className="font-black text-[110px] leading-none tracking-tight" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{d.metric}</div>
        </div>
        <h1 className="font-extrabold text-[44px] leading-[1.05] tracking-tight mt-6" style={{ color: d.textColor, fontFamily: brand.fonts.display }}>{d.title}</h1>
        <div className="mt-auto">
          <div className="font-bold text-[26px]" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.author}</div>
          <div className="font-mono text-[14px] tracking-[0.08em] mt-1" style={{ color: d.textColor + '99' }}>{d.role}</div>
          <div className="font-mono text-[12px] tracking-[0.15em] mt-6" style={{ color: d.textColor + '73' }}>{d.date}</div>
          <div className="mt-4"><LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} /></div>
        </div>
      </div>
      <div className="flex-1 relative">
        {d.uploadedImage ? (
          <BlendPortrait src={d.uploadedImage} bg={d.bgColor} className="absolute inset-x-6 bottom-0 top-12" />
        ) : photo ? (
          <div className="absolute inset-0" style={{ backgroundColor: d.accentColor }}>
            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-contain object-bottom grayscale contrast-110 mix-blend-luminosity" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(circle at 40% 35%, ${d.accentColor}26, transparent 60%)` }}>
            <div className="w-56 h-56 rounded-full border-2 flex items-center justify-center font-mono text-[12px] tracking-[0.2em]"
              style={{ borderColor: d.accentColor + '66', color: d.textColor + '66' }}>GUEST PHOTO</div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: `linear-gradient(to top, ${d.bgColor}, transparent)` }} />
        {waveform(photo && !d.uploadedImage ? d.bgColor : d.accentColor)}
      </div>
    </div>
  )
}

const THUMB_VARIANT_IDS = ['punch', 'tutorial', 'demo', 'live']

export function TplYouTubeThumb({ d, brand }) {
  const variant = THUMB_VARIANT_IDS.includes(d.variant) ? d.variant : 'punch'
  const img = d.uploadedImage || d.generatedImage

  if (variant === 'tutorial' || variant === 'demo') {
    // Product walkthrough: screenshot inside a browser or terminal frame, calmer type
    const isDemo = variant === 'demo'
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
        {!d.hideCrosshairs && <div className="absolute inset-0" style={{ backgroundSize: '52px 52px', backgroundImage: `linear-gradient(to right, ${d.accentColor}0d 1px, transparent 1px), linear-gradient(to bottom, ${d.accentColor}0d 1px, transparent 1px)` }} />}
        <div className="absolute right-[-4%] top-[15%] w-[52%] z-10 rounded-xl overflow-hidden" style={{ transform: 'rotate(1.5deg)', boxShadow: `0 34px 70px rgba(0,0,0,0.55), 0 0 0 1px ${d.accentColor}40` }}>
          <div className="flex items-center gap-2 px-5 h-12" style={{ backgroundColor: mixHex(d.bgColor, '#ffffff', 0.09) }}>
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" /><div className="w-3 h-3 rounded-full bg-[#febc2e]" /><div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <div className="ml-4 px-4 py-1 rounded font-mono text-[13px] tracking-[0.08em] flex-1 truncate" style={{ backgroundColor: d.bgColor + '99', color: d.textColor + '99' }}>{isDemo ? `$ ${(d.subtitle || 'demo').toLowerCase().replace(/\s+/g, '-')}` : (d.url || brand.url)}</div>
          </div>
          <div className="relative w-full aspect-[16/10]" style={{ backgroundColor: mixHex(d.bgColor, '#ffffff', 0.04) }}>
            {img ? (
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[14px] tracking-[0.25em]" style={{ color: d.textColor + '59' }}>SCREENSHOT</div>
            )}
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-[62%] z-10 pointer-events-none" style={{ background: `linear-gradient(100deg, ${d.bgColor} 52%, transparent 100%)` }} />
        <div className="absolute left-14 top-12 z-20"><LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-9" /></div>
        <div className="absolute left-14 top-[29%] z-20 max-w-[49%]">
          <div className="flex items-center gap-4 mb-7">
            <div className="px-3.5 py-1.5 font-mono text-[16px] font-bold tracking-[0.2em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{isDemo ? 'DEMO' : 'HOW TO'}</div>
            <div className="font-mono text-[16px] tracking-[0.25em] uppercase" style={{ color: d.accentColor }}>{d.subtitle}</div>
          </div>
          <h1 className="font-extrabold text-[72px] leading-[1.02] tracking-tight" style={{ color: d.textColor, fontFamily: brand.fonts.display }}>{d.title}</h1>
          {d.metric && (
            <div className="inline-flex items-center gap-3 mt-9 px-5 py-2.5 border-2 font-mono text-[20px] font-bold tracking-[0.15em]" style={{ borderColor: d.accentColor, color: d.accentColor }}>
              <div className="w-0 h-0" style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `12px solid ${d.accentColor}` }} />
              {d.metric}
            </div>
          )}
        </div>
      </div>
    )
  }

  // punch and live: big type plus a face cutout
  const words = (d.title || 'NEW VIDEO').toUpperCase().split(/\s+/)
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ')
  const line2 = words.slice(mid).join(' ')
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <div className="absolute -right-24 top-0 bottom-0 w-[58%]" style={{ background: `linear-gradient(115deg, transparent 0%, ${d.accentColor}26 30%, ${d.accentColor}59 100%)`, transform: 'skewX(-8deg)' }} />
      <PixelMosaic color={d.accentColor + '33'} cols={10} rows={7} className="absolute right-0 top-0 w-[46%] h-full" />
      {img ? (
        <img src={img} alt="" className="absolute right-0 bottom-0 h-[96%] w-[46%] object-contain object-bottom z-10" style={{ filter: `drop-shadow(-14px 0 34px ${d.bgColor})` }} />
      ) : (
        <div className="absolute right-[8%] bottom-[8%] w-[28%] h-[72%] border-2 border-dashed z-10 flex items-center justify-center font-mono text-[15px] tracking-[0.2em]" style={{ borderColor: d.accentColor + '66', color: d.textColor + '66' }}>FACE CUTOUT</div>
      )}
      <div className="absolute left-14 top-[14%] z-20 max-w-[58%]">
        <div className="inline-flex px-4 py-1.5 mb-6" style={{ backgroundColor: d.accentColor }}>
          <span className="font-mono text-[19px] font-bold tracking-[0.2em] uppercase" style={{ color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</span>
        </div>
        <div className="font-black text-[104px] leading-[0.95] tracking-tight" style={{ color: d.textColor, fontFamily: brand.fonts.display, textShadow: `6px 6px 0 ${d.bgColor}, 11px 11px 0 ${d.accentColor}59` }}>{line1}</div>
        <div className="font-black text-[104px] leading-[0.95] tracking-tight" style={{ color: d.accentColor, fontFamily: brand.fonts.display, textShadow: `6px 6px 0 ${d.bgColor}` }}>{line2}</div>
      </div>
      {variant === 'live' ? (
        <div className="absolute left-14 bottom-12 z-20 flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-5 py-2.5 font-black text-[26px] tracking-wide" style={{ backgroundColor: '#e5261f', color: '#ffffff', fontFamily: brand.fonts.heading }}>
            <div className="w-3.5 h-3.5 rounded-full bg-white" />LIVE
          </div>
          {d.metric && <div className="px-5 py-2.5 border-[3px] font-black text-[26px]" style={{ borderColor: d.textColor, color: d.textColor, backgroundColor: d.bgColor + 'cc', fontFamily: brand.fonts.heading }}>{d.metric}</div>}
        </div>
      ) : d.metric ? (
        <div className="absolute left-14 bottom-12 z-20 px-5 py-2.5 border-[3px] font-black text-[28px] rotate-[-3deg]" style={{ borderColor: d.accentColor, color: d.accentColor, backgroundColor: d.bgColor + 'cc', fontFamily: brand.fonts.heading }}>{d.metric}</div>
      ) : null}
      <div className="absolute right-8 top-8 z-20"><LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-9" /></div>
    </div>
  )
}

export function TplTitleCard({ d, brand }) {
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      {!d.hideCrosshairs && <div className="absolute inset-0" style={{ backgroundSize: '54px 54px', backgroundImage: `linear-gradient(to right, ${d.accentColor}10 1px, transparent 1px), linear-gradient(to bottom, ${d.accentColor}10 1px, transparent 1px)` }} />}
      <div className="absolute top-16 left-1/2 -translate-x-1/2"><LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-9" /></div>
      <div className="relative z-10 flex items-center gap-8 mb-10">
        <div className="w-24 h-px" style={{ backgroundColor: d.accentColor + '66' }} />
        <div className="font-mono text-[17px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        <div className="w-24 h-px" style={{ backgroundColor: d.accentColor + '66' }} />
      </div>
      <h1 className="relative z-10 font-extrabold text-[96px] leading-[1.02] tracking-tight text-center max-w-[80%]" style={{ color: d.textColor, fontFamily: brand.fonts.display }}>{d.title}</h1>
      {d.metric && (
        <div className="relative z-10 mt-12 px-6 py-2 border font-mono text-[19px] tracking-[0.3em]" style={{ borderColor: d.accentColor + '66', color: d.textColor }}>
          SESSION {d.metric}
        </div>
      )}
      <div className="absolute bottom-16 left-0 right-0 text-center font-mono text-[15px] tracking-[0.2em]" style={{ color: d.textColor + '73' }}>
        {d.author} · {d.date}
      </div>
    </div>
  )
}

// Transparent overlay for video editors: only the lower-third bar and bug are painted
export function TplLowerThird({ d, brand }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: brand.fonts.body }}>
      <div className="absolute left-24 bottom-24 flex items-stretch z-10" style={{ filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.45))' }}>
        <div className="w-[10px]" style={{ backgroundColor: d.accentColor }} />
        <div className="px-9 py-5" style={{ backgroundColor: d.bgColor + 'f2' }}>
          <div className="font-extrabold text-[46px] leading-none" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.author}</div>
          <div className="font-mono text-[19px] tracking-[0.12em] mt-2.5" style={{ color: d.accentColor }}>{d.role}</div>
        </div>
        <div className="px-7 flex items-center" style={{ backgroundColor: d.accentColor }}>
          <span className="font-mono text-[15px] font-bold tracking-[0.15em]" style={{ color: mixHex(d.accentColor, '#000000', 0.85) }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
      <div className="absolute right-16 top-14 opacity-90 z-10"><LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-12" /></div>
    </div>
  )
}

export function TplEndCard({ d, brand }) {
  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      {!d.hideCrosshairs && <div className="absolute inset-0" style={{ backgroundSize: '48px 48px', backgroundImage: `linear-gradient(to right, ${d.accentColor}10 1px, transparent 1px), linear-gradient(to bottom, ${d.accentColor}10 1px, transparent 1px)` }} />}
      <div className="relative z-10 w-[58%] p-20 flex flex-col">
        <div className="font-mono text-[16px] tracking-[0.3em] mb-8" style={{ color: d.accentColor }}>{d.subtitle}</div>
        {/* watch-next video slot: 16:9 frame where the edit drops the endscreen element */}
        <div className="w-full aspect-video border-2 border-dashed flex flex-col items-center justify-center gap-3" style={{ borderColor: d.accentColor + '59' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: d.accentColor }}>
            <div className="w-0 h-0 ml-1" style={{ borderTop: '13px solid transparent', borderBottom: '13px solid transparent', borderLeft: `20px solid ${mixHex(d.accentColor, '#000000', 0.85)}` }} />
          </div>
          <span className="font-mono text-[13px] tracking-[0.25em]" style={{ color: d.textColor + '66' }}>NEXT VIDEO ELEMENT</span>
        </div>
        <h1 className="font-extrabold text-[52px] leading-[1.05] tracking-tight mt-10" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.title}</h1>
      </div>
      <div className="relative z-10 flex-1 p-20 flex flex-col items-center justify-center border-l" style={{ borderColor: d.accentColor + '26' }}>
        <div className="w-44 h-44 rounded-full border-[3px] flex items-center justify-center p-8" style={{ borderColor: d.accentColor, backgroundColor: d.bgColor }}>
          <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-full w-full" />
        </div>
        <div className="mt-8 px-7 py-3 font-mono font-bold text-[17px] tracking-[0.2em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>SUBSCRIBE</div>
        <div className="mt-10 font-mono text-[15px] tracking-[0.18em]" style={{ color: d.textColor + '80' }}>{(d.url || brand.url).toUpperCase()}</div>
      </div>
    </div>
  )
}

// Display ad: eight creatives that hold the message constant and vary the
// mechanism, built to rotate in an ad set. Every variant carries a data-cta
// element so the linked-PDF export stays clickable.
export function TplDisplayAd({ d, brand }) {
  const v = ['ribbon', 'type', 'proof', 'offer', 'question', 'dark', 'badge', 'split'].includes(d.variant) ? d.variant : 'ribbon'
  const ink = d.textColor
  const cta = (
    <div data-cta className="px-7 py-3.5 font-mono font-bold text-[16px] tracking-[0.12em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.metric || 'LEARN MORE'} &rarr;</div>
  )

  if (v === 'type') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center">
          <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-8" />
          <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</span>
        </div>
        <div className="flex-1 flex items-center">
          <h1 className="font-extrabold text-[64px] leading-[1.02] tracking-tight max-w-[94%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          {cta}
          <span className="font-mono text-[13px] tracking-[0.15em]" style={{ color: ink + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'proof') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-11" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '8c' }}>{d.subtitle}</span>
          <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" />
        </div>
        <div className="flex-1 flex items-center gap-8">
          <div className="leading-none select-none text-[130px] -mt-10 shrink-0" style={{ fontFamily: brand.fonts.serif, color: d.accentColor }}>&ldquo;</div>
          <p className="text-[38px] leading-[1.25] max-w-[86%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.body}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-bold text-[19px] tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.title}</div>
          {cta}
        </div>
      </div>
    )
  }

  if (v === 'offer') {
    return (
      <div className="w-full h-full relative overflow-hidden flex px-16 py-12 gap-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '8c' }}>{d.subtitle}</span>
          <div className="flex-1 flex items-center">
            <div data-cta className="px-12 py-8 font-black leading-none tracking-tight text-[84px]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85), fontFamily: brand.fonts.display, boxShadow: `12px 12px 0 ${ink}26` }}>{d.metric || 'JOIN FREE'}</div>
          </div>
          <span className="font-mono text-[13px] tracking-[0.15em]" style={{ color: ink + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
        <div className="w-[36%] shrink-0 flex flex-col justify-center" style={{ borderLeft: `1.5px solid ${ink}26`, paddingLeft: 40 }}>
          <h1 className="font-extrabold text-[32px] leading-[1.12] tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <p className="text-[16px] leading-snug mt-4" style={{ color: ink + '99' }}>{d.body}</p>
          <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7 mt-6 self-start" />
        </div>
      </div>
    )
  }

  if (v === 'question') {
    const t = d.title || ''
    const q = t.endsWith('?') ? t : `${t}?`
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="absolute -right-6 -bottom-16 leading-none font-black select-none text-[440px]" style={{ fontFamily: brand.fonts.serif, color: d.accentColor + '1f' }}>?</div>
        <div className="relative flex justify-between items-center">
          <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-8" />
          <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '8c' }}>{d.subtitle}</span>
        </div>
        <div className="relative flex-1 flex items-center">
          <h1 className="text-[54px] leading-[1.1] tracking-tight max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{q}</h1>
        </div>
        <div className="relative flex items-center gap-6">
          {cta}
          <span className="font-mono text-[13px] tracking-[0.15em]" style={{ color: ink + '66' }}>{d.body}</span>
        </div>
      </div>
    )
  }

  if (v === 'dark') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-12" style={{ backgroundColor: ink, color: d.bgColor, fontFamily: brand.fonts.body }}>
        <DoorSlats color={d.bgColor + '14'} count={14} className="absolute inset-0 w-full h-full" />
        <div className="relative flex justify-between items-center">
          <LogoImg brand={brand} src={d.logoSrc} tone={d.bgColor} className="h-8" />
          <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 className="font-extrabold text-[54px] leading-[1.05] tracking-tight max-w-[90%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <p className="text-[18px] leading-snug mt-4 max-w-[70%]" style={{ color: d.bgColor + '99' }}>{d.body}</p>
        </div>
        <div className="relative flex items-center gap-6">
          <div data-cta className="px-7 py-3.5 font-mono font-bold text-[16px] tracking-[0.12em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85), boxShadow: `0 0 30px ${d.accentColor}80` }}>{d.metric || 'LEARN MORE'} &rarr;</div>
          <span className="font-mono text-[13px] tracking-[0.15em]" style={{ color: d.bgColor + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'badge') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center px-16 py-12 gap-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="shrink-0 flex flex-col items-center text-center">
          <BrandSeal brand={brand} tone={d.accentColor} size={190} />
          <div className="mt-4 font-mono text-[11px] tracking-[0.3em]" style={{ color: ink + '8c' }}>OPERATOR APPROVED</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="font-extrabold text-[44px] leading-[1.08] tracking-tight mt-3" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <p className="text-[17px] leading-snug mt-3 max-w-[92%]" style={{ color: ink + '99' }}>{d.body}</p>
          <div className="mt-6 flex items-center gap-6">
            {cta}
            <span className="font-mono text-[12px] tracking-[0.15em]" style={{ color: ink + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'split') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div data-cta className="w-[40%] shrink-0 flex flex-col items-center justify-center gap-4 text-center px-10" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>
          <div className="font-black leading-none text-[96px]" style={{ fontFamily: brand.fonts.display }}>&rarr;</div>
          <div className="font-mono font-bold text-[24px] tracking-[0.15em]">{d.metric || 'LEARN MORE'}</div>
        </div>
        <div className="flex-1 px-14 py-12 flex flex-col min-w-0">
          <div className="flex justify-between items-center">
            <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-8" />
            <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '8c' }}>{d.subtitle}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-extrabold text-[46px] leading-[1.06] tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
            <p className="text-[18px] leading-snug mt-4 max-w-[92%]" style={{ color: ink + '99' }}>{d.body}</p>
          </div>
          <span className="font-mono text-[13px] tracking-[0.15em]" style={{ color: ink + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <div className="relative z-10 w-[62%] p-14 flex flex-col">
        <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-9 self-start" />
        <div className="font-mono text-[13px] tracking-[0.3em] mt-8" style={{ color: d.accentColor }}>{d.subtitle}</div>
        <h1 className="font-extrabold text-[52px] leading-[1.04] tracking-tight mt-4" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.title}</h1>
        <p className="text-[20px] leading-snug mt-4" style={{ color: d.textColor + '99' }}>{d.body}</p>
        <div className="mt-auto flex items-center gap-6">
          <div data-cta className="px-7 py-3.5 font-mono font-bold text-[16px] tracking-[0.12em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.metric || 'LEARN MORE'} &rarr;</div>
          <span className="font-mono text-[13px] tracking-[0.15em]" style={{ color: d.textColor + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
      <div className="relative flex-1 border-l" style={{ borderColor: d.accentColor + '26' }}>
        <PixelMosaic color={d.accentColor + '26'} cols={10} rows={12} className="absolute inset-0 w-full h-full" />
        <svg viewBox="0 0 460 628" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="bs-ad-rib" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0%" stopColor={d.accentColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor={d.accentColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M -40,120 C 140,80 220,230 500,170 L 500,250 C 220,320 150,170 -40,220 Z" fill="url(#bs-ad-rib)" />
          <path d="M -40,380 C 130,320 260,470 500,400 L 500,460 C 260,540 140,390 -40,450 Z" fill="url(#bs-ad-rib)" opacity="0.6" />
          <path d="M -40,135 C 140,95 220,245 500,185" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}

export function TplEmailHero({ d, brand }) {
  const img = d.uploadedImage || d.generatedImage
  const v = ['hero', 'type', 'offer', 'note', 'band', 'seal', 'dark', 'ticker'].includes(d.variant) ? d.variant : 'hero'
  const ink = d.textColor
  const cta = (
    <div data-cta className="px-7 py-3.5 font-mono text-[14px] font-bold tracking-[0.15em] rounded-sm" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{(d.metric || 'READ MORE').toUpperCase()} &rarr;</div>
  )

  if (v === 'type') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-20 py-11" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[12px] tracking-[0.4em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="font-extrabold text-[52px] leading-[1.06] tracking-tight max-w-[86%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <p className="text-[17px] leading-snug mt-4 max-w-[64%]" style={{ color: ink + '99' }}>{d.body}</p>
        </div>
        {cta}
      </div>
    )
  }

  if (v === 'offer') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center px-16 gap-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div data-cta className="shrink-0 px-10 py-7 font-black leading-none tracking-tight text-[56px]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85), fontFamily: brand.fonts.display, boxShadow: `10px 10px 0 ${ink}26` }}>{(d.metric || 'READ MORE').toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="font-extrabold text-[38px] leading-[1.08] tracking-tight mt-2" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <p className="text-[16px] leading-snug mt-3 max-w-[92%]" style={{ color: ink + '99' }}>{d.body}</p>
        </div>
        <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-8 self-start mt-8" />
      </div>
    )
  }

  if (v === 'note') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-10" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '8c' }}>{d.subtitle} &middot; A NOTE FROM THE OPERATORS</div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-[40px] leading-[1.15] italic max-w-[88%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
          <p className="text-[17px] leading-relaxed mt-4 max-w-[76%]" style={{ color: ink + 'a6' }}>{d.body}</p>
        </div>
        <div className="flex items-end justify-between">
          {cta}
          <div className="w-[200px]">
            <div style={{ height: 1.5, backgroundColor: ink + '80' }} />
            <div className="font-mono text-[10px] tracking-[0.25em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'band') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="h-[54%] shrink-0 flex flex-col justify-center px-16" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>
          <div className="font-mono text-[12px] tracking-[0.3em] opacity-80">{d.subtitle}</div>
          <h1 className="font-extrabold text-[44px] leading-[1.05] tracking-tight mt-2 max-w-[94%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
        </div>
        <div className="flex-1 flex items-center justify-between px-16">
          <p className="text-[17px] leading-snug max-w-[58%]" style={{ color: ink + 'a6' }}>{d.body}</p>
          {cta}
        </div>
      </div>
    )
  }

  if (v === 'seal') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center px-16 gap-12" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <BrandSeal brand={brand} tone={d.accentColor} size={170} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="font-extrabold text-[40px] leading-[1.08] tracking-tight mt-2" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          <p className="text-[16px] leading-snug mt-3 max-w-[90%]" style={{ color: ink + '99' }}>{d.body}</p>
        </div>
        <div className="shrink-0 self-end mb-2">{cta}</div>
      </div>
    )
  }

  if (v === 'dark') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-10" style={{ backgroundColor: ink, color: d.bgColor, fontFamily: brand.fonts.body }}>
        <DoorSlats color={d.bgColor + '12'} count={12} className="absolute inset-0 w-full h-full" />
        <div className="relative flex justify-between items-center">
          <LogoImg brand={brand} src={d.logoSrc} tone={d.bgColor} className="h-8" />
          <span className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 className="font-extrabold text-[44px] leading-[1.06] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
        </div>
        <div className="relative flex items-center justify-between">
          <div data-cta className="px-7 py-3.5 font-mono text-[14px] font-bold tracking-[0.15em] rounded-sm" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85), boxShadow: `0 0 26px ${d.accentColor}80` }}>{(d.metric || 'READ MORE').toUpperCase()} &rarr;</div>
          <span className="font-mono text-[12px] tracking-[0.2em]" style={{ color: d.bgColor + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'ticker') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <TickerRail brand={brand} color={ink + '59'} className="py-2.5 text-[10px]" />
        <div style={{ height: 1.5, backgroundColor: ink + '40' }} />
        <div className="flex-1 flex items-center justify-between px-16 gap-10">
          <div className="min-w-0">
            <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="font-extrabold text-[42px] leading-[1.06] tracking-tight mt-2" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
            <p className="text-[16px] leading-snug mt-3 max-w-[88%]" style={{ color: ink + '99' }}>{d.body}</p>
          </div>
          <div className="shrink-0">{cta}</div>
        </div>
        <div style={{ height: 1.5, backgroundColor: ink + '40' }} />
        <TickerRail brand={brand} color={ink + '59'} className="py-2.5 text-[10px]" />
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <div className="relative z-10 w-[62%] px-16 py-12 flex flex-col justify-center">
        <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-9 self-start mb-9" />
        <div className="font-mono text-[14px] tracking-[0.3em] mb-5" style={{ color: d.accentColor }}>{d.subtitle}</div>
        <h1 className="font-extrabold text-[54px] leading-[1.04] tracking-tight" style={{ color: d.textColor, fontFamily: brand.fonts.heading }}>{d.title}</h1>
        <p className="text-[19px] leading-relaxed mt-5 max-w-[92%]" style={{ color: d.textColor + 'b3' }}>{d.body}</p>
        <div className="flex items-center gap-6 mt-9">
          <div data-cta className="px-7 py-3.5 font-mono text-[14px] font-bold tracking-[0.15em] rounded-sm" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{(d.metric || 'READ MORE').toUpperCase()} &rarr;</div>
          <span className="font-mono text-[12px] tracking-[0.2em]" style={{ color: d.textColor + '66' }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
      <div className="relative flex-1 border-l" style={{ borderColor: d.accentColor + '26' }}>
        <PixelMosaic color={d.accentColor + '2e'} cols={7} rows={9} className="absolute inset-0" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${d.bgColor} 0%, transparent 60%)` }} />
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      </div>
    </div>
  )
}

export function TplNewsletter({ d, brand }) {
  const stories = (d.features || '').split('\n').filter(Boolean).slice(0, 4)
  const v = ['issue', 'frontpage', 'contents', 'inbox', 'dispatch', 'post', 'ledger', 'marquee'].includes(d.variant) ? d.variant : 'issue'
  const ink = d.textColor
  const name = d.subtitle || brand.newsletterName

  if (v === 'frontpage') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="text-center">
          <LedgerRule color={ink} />
          <div className="font-black text-[88px] leading-none tracking-tight py-5" style={{ fontFamily: brand.fonts.heading }}>{name}<span style={{ color: d.accentColor }}>.</span></div>
          <LedgerRule color={ink} />
          <div className="font-mono text-[13px] tracking-[0.3em] py-4" style={{ color: ink + '99', borderBottom: `1px solid ${ink}40` }}>
            ISSUE {d.metric} &middot; {d.date} &middot; {(d.url || brand.url).toUpperCase()}
          </div>
        </div>
        <div className="mt-12">
          <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>LEAD STORY</div>
          <h1 className="mt-5 text-[58px] leading-[1.08] tracking-tight max-w-[94%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="mt-6 text-[21px] leading-relaxed max-w-[86%]" style={{ color: ink + 'b3' }}>{d.body}</p>
        </div>
        <div className="mt-12 flex-1 grid grid-cols-2 gap-x-12 gap-y-8 content-center">
          {stories.map((s, i) => (
            <div key={i} className="pt-5" style={{ borderTop: `1.5px solid ${ink}40` }}>
              <span className="font-mono text-[13px] font-bold" style={{ color: d.accentColor }}>{String(i + 2).padStart(2, '0')}</span>
              <div className="mt-2 font-bold text-[24px] leading-snug tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{s}</div>
            </div>
          ))}
        </div>
        <div className="pt-6 text-center font-mono text-[11px] tracking-[0.15em]" style={{ borderTop: `1px solid ${ink}40`, color: ink + '4d' }}>{brand.newsletterNote}</div>
      </div>
    )
  }

  if (v === 'contents') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={`ISSUE ${d.metric}`} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="mt-10">
          <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: ink + '80' }}>{name} &middot; {d.date}</div>
          <h1 className="mt-5 text-[46px] leading-[1.12] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        </div>
        <div className="mt-12 flex-1 flex flex-col justify-center">
          <div className="font-black leading-none text-[76px]" style={{ fontFamily: brand.fonts.display, color: ink + '1f' }}>CONTENTS</div>
          <div className="mt-8 space-y-7">
            {stories.map((s, i) => (
              <div key={i} className="flex items-baseline text-[27px] font-bold tracking-tight" style={{ fontFamily: brand.fonts.heading }}>
                <span className="font-mono text-[15px] font-bold shrink-0 w-12" style={{ color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="shrink-0 max-w-[70%]">{s}</span>
                <span className="flex-1 mx-4" style={{ borderBottom: `2px dotted ${ink}40`, transform: 'translateY(-6px)' }} />
                <span className="font-mono text-[16px] shrink-0" style={{ color: ink + '8c' }}>p. {String(i * 3 + 2).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    )
  }

  if (v === 'inbox') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center px-16 py-16" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.05), color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden" style={{ backgroundColor: d.bgColor, border: `1.5px solid ${ink}33`, boxShadow: `0 26px 52px ${ink}33` }}>
          <div className="flex items-center gap-2.5 px-7 py-4" style={{ borderBottom: `1px solid ${ink}26` }}>
            {[0, 1, 2].map(i => <span key={i} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: i === 0 ? d.accentColor : ink + '33' }} />)}
            <span className="ml-4 font-mono text-[12px] tracking-[0.25em]" style={{ color: ink + '8c' }}>ISSUE {d.metric}</span>
          </div>
          <div className="px-10 py-6 space-y-2.5 font-mono text-[15px]" style={{ borderBottom: `1px solid ${ink}26` }}>
            <div><span style={{ color: ink + '66' }}>FROM &middot; </span>{name} &lt;{(d.url || brand.url).toLowerCase()}&gt;</div>
            <div><span style={{ color: ink + '66' }}>TO &middot; </span>OPERATORS EVERYWHERE</div>
            <div><span style={{ color: ink + '66' }}>SUBJECT &middot; </span><span className="font-bold" style={{ color: d.accentColor }}>{d.title}</span></div>
          </div>
          <div className="px-10 py-8 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              <p className="text-[22px] leading-relaxed max-w-[92%]" style={{ color: ink + 'b3' }}>{d.body}</p>
              <div className="mt-8 space-y-4">
                {stories.map((s, i) => (
                  <div key={i} className="flex items-center gap-5 px-6 py-4" style={{ backgroundColor: ink + '0a', border: `1px solid ${ink}26` }}>
                    <span className="font-mono text-[14px] font-bold shrink-0" style={{ color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-bold text-[21px] tracking-tight truncate" style={{ fontFamily: brand.fonts.heading }}>{s}</span>
                    <span className="ml-auto text-[20px] shrink-0" style={{ color: d.accentColor }}>&rarr;</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 flex justify-between items-center font-mono text-[12px] tracking-[0.15em]" style={{ color: ink + '66' }}>
              <span>{d.date}</span>
              <span>{brand.newsletterNote}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'dispatch') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14 font-mono" style={{ backgroundColor: d.bgColor, color: ink }}>
        <div className="w-full h-full flex flex-col px-14 py-12" style={{ border: `3px double ${ink}` }}>
          <div className="text-center">
            <div className="text-[34px] font-bold tracking-[0.35em]">{name} DISPATCH</div>
            <div className="mt-3 text-[13px] tracking-[0.25em]" style={{ color: ink + '8c' }}>RECEIVED {d.date} &middot; ISSUE NO. {d.metric}</div>
            <div className="mt-5 text-[14px] tracking-[0.3em]" style={{ color: ink + '66' }}>= = = = = = = = = = = = = = = =</div>
          </div>
          <div className="mt-10 flex-1 flex flex-col justify-center">
            <div className="text-[30px] font-bold leading-[1.4] tracking-[0.04em] uppercase">{d.title} <span style={{ color: d.accentColor }}>STOP</span></div>
            <div className="mt-10 space-y-7 text-[19px] leading-[1.6] tracking-[0.02em] uppercase" style={{ color: ink + 'd9' }}>
              {stories.map((s, i) => (
                <div key={i}>{s} <span style={{ color: d.accentColor }}>STOP</span></div>
              ))}
            </div>
            <div className="mt-10 text-[17px] uppercase tracking-[0.04em]" style={{ color: ink + '99' }}>FULL WIRE AT {(d.url || brand.url).toUpperCase()} <span style={{ color: d.accentColor }}>END</span></div>
          </div>
          <div className="text-center text-[12px] tracking-[0.25em]" style={{ color: ink + '66' }}>{brand.signoff.toUpperCase()}</div>
        </div>
      </div>
    )
  }

  if (v === 'post') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-start">
          <div className="pt-6">
            <div className="font-mono text-[13px] tracking-[0.3em]" style={{ color: ink + '80' }}>FROM &middot; {name}</div>
            <div className="mt-6 text-[38px] italic leading-snug" style={{ fontFamily: brand.fonts.serif }}>To: Operators everywhere</div>
            <div className="mt-2 w-[420px]" style={{ height: 1.5, backgroundColor: ink + '59' }} />
          </div>
          <div className="relative shrink-0">
            <div className="p-4" style={{ border: `3px dashed ${ink}59`, backgroundColor: mixHex(d.bgColor, d.accentColor, 0.08) }}>
              <BrandSeal brand={brand} tone={d.accentColor} size={130} />
              <div className="mt-2 text-center font-mono text-[10px] tracking-[0.3em]" style={{ color: ink + '8c' }}>FIRST CLASS</div>
            </div>
            <div className="absolute -left-24 top-8 w-28 h-28 rounded-full flex items-center justify-center -rotate-12" style={{ border: `2px solid ${ink}59` }}>
              <div className="text-center font-mono text-[11px] tracking-[0.15em] leading-relaxed" style={{ color: ink + '8c' }}>ISSUE<br />{d.metric}<br />{(d.date || '').split(' ')[0]}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-[54px] leading-[1.1] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="mt-7 text-[21px] leading-relaxed max-w-[84%]" style={{ color: ink + 'b3' }}>{d.body}</p>
          <div className="mt-10 space-y-4">
            {stories.map((s, i) => (
              <div key={i} className="flex items-center gap-5 text-[21px]" style={{ color: ink + 'd9' }}>
                <span className="shrink-0 w-7" style={{ height: 3, backgroundColor: d.accentColor }} />
                {s}
              </div>
            ))}
          </div>
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <span>{brand.newsletterNote}</span>
        </div>
      </div>
    )
  }

  if (v === 'ledger') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>{name} &middot; ISSUE NO. {d.metric}</span>
            <span>{d.date}</span>
          </div>
          <div className="relative mt-10">
            <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '66' }}>THIS ISSUE</div>
            <h1 className="mt-4 text-[48px] leading-[1.12] tracking-tight max-w-[94%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          </div>
          <div className="relative mt-10 flex-1">
            {stories.map((s, i) => (
              <div key={i} className="flex items-center gap-8 py-5" style={{ borderTop: `1px solid ${ink}33`, borderBottom: i === stories.length - 1 ? `1px solid ${ink}33` : 'none' }}>
                <span className="font-black text-[30px] leading-none w-14 shrink-0" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[24px] font-bold tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{s}</span>
              </div>
            ))}
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'marquee') {
    const words = name.split(/\s+/)
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark}</span>
          <span>{d.date}</span>
        </div>
        <div className="mt-10">
          {words.map((w, i) => (
            <div key={i} className="font-black leading-[0.92] tracking-tight text-[148px]" style={{ fontFamily: brand.fonts.display, color: i === words.length - 1 ? d.accentColor : ink }}>{w.toUpperCase()}</div>
          ))}
          <div className="mt-6 inline-flex px-5 py-2.5 font-mono text-[14px] font-bold tracking-[0.3em]" style={{ backgroundColor: ink, color: d.bgColor }}>ISSUE {d.metric}</div>
        </div>
        <div className="flex-1 flex flex-col justify-end">
          <LedgerRule color={ink} />
          <h1 className="mt-8 text-[44px] leading-[1.12] tracking-tight max-w-[94%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[15px] tracking-[0.1em] uppercase" style={{ color: ink + '99' }}>
            {stories.map((s, i) => (
              <span key={i}><span style={{ color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span> {s}</span>
            ))}
          </div>
        </div>
        <LedgerRule color={ink + '66'} className="mt-8" />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body, color: d.textColor }}>
      <div className="border-t-4 border-b pb-6 pt-7 flex items-end justify-between" style={{ borderColor: d.textColor }}>
        <div>
          <div className="font-black text-[56px] leading-none tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.subtitle}</div>
          <div className="font-mono text-[13px] tracking-[0.3em] mt-3" style={{ color: d.accentColor }}>ISSUE {d.metric} · {d.date}</div>
        </div>
        <LogoImg brand={brand} src={d.logoSrc} tone={d.textColor} className="h-10 mb-1" />
      </div>
      <div className="mt-12">
        <div className="w-14 h-1.5 mb-6" style={{ backgroundColor: d.accentColor }} />
        <h1 className="font-extrabold text-[62px] leading-[1.05] tracking-tight max-w-[90%]" style={{ fontFamily: brand.fonts.serif }}>{d.title}</h1>
        <p className="text-[22px] leading-relaxed mt-7 max-w-[82%]" style={{ color: d.textColor + 'b3' }}>{d.body}</p>
      </div>
      <div className="mt-12 flex-1">
        <div className="font-mono text-[12px] font-bold tracking-[0.3em] mb-2" style={{ color: d.textColor + '66' }}>IN THIS ISSUE</div>
        {stories.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-6 border-t" style={{ borderColor: d.textColor + '26' }}>
            <div className="flex items-center gap-8 min-w-0">
              <span className="font-mono text-[15px] font-bold shrink-0" style={{ color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="font-bold text-[26px] tracking-tight truncate" style={{ fontFamily: brand.fonts.heading }}>{s}</span>
            </div>
            <span className="text-[26px] shrink-0" style={{ color: d.accentColor }}>&rarr;</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-6 flex items-center justify-between" style={{ borderColor: d.textColor }}>
        <span className="font-mono text-[13px] tracking-[0.2em]" style={{ color: d.textColor + '80' }}>{(d.url || brand.url).toUpperCase()}</span>
        <span className="font-mono text-[11px] tracking-[0.12em]" style={{ color: d.textColor + '4d' }}>{brand.newsletterNote}</span>
      </div>
    </div>
  )
}

/* ─── The operator's ledger series — original Moguls-era templates.
   Financial-document details (hairline double rules, folio numbers, a stamped
   seal), serif editorial headlines, roll-up-door slat textures, restrained
   gold. Not a Prescott layout among them. ─── */

// Brand seal, exportable as its own artifact.
export function TplSeal({ d, brand }) {
  const tone = d.variant === 'ink' ? d.textColor : d.variant === 'accent' ? d.accentColor : d.variant === 'gold' ? 'gold' : 'blue'
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <BrandSeal brand={brand} tone={tone} size={620} topText={d.title} bottomText={d.subtitle} />
      <div className="mt-12 font-mono text-[15px] tracking-[0.4em] uppercase" style={{ color: d.textColor + '99' }}>{brand.tagline}</div>
    </div>
  )
}

// Telemetry for operators: one insight headline, the chart that proves it,
// ledger rules and a delta chip. Six forms — bars, line, area, ranked rows,
// donut (composition), and lollipop dots — all drawn in-house, single accent.
export function TplChart({ d, brand }) {
  let data = []
  try {
    const parsed = JSON.parse(d.dataJson || '[]')
    if (Array.isArray(parsed)) data = parsed.filter(r => r && typeof r.value === 'number').slice(0, 16)
  } catch { /* invalid JSON renders the empty state */ }
  const maxV = Math.max(...data.map(r => r.value), 1)
  const CW = 940, CH = 380
  const variant = ['bars', 'line', 'area', 'rows', 'donut', 'dots'].includes(d.variant) ? d.variant : 'bars'
  const px = (i) => data.length > 1 ? (i * CW) / (data.length - 1) : CW / 2
  const bw = Math.min(72, (CW / Math.max(data.length, 1)) * 0.58)

  const gridAxis = (
    <>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line x1="0" y1={CH - CH * f} x2={CW} y2={CH - CH * f} stroke={d.textColor + '26'} strokeWidth="1" strokeDasharray="2,6" />
          <text x="-14" y={CH - CH * f + 4} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="13" fill={d.textColor + '66'}>{Math.round(maxV * f)}</text>
        </g>
      ))}
      <line x1="0" y1={CH} x2={CW} y2={CH} stroke={d.textColor} strokeWidth="2" />
    </>
  )
  const xLabel = (i, r) => (
    <text x={px(i)} y={CH + 30} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="1.5" fill={d.textColor + '80'}>{String(r.label ?? i + 1).toUpperCase()}</text>
  )

  let chart
  if (variant === 'line' || variant === 'area') {
    const pts = data.map((r, i) => `${px(i)},${CH - (r.value / maxV) * CH}`).join(' ')
    chart = (
      <svg viewBox={`-56 -20 ${CW + 112} ${CH + 76}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {gridAxis}
        <polygon points={`0,${CH} ${pts} ${CW},${CH}`} fill={d.accentColor + (variant === 'area' ? '40' : '1f')} />
        <polyline points={pts} fill="none" stroke={d.accentColor} strokeWidth={variant === 'area' ? 3 : 3.5} strokeLinejoin="round" />
        {data.map((r, i) => {
          const y = CH - (r.value / maxV) * CH
          const last = i === data.length - 1
          const showDot = variant === 'line' || last || i === 0
          return (
            <g key={i}>
              {showDot && <circle cx={px(i)} cy={y} r={last ? 7 : 4.5} fill={last ? d.accentColor : d.bgColor} stroke={d.accentColor} strokeWidth="2.5" />}
              {(last || i === 0) && <text x={px(i)} y={y - 16} textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="17" fill={d.textColor}>{r.value}</text>}
              {xLabel(i, r)}
            </g>
          )
        })}
      </svg>
    )
  } else if (variant === 'dots') {
    chart = (
      <svg viewBox={`-56 -20 ${CW + 112} ${CH + 76}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {gridAxis}
        {data.map((r, i) => {
          const y = CH - (r.value / maxV) * CH
          const last = i === data.length - 1
          return (
            <g key={i}>
              <line x1={px(i)} y1={CH} x2={px(i)} y2={y + 10} stroke={last ? d.accentColor : d.textColor + '4d'} strokeWidth="3" />
              <circle cx={px(i)} cy={y} r="10" fill={last ? d.accentColor : d.bgColor} stroke={last ? d.accentColor : d.textColor + '99'} strokeWidth="3" />
              <text x={px(i)} y={y - 18} textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight={last ? 700 : 400} fontSize="15" fill={last ? d.textColor : d.textColor + '99'}>{r.value}</text>
              {xLabel(i, r)}
            </g>
          )
        })}
      </svg>
    )
  } else if (variant === 'rows') {
    const rows = data.slice(0, 8)
    const step = Math.min(58, (CH + 40) / rows.length)
    const barH = step * 0.52
    const trackW = CW - 200
    chart = (
      <svg viewBox={`0 -10 ${CW + 40} ${rows.length * step + 20}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {rows.map((r, i) => {
          const y = i * step
          const wV = (r.value / maxV) * trackW
          const top = r.value === Math.max(...rows.map(x => x.value))
          return (
            <g key={i}>
              <text x="0" y={y + barH / 2 + 5} fontFamily="ui-monospace, monospace" fontSize="15" letterSpacing="1.5" fill={d.textColor + 'b3'}>{String(r.label ?? i + 1).toUpperCase()}</text>
              <rect x="150" y={y} width={trackW} height={barH} fill={d.textColor + '14'} />
              <rect x="150" y={y} width={wV} height={barH} fill={top ? d.accentColor : d.textColor + '59'} />
              <text x={158 + wV + 8} y={y + barH / 2 + 5} fontFamily="ui-monospace, monospace" fontWeight={top ? 700 : 400} fontSize="15" fill={top ? d.textColor : d.textColor + '99'}>{r.value}</text>
            </g>
          )
        })}
      </svg>
    )
  } else if (variant === 'donut') {
    const slices = data.slice(0, 7)
    const total = slices.reduce((a, r) => a + r.value, 0) || 1
    const R = 130, TH = 52, C = 2 * Math.PI * R
    const maxIdx = slices.reduce((mi, r, i) => (r.value > slices[mi].value ? i : mi), 0)
    const inkOps = ['b3', '8c', '66', '4d', '3b', '2b']
    const sliceColor = (i) => i === maxIdx ? d.accentColor : d.textColor + inkOps[Math.min(i < maxIdx ? i : i - 1, inkOps.length - 1)]
    // running start offsets, computed without mutating closures
    const segs = slices.reduce((arr, r) => {
      const prev = arr[arr.length - 1]
      arr.push({ ...r, start: prev ? prev.start + prev.value : 0 })
      return arr
    }, [])
    chart = (
      <svg viewBox={`0 0 ${CW} 420`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(225, 210)">
          {segs.map((r, i) => (
            <circle key={i} r={R} fill="none" stroke={sliceColor(i)} strokeWidth={TH}
              strokeDasharray={`${Math.max((r.value / total) * C - 4, 1)} ${C}`}
              transform={`rotate(${(r.start / total) * 360 - 90})`} />
          ))}
          <text y="-4" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="44" fill={d.textColor}>{total}</text>
          <text y="28" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="3" fill={d.textColor + '80'}>TOTAL</text>
        </g>
        {segs.map((r, i) => {
          const y = 210 - (segs.length * 44) / 2 + i * 44 + 16
          return (
            <g key={i}>
              <rect x="480" y={y - 12} width="16" height="16" fill={sliceColor(i)} />
              <text x="512" y={y + 2} fontFamily="ui-monospace, monospace" fontSize="16" letterSpacing="1.5" fill={d.textColor + 'b3'}>{String(r.label ?? i + 1).toUpperCase()}</text>
              <text x={CW - 20} y={y + 2} textAnchor="end" fontFamily="ui-monospace, monospace" fontWeight={i === maxIdx ? 700 : 400} fontSize="16" fill={i === maxIdx ? d.textColor : d.textColor + '99'}>{r.value} &middot; {Math.round((r.value / total) * 100)}%</text>
            </g>
          )
        })}
      </svg>
    )
  } else {
    chart = (
      <svg viewBox={`-56 -20 ${CW + 112} ${CH + 76}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {gridAxis}
        {data.map((r, i) => {
          const bh = (r.value / maxV) * CH
          const x = data.length > 1 ? (i * CW) / data.length + (CW / data.length - bw) / 2 : (CW - bw) / 2
          const last = i === data.length - 1
          return (
            <g key={i}>
              <rect x={x} y={CH - bh} width={bw} height={bh} fill={last ? d.accentColor : d.textColor + '21'} stroke={last ? 'none' : d.textColor + '4d'} strokeWidth="1" />
              <text x={x + bw / 2} y={CH - bh - 12} textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight={last ? 700 : 400} fontSize="16" fill={last ? d.textColor : d.textColor + '99'}>{r.value}</text>
              <text x={x + bw / 2} y={CH + 30} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="1.5" fill={d.textColor + '80'}>{String(r.label ?? i + 1).toUpperCase()}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag={d.subtitle} />
      <LedgerRule color={d.textColor} className="mt-5" />
      <div className="flex items-end justify-between mt-10 gap-10">
        <h1 className="text-[58px] leading-[1.06] tracking-tight max-w-[70%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        <div className="text-right shrink-0">
          <div className="px-5 py-2 inline-block font-mono text-[24px] font-bold tracking-[0.08em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.metric}</div>
          <div className="font-mono text-[13px] tracking-[0.25em] mt-3" style={{ color: d.textColor + '80' }}>{d.date}</div>
        </div>
      </div>
      <div className="flex-1 mt-10 min-h-0">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-[13px] tracking-[0.25em] border border-dashed" style={{ color: d.textColor + '59', borderColor: d.textColor + '33' }}>ADD JSON DATA IN THE CONTENT TAB</div>
        ) : chart}
      </div>
      <LedgerRule color={d.textColor + '66'} className="mt-8" />
      <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.18em] uppercase" style={{ color: d.textColor + '8c' }}>
        <span className="max-w-[70%]">{d.body}</span>
        <span>{(d.url || brand.url).toUpperCase()}</span>
      </div>
    </div>
  )
}

// One number, set like a ledger total. Seal-stamped.
// Big number: eight ways to land one stat. The default is the ledger total;
// the rest re-stage the same figure as a counter, a sum, a roundel, and so on.
export function TplBigNumber({ d, brand }) {
  const v = ['total', 'outline', 'counter', 'sum', 'roundel', 'split', 'ghost', 'delta'].includes(d.variant) ? d.variant : 'total'
  const ink = d.textColor
  const footer = (
    <>
      <LedgerRule color={ink + '66'} />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
        <span>{(d.url || brand.url).toUpperCase()}</span>
        <span>{d.date}</span>
      </div>
    </>
  )

  if (v === 'outline') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark}</span>
          <span style={{ color: d.accentColor }}>{d.subtitle}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="font-black leading-none tracking-tight text-[340px]" style={{ fontFamily: brand.fonts.display, color: 'transparent', WebkitTextStroke: `5px ${d.accentColor}` }}>{d.metric}</div>
        </div>
        <h2 className="text-[42px] leading-[1.12] tracking-tight max-w-[88%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
        <p className="text-[19px] leading-relaxed mt-4 mb-8 max-w-[72%]" style={{ color: ink + '99' }}>{d.body}</p>
        {footer}
      </div>
    )
  }

  if (v === 'counter') {
    const chars = (d.metric || '').split('')
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-mono text-[13px] tracking-[0.4em]" style={{ color: ink + '8c' }}>THE COUNTER READS</div>
          <div className="mt-8 flex gap-3">
            {chars.map((c, i) => (
              <div key={i} className="relative w-[110px] py-6 text-center overflow-hidden" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.07), border: `2px solid ${ink}40`, borderRadius: 10, boxShadow: `0 12px 24px ${mixHex(d.bgColor, '#000000', 0.5)}59` }}>
                <div className="absolute inset-x-0 top-1/2" style={{ height: 1.5, backgroundColor: ink + '33' }} />
                <span className="relative font-black leading-none text-[96px]" style={{ fontFamily: brand.fonts.display, color: /\d/.test(c) ? d.accentColor : ink }}>{c}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-11 text-[38px] leading-[1.15] tracking-tight text-center max-w-[82%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
          <p className="mt-4 text-[18px] leading-relaxed text-center max-w-[64%]" style={{ color: ink + '99' }}>{d.body}</p>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'sum') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>{d.subtitle} &middot; RUNNING TOTAL</span>
            <span>{d.date}</span>
          </div>
          <div className="relative flex-1 flex flex-col justify-center">
            <div className="flex items-baseline font-mono text-[19px]" style={{ color: ink + 'a6' }}>
              <span className="shrink-0 max-w-[72%]">{d.title}</span>
              <span className="flex-1 mx-4" style={{ borderBottom: `2px dotted ${ink}40`, transform: 'translateY(-5px)' }} />
              <span className="shrink-0" style={{ color: ink + '66' }}>&hellip;</span>
            </div>
            <div className="mt-10" style={{ borderTop: `2px solid ${ink}`, paddingTop: 6 }}>
              <div style={{ borderTop: `1px solid ${ink}80` }} />
            </div>
            <div className="mt-8 flex items-baseline justify-between">
              <span className="font-mono text-[17px] tracking-[0.35em]" style={{ color: ink + '8c' }}>TOTAL</span>
              <span className="font-black leading-none tracking-tight text-[190px]" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{d.metric}</span>
            </div>
            <p className="mt-8 text-[19px] leading-relaxed max-w-[78%]" style={{ color: ink + '99' }}>{d.body}</p>
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'roundel') {
    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i * 6 * Math.PI) / 180
      return <line key={i} x1={Math.cos(a) * 196} y1={Math.sin(a) * 196} x2={Math.cos(a) * (i % 5 === 0 ? 182 : 188)} y2={Math.sin(a) * (i % 5 === 0 ? 182 : 188)} stroke={d.accentColor} strokeWidth={i % 5 === 0 ? 3 : 1.5} opacity={i % 5 === 0 ? 0.9 : 0.5} />
    })
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-20 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[13px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <LedgerRule color={ink} className="w-full mt-5" />
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
          <div className="relative w-[430px] h-[430px] flex items-center justify-center">
            <svg viewBox="-210 -210 420 420" className="absolute inset-0 w-full h-full">
              <circle r="205" fill="none" stroke={d.accentColor} strokeWidth="3" />
              {ticks}
              <circle r="168" fill="none" stroke={d.accentColor} strokeWidth="1.5" opacity="0.6" />
            </svg>
            <div className="font-black leading-none tracking-tight text-[120px]" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{d.metric}</div>
          </div>
          <h2 className="mt-8 text-[38px] leading-[1.15] tracking-tight max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
        </div>
        <div className="w-full">{footer}</div>
      </div>
    )
  }

  if (v === 'split') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-[44%] shrink-0 flex items-center justify-center px-8" style={{ backgroundColor: d.accentColor }}>
          <div className="font-black leading-[0.9] tracking-tight text-[170px] break-words text-center" style={{ fontFamily: brand.fonts.display, color: mixHex(d.accentColor, '#000000', 0.82) }}>{d.metric}</div>
        </div>
        <div className="flex-1 flex flex-col px-14 py-14 min-w-0">
          <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
          <LedgerRule color={ink} className="mt-4" />
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-[46px] leading-[1.12] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
            <p className="text-[20px] leading-relaxed mt-6 max-w-[92%]" style={{ color: ink + '99' }}>{d.body}</p>
          </div>
          {footer}
        </div>
      </div>
    )
  }

  if (v === 'ghost') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="absolute inset-0 flex items-center justify-center leading-none font-black select-none text-[540px] tracking-tight" style={{ fontFamily: brand.fonts.display, color: d.accentColor + '1f' }}>{d.metric}</div>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="relative flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-[62px] leading-[1.1] tracking-tight max-w-[86%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
          <p className="text-[22px] leading-relaxed mt-7 max-w-[66%]" style={{ color: ink + 'a6' }}>{d.body}</p>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'delta') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-8">
            <svg viewBox="0 0 100 100" className="w-[150px] shrink-0">
              <path d="M 50,8 L 92,58 L 66,58 L 66,92 L 34,92 L 34,58 L 8,58 Z" fill={d.accentColor} />
            </svg>
            <div className="font-black leading-[0.9] tracking-tight text-[230px]" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{d.metric}</div>
          </div>
          <h2 className="text-[46px] leading-[1.12] tracking-tight mt-10 max-w-[85%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
          <p className="text-[20px] leading-relaxed mt-5 max-w-[70%]" style={{ color: ink + '99' }}>{d.body}</p>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag={d.subtitle} />
      <LedgerRule color={d.textColor} className="mt-5" />
      <div className="absolute right-14 top-40 opacity-[0.13]"><BrandSeal brand={brand} tone={d.accentColor} size={430} /></div>
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="font-black leading-[0.9] tracking-tight text-[300px]" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{d.metric}</div>
        <div className="w-40 h-[3px] mt-8" style={{ backgroundColor: d.accentColor }} />
        <h2 className="text-[54px] leading-[1.12] tracking-tight mt-8 max-w-[85%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h2>
        <p className="text-[24px] leading-relaxed mt-6 max-w-[70%]" style={{ color: d.textColor + '99' }}>{d.body}</p>
      </div>
      <LedgerRule color={d.textColor + '66'} />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
        <span>{(d.url || brand.url).toUpperCase()}</span>
        <span>{d.date}</span>
      </div>
    </div>
  )
}

// Announcement in four designs: notice (ticker rails), decree (seal-led
// document), poster (display type), wire (mono bulletin). The CTA carries
// data-cta so the PDF export can lay a clickable link over it.
export function TplAnnouncement({ d, brand }) {
  const v = ['notice', 'decree', 'poster', 'wire', 'gate', 'folio', 'marquee', 'split'].includes(d.variant) ? d.variant : 'notice'
  // No label, no button — deck pages (SocialCarouselCanvas) blank the metric.
  const cta = d.metric ? (
    <div data-cta className="inline-block px-9 py-4 font-mono text-[17px] font-bold tracking-[0.2em]"
      style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.metric} &rarr;</div>
  ) : null

  if (v === 'decree') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-24 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <BrandSeal brand={brand} tone={d.accentColor} size={210} />
        <LedgerRule color={d.textColor} className="w-full mt-8" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
          <h1 className="text-[80px] leading-[1.04] tracking-tight mt-8" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="text-[25px] leading-relaxed mt-8 max-w-[80%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
          <div className="mt-11">{cta}</div>
        </div>
        <LedgerRule color={d.textColor + '66'} className="w-full" />
        <div className="w-full flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <span>{d.date}</span>
        </div>
      </div>
    )
  }

  if (v === 'poster') {
    const words = (d.title || '').toUpperCase().split(/\s+/)
    const lines = []
    for (let i = 0; i < words.length; i += 2) lines.push(words.slice(i, i + 2).join(' '))
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={d.textColor} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center min-h-0">
          {lines.map((l, i) => (
            <div key={i} className="font-black leading-[0.96] tracking-tight" style={{ fontFamily: brand.fonts.display, fontSize: 122, color: i === lines.length - 1 ? d.accentColor : d.textColor }}>{l}</div>
          ))}
          <div className="w-36 h-[5px] mt-9" style={{ backgroundColor: d.accentColor }} />
          <p className="text-[24px] leading-relaxed mt-7 max-w-[70%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
        </div>
        <div className="flex items-end justify-between">
          {cta}
          <div className="text-right font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
            <div>{d.date}</div>
            <div className="mt-1" style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'wire') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="flex items-center justify-between px-16 py-5" style={{ backgroundColor: d.textColor, color: d.bgColor }}>
          <span className="font-mono text-[14px] font-bold tracking-[0.3em]">&#9632; {d.subtitle}</span>
          <span className="font-mono text-[13px] tracking-[0.25em]">{d.date}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-20">
          <div className="font-mono text-[13px] tracking-[0.3em]" style={{ color: d.accentColor }}>FROM THE DESK OF {brand.wordmark}</div>
          <h1 className="text-[76px] leading-[1.06] tracking-tight mt-7 max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="my-9" style={{ height: 1, borderTop: `2px dashed ${d.textColor}40` }} />
          <p className="text-[26px] leading-relaxed max-w-[85%]" style={{ color: d.textColor + 'b3' }}>{d.body}</p>
          <div className="mt-11 flex items-center gap-6">
            {cta}
            <span className="font-mono text-[13px] tracking-[0.2em]" style={{ color: d.textColor + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
        <div className="px-16 pb-10">
          <div style={{ height: 1, borderTop: `2px dashed ${d.textColor}40` }} />
          <div className="flex justify-between items-center pt-4 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: d.textColor + '73' }}>
            <span>{brand.tagline}</span>
            <BrandSeal brand={brand} tone={d.textColor + '99'} size={56} />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'gate') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        {/* the roll-up door, half lifted */}
        <div className="relative shrink-0" style={{ height: '30%' }}>
          <DoorSlats color={d.textColor + '26'} count={8} className="absolute inset-0 w-full h-full" />
          <div className="absolute left-16 top-8 font-mono text-[13px] tracking-[0.35em]" style={{ color: d.textColor + '99' }}>UNIT 001 · {d.date}</div>
        </div>
        <div className="relative shrink-0" style={{ height: 16, backgroundColor: d.textColor }}>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-28 h-6 rounded-b-md" style={{ backgroundColor: d.textColor }} />
        </div>
        {/* what the lifted door reveals */}
        <div className="flex-1 flex flex-col justify-center px-20">
          <div className="font-mono text-[14px] tracking-[0.4em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="text-[78px] leading-[1.04] tracking-tight mt-7 max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="text-[25px] leading-relaxed mt-8 max-w-[80%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
          <div className="mt-11">{cta}</div>
        </div>
        <div className="px-20 pb-10">
          <LedgerRule color={d.textColor + '66'} />
          <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: d.textColor + '8c' }}>
            <span>{(d.url || brand.url).toUpperCase()}</span>
            <span>{brand.tagline}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'folio') {
    const corner = (pos, sx, sy) => (
      <path key={pos} d={`M ${sx > 0 ? 0 : 100},${sy > 0 ? 11 : 89} L ${sx > 0 ? 0 : 100},${sy > 0 ? 0 : 100} L ${sx > 0 ? 13 : 87},${sy > 0 ? 0 : 100}`} fill="none" stroke={d.textColor} strokeWidth="1.6" />
    )
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full" style={{ border: `2px solid ${d.textColor}` }}>
          <div className="absolute inset-[7px]" style={{ border: `1px solid ${d.textColor}80` }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none">
            {corner('tl', 1, 1)}{corner('tr', -1, 1)}{corner('bl', 1, -1)}{corner('br', -1, -1)}
          </svg>
          <div className="relative h-full flex flex-col px-16 py-14">
            <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: d.textColor + '99' }}>
              <span>MEMO · NO. 001</span>
              <span>{d.date}</span>
            </div>
            <div className="mt-8 space-y-2 font-mono text-[14px] tracking-[0.18em] uppercase">
              <div><span style={{ color: d.textColor + '66' }}>FROM · </span>{brand.wordmark}</div>
              <div><span style={{ color: d.textColor + '66' }}>RE · </span><span style={{ color: d.accentColor }}>{d.subtitle}</span></div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-[68px] leading-[1.08] tracking-tight max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
              <p className="text-[24px] leading-relaxed mt-7 max-w-[85%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
              <div className="mt-10">{cta}</div>
            </div>
            <div className="flex items-end justify-between">
              <div className="w-[280px]">
                <div style={{ height: 1.5, backgroundColor: d.textColor + '99' }} />
                <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: d.textColor + '80' }}>{brand.signoff}</div>
              </div>
              <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'marquee') {
    const words = (d.title || '').toUpperCase().split(/\s+/)
    const lines = []
    for (let i = 0; i < words.length; i += 2) lines.push(words.slice(i, i + 2).join(' '))
    const bulbs = (
      <div className="flex justify-between px-2">
        {Array.from({ length: 15 }, (_, i) => <span key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: i % 2 ? d.accentColor : d.accentColor + '59' }} />)}
      </div>
    )
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="w-full max-w-[880px] py-8" style={{ border: `3px solid ${d.textColor}` }}>
          {bulbs}
          <div className="text-center px-12 py-10">
            <div className="font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&#9733; {d.subtitle} &#9733;</div>
            <div className="mt-8">
              {lines.map((l, i) => (
                <div key={i} className="font-black leading-[0.98] tracking-tight" style={{ fontFamily: brand.fonts.display, fontSize: 96, color: i === lines.length - 1 ? d.accentColor : d.textColor }}>{l}</div>
              ))}
            </div>
            <p className="text-[22px] leading-relaxed mt-8 max-w-[85%] mx-auto" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
            <div className="mt-9">{cta}</div>
            <div className="font-mono text-[12px] tracking-[0.3em] mt-8 uppercase" style={{ color: d.textColor + '8c' }}>{d.date} · {(d.url || brand.url).toUpperCase()}</div>
          </div>
          {bulbs}
        </div>
      </div>
    )
  }

  if (v === 'split') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-[30%] shrink-0 flex flex-col items-center justify-between py-14" style={{ backgroundColor: d.accentColor }}>
          <div className="flex-1 flex items-center">
            <div className="font-black tracking-[0.2em] whitespace-nowrap -rotate-90 text-[64px] leading-none" style={{ fontFamily: brand.fonts.display, color: mixHex(d.accentColor, '#000000', 0.8) }}>{d.subtitle}</div>
          </div>
          <BrandSeal brand={brand} tone={mixHex(d.accentColor, '#ffffff', 0.85)} size={130} />
        </div>
        <div className="flex-1 flex flex-col px-16 py-16">
          <div className="font-mono text-[13px] tracking-[0.3em]" style={{ color: d.textColor + '80' }}>{d.date}</div>
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-[72px] leading-[1.06] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <p className="text-[24px] leading-relaxed mt-8 max-w-[92%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
            <div className="mt-10">{cta}</div>
          </div>
          <LedgerRule color={d.textColor + '66'} />
          <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: d.textColor + '8c' }}>
            <span>{(d.url || brand.url).toUpperCase()}</span>
            <span>{brand.tagline}</span>
          </div>
        </div>
      </div>
    )
  }

  // notice: official announcement between ticker rails
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div className="shrink-0 pt-8 px-0">
        <LedgerRule color={d.textColor} className="mx-16" />
        <TickerRail brand={brand} color={d.textColor + '4d'} className="py-3 px-16" />
        <div style={{ height: 1, backgroundColor: d.textColor, opacity: 0.5 }} className="mx-16" />
      </div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-24">
        <div className="font-mono text-[15px] tracking-[0.45em] mb-10" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <h1 className="text-[86px] leading-[1.02] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        <p className="text-[26px] leading-relaxed mt-10 max-w-[75%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
        <div className="mt-12">{cta}</div>
      </div>
      <div className="relative z-10 shrink-0 pb-10 px-16">
        <LedgerRule color={d.textColor + '66'} />
        <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <BrandSeal brand={brand} tone={d.textColor + '99'} size={72} />
          <span>{d.date}</span>
        </div>
      </div>
    </div>
  )
}

// Numbered operator report cover: folio chip, abstract, figure plate.
export function TplReport({ d, brand }) {
  const img = d.uploadedImage || d.generatedImage
  const v = ['plate', 'journal', 'memo', 'annual', 'binder', 'thesis', 'tabs', 'redacted'].includes(d.variant) ? d.variant : 'plate'
  const ink = d.textColor
  const footer = (
    <>
      <LedgerRule color={ink + '66'} />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
        <span>{(d.url || brand.url).toUpperCase()}</span>
        <span>{brand.signoff.toUpperCase()}</span>
      </div>
    </>
  )

  if (v === 'journal') {
    const year = ((d.metric || '').match(/\d{4}/) || ['2026'])[0]
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16 text-center" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[13px] tracking-[0.35em] uppercase" style={{ color: ink + '99' }}>THE {brand.wordmark} JOURNAL OF SELF-STORAGE</div>
        <div className="mt-3 font-mono text-[12px] tracking-[0.25em]" style={{ color: d.accentColor }}>{d.metric}</div>
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-[58px] leading-[1.12] tracking-tight max-w-[92%] mx-auto" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-7 font-mono text-[14px] tracking-[0.2em]" style={{ color: ink + '99' }}>{d.author}</div>
          <div className="mt-11 mx-auto max-w-[78%] px-10 py-8 text-left" style={{ border: `1.5px solid ${ink}40` }}>
            <div className="font-mono text-[12px] tracking-[0.35em] mb-4" style={{ color: d.accentColor }}>ABSTRACT</div>
            <p className="text-[19px] leading-[1.7]" style={{ color: ink + 'cc' }}>{d.body}</p>
          </div>
        </div>
        <div className="font-mono text-[12px] tracking-[0.08em] pb-4" style={{ color: ink + '73' }}>
          {(d.author || '').split(/\s*·\s*/)[0]} ({year}). <span className="italic">{d.title}</span>. {(d.url || brand.url).toLowerCase()}
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span>{d.subtitle}</span>
          <span>{brand.signoff.toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'memo') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex items-center justify-between pb-5" style={{ borderBottom: `3px double ${ink}` }}>
          <span className="font-mono text-[15px] font-bold tracking-[0.35em]">MEMORANDUM</span>
          <LogoImg brand={brand} src={d.logoSrc} tone={ink} className="h-7" />
        </div>
        <div className="mt-8 space-y-3 font-mono text-[15px] tracking-[0.12em] uppercase">
          <div><span style={{ color: ink + '66' }}>TO &middot; </span>ALL OPERATORS</div>
          <div><span style={{ color: ink + '66' }}>FROM &middot; </span>{d.author}</div>
          <div><span style={{ color: ink + '66' }}>RE &middot; </span><span className="font-bold" style={{ color: d.accentColor }}>{d.title}</span></div>
          <div><span style={{ color: ink + '66' }}>REF &middot; </span>{d.metric}</div>
        </div>
        <div className="my-7" style={{ height: 1.5, backgroundColor: ink + '40' }} />
        <div className="flex-1">
          <p className="text-[27px] leading-[1.65] max-w-[94%]" style={{ color: ink + 'd9' }}>{d.body}</p>
          <div className="mt-10 inline-flex px-5 py-2.5 font-mono text-[13px] font-bold tracking-[0.25em]" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>ACTION &middot; READ IN FULL</div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'annual') {
    const parts = (d.metric || '').split(/\s*·\s*/)
    const big = parts[parts.length - 1] || d.metric
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-black leading-[0.88] tracking-tight text-[220px]" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{big}</div>
          <div className="w-40 h-[3px] mt-8" style={{ backgroundColor: d.accentColor }} />
          <h1 className="text-[52px] leading-[1.1] tracking-tight mt-8 max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="text-[20px] leading-relaxed mt-6 max-w-[76%]" style={{ color: ink + '99' }}>{d.body}</p>
          <div className="mt-8 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>PREPARED BY {(d.author || '').toUpperCase()}</div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'binder') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-[110px] shrink-0 relative flex flex-col items-center justify-around py-16" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.06), borderRight: `2px solid ${ink}40` }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="w-9 h-9 rounded-full" style={{ backgroundColor: d.bgColor, border: `3px solid ${ink}59`, boxShadow: `inset 2px 2px 4px ${ink}33` }} />
          ))}
        </div>
        <div className="flex-1 flex flex-col px-14 py-16 min-w-0">
          <div className="self-start px-5 py-2.5 font-mono text-[13px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>{d.subtitle}</div>
          <div className="mt-4 font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '8c' }}>{d.metric}</div>
          <h1 className="text-[58px] leading-[1.08] tracking-tight mt-7" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="text-[20px] leading-relaxed mt-7 max-w-[92%]" style={{ color: ink + '99' }}>{d.body}</p>
          <div className="mt-auto">
            <div className="font-mono text-[12px] tracking-[0.3em] mb-2" style={{ color: d.accentColor }}>PREPARED BY</div>
            <div className="text-[19px] font-semibold">{d.author}</div>
          </div>
          <div className="mt-8">{footer}</div>
        </div>
      </div>
    )
  }

  if (v === 'thesis') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-24 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="text-[24px] font-bold tracking-[0.08em]" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}<span style={{ color: d.accentColor }}>.</span></div>
        <div className="mt-2 font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: ink + '8c' }}>{brand.masthead}</div>
        <LedgerRule color={ink} className="w-[46%] mt-6" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-mono text-[13px] tracking-[0.45em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="mt-8 text-[56px] leading-[1.15] tracking-tight max-w-[88%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-12 font-mono text-[12px] tracking-[0.35em]" style={{ color: ink + '66' }}>A REPORT PREPARED BY</div>
          <div className="mt-3 text-[22px] font-semibold">{d.author}</div>
        </div>
        <BrandSeal brand={brand} tone={d.accentColor} size={120} />
        <div className="mt-6 font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>{d.metric} &middot; {(d.url || brand.url).toUpperCase()}</div>
      </div>
    )
  }

  if (v === 'tabs') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex-1 flex flex-col px-20 py-16 min-w-0">
          <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.metric} />
          <LedgerRule color={ink} className="mt-5" />
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="text-[60px] leading-[1.08] tracking-tight mt-5 max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <p className="text-[20px] leading-relaxed mt-7 max-w-[86%]" style={{ color: ink + '99' }}>{d.body}</p>
            <div className="mt-9 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>PREPARED BY {(d.author || '').toUpperCase()}</div>
          </div>
          {footer}
        </div>
        <div className="w-[86px] shrink-0 flex flex-col justify-center gap-3 pr-5">
          {['01', '02', '03', '04', '05'].map((t, i) => (
            <div key={t} className="py-7 flex items-center justify-center rounded-l-xl font-mono text-[14px] font-bold tracking-[0.15em]"
              style={i === 0
                ? { backgroundColor: d.accentColor, color: '#FFFFFF' }
                : { backgroundColor: mixHex(d.bgColor, ink, 0.06), color: ink + '8c', border: `1px solid ${ink}26`, borderRight: 'none' }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (v === 'redacted') {
    const words = (d.body || '').split(/\s+/)
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '99' }}>
          <span>{brand.masthead.toUpperCase()} &middot; {d.metric}</span>
          <span className="px-3 py-1.5 border-2 font-bold -rotate-2" style={{ borderColor: d.accentColor, color: d.accentColor }}>DECLASSIFIED</span>
        </div>
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle} &middot; FOR SUBSCRIBERS ONLY</div>
          <h1 className="text-[58px] leading-[1.1] tracking-tight mt-5 max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="text-[24px] leading-[1.75] mt-9 max-w-[94%]" style={{ color: ink + 'cc' }}>
            {words.map((w, i) => hash01(i, 17) < 0.28 && w.length > 3
              ? <span key={i}><span className="rounded-sm select-none" style={{ backgroundColor: ink, color: 'transparent' }}>{w}</span>{' '}</span>
              : <span key={i}>{w} </span>)}
          </p>
          <div className="mt-9 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>FULL REPORT UNREDACTED AT {(d.url || brand.url).toUpperCase()}</div>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div className="flex items-center justify-between">
        <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} />
        <div className="px-4 py-2 border font-mono text-[14px] tracking-[0.2em]" style={{ borderColor: d.textColor, color: d.textColor }}>{d.metric}</div>
      </div>
      <LedgerRule color={d.textColor} className="mt-5" />
      <div className="font-mono text-[13px] tracking-[0.35em] mt-10" style={{ color: d.accentColor }}>{d.subtitle}</div>
      <h1 className="text-[76px] leading-[1.04] tracking-tight mt-4 max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
      <div className="flex gap-14 mt-12 flex-1 min-h-0">
        <div className="flex-1">
          <div className="font-mono text-[12px] tracking-[0.3em] font-bold mb-4" style={{ color: d.accentColor }}>SUMMARY</div>
          <p className="text-[23px] leading-[1.6]" style={{ color: d.textColor + 'cc' }}>{d.body}</p>
          <div className="mt-10">
            <div className="font-mono text-[12px] tracking-[0.3em] mb-2" style={{ color: d.accentColor }}>PREPARED BY</div>
            <div className="text-[19px] font-semibold">{d.author}</div>
          </div>
        </div>
        <div className="w-[320px] shrink-0 flex flex-col">
          <div className="flex-1 border relative overflow-hidden flex items-center justify-center" style={{ borderColor: d.textColor + '40' }}>
            {img
              ? <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
              : (
                <>
                  <DoorSlats color={d.textColor + '1f'} count={18} className="absolute inset-0 w-full h-full" />
                  <BrandSeal brand={brand} tone={d.accentColor} size={200} className="relative z-10" />
                </>
              )}
          </div>
          <div className="font-mono text-[11px] tracking-[0.2em] mt-3 uppercase" style={{ color: d.textColor + '73' }}>Plate 01 · {d.subtitle}</div>
        </div>
      </div>
      <LedgerRule color={d.textColor + '66'} className="mt-10" />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
        <span>{(d.url || brand.url).toUpperCase()}</span>
        <span>{brand.signoff.toUpperCase()}</span>
      </div>
    </div>
  )
}

// New-episode notice: outlined episode numeral, slat spine, platform row.
export function TplPodcastAnnounce({ d, brand }) {
  const platforms = (d.features || '').split('\n').filter(Boolean)
  const v = ['numeral', 'studio', 'player', 'onair', 'wave', 'ticket', 'ledger', 'marquee', 'cassette', 'vu', 'dial', 'transcript'].includes(d.variant) ? d.variant : 'numeral'
  const ink = d.textColor
  // guests arrive as names (comma separated) and/or photos, exactly like the
  // speaking bill — photos are optional and every design stands without them
  const names = (d.author || '').split(',').map(t => t.trim()).filter(Boolean)
  const roles = names.length > 1 ? (d.role || '').split(',').map(t => t.trim()).filter(Boolean) : [d.role || '']
  const photos = [d.uploadedImage, ...(d.uploadedCoHosts || [])].filter(Boolean)
  const count = Math.min(3, Math.max(1, names.length, photos.length))
  const items = Array.from({ length: count }, (_, i) => ({
    name: names[i] || '', role: names.length > 1 ? (roles[i] || '') : (i === 0 ? (roles[0] || '') : ''), photo: photos[i],
  }))
  const avatar = (it, cls = 'w-14 h-14 text-[18px]') => (
    <div className={`${cls} rounded-full border-2 overflow-hidden relative flex items-center justify-center font-bold shrink-0`}
      style={{ borderColor: d.accentColor, color: d.accentColor, fontFamily: brand.fonts.heading }}>
      {it.photo ? <img src={it.photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (it.name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('')}
    </div>
  )
  // the guest strip appears only when there is something to show
  const guestRow = (photos.length > 0 || items.length > 1) ? (
    <div className="flex items-center gap-3">{items.map((it, i) => <div key={i}>{avatar(it)}</div>)}</div>
  ) : null
  const hostBlock = (
    <>
      <div className="text-[26px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
      <div className="font-mono text-[15px] tracking-[0.08em] mt-1" style={{ color: ink + '99' }}>{names.length > 1 ? roles.filter(Boolean).join(' · ') : d.role}</div>
    </>
  )
  const micGlyph = (
    <svg viewBox="0 0 100 130" className="w-24" fill="none" stroke={d.accentColor + '80'} strokeWidth="5" strokeLinecap="round">
      <rect x="35" y="8" width="30" height="58" rx="15" />
      <path d="M 20,55 C 20,85 80,85 80,55" />
      <line x1="50" y1="82" x2="50" y2="105" />
      <line x1="30" y1="115" x2="70" y2="115" />
    </svg>
  )

  if (v === 'cassette') {
    const spool = (cx) => (
      <g transform={`translate(${cx}, 0)`}>
        <circle r="34" fill="none" stroke={ink + '8c'} strokeWidth="3" />
        <circle r="12" fill={ink + '26'} stroke={ink + '8c'} strokeWidth="2" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180
          return <line key={i} x1={Math.cos(a) * 14} y1={Math.sin(a) * 14} x2={Math.cos(a) * 30} y2={Math.sin(a) * 30} stroke={ink + '8c'} strokeWidth="3" />
        })}
      </g>
    )
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-full flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark}</span>
          <span style={{ color: d.accentColor }}>{d.date}</span>
        </div>
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="relative w-[82%] px-8 pt-7 pb-9 rounded-xl" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.06), border: `2px solid ${ink}59`, boxShadow: `0 22px 44px ${mixHex(d.bgColor, '#000000', 0.5)}59` }}>
            {[['top-3 left-3'], ['top-3 right-3'], ['bottom-3 left-3'], ['bottom-3 right-3']].map(([pos], i) => (
              <span key={i} className={`absolute ${pos} w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: ink + '40' }} />
            ))}
            <div className="rounded-md px-6 py-4 text-center" style={{ backgroundColor: mixHex(d.bgColor, d.accentColor, 0.16), border: `1px solid ${ink}33` }}>
              <div className="font-mono text-[11px] tracking-[0.3em]" style={{ color: ink + '99' }}>{d.subtitle} &middot; EP {d.metric}</div>
              <div className="mt-2 text-[26px] font-bold leading-[1.2] tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.title}</div>
            </div>
            <svg viewBox="-160 -50 320 100" className="w-[62%] mx-auto mt-5">
              <rect x="-152" y="-40" width="304" height="80" rx="12" fill="none" stroke={ink + '40'} strokeWidth="2" />
              {spool(-82)}
              {spool(82)}
              <line x1="-42" y1="0" x2="42" y2="0" stroke={ink + '40'} strokeWidth="8" />
            </svg>
            <div className="mt-5 flex justify-between font-mono text-[11px] tracking-[0.25em]" style={{ color: ink + '8c' }}>
              <span>SIDE A</span>
              <span style={{ color: d.accentColor }}>44 MIN</span>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-5">
            {guestRow}
            <div>
              <div className="text-[20px] font-bold leading-tight" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[12px] mt-0.5" style={{ color: ink + '8c' }}>{names.length > 1 ? roles.filter(Boolean).join(' · ') : d.role}</div>
            </div>
          </div>
        </div>
        <div className="w-full">
          <LedgerRule color={ink + '66'} />
          <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span>{platforms.join(' · ')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'vu') {
    const tick = (deg, major) => {
      const a = (deg * Math.PI) / 180
      const r1 = major ? 88 : 92
      const hot = deg <= 45
      return <line key={deg} x1={Math.cos(a) * r1} y1={-Math.sin(a) * r1} x2={Math.cos(a) * 102} y2={-Math.sin(a) * 102} stroke={hot ? d.accentColor : ink + '8c'} strokeWidth={major ? 3 : 1.5} />
    }
    const needleA = (38 * Math.PI) / 180
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={`EP ${d.metric}`} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-[58%] px-10 pt-10 pb-6 rounded-lg" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.05), border: `2px solid ${ink}40` }}>
            <svg viewBox="-115 -115 230 125" className="w-full">
              {[150, 135, 120, 105, 90, 75, 60, 45, 30, 15].map((deg, i) => tick(deg, i % 2 === 0))}
              <path d="M -103,0 A 103,103 0 0 1 103,0" fill="none" stroke={ink + '33'} strokeWidth="1.5" transform="scale(1,-1)" />
              <line x1="0" y1="0" x2={Math.cos(needleA) * 96} y2={-Math.sin(needleA) * 96} stroke={d.accentColor} strokeWidth="4" strokeLinecap="round" />
              <circle r="7" fill={d.accentColor} />
              <text x="-100" y="-4" fill={ink + '8c'} fontSize="13" fontFamily="ui-monospace, monospace">-20</text>
              <text x="78" y="-4" fill={d.accentColor} fontSize="13" fontFamily="ui-monospace, monospace">+3</text>
            </svg>
            <div className="flex justify-between items-center mt-3 font-mono text-[13px] tracking-[0.3em]" style={{ color: ink + '8c' }}>
              <span>VU</span>
              <span style={{ color: d.accentColor }}>IN THE RED</span>
            </div>
          </div>
          <h1 className="mt-9 text-[42px] leading-[1.12] tracking-tight text-center max-w-[86%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-6 flex items-center gap-4">
            {guestRow}
            <span className="text-[19px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</span>
          </div>
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span style={{ color: d.accentColor }}>{d.date}</span>
          <span>{platforms.join(' · ')}</span>
        </div>
      </div>
    )
  }

  if (v === 'dial') {
    const freqs = [88, 92, 96, 100, 104, 108]
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark} RADIO</span>
          <span style={{ color: d.accentColor }}>TUNE IN</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative px-8 pt-9 pb-7 rounded-lg" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.05), border: `2px solid ${ink}40` }}>
            <div className="relative h-16">
              <div className="absolute inset-x-0 top-7" style={{ height: 2, backgroundColor: ink + '59' }} />
              {Array.from({ length: 41 }, (_, i) => (
                <div key={i} className="absolute" style={{ left: `${i * 2.5}%`, top: i % 5 === 0 ? 14 : 20, width: 1.5, height: i % 5 === 0 ? 28 : 16, backgroundColor: ink + (i % 5 === 0 ? '8c' : '40') }} />
              ))}
              {freqs.map((f, i) => (
                <div key={f} className="absolute -top-1 font-mono text-[12px] -translate-x-1/2" style={{ left: `${i * 20}%`, color: ink + '8c' }}>{f}</div>
              ))}
              <div className="absolute -top-3 bottom-0" style={{ left: '62%', width: 3, backgroundColor: d.accentColor, boxShadow: `0 0 14px ${d.accentColor}` }} />
              <div className="absolute -top-9 -translate-x-1/2 px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.2em]" style={{ left: '62%', backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>EP {d.metric}</div>
            </div>
            <div className="mt-4 flex justify-between font-mono text-[11px] tracking-[0.3em]" style={{ color: ink + '66' }}>
              <span>FM</span><span>{d.subtitle}</span>
            </div>
          </div>
          <h1 className="mt-10 text-[44px] leading-[1.12] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-7 flex items-center gap-5">
            {guestRow}
            <div>
              <div className="text-[20px] font-bold leading-tight" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[12px] mt-0.5" style={{ color: ink + '8c' }}>{names.length > 1 ? roles.filter(Boolean).join(' · ') : d.role}</div>
            </div>
          </div>
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span style={{ color: d.accentColor }}>{d.date}</span>
          <span>{platforms.join(' · ')}</span>
        </div>
      </div>
    )
  }

  if (v === 'transcript') {
    const speaker = (names[0] || 'HOST').split(/\s+/)[0].toUpperCase()
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16 font-mono" style={{ backgroundColor: d.bgColor, color: ink }}>
        <div className="flex justify-between items-center text-[13px] tracking-[0.3em] uppercase pb-5" style={{ borderBottom: `2px solid ${ink}`, color: ink + '99' }}>
          <span>FROM THE TRANSCRIPT</span>
          <span>EP {d.metric}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[15px] tracking-[0.1em]" style={{ color: ink + '40' }}>[00:00:41] &mdash; INTRO</div>
          <div className="mt-3 text-[15px] tracking-[0.1em]" style={{ color: ink + '40' }}>[00:07:15] &mdash; &hellip;</div>
          <div className="mt-10 pl-8" style={{ borderLeft: `5px solid ${d.accentColor}` }}>
            <div className="text-[15px] tracking-[0.1em]" style={{ color: d.accentColor }}>[00:14:22] {speaker}:</div>
            <div className="mt-4 text-[38px] font-bold leading-[1.3] tracking-tight" style={{ fontFamily: brand.fonts.serif }}>&ldquo;{d.title}&rdquo;</div>
          </div>
          <div className="mt-10 text-[15px] tracking-[0.1em]" style={{ color: ink + '40' }}>[00:14:58] &mdash; &hellip;</div>
          <div className="mt-9 flex items-center gap-5">
            {guestRow}
            <div>
              <div className="text-[18px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="text-[12px] mt-0.5" style={{ color: ink + '8c' }}>{names.length > 1 ? roles.filter(Boolean).join(' · ') : d.role}</div>
            </div>
          </div>
        </div>
        <div className="pt-5 flex justify-between text-[12px] tracking-[0.2em] uppercase" style={{ borderTop: `2px solid ${ink}`, color: ink + '8c' }}>
          <span style={{ color: d.accentColor }}>{d.date}</span>
          <span>{platforms.join(' · ')}</span>
        </div>
      </div>
    )
  }

  if (v === 'studio') {
    return (
      <div className="w-full h-full relative overflow-hidden flex px-20 py-16 gap-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="self-start px-4 py-2 font-mono text-[14px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</div>
          <div className="mt-8 font-mono text-[14px] tracking-[0.3em]" style={{ color: ink + '80' }}>EPISODE {d.metric}</div>
          <h1 className="mt-4 text-[52px] leading-[1.08] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-auto">
            {hostBlock}
            <LedgerRule color={ink + '66'} className="mt-7" />
            <div className="flex justify-between items-center pt-4 font-mono text-[13px] tracking-[0.22em] uppercase">
              <span style={{ color: d.accentColor }}>{d.date}</span>
              <span style={{ color: ink + '8c' }}>{platforms.join(' · ')}</span>
            </div>
          </div>
        </div>
        <div className="w-[34%] shrink-0 flex flex-col gap-4">
          <div className="relative flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: ink + '0a', border: `1.5px solid ${ink}33` }}>
            <DoorSlats color={d.accentColor + '2b'} count={10} className="absolute inset-0 w-full h-full" />
            {items[0].photo ? (
              <BlendPortrait src={items[0].photo} bg={d.bgColor} className="absolute inset-x-2 inset-y-2" pos="center" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">{micGlyph}</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: `linear-gradient(to top, ${d.bgColor}cc, transparent)` }} />
          </div>
          {items.length > 1 && <div className="flex justify-center gap-3">{items.slice(1).map((it, i) => <div key={i}>{avatar(it)}</div>)}</div>}
        </div>
      </div>
    )
  }

  if (v === 'player') {
    const artwork = photos[0]
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '08'} count={24} className="absolute inset-0 w-full h-full" />
        <div className="relative w-full max-w-[880px] px-12 py-11" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.05), border: `1.5px solid ${ink}33`, boxShadow: `0 26px 52px ${mixHex(d.bgColor, '#000000', 0.5)}66` }}>
          <div className="flex items-center gap-8">
            <div className="w-44 h-44 shrink-0 relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: mixHex(d.bgColor, d.accentColor, 0.16), border: `1.5px solid ${ink}33` }}>
              {artwork ? <img src={artwork} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <BrandSeal brand={brand} tone={d.accentColor} size={130} />}
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle} &middot; EP {d.metric}</div>
              <div className="mt-3 text-[30px] font-bold leading-[1.15] tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.title}</div>
              <div className="font-mono text-[13px] mt-2" style={{ color: ink + '8c' }}>{d.author}</div>
            </div>
          </div>
          <div className="mt-9">
            <div className="relative h-1.5 rounded-full" style={{ backgroundColor: ink + '26' }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '38%', backgroundColor: d.accentColor }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ left: '38%', backgroundColor: d.accentColor }} />
            </div>
            <div className="flex justify-between mt-2 font-mono text-[11px]" style={{ color: ink + '66' }}>
              <span>16:42</span><span>44:05</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-10">
            <svg viewBox="0 0 24 24" className="w-8" fill={ink + '99'}><path d="M 11,12 L 20,5 V 19 Z M 4,5 h 3 v 14 h -3 Z" /></svg>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: d.accentColor }}>
              <svg viewBox="0 0 24 24" className="w-7" fill={mixHex(d.accentColor, '#000000', 0.85)}><path d="M 8,5 L 19,12 L 8,19 Z" /></svg>
            </div>
            <svg viewBox="0 0 24 24" className="w-8" fill={ink + '99'}><path d="M 13,12 L 4,5 V 19 Z M 17,5 h 3 v 14 h -3 Z" /></svg>
          </div>
          <div className="mt-7 pt-5 flex justify-between items-center font-mono text-[12px] tracking-[0.2em] uppercase" style={{ borderTop: `1px solid ${ink}26`, color: ink + '8c' }}>
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span>{platforms.join(' · ')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'onair') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[14px] tracking-[0.45em]" style={{ color: ink + '8c' }}>{d.subtitle} &middot; EP {d.metric}</div>
        <LedgerRule color={ink} className="w-full mt-5" />
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="px-20 py-10 rounded-[28px] border-4 flex items-center gap-7" style={{ borderColor: d.accentColor, boxShadow: `0 0 0 10px ${d.accentColor}22, 0 0 60px ${d.accentColor}55` }}>
            <span className="w-6 h-6 rounded-full" style={{ backgroundColor: d.accentColor, boxShadow: `0 0 22px ${d.accentColor}` }} />
            <span className="text-[110px] font-black leading-none tracking-[0.08em]" style={{ color: d.accentColor, fontFamily: brand.fonts.display, textShadow: `0 0 34px ${d.accentColor}88` }}>ON AIR</span>
          </div>
          <h1 className="mt-10 text-[38px] leading-[1.15] tracking-tight max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          {guestRow && <div className="mt-7 flex justify-center">{guestRow}</div>}
          <div className="mt-5 text-[20px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
        </div>
        <div className="w-full">
          <LedgerRule color={ink + '66'} />
          <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span>{platforms.join(' · ')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'wave') {
    const bars = Array.from({ length: 44 }, (_, i) => 16 + hash01(i, 11) * 86)
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={`EP ${d.metric}`} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <svg viewBox="0 0 448 120" className="w-full h-[120px]">
            {bars.map((h, i) => (
              <rect key={i} x={i * 10 + 1} y={(120 - h) / 2} width="6" height={h} rx="3"
                fill={i >= 17 && i <= 27 ? d.accentColor : ink + '40'} />
            ))}
          </svg>
          <h1 className="mt-10 text-[46px] leading-[1.1] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-7 flex items-center gap-5">
            {guestRow}
            <div>
              <div className="text-[20px] font-bold leading-tight" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[12px] mt-0.5" style={{ color: ink + '8c' }}>{names.length > 1 ? roles.filter(Boolean).join(' · ') : d.role}</div>
            </div>
          </div>
        </div>
        <LedgerRule color={ink + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
          <span style={{ color: d.accentColor }}>{d.date}</span>
          <span>{platforms.join(' · ')}</span>
        </div>
      </div>
    )
  }

  if (v === 'ticket') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '08'} count={24} className="absolute inset-0 w-full h-full" />
        <div className="relative w-full max-w-[880px] border-2 flex" style={{ borderColor: ink, backgroundColor: d.bgColor, boxShadow: `14px 14px 0 ${d.accentColor}40` }}>
          <div className="absolute -top-5 left-[236px] w-10 h-10 rounded-full z-20" style={{ backgroundColor: d.bgColor }} />
          <div className="absolute -bottom-5 left-[236px] w-10 h-10 rounded-full z-20" style={{ backgroundColor: d.bgColor }} />
          <div className="w-[260px] shrink-0 flex flex-col items-center justify-center py-12 px-6 text-center" style={{ borderRight: `2px dashed ${ink}59` }}>
            <BrandSeal brand={brand} tone={d.accentColor} size={120} />
            <div className="mt-6 font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '99' }}>EPISODE</div>
            <div className="mt-2 text-[54px] font-black leading-none" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{d.metric}</div>
          </div>
          <div className="flex-1 py-12 px-12 flex flex-col">
            <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="text-[40px] leading-[1.12] tracking-tight mt-4" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <div className="mt-auto pt-7 flex items-center gap-4">
              {guestRow || avatar(items[0])}
              <div className="min-w-0">
                <div className="text-[20px] font-bold leading-tight truncate" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
                <div className="font-mono text-[11px] truncate" style={{ color: ink + '99' }}>{names.length > 1 ? roles.filter(Boolean).join(' · ') : d.role}</div>
              </div>
            </div>
            <LedgerRule color={ink + '59'} className="mt-6" />
            <div className="flex justify-between items-center pt-3 font-mono text-[13px] tracking-[0.15em] uppercase">
              <span style={{ color: d.accentColor }}>{d.date}</span>
              <span style={{ color: ink + '8c' }}>{platforms.join(' · ')}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'ledger') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>EPISODE NOTICE &middot; NO. {d.metric}</span>
            <span style={{ color: d.accentColor }}>{d.date}</span>
          </div>
          <div className="relative mt-6 space-y-2 font-mono text-[13px] tracking-[0.18em] uppercase">
            <div><span style={{ color: ink + '66' }}>SHOW &middot; </span>{d.subtitle}</div>
            <div><span style={{ color: ink + '66' }}>ON MIC &middot; </span><span style={{ color: d.accentColor }}>{d.author}</span></div>
            <div><span style={{ color: ink + '66' }}>PLATFORMS &middot; </span>{platforms.join(' · ')}</div>
          </div>
          <div className="relative flex flex-1 min-h-0 gap-10 items-center">
            <h1 className="flex-1 text-[46px] leading-[1.12] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            {photos.length > 0 && (
              <div className="w-[28%] shrink-0 self-stretch my-6 flex flex-col gap-3">
                {items.filter(it => it.photo).map((it, i) => (
                  <div key={i} className="relative flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: ink + '0a', border: `1.5px solid ${ink}33` }}>
                    <BlendPortrait src={it.photo} bg={d.bgColor} className="absolute inset-x-2 inset-y-2" pos="center" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'marquee') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 leading-none font-black select-none" style={{ fontFamily: brand.fonts.display, fontSize: 560, color: 'transparent', WebkitTextStroke: `2.5px ${d.accentColor}40` }}>{d.metric}</div>
        <div className="relative flex items-center justify-between">
          <div className="inline-flex px-4 py-2 font-mono text-[14px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</div>
          <span className="font-mono text-[13px] tracking-[0.3em]" style={{ color: ink + '8c' }}>EP {d.metric}</span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center max-w-[78%]">
          <h1 className="text-[64px] leading-[1.05] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          {guestRow && <div className="mt-8">{guestRow}</div>}
        </div>
        <div className="relative">
          {hostBlock}
          <LedgerRule color={ink + '66'} className="mt-6" />
          <div className="flex justify-between items-center pt-4 font-mono text-[13px] tracking-[0.22em] uppercase">
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span style={{ color: ink + '8c' }}>{platforms.join(' · ')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
      <div className="relative flex-1 px-20 py-16 flex flex-col z-10">
        <div className="flex items-center justify-between">
          <div className="inline-flex px-4 py-2 font-mono text-[14px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</div>
          <BrandSeal brand={brand} tone={ink + 'b3'} size={86} />
        </div>
        <div className="mt-10 leading-none font-black select-none" style={{ fontFamily: brand.fonts.display, fontSize: 300, color: 'transparent', WebkitTextStroke: `3px ${d.accentColor}` }}>{d.metric}</div>
        <h1 className="text-[60px] leading-[1.06] tracking-tight mt-4 max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        <div className="mt-auto">
          {guestRow && <div className="mb-5">{guestRow}</div>}
          {hostBlock}
          <LedgerRule color={ink + '66'} className="mt-8" />
          <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.22em] uppercase">
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span style={{ color: ink + '8c' }}>{platforms.join(' · ')}</span>
          </div>
        </div>
      </div>
      <div className="relative w-[120px] shrink-0">
        <DoorSlats color={d.accentColor + '40'} count={20} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-y-0 left-0 w-px" style={{ backgroundColor: ink + '33' }} />
      </div>
    </div>
  )
}

// Virtual-event ticket, perforation and all.
export function TplWebinar({ d, brand }) {
  const notch = (pos) => <div className={`absolute ${pos} w-10 h-10 rounded-full z-20`} style={{ backgroundColor: d.bgColor }} />
  const v = ['ticket', 'stream', 'countdown', 'invite', 'pass', 'ledger', 'marquee', 'signal'].includes(d.variant) ? d.variant : 'ticket'
  const ink = d.textColor
  const initials = (d.author || '?').split(/\s+/).map(x => x[0]).slice(0, 2).join('')
  const hostRow = (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-[20px] shrink-0" style={{ borderColor: d.accentColor, color: d.accentColor, fontFamily: brand.fonts.heading }}>{initials}</div>
      <div className="min-w-0">
        <div className="text-[22px] font-bold leading-tight truncate" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
        <div className="font-mono text-[13px] truncate" style={{ color: ink + '99' }}>{d.role}</div>
      </div>
    </div>
  )

  if (v === 'stream') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.05), color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-full max-w-[900px] overflow-hidden" style={{ backgroundColor: d.bgColor, border: `1.5px solid ${ink}33`, boxShadow: `0 26px 52px ${mixHex(d.bgColor, '#000000', 0.5)}59` }}>
          <div className="flex items-center justify-between px-6 py-3.5" style={{ borderBottom: `1px solid ${ink}26` }}>
            <div className="flex items-center gap-2.5">
              {[0, 1, 2].map(i => <span key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: ink + '33' }} />)}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: d.accentColor }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: mixHex(d.accentColor, '#000000', 0.85) }} />
              <span className="font-mono text-[11px] font-bold tracking-[0.2em]" style={{ color: mixHex(d.accentColor, '#000000', 0.85) }}>LIVE</span>
            </div>
          </div>
          <div className="relative h-[380px]" style={{ background: `radial-gradient(circle at 50% 42%, ${d.accentColor}26, transparent 65%)` }}>
            <DoorSlats color={ink + '0d'} count={12} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full flex items-center justify-center font-bold text-[42px]" style={{ backgroundColor: mixHex(d.bgColor, d.accentColor, 0.2), border: `2.5px solid ${d.accentColor}`, color: d.accentColor, fontFamily: brand.fonts.heading }}>{initials}</div>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1.5 font-mono text-[12px] tracking-[0.1em]" style={{ backgroundColor: mixHex(d.bgColor, '#000000', 0.4) + 'cc', color: '#F5F5F5' }}>{d.author} &middot; {d.role}</div>
            <div className="absolute bottom-4 right-4 font-mono text-[12px] tracking-[0.15em]" style={{ color: ink + '8c' }}>&#9679; REC</div>
          </div>
          <div className="px-8 py-7" style={{ borderTop: `1px solid ${ink}26` }}>
            <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.15] tracking-tight" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
            <div className="mt-5 pt-4 flex justify-between items-center font-mono text-[13px] tracking-[0.18em] uppercase" style={{ borderTop: `1px solid ${ink}26` }}>
              <span>{d.date}</span>
              <span style={{ color: d.accentColor }}>{d.metric} &middot; {(d.url || brand.url).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'countdown') {
    const blocks = [['03', 'DAYS'], ['12', 'HRS'], ['45', 'MIN']]
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <LedgerRule color={ink} className="w-full mt-5" />
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="font-mono text-[13px] tracking-[0.4em]" style={{ color: ink + '8c' }}>DOORS OPEN IN</div>
          <div className="mt-7 flex items-center gap-5">
            {blocks.map(([n, l], i) => (
              <div key={l} className="flex items-center gap-5">
                <div className="px-7 py-5 border-2 text-center" style={{ borderColor: i === 0 ? d.accentColor : ink + '59', boxShadow: i === 0 ? `8px 8px 0 ${d.accentColor}40` : undefined }}>
                  <div className="font-black text-[72px] leading-none" style={{ fontFamily: brand.fonts.display, color: i === 0 ? d.accentColor : ink }}>{n}</div>
                  <div className="font-mono text-[11px] tracking-[0.3em] mt-2" style={{ color: ink + '8c' }}>{l}</div>
                </div>
                {i < 2 && <div className="font-black text-[44px] leading-none" style={{ color: ink + '40' }}>:</div>}
              </div>
            ))}
          </div>
          <h1 className="mt-11 text-[40px] leading-[1.15] tracking-tight max-w-[84%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-7 flex items-center gap-4">
            <div className="px-5 py-2.5 font-mono text-[14px] font-bold tracking-[0.15em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.date}</div>
            <div className="px-5 py-2.5 border-2 font-mono text-[14px] font-bold tracking-[0.15em]" style={{ borderColor: ink }}>{d.metric}</div>
          </div>
        </div>
        <div className="w-full">
          <LedgerRule color={ink + '66'} />
          <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
            <span>HOSTED BY {(d.author || '').toUpperCase()}</span>
            <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'invite') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '08'} count={24} className="absolute inset-0 w-full h-full" />
        <div className="relative w-full max-w-[860px]" style={{ backgroundColor: d.bgColor, border: `2px solid ${ink}`, boxShadow: `14px 14px 0 ${d.accentColor}40` }}>
          <div className="flex items-center justify-between px-10 py-5" style={{ backgroundColor: ink, color: d.bgColor }}>
            <span className="font-mono text-[13px] font-bold tracking-[0.3em]">CALENDAR INVITE</span>
            <span className="font-mono text-[12px] tracking-[0.25em]">{d.metric}</span>
          </div>
          <div className="px-10 py-9">
            <h1 className="text-[40px] leading-[1.12] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <div className="mt-7 space-y-3 font-mono text-[14px] tracking-[0.15em] uppercase">
              <div><span style={{ color: ink + '66' }}>WHEN &middot; </span>{d.date}</div>
              <div><span style={{ color: ink + '66' }}>HOST &middot; </span><span style={{ color: d.accentColor }}>{d.author}{d.role ? ` — ${d.role}` : ''}</span></div>
              <div><span style={{ color: ink + '66' }}>WHERE &middot; </span>{(d.url || brand.url).toUpperCase()}</div>
            </div>
            <div className="mt-9 flex gap-4">
              <div className="flex-1 py-4 text-center font-mono text-[15px] font-bold tracking-[0.25em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>ACCEPT</div>
              <div className="flex-1 py-4 text-center font-mono text-[15px] font-bold tracking-[0.25em]" style={{ border: `2px solid ${ink}40`, color: ink + '66' }}>DECLINE</div>
            </div>
            <div className="mt-7 pt-5 text-center font-mono text-[11px] tracking-[0.25em]" style={{ borderTop: `1px solid ${ink}26`, color: ink + '66' }}>{d.subtitle} &middot; SEATS ARE {d.metric} UNTIL THEY ARE NOT</div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'pass') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '08'} count={24} className="absolute inset-0 w-full h-full" />
        <div className="relative w-[54%] h-[86%] flex flex-col items-center text-center px-12 pt-14 pb-12" style={{ backgroundColor: mixHex(d.bgColor, ink, 0.04), border: `2px solid ${ink}59`, boxShadow: `0 26px 52px ${mixHex(d.bgColor, '#000000', 0.5)}59` }}>
          <div className="w-28 h-4 rounded-full" style={{ backgroundColor: ink + '33', border: `1px solid ${ink}59` }} />
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
            <BrandSeal brand={brand} tone={d.accentColor} size={150} />
            <div className="mt-7 font-mono text-[12px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="mt-5 text-[34px] leading-[1.2] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <div className="mt-8 pt-7 w-full" style={{ borderTop: `2px dashed ${ink}40` }}>
              <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[12px] mt-1" style={{ color: ink + '8c' }}>{d.role}</div>
            </div>
          </div>
          <div className="w-full flex justify-between font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
            <span>{d.date}</span>
            <span style={{ color: d.accentColor }}>ADMIT ONE &middot; {d.metric}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'ledger') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>SESSION NOTICE &middot; NO. 001</span>
            <span style={{ color: d.accentColor }}>{d.metric}</span>
          </div>
          <div className="relative mt-6 space-y-2 font-mono text-[13px] tracking-[0.18em] uppercase">
            <div><span style={{ color: ink + '66' }}>FORMAT &middot; </span>{d.subtitle}</div>
            <div><span style={{ color: ink + '66' }}>HOST &middot; </span><span style={{ color: d.accentColor }}>{d.author}{d.role ? ` — ${d.role}` : ''}</span></div>
            <div><span style={{ color: ink + '66' }}>TIME &middot; </span>{d.date}</div>
          </div>
          <div className="relative flex-1 flex items-center">
            <h1 className="text-[52px] leading-[1.12] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'marquee') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.metric} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-7">
            <span className="w-7 h-7 rounded-full" style={{ backgroundColor: d.accentColor, boxShadow: `0 0 26px ${d.accentColor}` }} />
            <span className="font-black leading-none tracking-tight text-[190px]" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>LIVE</span>
          </div>
          <div className="mt-3 font-mono text-[14px] tracking-[0.35em]" style={{ color: ink + '8c' }}>{d.subtitle}</div>
          <h1 className="mt-8 text-[46px] leading-[1.12] tracking-tight max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        </div>
        <div>
          {hostRow}
          <LedgerRule color={ink + '66'} className="mt-7" />
          <div className="flex justify-between pt-4 font-mono text-[13px] tracking-[0.2em] uppercase">
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'signal') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>
          <span>{brand.wordmark}</span>
          <span style={{ color: d.accentColor }}>{d.metric}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <svg viewBox="0 0 140 120" className="w-[150px]">
            <circle cx="24" cy="100" r="10" fill={d.accentColor} />
            {[34, 58, 82].map((r, i) => (
              <circle key={r} cx="24" cy="100" r={r} fill="none" stroke={d.accentColor} strokeWidth={5 - i} strokeLinecap="round" opacity={1 - i * 0.28}
                strokeDasharray={`${2 * Math.PI * r * 0.25} ${2 * Math.PI * r * 0.75}`} transform="rotate(-67.5 24 100)" />
            ))}
          </svg>
          <div className="mt-6 font-mono text-[14px] tracking-[0.4em]" style={{ color: d.accentColor }}>NOW BROADCASTING &middot; {d.subtitle}</div>
          <h1 className="mt-6 text-[52px] leading-[1.1] tracking-tight max-w-[90%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        </div>
        <div>
          {hostRow}
          <LedgerRule color={ink + '66'} className="mt-7" />
          <div className="flex justify-between pt-4 font-mono text-[13px] tracking-[0.2em] uppercase">
            <span style={{ color: d.accentColor }}>{d.date}</span>
            <span style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-20" style={{ backgroundColor: d.bgColor, fontFamily: brand.fonts.body }}>
      <DoorSlats color={d.textColor + '08'} count={24} className="absolute inset-0 w-full h-full" />
      <div className="relative w-full max-w-[880px] border-2 flex" style={{ borderColor: d.textColor, backgroundColor: d.bgColor, boxShadow: `14px 14px 0 ${d.accentColor}40` }}>
        {notch('-top-5 left-[236px]')}
        {notch('-bottom-5 left-[236px]')}
        <div className="w-[260px] shrink-0 flex flex-col items-center justify-center py-14 px-6 text-center" style={{ borderRight: `2px dashed ${d.textColor}59` }}>
          <BrandSeal brand={brand} tone={d.accentColor} size={130} />
          <div className="mt-8 font-mono text-[13px] tracking-[0.3em]" style={{ color: d.textColor + '99' }}>ADMISSION</div>
          <div className="mt-2 text-[54px] font-black leading-none" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{d.metric}</div>
        </div>
        <div className="flex-1 py-14 px-12 flex flex-col" style={{ color: d.textColor }}>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <h1 className="text-[52px] leading-[1.08] tracking-tight mt-5" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-auto pt-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-[20px]" style={{ borderColor: d.accentColor, color: d.accentColor, fontFamily: brand.fonts.heading }}>
                {(d.author || '?').split(' ').map(x => x[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
                <div className="font-mono text-[13px]" style={{ color: d.textColor + '99' }}>{d.role}</div>
              </div>
            </div>
            <LedgerRule color={d.textColor + '59'} className="mt-8" />
            <div className="flex justify-between items-center pt-4 font-mono text-[14px] tracking-[0.18em] uppercase">
              <span style={{ color: d.textColor }}>{d.date}</span>
              <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Keynote bill: vertical rail type, ledger meta, and a portrait that adapts
// to the canvas — on wide canvases a side plate; on square/tall canvases a
// full-width band between the title and the speaker block.
export function TplSpeaking({ d, brand, canvas }) {
  // any uploaded photo counts — including ones added via Additional Speakers
  const portrait = d.uploadedImage || d.generatedImage || (d.uploadedCoHosts || [])[0]
  const tall = (canvas?.h ?? 1080) >= (canvas?.w ?? 1080)
  // short banners (ads, email heroes) get compact type so nothing collides
  const short = !tall && (canvas?.h ?? 1080) < 750
  // Multiple speakers: comma-separated names (and roles) switch the bill to a
  // panel of tiles. Photos: primary upload + additional speaker uploads.
  const names = (d.author || '').split(',').map(t => t.trim()).filter(Boolean)
  // roles split per speaker only when there are multiple names — a single
  // speaker's role may legitimately contain commas
  const roles = names.length > 1 ? (d.role || '').split(',').map(t => t.trim()).filter(Boolean) : [d.role || '']
  const photos = [d.uploadedImage, ...(d.uploadedCoHosts || [])].filter(Boolean)
  const speakers = names.map((n, i) => ({ name: n, role: roles[i] || roles[0] || '', photo: photos[i] }))
  // tiles are driven by people, whichever way they arrive: names or photos
  const count = Math.min(3, Math.max(1, speakers.length, photos.length))
  const items = Array.from({ length: count }, (_, i) => ({
    name: names[i] || '',
    role: names.length > 1 ? (roles[i] || '') : (i === 0 ? (roles[0] || '') : ''),
    photo: photos[i],
  }))
  const renderTile = (sp, big) => (
    <>
      <div className="relative flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: d.textColor + '0a', border: `1.5px solid ${d.textColor}33` }}>
        <DoorSlats color={d.accentColor + '2b'} count={big ? 10 : 7} className="absolute inset-0 w-full h-full" />
        {sp.photo ? (
          <BlendPortrait src={sp.photo} bg={d.bgColor} className="absolute inset-x-2 inset-y-2" pos="center" />
        ) : sp.name ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${big ? (short ? 'w-16 h-16 text-[20px]' : 'w-24 h-24 text-[30px]') : (short ? 'w-11 h-11 text-[14px]' : 'w-16 h-16 text-[20px]')} rounded-full border-2 flex items-center justify-center font-bold`}
              style={{ borderColor: d.accentColor + '80', color: d.accentColor, fontFamily: brand.fonts.heading }}>
              {sp.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('')}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className={big ? (short ? 'w-16' : 'w-24') : (short ? 'w-11' : 'w-16')}>
              <circle cx="50" cy="34" r="15" fill="none" stroke={d.accentColor + '80'} strokeWidth="4" />
              <path d="M 18,88 C 24,60 76,60 82,88" fill="none" stroke={d.accentColor + '80'} strokeWidth="4" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: `linear-gradient(to top, ${d.bgColor}cc, transparent)` }} />
      </div>
      <div className={big ? (short ? 'mt-2 min-h-[42px]' : 'mt-3 min-h-[58px]') : (short ? 'mt-1.5 min-h-[30px]' : 'mt-2 min-h-[40px]')}>
        {sp.name && <div className={`${big ? (short ? 'text-[18px]' : 'text-[24px]') : (short ? 'text-[13px]' : 'text-[17px]')} font-bold leading-tight truncate`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>}
        {sp.role && <div className={`font-mono ${big ? (short ? 'text-[10px]' : 'text-[12px]') : (short ? 'text-[9px]' : 'text-[10px]')} mt-1 truncate`} style={{ color: d.accentColor }}>{sp.role}</div>}
      </div>
    </>
  )
  const v = ['bill', 'spotlight', 'marquee', 'poster', 'ticket', 'ledger', 'wire', 'split'].includes(d.variant) ? d.variant : 'bill'
  const portrait0 = photos[0]
  const initials = (d.author || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('')
  const photoOr = (cls, pos = 'center', bordered = true) => (
    <div className={`relative overflow-hidden ${cls}`} style={bordered ? { backgroundColor: d.textColor + '0a', border: `1.5px solid ${d.textColor}33` } : undefined}>
      {bordered && <DoorSlats color={d.accentColor + '2b'} count={10} className="absolute inset-0 w-full h-full" />}
      {portrait0 ? (
        <BlendPortrait src={portrait0} bg={d.bgColor} className="absolute inset-x-2 inset-y-2" pos={pos} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center font-bold text-[30px]"
            style={{ borderColor: d.accentColor + '80', color: d.accentColor, fontFamily: brand.fonts.heading }}>{initials}</div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: `linear-gradient(to top, ${d.bgColor}cc, transparent)` }} />
    </div>
  )
  // per-person versions of the same primitives, so every design can seat a
  // panel of two or three without falling back to the bill layout
  const multi = items.length > 1
  const initialsOf = (name) => (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('')
  const tileFor = (sp, cls, pos = 'center') => (
    <div className={`relative overflow-hidden ${cls}`} style={{ backgroundColor: d.textColor + '0a', border: `1.5px solid ${d.textColor}33` }}>
      <DoorSlats color={d.accentColor + '2b'} count={8} className="absolute inset-0 w-full h-full" />
      {sp.photo ? (
        <BlendPortrait src={sp.photo} bg={d.bgColor} className="absolute inset-x-2 inset-y-2" pos={pos} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-[18px]"
            style={{ borderColor: d.accentColor + '80', color: d.accentColor, fontFamily: brand.fonts.heading }}>{initialsOf(sp.name)}</div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: `linear-gradient(to top, ${d.bgColor}cc, transparent)` }} />
    </div>
  )
  const avatarFor = (sp, cls = 'w-14 h-14 text-[19px]') => (
    <div className={`${cls} rounded-full border-2 flex items-center justify-center font-bold overflow-hidden relative shrink-0`}
      style={{ borderColor: d.accentColor, color: d.accentColor, fontFamily: brand.fonts.heading }}>
      {sp.photo ? <img src={sp.photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : initialsOf(sp.name)}
    </div>
  )

  if (v === 'spotlight') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center text-center px-20 py-14" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <LedgerRule color={d.textColor} className="w-full mt-5" />
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          {multi ? (
            <div className="flex justify-center gap-7 w-full">
              {items.map((sp, i) => (
                <div key={i} className={`${items.length === 2 ? 'w-[28%]' : 'w-[24%]'} flex flex-col items-center`}>
                  {tileFor(sp, 'w-full aspect-[3/4]')}
                  <div className={`${short ? 'text-[15px] mt-2' : 'text-[19px] mt-3'} font-bold leading-tight`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>
                  {sp.role && <div className="font-mono text-[10px] mt-1" style={{ color: d.accentColor }}>{sp.role}</div>}
                </div>
              ))}
            </div>
          ) : (
            <>
              {photoOr('w-[34%] aspect-[3/4]', 'center')}
              <div className={`${short ? 'text-[26px] mt-4' : 'text-[34px] mt-6'} font-bold leading-tight`} style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[13px] mt-2" style={{ color: d.accentColor }}>{d.role}</div>
            </>
          )}
          <h1 className={`${short ? 'text-[34px] mt-5' : multi ? 'text-[40px] mt-7' : 'text-[48px] mt-8'} leading-[1.1] tracking-tight max-w-[85%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className={`font-mono tracking-[0.2em] uppercase ${short ? 'text-[12px] mt-4' : 'text-[14px] mt-7'}`} style={{ color: d.textColor + '99' }}>{d.date}</div>
        </div>
        <LedgerRule color={d.textColor + '66'} className="w-full" />
        <div className="w-full flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    )
  }

  if (v === 'marquee') {
    // one speaker: their name stacked word-by-word. A panel: one giant line
    // per speaker — the marquee becomes the bill of names.
    const parts = multi ? items.map(sp => sp.name) : (d.author || '').split(/\s+/)
    const marqueeSize = multi ? (short ? 'text-[52px]' : items.length === 3 ? 'text-[64px]' : 'text-[84px]') : (short ? 'text-[84px]' : 'text-[128px]')
    const roleLine = multi ? items.map(sp => sp.role).filter(Boolean).join(' · ') : d.role
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={d.textColor} className="mt-5" />
        <div className="flex flex-1 min-h-0 gap-10 items-center">
          <div className="flex-1 min-w-0">
            {parts.map((w, i) => (
              <div key={i} className={`font-black leading-[0.95] tracking-tight whitespace-nowrap ${marqueeSize}`} style={{ fontFamily: brand.fonts.display, color: i === parts.length - 1 ? d.accentColor : d.textColor }}>{w.toUpperCase()}</div>
            ))}
            <div className="font-mono text-[13px] tracking-[0.15em] mt-4" style={{ color: d.textColor + '99' }}>{roleLine}</div>
            <h2 className={`${short ? 'text-[22px] mt-5' : 'text-[30px] mt-8'} leading-snug max-w-[92%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
          </div>
          {multi ? (
            <div className="w-[30%] shrink-0 self-stretch my-4 flex flex-col gap-4">
              {items.map((sp, i) => <div key={i} className="flex-1 min-h-0 flex flex-col">{tileFor(sp, 'flex-1 min-h-0')}</div>)}
            </div>
          ) : (
            <div className="w-[30%] shrink-0 self-center">{photoOr('w-full aspect-[3/4]', 'center')}</div>
          )}
        </div>
        <LedgerRule color={d.textColor + '66'} />
        <div className="flex justify-between pt-4 font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
          <span>{d.date}</span>
          <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
        </div>
      </div>
    )
  }

  if (v === 'poster') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative z-10 w-[52%] flex flex-col px-16 py-14">
          <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} />
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-mono text-[13px] tracking-[0.4em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className={`${short ? 'text-[38px]' : 'text-[58px]'} leading-[1.06] tracking-tight mt-6`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            {multi ? (
              <div className={short ? 'mt-5 space-y-3' : 'mt-8 space-y-4'}>
                {items.map((sp, i) => (
                  <div key={i}>
                    <div className={`${short ? 'text-[17px]' : 'text-[22px]'} font-bold leading-tight`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>
                    {sp.role && <div className="font-mono text-[11px] mt-0.5" style={{ color: d.accentColor }}>{sp.role}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className={`${short ? 'text-[22px] mt-6' : 'text-[30px] mt-10'} font-bold`} style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
                <div className="font-mono text-[12px] mt-1" style={{ color: d.accentColor }}>{d.role}</div>
              </>
            )}
            <div className={`mt-6 pl-4 ${short ? 'text-[14px]' : 'text-[18px]'} leading-relaxed`} style={{ borderLeft: `4px solid ${d.accentColor}`, color: d.textColor + 'cc' }}>{d.date}</div>
          </div>
          <div className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>{(d.url || brand.url).toUpperCase()}</div>
        </div>
        <div className="relative flex-1 flex flex-col">
          <DoorSlats color={d.accentColor + '21'} count={22} className="absolute inset-0 w-full h-full" />
          {multi ? (
            items.map((sp, i) => (
              <div key={i} className="relative flex-1 min-h-0" style={i ? { borderTop: `1.5px solid ${d.textColor}40` } : undefined}>
                {sp.photo ? (
                  <BlendPortrait src={sp.photo} bg={d.bgColor} className="absolute inset-0" pos="center" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[0.25em]" style={{ color: d.textColor + '66' }}>{(sp.name || 'SPEAKER PHOTO').toUpperCase()}</div>
                )}
              </div>
            ))
          ) : portrait0 ? (
            <BlendPortrait src={portrait0} bg={d.bgColor} className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[12px] tracking-[0.25em]" style={{ color: d.textColor + '66' }}>SPEAKER PHOTO</div>
          )}
          <div className="absolute inset-y-0 left-0 w-24" style={{ background: `linear-gradient(to right, ${d.bgColor}, transparent)` }} />
          <div className="absolute bottom-0 inset-x-0 h-28" style={{ background: `linear-gradient(to top, ${d.bgColor}, transparent)` }} />
        </div>
      </div>
    )
  }

  if (v === 'ticket') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <DoorSlats color={d.textColor + '08'} count={24} className="absolute inset-0 w-full h-full" />
        <div className="relative w-full max-w-[880px] border-2 flex" style={{ borderColor: d.textColor, backgroundColor: d.bgColor, boxShadow: `14px 14px 0 ${d.accentColor}40` }}>
          <div className="absolute -top-5 left-[236px] w-10 h-10 rounded-full z-20" style={{ backgroundColor: d.bgColor }} />
          <div className="absolute -bottom-5 left-[236px] w-10 h-10 rounded-full z-20" style={{ backgroundColor: d.bgColor }} />
          <div className="w-[260px] shrink-0 flex flex-col items-center justify-center py-12 px-6 text-center" style={{ borderRight: `2px dashed ${d.textColor}59` }}>
            <BrandSeal brand={brand} tone={d.accentColor} size={120} />
            <div className="mt-6 font-mono text-[12px] tracking-[0.3em]" style={{ color: d.textColor + '99' }}>ONE NIGHT ONLY</div>
            <div className="mt-2 text-[38px] font-black leading-none" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>LIVE</div>
          </div>
          <div className="flex-1 py-12 px-12 flex flex-col">
            <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
            <h1 className="text-[44px] leading-[1.1] tracking-tight mt-4" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <div className={`mt-auto pt-8 flex items-center flex-wrap ${multi ? 'gap-x-8 gap-y-3' : 'gap-4'}`}>
              {items.map((sp, i) => (
                <div key={i} className="flex items-center gap-4 min-w-0">
                  {avatarFor(sp, multi ? 'w-12 h-12 text-[16px]' : 'w-14 h-14 text-[19px]')}
                  <div className="min-w-0">
                    <div className={`${multi ? 'text-[17px]' : 'text-[21px]'} font-bold leading-tight truncate`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>
                    {sp.role && <div className="font-mono text-[11px] truncate" style={{ color: d.textColor + '99' }}>{sp.role}</div>}
                  </div>
                </div>
              ))}
            </div>
            <LedgerRule color={d.textColor + '59'} className="mt-6" />
            <div className="flex justify-between items-center pt-3 font-mono text-[13px] tracking-[0.15em] uppercase">
              <span>{d.date}</span>
              <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'ledger') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${d.textColor}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${d.textColor}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: d.textColor + '99' }}>
            <span>EVENT NOTICE &middot; NO. 001</span>
            <span>{d.date}</span>
          </div>
          <div className="relative mt-6 space-y-2 font-mono text-[13px] tracking-[0.18em] uppercase">
            {multi ? items.map((sp, i) => (
              <div key={i}><span style={{ color: d.textColor + '66' }}>SPEAKER {i + 1} &middot; </span>{sp.name}{sp.role && <span style={{ color: d.accentColor }}> — {sp.role}</span>}</div>
            )) : (
              <>
                <div><span style={{ color: d.textColor + '66' }}>SPEAKER &middot; </span>{d.author}</div>
                <div><span style={{ color: d.textColor + '66' }}>TITLE &middot; </span><span style={{ color: d.accentColor }}>{d.role}</span></div>
              </>
            )}
            <div><span style={{ color: d.textColor + '66' }}>FORMAT &middot; </span>{d.subtitle}</div>
          </div>
          <div className="relative flex flex-1 min-h-0 gap-10 items-center">
            <h1 className={`flex-1 ${short ? 'text-[34px]' : 'text-[52px]'} leading-[1.1] tracking-tight`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <div className="w-[30%] shrink-0 self-stretch my-6 flex flex-col gap-3">
              {multi
                ? items.map((sp, i) => <div key={i} className="flex-1 min-h-0 flex flex-col">{tileFor(sp, 'flex-1 min-h-0')}</div>)
                : photoOr('flex-1 min-h-0', 'center')}
            </div>
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: d.textColor + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: d.textColor + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'wire') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="flex items-center justify-between px-16 py-5" style={{ backgroundColor: d.textColor, color: d.bgColor }}>
          <span className="font-mono text-[14px] font-bold tracking-[0.3em]">&#9632; {d.subtitle}</span>
          <span className="font-mono text-[13px] tracking-[0.25em]">{d.date}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-20">
          <div className="font-mono text-[13px] tracking-[0.3em]" style={{ color: d.accentColor }}>{brand.wordmark} PRESENTS</div>
          <h1 className={`${short ? 'text-[42px]' : 'text-[66px]'} leading-[1.06] tracking-tight mt-6 max-w-[95%]`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="my-8" style={{ height: 1, borderTop: `2px dashed ${d.textColor}40` }} />
          <div className={`flex items-center flex-wrap ${multi ? 'gap-x-10 gap-y-4' : 'gap-5'}`}>
            {items.map((sp, i) => (
              <div key={i} className="flex items-center gap-4 min-w-0">
                {avatarFor(sp, multi ? 'w-14 h-14 text-[18px]' : 'w-16 h-16 text-[21px]')}
                <div className="min-w-0">
                  <div className={`${multi ? 'text-[20px]' : 'text-[26px]'} font-bold leading-tight truncate`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>
                  {sp.role && <div className="font-mono text-[12px] mt-1 truncate" style={{ color: d.textColor + '99' }}>{sp.role}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-16 pb-9">
          <div style={{ height: 1, borderTop: `2px dashed ${d.textColor}40` }} />
          <div className="flex justify-between items-center pt-4 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: d.textColor + '73' }}>
            <span>{(d.url || brand.url).toUpperCase()}</span>
            <BrandSeal brand={brand} tone={d.textColor + '99'} size={52} />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'split') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-[30%] shrink-0 flex flex-col items-center justify-between py-12" style={{ backgroundColor: d.accentColor }}>
          <div className="flex-1 flex items-center">
            <div className="font-black tracking-[0.18em] whitespace-nowrap -rotate-90 text-[64px] leading-none" style={{ fontFamily: brand.fonts.display, color: mixHex(d.accentColor, '#000000', 0.8) }}>{d.subtitle}</div>
          </div>
          <BrandSeal brand={brand} tone={mixHex(d.accentColor, '#ffffff', 0.85)} size={110} />
        </div>
        <div className="flex-1 flex flex-col px-14 py-12 min-w-0">
          <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag={d.date} />
          <LedgerRule color={d.textColor} className="mt-4" />
          {multi ? (
            <div className={`w-full flex gap-4 ${short ? 'h-[44%] my-4' : 'h-[48%] my-7'}`}>
              {items.map((sp, i) => (
                <div key={i} className="flex-1 min-w-0 flex flex-col">
                  {tileFor(sp, 'flex-1 min-h-0')}
                  <div className={short ? 'mt-1.5 min-h-[30px]' : 'mt-2 min-h-[40px]'}>
                    <div className={`${short ? 'text-[14px]' : 'text-[18px]'} font-bold leading-tight truncate`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>
                    {sp.role && <div className="font-mono text-[10px] mt-1 truncate" style={{ color: d.accentColor }}>{sp.role}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            photoOr(`w-full ${short ? 'h-[38%] my-4' : 'h-[42%] my-7'}`, 'center')
          )}
          {multi ? (
            <div className="flex-1 min-h-0 flex items-center">
              <h1 className={`${short ? 'text-[30px]' : 'text-[42px]'} leading-[1.1] tracking-tight`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            </div>
          ) : (
            <>
              <h1 className={`${short ? 'text-[30px]' : 'text-[42px]'} leading-[1.1] tracking-tight`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
              <div className="mt-auto pt-4">
                <div className="text-[24px] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
                {d.role && <div className="font-mono text-[11px] mt-1" style={{ color: d.accentColor }}>{d.role}</div>}
              </div>
            </>
          )}
          <LedgerRule color={d.textColor + '66'} className="mt-5" />
          <div className="flex justify-between pt-3 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
            <span>{(d.url || brand.url).toUpperCase()}</span>
            <span>{brand.tagline}</span>
          </div>
        </div>
      </div>
    )
  }

  const plate = (extra, extraStyle = {}, pos = 'bottom') => (
    <div className={`relative overflow-hidden ${extra}`} style={{ ...extraStyle, backgroundColor: d.textColor + '0a', border: `1.5px solid ${d.textColor}33` }}>
      <DoorSlats color={d.accentColor + '2b'} count={tall ? 10 : 14} className="absolute inset-0 w-full h-full" />
      {portrait ? (
        <BlendPortrait src={portrait} bg={d.bgColor} className="absolute inset-x-3 inset-y-3" pos={pos} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[12px] tracking-[0.25em]" style={{ color: d.textColor + '66' }}>SPEAKER PHOTO</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: `linear-gradient(to top, ${d.bgColor}cc, transparent)` }} />
      <div className="absolute bottom-3 right-4 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '99' }}>Speaker &middot; {d.author}</div>
    </div>
  )
  return (
    <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div className="w-[150px] shrink-0 relative" style={{ borderRight: `1.5px solid ${d.textColor}40` }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-black tracking-[0.28em] text-[74px] leading-none select-none" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>
          {d.subtitle}
        </div>
      </div>
      <div className={`flex-1 px-16 flex flex-col min-w-0 ${short ? 'py-9' : 'py-16'}`}>
        <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag="LIVE ON STAGE" />
        <LedgerRule color={d.textColor} className={short ? 'mt-3' : 'mt-5'} />
        {(speakers.length > 1 || photos.length > 1) ? (
          <>
            <h1 className={`${short ? 'text-[36px] mt-4' : tall ? 'text-[54px] mt-8' : 'text-[48px] mt-8'} leading-[1.08] tracking-tight`} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            {photos.length === 1 && speakers.length > 1 ? (
              <>
                {/* one group photo of the whole panel: a single wide plate */}
                <div className={`relative flex-1 min-h-0 overflow-hidden ${short ? 'my-5' : 'my-9'}`} style={{ backgroundColor: d.textColor + '0a', border: `1.5px solid ${d.textColor}33` }}>
                  <DoorSlats color={d.accentColor + '2b'} count={10} className="absolute inset-0 w-full h-full" />
                  <BlendPortrait src={photos[0]} bg={d.bgColor} className="absolute inset-x-3 inset-y-3" pos="center" />
                  <div className="absolute bottom-0 left-0 right-0 h-14" style={{ background: `linear-gradient(to top, ${d.bgColor}cc, transparent)` }} />
                </div>
                <div className={`flex flex-wrap ${short ? 'gap-x-8 gap-y-2' : 'gap-x-12 gap-y-3'}`}>
                  {speakers.slice(0, 3).map((sp, i) => (
                    <div key={i} className="min-w-0">
                      <div className={`${short ? 'text-[18px]' : 'text-[24px]'} font-bold leading-tight`} style={{ fontFamily: brand.fonts.heading }}>{sp.name}</div>
                      {sp.role && <div className={`font-mono ${short ? 'text-[10px]' : 'text-[12px]'} mt-1`} style={{ color: d.accentColor }}>{sp.role}</div>}
                    </div>
                  ))}
                </div>
                <div className={`pl-4 ${short ? 'text-[14px] mt-3' : 'text-[19px] mt-6'} leading-relaxed`} style={{ borderLeft: `4px solid ${d.accentColor}`, color: d.textColor + 'cc' }}>{d.date}</div>
              </>
            ) : (
              <>
            {/* hero plate + smaller supporting boxes (max three people) */}
            <div className={`flex flex-1 min-h-0 ${short ? 'gap-5 my-5' : 'gap-7 my-9'}`}>
              <div className="flex-[1.5] min-w-0 flex flex-col">{renderTile(items[0], true)}</div>
              <div className={`flex-1 min-w-0 flex flex-col ${short ? 'gap-5' : 'gap-7'} ${items.length === 2 ? 'justify-center' : ''}`}>
                {items.slice(1).map((sp, i) => (
                  <div key={i} className={`${items.length === 2 ? 'h-[62%]' : 'flex-1'} flex flex-col min-h-0`}>{renderTile(sp, false)}</div>
                ))}
              </div>
            </div>
            <div className={`pl-4 ${short ? 'text-[14px]' : 'text-[19px]'} leading-relaxed`} style={{ borderLeft: `4px solid ${d.accentColor}`, color: d.textColor + 'cc' }}>{d.date}</div>
              </>
            )}
          </>
        ) : tall ? (
          <>
            <h1 className="text-[60px] leading-[1.08] tracking-tight mt-10" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            {/* the portrait band fills the space between title and speaker */}
            {plate('flex-1 min-h-0 w-full my-10', {}, 'center')}
            <div>
              <div className="text-[36px] font-bold leading-tight" style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
              <div className="font-mono text-[14px] mt-2" style={{ color: d.accentColor }}>{d.role}</div>
              <div className="mt-6 pl-5 text-[21px] leading-relaxed" style={{ borderLeft: `4px solid ${d.accentColor}`, color: d.textColor + 'cc' }}>{d.date}</div>
            </div>
          </>
        ) : (
          <div className={`flex flex-1 gap-12 min-h-0 ${short ? 'pt-6' : 'pt-12'}`}>
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <h1 className={short ? 'text-[40px] leading-[1.08] tracking-tight' : 'text-[60px] leading-[1.08] tracking-tight'} style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
              <div className={short ? 'mt-5' : 'mt-12'}>
                <div className={`${short ? 'text-[25px]' : 'text-[36px]'} font-bold leading-tight`} style={{ fontFamily: brand.fonts.heading }}>{d.author}</div>
                <div className={`font-mono ${short ? 'text-[12px] mt-1' : 'text-[14px] mt-2'}`} style={{ color: d.accentColor }}>{d.role}</div>
                <div className={`${short ? 'mt-3 pl-4 text-[15px]' : 'mt-8 pl-5 text-[21px]'} leading-relaxed`} style={{ borderLeft: `4px solid ${d.accentColor}`, color: d.textColor + 'cc' }}>{d.date}</div>
              </div>
            </div>
            <div className="w-[36%] shrink-0 flex flex-col justify-center min-h-0">
              {plate('w-full', { aspectRatio: '3 / 4', maxHeight: '92%' })}
            </div>
          </div>
        )}
        <LedgerRule color={d.textColor + '66'} className={short ? 'mt-4' : 'mt-10'} />
        <div className={`flex justify-between font-mono tracking-[0.2em] uppercase ${short ? 'pt-3 text-[11px]' : 'pt-5 text-[13px]'}`} style={{ color: d.textColor + '8c' }}>
          <span>{(d.url || brand.url).toUpperCase()}</span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    </div>
  )
}

// Partnership in six designs: contract (signed-deal document), venn (two
// rings, the overlap is the deal), plaque (commemorative frame), wire (joint
// bulletin), split (partner color block), memo (joint-venture document).
export function TplPartnership({ d, brand }) {
  const v = ['contract', 'venn', 'plaque', 'wire', 'split', 'memo'].includes(d.variant) ? d.variant : 'contract'
  const partner = d.partnerName || 'PARTNER'
  const footer = (
    <>
      <LedgerRule color={d.textColor + '66'} className="mt-6" />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
        <span>{(d.url || brand.url).toUpperCase()}</span>
        <span>{d.date}</span>
      </div>
    </>
  )

  if (v === 'venn') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="text-center font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <div className="relative flex-1 flex items-center justify-center min-h-0">
          <svg viewBox="0 0 700 340" className="w-full max-h-[46%]" preserveAspectRatio="xMidYMid meet">
            <defs>
              <clipPath id="bs-venn-lens"><circle cx="270" cy="170" r="150" /></clipPath>
            </defs>
            <circle cx="430" cy="170" r="150" fill={d.accentColor + '1f'} clipPath="url(#bs-venn-lens)" />
            <circle cx="270" cy="170" r="150" fill="none" stroke={d.textColor} strokeWidth="3" />
            <circle cx="430" cy="170" r="150" fill="none" stroke={d.accentColor} strokeWidth="3" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center" style={{ gap: '11%' }}>
              <BrandSeal brand={brand} tone={d.textColor} size={150} />
              <span className="font-black text-[54px] tracking-[0.04em] text-center leading-none" style={{ fontFamily: brand.fonts.display, color: d.accentColor, maxWidth: 220 }}>{partner}</span>
            </div>
          </div>
        </div>
        <h1 className="text-[62px] leading-[1.06] tracking-tight text-center" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        <p className="text-[23px] leading-relaxed mt-6 text-center mx-auto max-w-[75%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
        {footer}
      </div>
    )
  }

  if (v === 'plaque') {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-full max-w-[860px] px-14 py-14 text-center" style={{ border: `3px solid ${d.textColor}` }}>
          <div className="absolute inset-[8px] pointer-events-none" style={{ border: `1px solid ${d.textColor}66` }} />
          {[['-top-2 -left-2'], ['-top-2 -right-2'], ['-bottom-2 -left-2'], ['-bottom-2 -right-2']].map(([pos]) => (
            <div key={pos} className={`absolute ${pos} w-4 h-4 rotate-45`} style={{ backgroundColor: d.accentColor }} />
          ))}
          <div className="font-mono text-[13px] tracking-[0.45em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
          <div className="mt-9 text-[64px] leading-none font-bold tracking-[0.04em]" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}</div>
          <div className="my-5 text-[52px] leading-none" style={{ fontFamily: brand.fonts.serif, fontStyle: 'italic', color: d.accentColor }}>&amp;</div>
          <div className="text-[64px] leading-none font-black tracking-[0.06em]" style={{ fontFamily: brand.fonts.display }}>{partner}</div>
          <div className="w-24 h-[3px] mx-auto mt-9" style={{ backgroundColor: d.accentColor }} />
          <p className="text-[22px] leading-relaxed mt-7 mx-auto max-w-[85%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
          <div className="mt-8 flex items-center justify-center gap-5 font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: d.textColor + '8c' }}>
            <span>{d.date}</span>
            <BrandSeal brand={brand} tone={d.textColor + '99'} size={54} />
            <span>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'wire') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="flex items-center justify-between px-16 py-5" style={{ backgroundColor: d.textColor, color: d.bgColor }}>
          <span className="font-mono text-[14px] font-bold tracking-[0.3em]">&#9632; {d.subtitle}</span>
          <span className="font-mono text-[13px] tracking-[0.25em]">{d.date}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-20">
          <div className="flex items-center gap-8">
            <span className="text-[54px] font-bold tracking-[0.04em] leading-none" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}</span>
            <span className="text-[40px] leading-none" style={{ fontFamily: brand.fonts.serif, fontStyle: 'italic', color: d.accentColor }}>&times;</span>
            <span className="text-[54px] font-black tracking-[0.06em] leading-none" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{partner}</span>
          </div>
          <div className="my-9" style={{ height: 1, borderTop: `2px dashed ${d.textColor}40` }} />
          <h1 className="text-[68px] leading-[1.06] tracking-tight max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <p className="text-[25px] leading-relaxed mt-8 max-w-[85%]" style={{ color: d.textColor + 'b3' }}>{d.body}</p>
        </div>
        <div className="px-16 pb-10">
          <div style={{ height: 1, borderTop: `2px dashed ${d.textColor}40` }} />
          <div className="flex justify-between items-center pt-4 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: d.textColor + '73' }}>
            <span>{(d.url || brand.url).toUpperCase()}</span>
            <BrandSeal brand={brand} tone={d.textColor + '99'} size={56} />
          </div>
        </div>
      </div>
    )
  }

  if (v === 'split') {
    return (
      <div className="w-full h-full relative overflow-hidden flex" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-[32%] shrink-0 flex flex-col items-center justify-between py-14" style={{ backgroundColor: d.accentColor }}>
          <div className="font-mono text-[12px] tracking-[0.35em]" style={{ color: mixHex(d.accentColor, '#000000', 0.7) }}>{d.subtitle}</div>
          <div className="flex-1 flex items-center">
            <div className="font-black tracking-[0.12em] whitespace-nowrap -rotate-90 text-[72px] leading-none" style={{ fontFamily: brand.fonts.display, color: mixHex(d.accentColor, '#000000', 0.8) }}>{partner}</div>
          </div>
          <span className="text-[44px] leading-none" style={{ fontFamily: brand.fonts.serif, fontStyle: 'italic', color: mixHex(d.accentColor, '#ffffff', 0.85) }}>&times;</span>
        </div>
        <div className="flex-1 flex flex-col px-16 py-16">
          <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag={d.date} />
          <LedgerRule color={d.textColor} className="mt-5" />
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-[64px] leading-[1.08] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
            <p className="text-[23px] leading-relaxed mt-8 max-w-[92%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
          </div>
          <div className="flex gap-16 mb-2">
            {[brand.wordmark, partner].map(name => (
              <div key={name} className="flex-1">
                <div style={{ height: 1.5, backgroundColor: d.textColor + '99' }} />
                <div className="font-mono text-[11px] tracking-[0.25em] mt-2 uppercase" style={{ color: d.textColor + '80' }}>{name}</div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[12px] tracking-[0.2em] uppercase pt-3" style={{ color: d.textColor + '8c' }}>{(d.url || brand.url).toUpperCase()}</div>
        </div>
      </div>
    )
  }

  if (v === 'memo') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full" style={{ border: `2px solid ${d.textColor}` }}>
          <div className="absolute inset-[7px]" style={{ border: `1px solid ${d.textColor}80` }} />
          <div className="relative h-full flex flex-col px-16 py-14">
            <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: d.textColor + '99' }}>
              <span>JOINT VENTURE · NO. 001</span>
              <span>{d.date}</span>
            </div>
            <div className="mt-8 space-y-2 font-mono text-[14px] tracking-[0.18em] uppercase">
              <div><span style={{ color: d.textColor + '66' }}>PARTY A · </span>{brand.wordmark}</div>
              <div><span style={{ color: d.textColor + '66' }}>PARTY B · </span><span style={{ color: d.accentColor }}>{partner}</span></div>
              <div><span style={{ color: d.textColor + '66' }}>RE · </span>{d.subtitle}</div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-[62px] leading-[1.08] tracking-tight max-w-[95%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
              <p className="text-[23px] leading-relaxed mt-7 max-w-[85%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
            </div>
            <div className="flex gap-16 items-end">
              {[brand.wordmark, partner].map(name => (
                <div key={name} className="flex-1">
                  <div style={{ height: 1.5, backgroundColor: d.textColor + '99' }} />
                  <div className="font-mono text-[11px] tracking-[0.25em] mt-2 uppercase" style={{ color: d.textColor + '80' }}>{name}</div>
                </div>
              ))}
              <BrandSeal brand={brand} tone={d.textColor + '99'} size={64} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // contract: seal x partner plate over signature lines (the original)
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div className="text-center font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
      <LedgerRule color={d.textColor} className="mt-6" />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-14">
          <BrandSeal brand={brand} tone={d.textColor} size={210} />
          <div className="text-[64px] leading-none select-none" style={{ fontFamily: brand.fonts.serif, fontStyle: 'italic', color: d.accentColor }}>&times;</div>
          <div className="px-10 py-8 border-2 relative" style={{ borderColor: d.textColor }}>
            <div className="absolute inset-[5px] border" style={{ borderColor: d.textColor + '59' }} />
            <span className="relative font-black text-[44px] tracking-[0.08em] leading-none" style={{ fontFamily: brand.fonts.display }}>{partner}</span>
          </div>
        </div>
        <h1 className="text-[68px] leading-[1.06] tracking-tight mt-14 max-w-[85%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
        <p className="text-[24px] leading-relaxed mt-8 max-w-[70%]" style={{ color: d.textColor + 'a6' }}>{d.body}</p>
      </div>
      <div className="flex gap-24 justify-center mb-4">
        {[brand.wordmark, partner].map(name => (
          <div key={name} className="w-[280px] text-center">
            <div style={{ height: 1.5, backgroundColor: d.textColor + '99' }} />
            <div className="font-mono text-[12px] tracking-[0.3em] mt-3 uppercase" style={{ color: d.textColor + '80' }}>{name}</div>
          </div>
        ))}
      </div>
      {footer}
    </div>
  )
}

// Standing session card: stacked display type, cadence chips, month-dot motif.
export function TplOfficeHours({ d, brand }) {
  const words = (d.subtitle || 'OFFICE HOURS').toUpperCase().split(/\s+/)
  const mid = Math.ceil(words.length / 2)
  const v = ['marquee', 'door', 'clock', 'calendar', 'ledger', 'sign', 'ticket', 'board'].includes(d.variant) ? d.variant : 'marquee'
  const ink = d.textColor
  // the session chips and the hosted-by footer are the office-hours constants —
  // every design seats them somewhere
  const chips = (
    <div className="flex items-center gap-4">
      <div className="px-6 py-3 font-mono text-[16px] font-bold tracking-[0.15em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.date}</div>
      {d.metric && <div className="px-6 py-3 border-2 font-mono text-[16px] font-bold tracking-[0.15em]" style={{ borderColor: ink, color: ink }}>{d.metric}</div>}
    </div>
  )
  const footer = (
    <>
      <LedgerRule color={ink + '66'} />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
        <span>HOSTED BY {(d.author || '').toUpperCase()} · {(d.role || '').toUpperCase()}</span>
        <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
      </div>
    </>
  )

  if (v === 'door') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative h-[52%] shrink-0">
          <DoorSlats color={ink + '21'} count={12} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: `linear-gradient(to top, ${d.bgColor}, transparent)` }} />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
            <div className="flex gap-32">
              <div style={{ width: 2, height: 64, backgroundColor: ink + '8c', transform: 'rotate(14deg)', transformOrigin: 'top' }} />
              <div style={{ width: 2, height: 64, backgroundColor: ink + '8c', transform: 'rotate(-14deg)', transformOrigin: 'top' }} />
            </div>
            <div className="px-16 py-8 text-center border-4 -mt-1" style={{ backgroundColor: d.bgColor, borderColor: ink, boxShadow: `10px 10px 0 ${d.accentColor}40` }}>
              <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: ink + '99' }}>{d.subtitle}</div>
              <div className="text-[92px] font-black leading-none mt-2" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>OPEN</div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col px-20 pb-14 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            <h2 className="text-[38px] leading-snug max-w-[85%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
            <div className="mt-8">{chips}</div>
          </div>
          {footer}
        </div>
      </div>
    )
  }

  if (v === 'clock') {
    const tmatch = (d.date || '').match(/(\d{1,2})[:.](\d{2})/)
    const hh = (tmatch ? parseInt(tmatch[1], 10) : 8) % 12
    const mm = tmatch ? parseInt(tmatch[2], 10) : 0
    const ha = ((hh + mm / 60) * 30 - 90) * Math.PI / 180
    const ma = (mm * 6 - 90) * Math.PI / 180
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 min-h-0 flex items-center gap-16">
          <svg viewBox="-110 -110 220 220" className="w-[36%] shrink-0">
            <circle r="100" fill="none" stroke={ink} strokeWidth="3" />
            <circle r="93" fill="none" stroke={ink} strokeWidth="1" opacity="0.5" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 - 90) * Math.PI / 180
              const hot = i === hh
              return <line key={i} x1={Math.cos(a) * 78} y1={Math.sin(a) * 78} x2={Math.cos(a) * 88} y2={Math.sin(a) * 88} stroke={hot ? d.accentColor : ink} strokeWidth={hot ? 5 : 2.5} opacity={hot ? 1 : 0.7} />
            })}
            <line x1="0" y1="0" x2={Math.cos(ha) * 48} y2={Math.sin(ha) * 48} stroke={ink} strokeWidth="7" strokeLinecap="round" />
            <line x1="0" y1="0" x2={Math.cos(ma) * 68} y2={Math.sin(ma) * 68} stroke={d.accentColor} strokeWidth="4" strokeLinecap="round" />
            <circle r="6" fill={d.accentColor} />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="font-black leading-[0.95] tracking-tight text-[80px]" style={{ fontFamily: brand.fonts.display }}>{words.slice(0, mid).join(' ')}</div>
            <div className="font-black leading-[0.95] tracking-tight text-[80px]" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{words.slice(mid).join(' ') || 'HOURS'}</div>
            <h2 className="text-[28px] leading-snug mt-6 max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
            <div className="mt-8">{chips}</div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'calendar') {
    const dayM = (d.date || '').match(/EVERY\s+([A-Za-z]+)/i)
    const day = (dayM ? dayM[1] : 'WEEKLY').toUpperCase()
    const di = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].indexOf(day)
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag="STANDING SESSION" />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 min-h-0 flex items-center gap-14">
          <div className="w-[36%] shrink-0 border-2 flex flex-col overflow-hidden" style={{ borderColor: ink, backgroundColor: d.bgColor, boxShadow: `12px 12px 0 ${d.accentColor}40` }}>
            <div className="py-4 text-center font-mono text-[12px] tracking-[0.35em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.subtitle}</div>
            <div className="py-10 text-center">
              <div className="text-[110px] font-black leading-none" style={{ fontFamily: brand.fonts.display }}>{day.slice(0, 3)}</div>
              <div className="font-mono text-[12px] tracking-[0.3em] mt-3" style={{ color: ink + '99' }}>RECURRING</div>
            </div>
            <div className="flex justify-center gap-2.5 pb-8">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((c, i) => (
                <div key={i} className="w-9 h-9 flex items-center justify-center font-mono text-[13px] border"
                  style={i === di ? { backgroundColor: d.accentColor, borderColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85), fontWeight: 700 } : { borderColor: ink + '40', color: ink + '8c' }}>{c}</div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[42px] leading-[1.15] tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
            <div className="mt-9">{chips}</div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'ledger') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>STANDING APPOINTMENT &middot; NO. 001</span>
            <span style={{ color: d.accentColor }}>{d.metric}</span>
          </div>
          <div className="relative mt-6 space-y-2 font-mono text-[13px] tracking-[0.18em] uppercase">
            <div><span style={{ color: ink + '66' }}>SESSION &middot; </span>{d.subtitle}</div>
            <div><span style={{ color: ink + '66' }}>HOST &middot; </span><span style={{ color: d.accentColor }}>{d.author}{d.role ? ` — ${d.role}` : ''}</span></div>
            <div><span style={{ color: ink + '66' }}>TIME &middot; </span>{d.date}</div>
          </div>
          <div className="relative flex-1 flex items-center">
            <h1 className="text-[56px] leading-[1.1] tracking-tight max-w-[90%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'sign') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center px-20 py-16 text-center" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="font-mono text-[14px] tracking-[0.45em]" style={{ color: d.accentColor }}>&middot; {d.subtitle} &middot;</div>
        <LedgerRule color={ink} className="w-full mt-5" />
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="px-16 py-10 rounded-[36px] border-4" style={{ borderColor: d.accentColor, boxShadow: `0 0 0 10px ${d.accentColor}22, 0 0 60px ${d.accentColor}55` }}>
            <div className="rounded-[22px] border px-12 py-7" style={{ borderColor: d.accentColor + '66' }}>
              <div className="font-mono text-[15px] tracking-[0.4em]" style={{ color: ink + '99' }}>WE ARE</div>
              <div className="text-[130px] font-black leading-none tracking-[0.06em] mt-2" style={{ color: d.accentColor, fontFamily: brand.fonts.display, textShadow: `0 0 34px ${d.accentColor}88` }}>OPEN</div>
            </div>
          </div>
          <h2 className="text-[32px] mt-10 leading-snug max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
          <div className="mt-8 flex justify-center">{chips}</div>
        </div>
        <div className="w-full text-left">{footer}</div>
      </div>
    )
  }

  if (v === 'ticket') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 min-h-0 flex items-center gap-16">
          <div className="w-[34%] shrink-0 border-2 text-center" style={{ borderColor: ink, backgroundColor: d.bgColor, boxShadow: `12px 12px 0 ${d.accentColor}40` }}>
            <div className="py-3 font-mono text-[12px] tracking-[0.35em]" style={{ backgroundColor: ink, color: d.bgColor }}>NOW SERVING</div>
            <div className="py-10 px-6" style={{ borderBottom: `2px dashed ${ink}59` }}>
              <div className="text-[120px] font-black leading-none" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>A&middot;01</div>
            </div>
            <div className="py-4 font-mono text-[11px] tracking-[0.3em]" style={{ color: ink + '99' }}>TAKE A NUMBER{d.metric ? ` · ${d.metric}` : ''}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black leading-[0.95] tracking-tight text-[64px]" style={{ fontFamily: brand.fonts.display }}>{words.slice(0, mid).join(' ')}</div>
            <div className="font-black leading-[0.95] tracking-tight text-[64px]" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{words.slice(mid).join(' ') || 'HOURS'}</div>
            <h2 className="text-[28px] leading-snug mt-6 max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
            <div className="mt-8">{chips}</div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'board') {
    const rows = [
      ['SESSION', d.subtitle],
      ['HOST', `${d.author || ''}${d.role ? ' — ' + d.role : ''}`],
      ['TIME', d.date],
      ['ADMISSION', d.metric],
    ].filter(r => r[1])
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag="STANDING SESSION" />
        <LedgerRule color={ink} className="mt-5" />
        <div className="flex-1 min-h-0 flex flex-col justify-center">
          <h1 className="text-[50px] leading-[1.08] tracking-tight max-w-[90%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 600 }}>{d.title}</h1>
          <div className="mt-10 overflow-hidden" style={{ backgroundColor: ink, boxShadow: `12px 12px 0 ${d.accentColor}40` }}>
            {rows.map(([k, val], i) => (
              <div key={i} className="flex items-center justify-between px-10 py-5 font-mono tracking-[0.2em] uppercase" style={{ borderTop: i ? `1px solid ${d.bgColor}26` : 'none' }}>
                <span className="text-[13px]" style={{ color: d.bgColor + '99' }}>{k}</span>
                <span className="text-[19px] font-bold" style={{ color: i === rows.length - 1 ? d.accentColor : d.bgColor }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <Masthead brand={brand} ink={d.textColor} accent={d.accentColor} tag="STANDING SESSION" />
      <LedgerRule color={d.textColor} className="mt-5" />
      <div className="relative flex-1 flex flex-col justify-center">
        <svg viewBox="0 0 34 22" className="absolute right-2 top-10 w-[300px]">
          {Array.from({ length: 28 }, (_, i) => {
            const accent = i === 8 || i === 15 || i === 22
            return <circle key={i} cx={(i % 7) * 5 + 2} cy={Math.floor(i / 7) * 6 + 3} r={accent ? 1.9 : 1.1} fill={accent ? d.accentColor : d.textColor + '33'} />
          })}
        </svg>
        <div className="font-black leading-[0.92] tracking-tight text-[150px]" style={{ fontFamily: brand.fonts.display }}>{words.slice(0, mid).join(' ')}</div>
        <div className="font-black leading-[0.92] tracking-tight text-[150px]" style={{ color: d.accentColor, fontFamily: brand.fonts.display }}>{words.slice(mid).join(' ') || 'HOURS'}</div>
        <h2 className="text-[40px] leading-snug mt-10 max-w-[80%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h2>
        <div className="flex items-center gap-4 mt-10">
          <div className="px-6 py-3 font-mono text-[16px] font-bold tracking-[0.15em]" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>{d.date}</div>
          <div className="px-6 py-3 border-2 font-mono text-[16px] font-bold tracking-[0.15em]" style={{ borderColor: d.textColor, color: d.textColor }}>{d.metric}</div>
        </div>
      </div>
      <LedgerRule color={d.textColor + '66'} />
      <div className="flex justify-between pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
        <span>HOSTED BY {(d.author || '').toUpperCase()} · {(d.role || '').toUpperCase()}</span>
        <span style={{ color: d.accentColor }}>{(d.url || brand.url).toUpperCase()}</span>
      </div>
    </div>
  )
}

// The approved Storage 101 light-editorial lesson recipe: cream field, serif
// headline, one lesson, generous whitespace, sign-off footer. (SM canon.)
export function TplStorage101({ d, brand }) {
  const rows = (d.features || '').split('\n').filter(Boolean).slice(0, 5)
  const signoff = brand.signoff.replace(/\.$/, '')
  const commaAt = signoff.indexOf(',')
  const soLead = commaAt > -1 ? signoff.slice(0, commaAt + 1) : signoff
  const soAccent = commaAt > -1 ? signoff.slice(commaAt + 1) : ''
  const v = ['primer', 'chalk', 'card', 'notes', 'syllabus', 'quiz', 'sticky', 'blueprint', 'folder', 'receipt', 'unit', 'slide'].includes(d.variant) ? d.variant : 'primer'
  const ink = d.textColor
  const footer = (
    <div>
      <div style={{ height: 1, backgroundColor: ink + '4d' }} />
      <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.2em] uppercase">
        <span style={{ color: ink + 'a6' }}>{soLead}<span style={{ color: d.accentColor }}>{soAccent}.</span></span>
        <span style={{ color: ink + '8c' }}>{(d.url || brand.url).toLowerCase()}</span>
      </div>
    </div>
  )

  if (v === 'chalk') {
    // the lesson written up on the board: ink field, chalk lines
    const chalk = d.bgColor
    return (
      <div className="w-full h-full relative overflow-hidden p-12" style={{ backgroundColor: ink, color: chalk, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `3px solid ${chalk}8c` }}>
          <div className="absolute inset-[9px] pointer-events-none" style={{ border: `1.5px solid ${chalk}40` }} />
          <div className="relative flex justify-between font-mono text-[14px] tracking-[0.3em] uppercase" style={{ color: chalk + '99' }}>
            <span>{d.subtitle}</span>
            <span className="px-3 py-1 border" style={{ borderColor: chalk + '8c' }}>{d.metric}</span>
          </div>
          <div className="relative flex-1 flex flex-col justify-center">
            <h1 className="text-[58px] leading-[1.12]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
            <svg viewBox="0 0 300 10" preserveAspectRatio="none" className="w-[52%] mt-5 h-[12px]">
              <path d="M2,6 Q 20,2 40,6 T 80,6 T 120,6 T 160,6 T 200,6 T 240,6 T 280,6" fill="none" stroke={d.accentColor} strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            {d.body && <p className="mt-8 text-[22px] leading-relaxed max-w-[88%]" style={{ color: chalk + 'b3' }}>{d.body}</p>}
            {rows.length > 0 && (
              <div className="mt-9 space-y-5 max-w-[88%]">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-5 text-[23px]" style={{ color: chalk + 'd9' }}>
                    <span className="font-mono text-[17px] shrink-0" style={{ color: d.accentColor }}>&#8212;</span>
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex justify-between items-center font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: chalk + '8c' }}>
            <span>{brand.signoff.toUpperCase()}</span>
            <span>{(d.url || brand.url).toLowerCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'card') {
    // an index flashcard on the desk: rule at top, points sitting on ruled lines
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-14" style={{ backgroundColor: mixHex(d.bgColor, '#000000', 0.07), color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex items-baseline justify-between">
          <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
            {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
          </div>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        </div>
        <div className="relative flex-1 min-h-0 my-10 flex flex-col px-14 pt-12 pb-10" style={{ backgroundColor: d.bgColor, border: `1.5px solid ${ink}26`, boxShadow: `0 22px 44px ${ink}26` }}>
          <div className="absolute top-0 inset-x-0" style={{ height: 4, backgroundColor: d.accentColor }} />
          <div className="absolute top-7 right-10 font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '8c' }}>{d.metric}</div>
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            <h1 className="text-[52px] leading-[1.12] max-w-[88%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
            {d.body && <p className="mt-6 text-[21px] leading-relaxed max-w-[88%]" style={{ color: ink + 'b3' }}>{d.body}</p>}
            <div className="mt-9">
              {rows.map((r, i) => (
                <div key={i} className="flex items-baseline gap-5 text-[22px] pb-4 mb-4" style={{ color: ink + 'd9', borderBottom: `1px solid ${ink}26` }}>
                  <span className="font-mono text-[14px] shrink-0" style={{ color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'notes') {
    // a ruled notebook page: accent margin line, checked boxes
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-0 py-14" style={{
        backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 52px, ${ink}1a 52px, ${ink}1a 53px)`,
      }}>
        <div className="absolute inset-y-0 left-24 w-[2px]" style={{ backgroundColor: d.accentColor + '8c' }} />
        <div className="flex-1 flex flex-col pl-36 pr-16 min-h-0">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '80' }}>{d.subtitle} &middot; {d.metric}</div>
            <div className="text-[22px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
              {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-[56px] leading-[1.12]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
            {d.body && <p className="mt-7 text-[21px] leading-relaxed max-w-[90%]" style={{ color: ink + 'b3' }}>{d.body}</p>}
            {rows.length > 0 && (
              <div className="mt-10 space-y-6 max-w-[90%]">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-5 text-[22px]" style={{ color: ink + 'd9' }}>
                    <span className="w-8 h-8 shrink-0 flex items-center justify-center border-2 text-[17px] font-bold" style={{ borderColor: d.accentColor, color: d.accentColor }}>&#10003;</span>
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
          {footer}
        </div>
      </div>
    )
  }

  if (v === 'syllabus') {
    // the course index: a giant 101 and numbered units
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="absolute -right-6 -top-10 font-black leading-none select-none text-[340px]" style={{ fontFamily: brand.fonts.display, color: d.accentColor + '1f' }}>101</div>
        <Masthead brand={brand} ink={ink} accent={d.accentColor} tag={d.subtitle} />
        <LedgerRule color={ink} className="mt-5" />
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '80' }}>{d.metric}</div>
          <h1 className="mt-5 text-[56px] leading-[1.1] max-w-[88%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
          {rows.length > 0 && (
            <div className="mt-12">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-8 py-5" style={{ borderTop: `1px solid ${ink}33`, borderBottom: i === rows.length - 1 ? `1px solid ${ink}33` : 'none' }}>
                  <span className="font-black text-[34px] leading-none w-16 shrink-0" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[23px]" style={{ color: ink + 'd9' }}>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'quiz') {
    // pop quiz: the title is the question, the points are the options,
    // the body is the answer strip
    const letters = ['A', 'B', 'C', 'D', 'E']
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex items-center justify-between">
          <div className="inline-flex px-4 py-2 font-mono text-[14px] font-bold tracking-[0.3em]" style={{ backgroundColor: ink, color: d.bgColor }}>POP QUIZ</div>
          <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '80' }}>{d.subtitle} &middot; {d.metric}</div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start gap-6">
            <span className="text-[64px] leading-none font-black shrink-0" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>Q.</span>
            <h1 className="text-[48px] leading-[1.15] max-w-[88%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
          </div>
          {rows.length > 0 && (
            <div className="mt-11 space-y-5 pl-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-5 text-[22px]" style={{ color: ink + 'd9' }}>
                  <span className="w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-[19px]" style={{ borderColor: ink + '66', fontFamily: brand.fonts.heading }}>{letters[i]}</span>
                  {r}
                </div>
              ))}
            </div>
          )}
          {d.body && (
            <div className="mt-11 px-7 py-5 flex items-baseline gap-5" style={{ backgroundColor: d.accentColor, color: mixHex(d.accentColor, '#000000', 0.85) }}>
              <span className="font-mono text-[13px] font-bold tracking-[0.3em] shrink-0">ANSWER &middot;</span>
              <span className="text-[20px] leading-snug font-semibold">{d.body}</span>
            </div>
          )}
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'sticky') {
    // a field note stuck to the wall: pale accent note, taped corner, tilt
    const note = mixHex(d.accentColor, '#FFFFFF', 0.84)
    const noteInk = mixHex(d.accentColor, '#000000', 0.78)
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex items-baseline justify-between">
          <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
            {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
          </div>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="relative w-[88%] px-12 pt-14 pb-12" style={{ backgroundColor: note, color: noteInk, transform: 'rotate(-1.5deg)', boxShadow: `0 24px 48px ${ink}40` }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-9" style={{ backgroundColor: ink + '26', transform: 'rotate(1deg)' }} />
            <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: noteInk + '99' }}>FIELD NOTE &middot; {d.metric}</div>
            <h1 className="mt-5 text-[46px] leading-[1.15]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
            {d.body && <p className="mt-5 text-[20px] leading-relaxed italic" style={{ color: noteInk + 'b3', fontFamily: brand.fonts.serif }}>{d.body}</p>}
            {rows.length > 0 && (
              <div className="mt-7 space-y-4">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-4 text-[20px]" style={{ color: noteInk + 'd9' }}>
                    <span className="shrink-0 w-6" style={{ height: 2.5, backgroundColor: noteInk + '8c', transform: 'translateY(-6px)' }} />
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'folder') {
    // the deal file: a manila folder with the lesson tab, clipped papers
    const manila = '#EADFC4'
    const fInk = '#33301F'
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-16 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex items-baseline justify-between">
          <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
            {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
          </div>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col my-8">
          <div className="self-start px-8 py-2.5 font-mono text-[13px] font-bold tracking-[0.25em]" style={{ backgroundColor: manila, color: fInk, borderBottom: `1px solid ${fInk}26` }}>{d.metric}</div>
          <div className="relative flex-1 min-h-0 flex flex-col justify-center px-12 py-12" style={{ backgroundColor: manila, color: fInk, boxShadow: `0 22px 44px ${ink}33` }}>
            <div className="absolute top-6 right-10 font-mono text-[12px] tracking-[0.3em] border px-3 py-1.5 -rotate-3" style={{ borderColor: fInk + '59', color: fInk + '73' }}>OPERATOR FILE</div>
            <svg viewBox="0 0 24 60" className="absolute -top-5 right-28 w-6" fill="none" stroke={ink + 'a6'} strokeWidth="2.5">
              <path d="M 12,4 C 18,4 19,10 19,14 L 19,44 C 19,50 15,53 12,53 C 9,53 5,50 5,44 L 5,16 C 5,12 7,9 10,9 C 13,9 15,12 15,16 L 15,42" />
            </svg>
            <h1 className="text-[46px] leading-[1.14] max-w-[86%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{d.title}</h1>
            {d.body && <p className="mt-5 text-[20px] leading-relaxed max-w-[88%]" style={{ color: fInk + 'b3' }}>{d.body}</p>}
            {rows.length > 0 && (
              <div className="mt-8 space-y-4">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-4 text-[20px]" style={{ color: fInk + 'd9' }}>
                    <span className="font-mono text-[13px] shrink-0" style={{ color: d.accentColor }}>&#9656;</span>
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'receipt') {
    // the till receipt: itemized lesson, dotted leaders, barcode
    const paper = '#FDFCF8'
    const rInk = '#1C1A14'
    const bars = Array.from({ length: 36 }, (_, i) => 1 + Math.round(hash01(i, 7) * 3))
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center px-16 py-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="w-full flex items-baseline justify-between">
          <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
            {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
          </div>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        </div>
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="w-[68%] px-10 py-10 font-mono" style={{ backgroundColor: paper, color: rInk, transform: 'rotate(0.8deg)', boxShadow: `0 24px 48px ${ink}40`, borderTop: `3px dashed ${rInk}33`, borderBottom: `3px dashed ${rInk}33` }}>
            <div className="text-center text-[17px] font-bold tracking-[0.2em]" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}</div>
            <div className="text-center text-[11px] tracking-[0.25em] mt-1" style={{ color: rInk + '8c' }}>{d.subtitle} &middot; {d.metric}</div>
            <div className="my-5 text-center text-[12px] tracking-[0.4em]" style={{ color: rInk + '66' }}>* * * * * * * * * *</div>
            <div className="text-[19px] font-bold leading-snug uppercase tracking-[0.04em]">{d.title}</div>
            {d.body && <div className="mt-3 text-[13px] leading-relaxed" style={{ color: rInk + 'a6' }}>{d.body}</div>}
            <div className="mt-6 space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="flex items-baseline text-[14px]">
                  <span className="shrink-0">{r}</span>
                  <span className="flex-1 mx-2" style={{ borderBottom: `2px dotted ${rInk}40`, transform: 'translateY(-4px)' }} />
                  <span className="shrink-0 font-bold" style={{ color: d.accentColor }}>{String(i + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 flex justify-between text-[15px] font-bold" style={{ borderTop: `1.5px solid ${rInk}` }}>
              <span>TOTAL</span><span>{rows.length} POINT{rows.length === 1 ? '' : 'S'} &middot; FREE</span>
            </div>
            <div className="mt-6 flex items-end justify-center gap-[3px] h-12">
              {bars.map((w, i) => <div key={i} style={{ width: w, height: '100%', backgroundColor: rInk }} />)}
            </div>
            <div className="mt-3 text-center text-[10px] tracking-[0.3em]" style={{ color: rInk + '8c' }}>THANK YOU FOR LEARNING WITH US</div>
          </div>
        </div>
        <div className="w-full">{footer}</div>
      </div>
    )
  }

  if (v === 'unit') {
    // the lesson stenciled on a roll-up unit door, plate and padlock included
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '14'} count={22} className="absolute inset-0 w-full h-full" />
        <div className="relative flex items-baseline justify-between">
          <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
            {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
          </div>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="self-start border-2 px-6 py-4 text-center" style={{ borderColor: ink, backgroundColor: d.bgColor, boxShadow: `8px 8px 0 ${d.accentColor}40` }}>
            <div className="font-mono text-[11px] tracking-[0.35em]" style={{ color: ink + '8c' }}>UNIT</div>
            <div className="text-[44px] font-black leading-none mt-1" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>101</div>
          </div>
          <h1 className="mt-9 text-[54px] leading-[1.1] uppercase tracking-tight font-bold max-w-[94%]" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          {d.body && <p className="mt-6 text-[21px] leading-relaxed max-w-[85%]" style={{ color: ink + 'b3' }}>{d.body}</p>}
          {rows.length > 0 && (
            <div className="mt-9 space-y-5 max-w-[90%]">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-5 text-[21px]" style={{ color: ink + 'd9' }}>
                  <span className="shrink-0 w-7" style={{ height: 3, backgroundColor: d.accentColor }} />
                  {r}
                </div>
              ))}
            </div>
          )}
          <div className="mt-10 flex items-center gap-4">
            <svg viewBox="0 0 40 52" className="w-9" fill="none" stroke={ink} strokeWidth="3.5">
              <path d="M 10,22 L 10,14 C 10,8 14,4 20,4 C 26,4 30,8 30,14 L 30,22" />
              <rect x="6" y="22" width="28" height="24" fill={d.accentColor} stroke={ink} />
            </svg>
            <span className="font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>CONTENTS SECURED &middot; {d.metric}</span>
          </div>
        </div>
        <div className="relative">{footer}</div>
      </div>
    )
  }

  if (v === 'slide') {
    // one slide from the deck: header band, square bullets, progress dots
    const digits = (d.metric || '').match(/\d+/)
    const page = digits ? digits[0].padStart(2, '0') : '01'
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="flex items-center justify-between px-16 py-6" style={{ backgroundColor: ink, color: d.bgColor }}>
          <span className="text-[20px] font-bold tracking-[0.08em]" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}<span style={{ color: d.accentColor }}>.</span></span>
          <span className="font-mono text-[12px] tracking-[0.3em]">{d.subtitle} &middot; {d.metric}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-20 min-h-0">
          <h1 className="text-[60px] leading-[1.1]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, letterSpacing: '-1px' }}>{d.title}</h1>
          {d.body && <p className="mt-7 text-[22px] leading-relaxed max-w-[85%]" style={{ color: ink + 'b3' }}>{d.body}</p>}
          {rows.length > 0 && (
            <div className="mt-10 space-y-6 max-w-[90%]">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-6 text-[23px]" style={{ color: ink + 'd9' }}>
                  <span className="w-4 h-4 shrink-0" style={{ backgroundColor: d.accentColor }} />
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-20 pb-12">
          <div style={{ height: 1, backgroundColor: ink + '4d' }} />
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2.5">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? d.accentColor : ink + '33' }} />
              ))}
            </div>
            <span className="font-mono text-[13px] tracking-[0.25em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toLowerCase()}</span>
            <span className="text-[34px] font-black leading-none" style={{ fontFamily: brand.fonts.display, color: d.accentColor }}>{page}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'blueprint') {
    // facility drawing: deep accent field, drafting grid, title block
    const paper = mixHex(d.accentColor, '#000000', 0.68)
    const line = mixHex(d.accentColor, '#FFFFFF', 0.45)
    const text = '#F2F7FF'
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{
        backgroundColor: paper, color: text, fontFamily: brand.fonts.body,
        backgroundImage: `repeating-linear-gradient(to right, transparent, transparent 79px, ${line}26 79px, ${line}26 80px), repeating-linear-gradient(to bottom, transparent, transparent 79px, ${line}26 79px, ${line}26 80px)`,
      }}>
        <div className="flex justify-between font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: line }}>
          <span>{d.subtitle} &middot; DRAWING {d.metric}</span>
          <span>SHEET 101</span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 className="text-[54px] leading-[1.12] uppercase tracking-tight max-w-[92%] font-bold" style={{ fontFamily: brand.fonts.heading }}>{d.title}</h1>
          {d.body && <p className="mt-7 text-[21px] leading-relaxed max-w-[85%]" style={{ color: text + 'b3' }}>{d.body}</p>}
          {rows.length > 0 && (
            <div className="mt-11 space-y-6 max-w-[92%]">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-6 text-[21px]" style={{ color: text + 'd9' }}>
                  <span className="flex items-center shrink-0 w-16">
                    <span style={{ width: 2, height: 14, backgroundColor: line }} />
                    <span className="flex-1" style={{ height: 1.5, backgroundColor: line }} />
                    <span style={{ width: 2, height: 14, backgroundColor: line }} />
                  </span>
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="self-end border px-6 py-4 text-right" style={{ borderColor: line }}>
          <div className="text-[19px] font-bold tracking-[0.08em]" style={{ fontFamily: brand.fonts.heading }}>{brand.wordmark}</div>
          <div className="font-mono text-[11px] tracking-[0.25em] mt-1" style={{ color: line }}>{(d.url || brand.url).toUpperCase()}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div style={{ height: 8, backgroundColor: d.accentColor }} />
      <div className="flex-1 flex flex-col px-24 pt-14 pb-12 min-h-0">
        <div className="flex items-baseline justify-between">
          <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
            {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
          </div>
          <div className="font-mono text-[14px] tracking-[0.35em]" style={{ color: d.accentColor }}>{d.subtitle}</div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: d.textColor + '80' }}>SELF-STORAGE INVESTING · {d.metric}</div>
          <h1 className="mt-7 text-[72px]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, letterSpacing: '-1.5px', lineHeight: 1.06 }}>{d.title}</h1>
          {d.body && <p className="mt-8 text-[23px] leading-relaxed max-w-[85%]" style={{ color: d.textColor + 'b3' }}>{d.body}</p>}
          {rows.length > 0 && (
            <div className="mt-10 space-y-4 max-w-[85%]">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-5 text-[22px]" style={{ color: d.textColor + 'd9' }}>
                  <span className="w-7 shrink-0" style={{ height: 3, backgroundColor: d.accentColor }} />
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{ height: 1, backgroundColor: d.textColor + '4d' }} />
          <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.2em] uppercase">
            <span style={{ color: d.textColor + 'a6' }}>{soLead}<span style={{ color: d.accentColor }}>{soAccent}.</span></span>
            <span style={{ color: d.textColor + '8c' }}>{(d.url || brand.url).toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Myth vs fact: the flag color marks the myth, the ink carries the truth.
export function TplMythFact({ d, brand }) {
  const v = ['classic', 'stamp', 'split', 'cards', 'verdict', 'chat', 'redline', 'torn'].includes(d.variant) ? d.variant : 'classic'
  const ink = d.textColor
  const header = (
    <div className="flex items-baseline justify-between">
      <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
        {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
      </div>
      <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '80' }}>{d.subtitle} &middot; {d.metric}</div>
    </div>
  )
  const footer = (
    <div>
      <div style={{ height: 1, backgroundColor: ink + '4d' }} />
      <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>
        <span>{brand.signoff.toUpperCase()}</span>
        <span>{(d.url || brand.url).toLowerCase()}</span>
      </div>
    </div>
  )

  if (v === 'stamp') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {header}
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative max-w-[92%]">
            <h1 className="text-[56px] leading-[1.14]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, color: ink + 'a6' }}>&ldquo;{d.title}&rdquo;</h1>
            <div className="absolute right-0 -top-24 px-7 py-3 border-[5px] font-black text-[54px] leading-none tracking-[0.1em] -rotate-12" style={{ borderColor: d.accentColor, color: d.accentColor, fontFamily: brand.fonts.display, opacity: 0.92 }}>FALSE</div>
          </div>
          <div className="mt-14 flex items-center gap-4">
            <span className="w-10 h-10 shrink-0 flex items-center justify-center border-2 font-bold text-[22px]" style={{ borderColor: ink, color: ink }}>&#10003;</span>
            <span className="font-mono text-[14px] tracking-[0.3em]" style={{ color: ink + '80' }}>WHAT IS ACTUALLY TRUE</span>
          </div>
          <p className="mt-6 text-[34px] leading-[1.35] max-w-[95%] font-semibold" style={{ fontFamily: brand.fonts.serif }}>{d.body}</p>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'split') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {header}
        <div className="flex-1 min-h-0 flex gap-6 my-10">
          <div className="flex-1 flex flex-col p-10" style={{ backgroundColor: ink + '0d', border: `1.5px solid ${ink}33` }}>
            <div className="flex items-center gap-4">
              <span className="w-11 h-11 shrink-0 flex items-center justify-center font-bold text-[24px]" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>&#10005;</span>
              <span className="font-mono text-[14px] font-bold tracking-[0.3em]" style={{ color: d.accentColor }}>MYTH</span>
            </div>
            <div className="flex-1 flex items-center">
              <p className="text-[32px] leading-[1.3]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, color: ink + 'a6' }}>&ldquo;{d.title}&rdquo;</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col p-10" style={{ backgroundColor: ink, color: d.bgColor }}>
            <div className="flex items-center gap-4">
              <span className="w-11 h-11 shrink-0 flex items-center justify-center font-bold text-[24px]" style={{ backgroundColor: d.bgColor, color: ink }}>&#10003;</span>
              <span className="font-mono text-[14px] font-bold tracking-[0.3em]" style={{ color: d.bgColor + 'cc' }}>FACT</span>
            </div>
            <div className="flex-1 flex items-center">
              <p className="text-[32px] leading-[1.3] font-semibold" style={{ fontFamily: brand.fonts.serif }}>{d.body}</p>
            </div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'cards') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {header}
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-8">
          <div className="flex items-stretch" style={{ border: `1.5px solid ${ink}33`, backgroundColor: ink + '0a' }}>
            <div className="w-24 shrink-0 flex items-center justify-center text-[44px] font-black" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>&#10005;</div>
            <div className="flex-1 p-8">
              <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.accentColor }}>THE MYTH</div>
              <p className="mt-3 text-[30px] leading-[1.28]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, color: ink + 'a6' }}>&ldquo;{d.title}&rdquo;</p>
            </div>
          </div>
          <div className="flex items-stretch" style={{ backgroundColor: ink, boxShadow: `12px 12px 0 ${d.accentColor}33` }}>
            <div className="w-24 shrink-0 flex items-center justify-center text-[44px] font-black" style={{ backgroundColor: mixHex(ink, '#FFFFFF', 0.14), color: d.bgColor }}>&#10003;</div>
            <div className="flex-1 p-8" style={{ color: d.bgColor }}>
              <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: d.bgColor + 'cc' }}>THE FACT</div>
              <p className="mt-3 text-[30px] leading-[1.28] font-semibold" style={{ fontFamily: brand.fonts.serif }}>{d.body}</p>
            </div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'verdict') {
    return (
      <div className="w-full h-full relative overflow-hidden p-14" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-full h-full flex flex-col px-14 py-12" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[7px] pointer-events-none" style={{ border: `1px solid ${ink}80` }} />
          <div className="relative flex justify-between items-center font-mono text-[13px] tracking-[0.25em]" style={{ color: ink + '99' }}>
            <span>CLAIM REVIEW &middot; CASE {(d.metric || '').replace(/\D/g, '') || '01'}</span>
            <span>{d.subtitle}</span>
          </div>
          <div className="relative flex-1 flex flex-col justify-center">
            <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '66' }}>THE CLAIM</div>
            <h1 className="mt-4 text-[44px] leading-[1.18] max-w-[94%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, color: ink + 'a6' }}>&ldquo;{d.title}&rdquo;</h1>
            <div className="mt-10 flex items-center gap-5">
              <span className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '66' }}>VERDICT</span>
              <span className="px-5 py-2 font-black text-[26px] tracking-[0.12em]" style={{ backgroundColor: d.accentColor, color: '#FFFFFF', fontFamily: brand.fonts.display }}>FALSE</span>
            </div>
            <div className="mt-10 font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: ink + '66' }}>THE RULING</div>
            <p className="mt-4 text-[30px] leading-[1.35] max-w-[94%] font-semibold" style={{ fontFamily: brand.fonts.serif }}>{d.body}</p>
          </div>
          <div className="relative flex items-end justify-between">
            <div className="w-[260px]">
              <div style={{ height: 1.5, backgroundColor: ink + '99' }} />
              <div className="font-mono text-[11px] tracking-[0.28em] mt-2 uppercase" style={{ color: ink + '80' }}>{brand.signoff}</div>
            </div>
            <span className="font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{(d.url || brand.url).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'chat') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {header}
        <div className="flex-1 flex flex-col justify-center gap-12">
          <div className="max-w-[82%] self-start">
            <div className="font-mono text-[12px] tracking-[0.3em] mb-3" style={{ color: ink + '66' }}>HEARD IN THE WILD</div>
            <div className="px-9 py-7 rounded-3xl rounded-tl-md text-[28px] leading-[1.35]" style={{ backgroundColor: ink + '14', color: ink + 'b3', fontFamily: brand.fonts.serif }}>
              &ldquo;{d.title}&rdquo;
            </div>
          </div>
          <div className="max-w-[82%] self-end flex items-end gap-4">
            <div>
              <div className="font-mono text-[12px] tracking-[0.3em] mb-3 text-right" style={{ color: d.accentColor }}>{brand.wordmark} REPLIES</div>
              <div className="px-9 py-7 rounded-3xl rounded-br-md text-[28px] leading-[1.35] font-semibold" style={{ backgroundColor: ink, color: d.bgColor, fontFamily: brand.fonts.serif }}>
                {d.body}
              </div>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-bold text-[22px]" style={{ backgroundColor: d.accentColor, color: '#FFFFFF', fontFamily: brand.fonts.heading }}>{brand.wordmark[0]}</div>
          </div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'redline') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {header}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-[52px] leading-[1.22] max-w-[94%]" style={{
            fontFamily: brand.fonts.serif, fontWeight: 500, color: ink + '8c',
            textDecoration: 'line-through', textDecorationColor: d.accentColor, textDecorationThickness: 5,
          }}>{d.title}</h1>
          <div className="mt-6 font-mono text-[15px] tracking-[0.2em] font-bold" style={{ color: d.accentColor }}>&#94; CORRECTION &middot; SEE BELOW</div>
          <p className="mt-10 text-[38px] leading-[1.3] max-w-[95%] font-semibold pl-7" style={{ fontFamily: brand.fonts.serif, borderLeft: `6px solid ${d.accentColor}` }}>{d.body}</p>
          <div className="mt-9 self-start px-4 py-2 border font-mono text-[12px] tracking-[0.25em] -rotate-1" style={{ borderColor: d.accentColor + '8c', color: d.accentColor }}>REVIEWED BY THE OPERATORS</div>
        </div>
        {footer}
      </div>
    )
  }

  if (v === 'torn') {
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-16" style={{ backgroundColor: d.bgColor, color: ink, fontFamily: brand.fonts.body }}>
        {header}
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative self-center w-[88%] px-10 py-9 rotate-[-1.5deg]" style={{ backgroundColor: mixHex(d.bgColor, '#FFFFFF', 0.5), color: ink + 'a6', boxShadow: `0 18px 36px ${ink}33`, borderTop: `3px dashed ${ink}33`, borderBottom: `3px dashed ${ink}33` }}>
            <div className="font-mono text-[12px] tracking-[0.3em]" style={{ color: ink + '66' }}>THE MYTH &middot; {d.metric}</div>
            <p className="mt-4 text-[30px] leading-[1.3]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>&ldquo;{d.title}&rdquo;</p>
            <div className="absolute -right-5 -top-7 w-20 h-20 rounded-full flex items-center justify-center text-[44px] font-black rotate-12" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>&#10005;</div>
          </div>
          <div className="mt-14 flex items-center gap-6">
            <div className="flex-1" style={{ height: 1, backgroundColor: ink + '40' }} />
            <span className="font-mono text-[14px] tracking-[0.3em]" style={{ color: ink + '80' }}>KEEP THIS INSTEAD</span>
            <div className="flex-1" style={{ height: 1, backgroundColor: ink + '40' }} />
          </div>
          <p className="mt-10 text-[36px] leading-[1.32] max-w-[95%] font-semibold" style={{ fontFamily: brand.fonts.serif }}>{d.body}</p>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-24 py-16" style={{ backgroundColor: d.bgColor, color: d.textColor, fontFamily: brand.fonts.body }}>
      <div className="flex items-baseline justify-between">
        <div className="text-[26px] font-bold tracking-[0.06em]" style={{ fontFamily: brand.fonts.heading }}>
          {brand.wordmark}<span style={{ color: d.accentColor }}>.</span>
        </div>
        <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: d.textColor + '80' }}>{d.subtitle} · {d.metric}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="pl-8 relative">
          <div className="absolute left-0 top-1 bottom-1 w-[6px]" style={{ backgroundColor: d.accentColor }} />
          <div className="inline-flex px-3.5 py-1.5 font-mono text-[14px] font-bold tracking-[0.3em]" style={{ backgroundColor: d.accentColor, color: '#FFFFFF' }}>MYTH</div>
          <h1 className="mt-6 text-[62px] max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.1, color: d.textColor + 'b3' }}>&ldquo;{d.title}&rdquo;</h1>
        </div>
        <div className="my-12 flex items-center gap-6">
          <div className="flex-1" style={{ height: 1, backgroundColor: d.textColor + '40' }} />
          <span className="font-mono text-[15px] tracking-[0.3em]" style={{ color: d.textColor + '80' }}>THE FACT</span>
          <div className="flex-1" style={{ height: 1, backgroundColor: d.textColor + '40' }} />
        </div>
        <div className="pl-8 relative">
          <div className="absolute left-0 top-1 bottom-1 w-[6px]" style={{ backgroundColor: d.textColor }} />
          <p className="text-[40px] leading-[1.3] max-w-[95%] font-semibold" style={{ fontFamily: brand.fonts.serif }}>{d.body}</p>
        </div>
      </div>
      <div>
        <div style={{ height: 1, backgroundColor: d.textColor + '4d' }} />
        <div className="flex justify-between items-center pt-5 font-mono text-[13px] tracking-[0.2em] uppercase" style={{ color: d.textColor + '8c' }}>
          <span>{brand.signoff.toUpperCase()}</span>
          <span>{(d.url || brand.url).toLowerCase()}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Live Event Bill ───
// The whole event poster on one 1080×1350 sheet: kicker, headline, standfirst
// and callout, when/where, agenda, price plate, who it's for, what's included,
// and a scannable QR. Field conventions (brand-neutral, documented in the
// shell's labels):
//   body     — two paragraphs: the standfirst, then the callout line
//   features — agenda, one row per line
//   date     — "DAY, DATE · TIME · VENUE" (· separated; stacks into lines)
//   metric   — "PRICE · NOTE" ("$349 · FOR TWO PEOPLE")
//   role     — what's included, · separated
//   author   — who it's for, · separated (two cells)
//   ctaUrl   — QR target; falls back to https://<url>
// A title written as short sentences ("Find. Fund. Close.") stacks one word
// per line with the last in accent; any other title sets as one block.
export function TplLiveEvent({ d, brand }) {
  const v = ['bill', 'ticket', 'blueprint', 'receipt', 'marquee', 'door'].includes(d.variant) ? d.variant : 'bill'
  const ink = d.textColor, acc = d.accentColor, bg = d.bgColor
  const split = (s, re) => (s || '').split(re).map(x => x.trim()).filter(Boolean)
  const paras = split(d.body, '\n')
  const standfirst = paras[0] || ''
  const callout = paras.slice(1).join(' ')
  const agenda = split(d.features, '\n').slice(0, 5)
  const when = split(d.date, '·')
  const [price = '', ...priceRest] = split(d.metric, '·')
  const priceNote = priceRest.join(' · ')
  const included = split(d.role, '·')
  const audience = split(d.author, '·').slice(0, 2)
  const url = d.url || brand.url
  const qrValue = d.ctaUrl || (/^https?:/i.test(url) ? url : `https://${url}`)
  const sentences = split(d.title, /\.\s*/)
  const stacked = sentences.length >= 2 && sentences.length <= 4 && sentences.every(w => w.length <= 12) ? sentences : [d.title || '']
  const isStack = stacked.length > 1
  const onAcc = hexLuma(acc) > 0.55 ? mixHex(acc, '#000000', 0.85) : '#FFFFFF'
  const pad2 = (i) => String(i + 1).padStart(2, '0')
  const whenLead = when[0] || ''
  const whenRest = when.slice(1)
  const where = when.length >= 3 ? when.slice(2).join(' · ') : (when[1] || '')

  if (v === 'ticket') {
    const page = mixHex(bg, ink, 0.05)
    const stub = mixHex(bg, ink, 0.07)
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-12" style={{ backgroundColor: page, color: ink, fontFamily: brand.fonts.body }}>
        <DoorSlats color={ink + '0d'} count={34} className="absolute inset-0 w-full h-full" />
        <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: bg, border: `2px solid ${ink}`, boxShadow: `18px 18px 0 ${acc}40` }}>
          <div className="flex-1 min-h-0 flex flex-col px-14 pt-11 pb-8">
            <div className="flex items-start justify-between">
              <BrandSeal brand={brand} tone={acc} size={112} />
              <div className="text-right pt-2">
                <div className="font-mono text-[13px] tracking-[0.35em]" style={{ color: acc }}>{d.subtitle}</div>
                <div className="font-mono text-[12px] tracking-[0.22em] mt-2 uppercase" style={{ color: ink + '8c' }}>ADMIT · {priceNote || price}</div>
              </div>
            </div>
            <h1 className="mt-8 tracking-tight" style={{ fontFamily: brand.fonts.serif, fontWeight: 600, fontSize: isStack ? 108 : 76, lineHeight: 0.98 }}>
              {isStack ? stacked.map((w, i) => <span key={i} style={{ color: i === stacked.length - 1 ? acc : ink }}>{w}. </span>) : d.title}
            </h1>
            <p className="mt-6 text-[24px] leading-relaxed max-w-[92%]" style={{ color: ink + 'b3' }}>{standfirst}</p>
            <div className="mt-9 flex gap-10 flex-1 min-h-0">
              <div className="flex-1 min-w-0">
                {agenda.map((r, i) => (
                  <div key={i} className="flex items-start gap-4 text-[21px] leading-snug py-3.5" style={{ color: ink + 'e6' }}>
                    <span className="mt-1 w-7 h-7 shrink-0 flex items-center justify-center border-2 text-[14px] font-bold" style={{ borderColor: acc, color: acc }}>&#10003;</span>
                    {r}
                  </div>
                ))}
              </div>
              <div className="w-[290px] shrink-0 pl-8" style={{ borderLeft: `1px dashed ${ink}59` }}>
                <div className="text-[26px] font-bold leading-tight" style={{ fontFamily: brand.fonts.heading }}>{whenLead}</div>
                {whenRest.map((l, i) => <div key={i} className="font-mono text-[12px] tracking-[0.15em] uppercase mt-3 leading-relaxed" style={{ color: ink + '99' }}>{l}</div>)}
                {callout && <div className="mt-7 text-[19px] leading-snug italic" style={{ fontFamily: brand.fonts.serif, color: acc }}>{callout}</div>}
              </div>
            </div>
            {audience.length > 0 && (
              <div className="mt-auto grid grid-cols-2 gap-8 pt-6">
                {audience.map((a, i) => (
                  <div key={i} className="pt-3 text-[15px] leading-snug" style={{ borderTop: `2px solid ${acc}`, color: ink + 'b3' }}>
                    <div className="font-mono text-[10px] tracking-[0.3em] mb-1.5" style={{ color: acc }}>{i === 0 ? 'BUILT FOR' : 'ALSO FOR'}</div>{a}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative h-0 shrink-0" style={{ borderTop: `2px dashed ${ink}66` }}>
            <div className="absolute -left-[26px] -top-[26px] w-[50px] h-[50px] rounded-full" style={{ backgroundColor: page }} />
            <div className="absolute -right-[26px] -top-[26px] w-[50px] h-[50px] rounded-full" style={{ backgroundColor: page }} />
          </div>
          <div className="h-[270px] shrink-0 flex items-center px-14 gap-9" style={{ backgroundColor: stub }}>
            <div className="shrink-0">
              <div className="font-mono text-[12px] tracking-[0.35em]" style={{ color: ink + '8c' }}>ADMISSION</div>
              <div className="font-black leading-none mt-2" style={{ fontFamily: brand.fonts.display, fontSize: 116, color: acc }}>{price}</div>
              <div className="font-mono text-[13px] tracking-[0.25em] mt-2 uppercase">{priceNote}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2">
                {included.map((c, i) => <span key={i} className="px-2.5 py-1 font-mono text-[11px] tracking-[0.15em] uppercase" style={{ border: `1px solid ${ink}59`, color: ink + 'd9' }}>{c}</span>)}
              </div>
              <div className="mt-5 font-mono text-[12px] tracking-[0.25em] uppercase" style={{ color: ink + '8c' }}>SCAN TO REGISTER &rarr;</div>
            </div>
            <div className="shrink-0 text-center">
              <QrCode value={qrValue} size={150} fg={ink} bg={stub} />
              <div className="font-mono text-[11px] tracking-[0.2em] mt-2" style={{ color: acc }}>{url.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'blueprint') {
    const grid = `linear-gradient(${ink}14 1px, transparent 1px), linear-gradient(90deg, ${ink}14 1px, transparent 1px)`
    const cell = (k, val, i) => (
      <div key={k} className="px-6 py-5 min-w-0" style={{ borderRight: `1px solid ${ink}59`, borderLeft: i === 0 ? undefined : undefined }}>
        <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: ink + '8c' }}>{k}</div>
        <div className="mt-2 text-[16px] font-bold leading-snug" style={{ fontFamily: brand.fonts.heading }}>{val}</div>
      </div>
    )
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col p-12" style={{ backgroundColor: bg, color: ink, fontFamily: brand.fonts.body, backgroundImage: grid, backgroundSize: '54px 54px' }}>
        <div className="relative flex-1 flex flex-col" style={{ border: `2px solid ${ink}` }}>
          <div className="absolute inset-[10px] pointer-events-none" style={{ border: `1px solid ${ink}59` }} />
          <div className="relative flex justify-between items-center px-10 py-5 font-mono text-[12px] tracking-[0.3em] uppercase" style={{ borderBottom: `1px solid ${ink}59`, color: ink + 'b3' }}>
            <span>{brand.wordmark} &middot; {d.subtitle}</span>
            <span>SHEET 01 / 01</span>
          </div>
          <div className="relative flex-1 min-h-0 flex flex-col px-10 pt-9">
            {stacked.map((w, i) => (
              <div key={i} className="font-bold uppercase tracking-[0.01em]" style={{ fontFamily: brand.fonts.heading, fontSize: isStack ? 124 : 80, lineHeight: 0.9, color: i === stacked.length - 1 ? acc : ink }}>{w}{isStack ? '.' : ''}</div>
            ))}
            <svg viewBox="0 0 600 24" preserveAspectRatio="none" className="w-full h-[24px] mt-5">
              <line x1="0" y1="12" x2="600" y2="12" stroke={acc} strokeWidth="1.5" />
              <line x1="0.75" y1="2" x2="0.75" y2="22" stroke={acc} strokeWidth="1.5" />
              <line x1="599.25" y1="2" x2="599.25" y2="22" stroke={acc} strokeWidth="1.5" />
              <line x1="300" y1="6" x2="300" y2="18" stroke={acc} strokeWidth="1" />
            </svg>
            <div className="mt-3 font-mono text-[13px] tracking-[0.22em] uppercase leading-relaxed" style={{ color: acc }}>{standfirst}</div>
            {callout && <div className="mt-5 text-[24px] leading-snug max-w-[92%]" style={{ fontFamily: brand.fonts.serif, fontWeight: 500 }}>{callout}</div>}
            <div className="mt-8 flex-1 min-h-0 flex gap-10">
              <div className="w-[48%] shrink-0 space-y-6">
                {agenda.map((r, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-mono text-[13px] font-bold" style={{ border: `1.5px solid ${acc}`, color: acc }}>{pad2(i)}</div>
                    <div className="pt-2 text-[18px] leading-snug" style={{ color: ink + 'd9' }}>{r}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0 relative">
                {/* facility elevation: three volumes, roll-up doors, dimension ticks */}
                <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 w-full h-full">
                  <g fill="none" stroke={acc} strokeWidth="1.5">
                    <rect x="20" y="120" width="110" height="130" />
                    <rect x="130" y="70" width="140" height="180" />
                    <rect x="270" y="120" width="110" height="130" />
                    <line x1="10" y1="120" x2="140" y2="120" strokeWidth="2.5" />
                    <line x1="120" y1="70" x2="280" y2="70" strokeWidth="2.5" />
                    <line x1="260" y1="120" x2="390" y2="120" strokeWidth="2.5" />
                    <rect x="190" y="52" width="20" height="18" />
                    {[40, 80].map(x => <g key={x}><rect x={x} y="165" width="32" height="85" />{[180, 194, 208, 222, 236].map(y => <line key={y} x1={x + 4} y1={y} x2={x + 28} y2={y} opacity="0.6" />)}</g>)}
                    {[290, 330].map(x => <g key={x}><rect x={x} y="165" width="32" height="85" />{[180, 194, 208, 222, 236].map(y => <line key={y} x1={x + 4} y1={y} x2={x + 28} y2={y} opacity="0.6" />)}</g>)}
                    <rect x="165" y="140" width="70" height="110" />
                    {[156, 172, 188, 204, 220, 236].map(y => <line key={y} x1="171" y1={y} x2="229" y2={y} opacity="0.6" />)}
                    <line x1="0" y1="250" x2="400" y2="250" strokeWidth="3" />
                    <line x1="0" y1="258" x2="400" y2="258" opacity="0.4" />
                  </g>
                  <g stroke={acc} strokeWidth="1" opacity="0.8">
                    <line x1="20" y1="280" x2="380" y2="280" /><line x1="20" y1="274" x2="20" y2="286" /><line x1="380" y1="274" x2="380" y2="286" />
                    <line x1="394" y1="70" x2="394" y2="250" /><line x1="388" y1="70" x2="400" y2="70" /><line x1="388" y1="250" x2="400" y2="250" />
                  </g>
                  <text x="200" y="297" textAnchor="middle" fill={acc} fontFamily="ui-monospace, Menlo, monospace" fontSize="9" letterSpacing="2" opacity="0.9">ELEVATION · NOT TO SCALE</text>
                </svg>
              </div>
            </div>
            <div className="mt-auto pb-6 font-mono text-[11px] tracking-[0.2em] uppercase leading-loose" style={{ color: ink + '8c' }}>
              {included.length > 0 && <div><span style={{ color: acc }}>SPEC &middot; </span>{included.join(' · ')}</div>}
              {audience.length > 0 && <div><span style={{ color: acc }}>FOR &middot; </span>{audience.join(' · ')}</div>}
            </div>
          </div>
          <div className="relative grid grid-cols-[1fr_1fr_1fr_auto]" style={{ borderTop: `2px solid ${ink}` }}>
            {cell('WHEN', [whenLead, when[1]].filter(Boolean).join(' · '), 0)}
            {cell('WHERE', where, 1)}
            {cell('ADMISSION', [price, priceNote].filter(Boolean).join(' '), 2)}
            <div className="px-5 py-4 flex items-center gap-4">
              <QrCode value={qrValue} size={96} fg={ink} bg={bg} />
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase leading-relaxed" style={{ color: ink + 'b3' }}>
                SCAN TO<br />REGISTER<br /><span style={{ color: acc }}>{url.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (v === 'receipt') {
    const desk = mixHex(bg, ink, 0.14)
    const teeth = []
    for (let x = 0; x <= 820; x += 20) teeth.push(`${x},${(x / 20) % 2 === 0 ? 2 : 20}`)
    const line = (l, r, i, strong) => (
      <div key={i} className={`flex items-baseline gap-3 py-[7px] ${strong ? 'font-semibold' : ''}`} style={{ fontSize: 18, color: strong ? ink : ink + 'e6' }}>
        <span className="shrink-0 max-w-[82%] leading-snug">{l}</span>
        <span className="flex-1 border-b border-dotted" style={{ borderColor: ink + '73', transform: 'translateY(-5px)' }} />
        <span className="shrink-0 font-mono text-[13px] tracking-[0.15em]" style={{ color: strong ? acc : ink + '99' }}>{r}</span>
      </div>
    )
    return (
      <div className="w-full h-full relative overflow-hidden flex justify-center px-12 pt-10 pb-14" style={{ backgroundColor: desk, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative w-[820px] h-full flex flex-col px-14 pt-11 pb-14" style={{ backgroundColor: bg, boxShadow: `0 30px 60px ${ink}4d` }}>
          <svg viewBox="0 0 820 22" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full h-[22px]">
            <polygon points={`0,22 ${teeth.join(' ')} 820,22`} fill={desk} />
          </svg>
          <div className="text-center">
            <BrandSeal brand={brand} tone={ink} size={132} className="mx-auto" />
            <div className="mt-3 font-mono text-[12px] tracking-[0.35em] uppercase" style={{ color: ink + '8c' }}>{d.subtitle}</div>
          </div>
          <div className="mt-5 py-5 text-center font-black uppercase tracking-tight" style={{ borderTop: `2px dashed ${ink}59`, borderBottom: `2px dashed ${ink}59`, fontFamily: brand.fonts.display, fontSize: isStack ? 84 : 60, lineHeight: 0.92 }}>
            {isStack ? stacked.map((w, i) => <span key={i} style={{ color: i === stacked.length - 1 ? acc : ink }}>{w}.{i < stacked.length - 1 ? ' ' : ''}</span>) : d.title}
          </div>
          <p className="mt-5 text-center text-[17px] leading-relaxed" style={{ color: ink + 'b3' }}>{standfirst}</p>
          <div className="mt-5 font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: acc }}>ITEMIZED</div>
          <div className="mt-1">
            {agenda.map((r, i) => line(r, pad2(i), i, false))}
            {callout && line(callout, '★', 'c', true)}
          </div>
          <div className="mt-2 pt-1" style={{ borderTop: `1px solid ${ink}` }}>
            {included.map((c, i) => line(c, 'INCL.', i, false))}
          </div>
          <div className="mt-4 pt-4 flex items-end justify-between" style={{ borderTop: `3px double ${ink}` }}>
            <div>
              <div className="font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>TOTAL{priceNote ? ` · ${priceNote}` : ''}</div>
              <div className="font-black leading-none mt-1" style={{ fontFamily: brand.fonts.display, fontSize: 100, color: acc }}>{price}</div>
            </div>
            <div className="text-right pb-2">
              {when.map((l, i) => <div key={i} className="font-mono text-[12px] tracking-[0.15em] uppercase leading-loose" style={{ color: i === 0 ? ink : ink + '99' }}>{l}</div>)}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-6 pt-5" style={{ borderTop: `2px dashed ${ink}59` }}>
            <QrCode value={qrValue} size={118} fg={ink} bg={bg} />
            <div className="min-w-0">
              <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>SCAN TO REGISTER</div>
              <div className="font-mono text-[12px] tracking-[0.2em] mt-1" style={{ color: acc }}>{url.toLowerCase()}</div>
              {audience.length > 0 && <div className="mt-2 text-[12px] leading-snug" style={{ color: ink + '8c' }}>{audience.join(' · ')}</div>}
            </div>
          </div>
          <div className="mt-4 text-center font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: ink + '8c' }}>{brand.signoff}</div>
        </div>
      </div>
    )
  }

  if (v === 'marquee') {
    const bulbs = (
      <div className="flex justify-between px-4">
        {Array.from({ length: 19 }, (_, i) => <span key={i} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: i % 2 ? acc : acc + '59', boxShadow: i % 2 ? `0 0 12px ${acc}99` : undefined }} />)}
      </div>
    )
    const star = []
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16
      const r = i % 2 === 0 ? 100 : 82
      star.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`)
    }
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col p-12" style={{ backgroundColor: bg, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative flex-1 min-h-0 flex flex-col py-5" style={{ border: `3px solid ${ink}` }}>
          <div className="absolute inset-[12px] pointer-events-none" style={{ border: `1px solid ${ink}40` }} />
          {bulbs}
          <div className="flex-1 min-h-0 flex flex-col px-14 pt-7 pb-3">
            <div className="flex justify-between items-center font-mono text-[13px] tracking-[0.4em] uppercase" style={{ color: acc }}>
              <span>&#9733; {d.subtitle}</span>
              <span>{whenLead}</span>
            </div>
            <div className="mt-6 text-center">
              {stacked.map((w, i) => (
                <div key={i} className="font-black uppercase tracking-tight" style={{ fontFamily: brand.fonts.display, fontSize: isStack ? 164 : 96, lineHeight: 0.86, color: i === stacked.length - 1 ? acc : ink, textShadow: i === stacked.length - 1 ? `0 0 34px ${acc}73` : undefined }}>{w}{isStack ? '.' : ''}</div>
              ))}
            </div>
            <p className="mt-6 text-center text-[21px] leading-relaxed mx-auto max-w-[86%]" style={{ fontFamily: brand.fonts.serif, color: ink + 'd9' }}>{standfirst}</p>
            {callout && <div className="mt-5 mx-auto px-5 py-2 font-mono text-[12px] tracking-[0.22em] uppercase text-center max-w-[90%]" style={{ border: `1px solid ${acc}`, color: acc }}>{callout}</div>}
            <div className="mt-8 flex gap-8 items-start">
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 content-start pt-2">
                {agenda.map((r, i) => (
                  <div key={i} className="flex gap-3 items-start text-[18px] leading-snug" style={{ color: ink + 'd9' }}>
                    <span className="font-mono text-[12px] pt-1 shrink-0" style={{ color: acc }}>{pad2(i)}</span>{r}
                  </div>
                ))}
              </div>
              <div className="relative w-[224px] h-[224px] shrink-0 flex items-center justify-center">
                <svg viewBox="-104 -104 208 208" className="absolute inset-0 w-full h-full"><polygon points={star.join(' ')} fill={acc} /></svg>
                <div className="relative text-center px-6" style={{ color: onAcc }}>
                  <div className="font-black leading-none" style={{ fontFamily: brand.fonts.display, fontSize: 62 }}>{price}</div>
                  {priceNote && <div className="font-mono text-[10px] tracking-[0.18em] mt-1 uppercase leading-tight">{priceNote}</div>}
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center gap-6 pt-6" style={{ borderTop: `1px solid ${ink}40` }}>
              <QrCode value={qrValue} size={108} fg={ink} bg={bg} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[12px] tracking-[0.25em] uppercase leading-relaxed" style={{ color: ink + '8c' }}>{whenRest.join(' · ')}</div>
                {included.length > 0 && <div className="mt-2 text-[15px] leading-snug" style={{ color: ink + 'b3' }}>{included.join(' · ')}</div>}
                {audience.length > 0 && <div className="mt-1.5 text-[13px] leading-snug" style={{ color: ink + '80' }}>{audience.join(' · ')}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[22px] font-bold" style={{ fontFamily: brand.fonts.heading }}>SCAN TO REGISTER</div>
                <div className="font-mono text-[12px] tracking-[0.2em] mt-1" style={{ color: acc }}>{url.toLowerCase()}</div>
              </div>
            </div>
          </div>
          {bulbs}
        </div>
      </div>
    )
  }

  if (v === 'door') {
    // a roll-up unit door, half raised: the headline is stencilled across the
    // slats; the day's details sit in the open bay beneath it
    const door = acc
    const slat = mixHex(acc, '#000000', 0.22)
    const stencil = hexLuma(acc) > 0.55 ? mixHex(acc, '#000000', 0.82) : bg
    const plate = hexLuma(acc) > 0.55 ? mixHex(acc, '#000000', 0.82) : '#FFFFFF'
    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ backgroundColor: bg, color: ink, fontFamily: brand.fonts.body }}>
        <div className="relative h-[54%] shrink-0 overflow-hidden" style={{ backgroundColor: door }}>
          <DoorSlats color={slat} count={22} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-x-0 top-0 h-[26px]" style={{ backgroundColor: mixHex(acc, '#000000', 0.45) }} />
          <div className="absolute top-12 left-12 px-4 py-2 font-mono text-[13px] font-bold tracking-[0.3em]" style={{ backgroundColor: plate, color: acc }}>{d.subtitle}</div>
          <div className="absolute top-12 right-12 px-4 py-2 font-mono text-[13px] font-bold tracking-[0.3em] text-right" style={{ backgroundColor: plate, color: acc }}>{whenLead}</div>
          <div className="absolute inset-x-0 bottom-[70px] px-12">
            {stacked.map((w, i) => (
              <div key={i} className="font-black uppercase tracking-tight" style={{ fontFamily: brand.fonts.display, fontSize: isStack ? 178 : 104, lineHeight: 0.84, color: stencil, opacity: i === stacked.length - 1 ? 1 : 0.92 }}>{w}{isStack ? '.' : ''}</div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[38px] flex items-center justify-center" style={{ backgroundColor: mixHex(acc, '#000000', 0.5) }}>
            <div className="w-[120px] h-[10px] rounded-full" style={{ backgroundColor: mixHex(acc, '#FFFFFF', 0.5) }} />
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col px-14 pt-9 pb-11">
          <div className="flex items-start justify-between gap-8">
            <p className="text-[23px] leading-[1.4] max-w-[60%]" style={{ fontFamily: brand.fonts.serif, color: ink + 'd9' }}>{standfirst}</p>
            <div className="shrink-0 text-right">
              <div className="font-black leading-none" style={{ fontFamily: brand.fonts.display, fontSize: 84, color: acc }}>{price}</div>
              {priceNote && <div className="font-mono text-[12px] tracking-[0.25em] uppercase mt-1" style={{ color: ink + 'a6' }}>{priceNote}</div>}
            </div>
          </div>
          {callout && <div className="mt-6 text-[20px] font-semibold leading-snug pl-5" style={{ borderLeft: `5px solid ${acc}` }}>{callout}</div>}
          <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-6">
            {agenda.map((r, i) => (
              <div key={i} className="flex gap-3 items-start text-[18px] leading-snug" style={{ color: ink + 'd9' }}>
                <span className="font-mono text-[12px] pt-1 shrink-0" style={{ color: acc }}>{pad2(i)}</span>{r}
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-6 pt-6" style={{ borderTop: `2px solid ${ink}` }}>
            <QrCode value={qrValue} size={104} fg={ink} bg={bg} />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[12px] tracking-[0.2em] uppercase leading-relaxed" style={{ color: ink + '8c' }}>{whenRest.join(' · ')}</div>
              {included.length > 0 && <div className="mt-1.5 text-[14px] leading-snug" style={{ color: ink + 'b3' }}>{included.join(' · ')}</div>}
              {audience.length > 0 && <div className="mt-1 text-[12px] leading-snug" style={{ color: ink + '80' }}>{audience.join(' · ')}</div>}
            </div>
            <div className="text-right shrink-0">
              <div className="text-[22px] font-bold leading-none" style={{ fontFamily: brand.fonts.heading }}>SCAN TO REGISTER</div>
              <div className="font-mono text-[12px] tracking-[0.2em] mt-2" style={{ color: acc }}>{url.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // bill — the operator's playbill (default)
  const rows = agenda.slice(0, 4)
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-16 pt-14 pb-12" style={{ backgroundColor: bg, color: ink, fontFamily: brand.fonts.body }}>
      <Masthead brand={brand} ink={ink} accent={acc} tag={d.subtitle} />
      <LedgerRule color={ink} className="mt-4" />
      <div className="mt-8 flex items-end justify-between gap-8">
        <div className="min-w-0">
          {stacked.map((w, i) => (
            <div key={i} className="font-black uppercase tracking-tight" style={{ fontFamily: brand.fonts.display, fontSize: isStack ? 148 : 92, lineHeight: 0.88, color: i === stacked.length - 1 ? acc : ink }}>{w}{isStack ? '.' : ''}</div>
          ))}
        </div>
        <div className="shrink-0 text-right pb-2 max-w-[380px]">
          <div className="text-[26px] font-bold leading-tight" style={{ fontFamily: brand.fonts.heading }}>{whenLead}</div>
          {whenRest.map((l, i) => <div key={i} className="font-mono text-[12px] tracking-[0.14em] mt-2 uppercase leading-relaxed" style={{ color: ink + '99' }}>{l}</div>)}
        </div>
      </div>
      <p className="mt-6 text-[24px] leading-[1.45] max-w-[94%]" style={{ fontFamily: brand.fonts.serif, color: ink + 'd9' }}>{standfirst}</p>
      {callout && <div className="mt-6 pl-6 py-2 text-[20px] font-semibold leading-snug" style={{ borderLeft: `6px solid ${acc}` }}>{callout}</div>}
      <div className="mt-8 flex gap-8 flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[12px] tracking-[0.3em] uppercase pb-2" style={{ color: acc, borderBottom: `2px solid ${ink}` }}>ON THE DAY</div>
          {rows.map((r, i) => (
            <div key={i} className="flex gap-5 items-baseline py-3.5" style={{ borderBottom: `1px solid ${ink}26` }}>
              <span className="font-mono text-[13px] shrink-0" style={{ color: acc }}>{pad2(i)}</span>
              <span className="text-[18px] leading-snug" style={{ color: ink + 'e6' }}>{r}</span>
            </div>
          ))}
        </div>
        <div className="w-[320px] shrink-0 flex flex-col px-7 py-7" style={{ backgroundColor: ink, color: bg }}>
          <div className="font-mono text-[11px] tracking-[0.35em] uppercase" style={{ color: bg + 'a6' }}>ADMISSION</div>
          <div className="font-black leading-none mt-3" style={{ fontFamily: brand.fonts.display, fontSize: 92, color: acc }}>{price}</div>
          {priceNote && <div className="font-mono text-[13px] tracking-[0.25em] mt-2 uppercase">{priceNote}</div>}
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {included.map((c, i) => <span key={i} className="px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] uppercase" style={{ border: `1px solid ${bg}59` }}>{c}</span>)}
          </div>
        </div>
      </div>
      {audience.length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-6">
          {audience.map((a, i) => <div key={i} className="text-[15px] leading-snug pt-3" style={{ borderTop: `2px solid ${ink}`, color: ink + 'b3' }}>{a}</div>)}
        </div>
      )}
      <LedgerRule color={ink + '66'} className="mt-8" />
      <div className="flex items-center gap-6 pt-6">
        <QrCode value={qrValue} size={124} fg={ink} bg={bg} />
        <div>
          <div className="text-[28px] font-bold leading-none" style={{ fontFamily: brand.fonts.heading }}>SCAN TO REGISTER</div>
          <div className="font-mono text-[13px] tracking-[0.2em] uppercase mt-2" style={{ color: acc }}>{url}</div>
        </div>
        <div className="ml-auto text-right font-mono text-[12px] tracking-[0.2em] uppercase" style={{ color: ink + '8c' }}>{brand.signoff.toUpperCase()}</div>
      </div>
    </div>
  )
}

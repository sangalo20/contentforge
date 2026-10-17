// Central brand registry for the Brand Studio. Every visual decision a
// template makes — colors, fonts, logo, footer URL, wordmark, default copy —
// flows from the selected brand here; templates never hardcode brand facts.
// Specs come from the verified brand style guides (see social-media-skills/
// skills/brand-knowledge-hub/references/brand-assets.md). Logo files land in
// frontend/public/logos/<brandId>/ — until they exist, LogoImg renders the
// wordmark as a typographic fallback. `logoFor` names the default mark per
// ground (dark templates get the reversed mark, light get the color lockup);
// buildDefaults applies it by background luminance.
import { hexLuma } from './helpers'

export const BRANDS = [
  {
    id: 'storagemoguls',
    name: 'Storage Moguls',
    shortName: 'Moguls',
    wordmark: 'STORAGE MOGULS',
    url: 'storagemoguls.ai',
    tagline: 'REAL PEOPLE · REAL DEALS · REAL RESULTS',
    masthead: 'OPERATOR INTELLIGENCE',
    signoff: 'Practitioners, Not Professors.',
    disclaimer: '© 2026 Storage Moguls · Real People · Real Deals · Real Results',
    newsletterName: 'THE MOGUL',
    newsletterNote: 'YOU ARE RECEIVING THE MOGUL BECAUSE YOU OPERATE IN SELF STORAGE',
    fonts: {
      heading: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      display: "'Big Shoulders Display', 'Barlow Condensed', Arial, sans-serif",
      body: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
      serif: "'Fraunces', Georgia, serif",
      mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    },
    ticker: 'STORAGE MOGULS · OPERATOR INTELLIGENCE · REAL PEOPLE · REAL DEALS · REAL RESULTS · ',
    // The palette wall. Canonical core: electric blue #2E7DF6 (NOT the legacy
    // slate #3F6F8E) on deep navy; ledger gold for the institutional register;
    // cream for the educational "Storage 101" lane; brick red reserved for
    // myth-flagging only (per the SM educational-poster canon).
    // The palette wall: 24 presets in six 4-chip rows. Daylight leads (the
    // studio's working default); rows read as families — everyday lights,
    // editorial lights, accents & specials, navy core, gold & royal,
    // technical darks. Video surfaces and identity anchors seed navy
    // explicitly in `copy` — dark stays one click away for everything else.
    palettes: [
      // everyday lights
      { id: 'sm-daylight', label: 'Daylight', bg: '#E9F0FA', accent: '#0077FF', text: '#10182B' },
      { id: 'sm-sky', label: 'Sky', bg: '#D7E7FA', accent: '#0A5BD8', text: '#0B1E3A' },
      { id: 'sm-paper', label: 'Paper', bg: '#FAFAF8', accent: '#2E7DF6', text: '#10182B' },
      { id: 'sm-mono', label: 'Mono Print', bg: '#FFFFFF', accent: '#10182B', text: '#10182B' },
      // editorial lights
      { id: 'sm-101', label: 'Storage 101', bg: '#F5F3EE', accent: '#2E7DF6', text: '#10182B' },
      { id: 'sm-ice', label: 'Ice', bg: '#E9EEF9', accent: '#14337E', text: '#0B1322' },
      { id: 'sm-mist', label: 'Mist', bg: '#EDECE8', accent: '#3F6F8E', text: '#232A36' },
      { id: 'sm-silver', label: 'Silver', bg: '#E4E2DC', accent: '#10182B', text: '#1A1A2E' },
      // accents & specials
      { id: 'sm-gilt', label: 'Gilt Cream', bg: '#F5F3EE', accent: '#C98F2B', text: '#10182B' },
      { id: 'sm-honey', label: 'Honey', bg: '#FBF5E6', accent: '#B9821F', text: '#2A2214' },
      { id: 'sm-myth', label: 'Myth Red', bg: '#F5F3EE', accent: '#B9271B', text: '#10182B' },
      { id: 'sm-facility', label: 'Facility', bg: '#0077FF', accent: '#FFFFFF', text: '#FFFFFF' },
      // rich darks — one navy anchor, then genuinely different characters
      { id: 'sm-editorial', label: 'Editorial', bg: '#10182B', accent: '#2E7DF6', text: '#F5F5F5' },
      { id: 'sm-ocean', label: 'Ocean', bg: '#0A2F33', accent: '#3FC9B6', text: '#ECF6F4' },
      { id: 'sm-indigo', label: 'Indigo', bg: '#1B1D45', accent: '#8E96FF', text: '#EEEFFA' },
      { id: 'sm-emerald', label: 'Emerald', bg: '#0E2B21', accent: '#46C489', text: '#EAF5EF' },
      // gold & royal
      { id: 'sm-ledger', label: 'Ledger Gold', bg: '#10182B', accent: '#E8B23C', text: '#F5F3EE' },
      { id: 'sm-royal', label: 'Royal', bg: '#14337E', accent: '#F2C14E', text: '#FFFFFF' },
      { id: 'sm-vault', label: 'Vault', bg: '#0A0A0C', accent: '#D9A431', text: '#F0EDE6' },
      { id: 'sm-dusk', label: 'Dusk', bg: '#1E3A6E', accent: '#7FB3FF', text: '#F0F4FA' },
      // technical darks
      { id: 'sm-blueprint', label: 'Blueprint', bg: '#0D2B57', accent: '#9CC4FF', text: '#EFF4FB' },
      { id: 'sm-graphite', label: 'Graphite', bg: '#1C1F26', accent: '#8FA6C4', text: '#F2F4F7' },
      { id: 'sm-slate', label: 'Slate', bg: '#0B1622', accent: '#3F6F8E', text: '#F4F2ED' },
      { id: 'sm-ink', label: 'Podcast Ink', bg: '#111F2E', accent: '#2E7DF6', text: '#F4F2ED' },
    ],
    // Two-tier identity. FUNCTIONAL tier: the refined "ledger mark" (flat
    // volumes, door slats knocked out) and its outlined-type lockups — the
    // working mark for small sizes, mastheads, avatars. DISPLAY tier: the
    // delivered kit's illustrative lockups/icons (Downloads/Final
    // Files_Storge Moguls) for large storytelling placements; white kit marks
    // are generated reversed variants. Same massing across tiers — never use
    // both on one artifact.
    logos: [
      { id: 'mark-navy', label: 'Mark · Navy', src: '/logos/storagemoguls/mark-navy.svg', luma: 0.1 },
      { id: 'mark-white', label: 'Mark · White', src: '/logos/storagemoguls/mark-white.svg', luma: 0.92 },
      { id: 'mark-gold', label: 'Mark · Gold', src: '/logos/storagemoguls/mark-gold.svg', luma: 0.72 },
      { id: 'refined-navy', label: 'Refined Lockup · Navy', src: '/logos/storagemoguls/lockup-refined-navy.svg', luma: 0.1 },
      { id: 'refined-white', label: 'Refined Lockup · White', src: '/logos/storagemoguls/lockup-refined-white.svg', luma: 0.92 },
      { id: 'refined-gold', label: 'Refined Lockup · Gold', src: '/logos/storagemoguls/lockup-refined-gold.svg', luma: 0.72 },
      { id: 'refined-navy-stacked', label: 'Refined Stacked · Navy', src: '/logos/storagemoguls/lockup-refined-navy-stacked.svg', luma: 0.1 },
      { id: 'refined-white-stacked', label: 'Refined Stacked · White', src: '/logos/storagemoguls/lockup-refined-white-stacked.svg', luma: 0.92 },
      { id: 'refined-gold-stacked', label: 'Refined Stacked · Gold', src: '/logos/storagemoguls/lockup-refined-gold-stacked.svg', luma: 0.72 },
      { id: 'lockup-color', label: 'Lockup · Color', src: '/logos/storagemoguls/lockup-color.svg', luma: 0.55 },
      { id: 'lockup-white', label: 'Lockup · White', src: '/logos/storagemoguls/lockup-white.svg', luma: 0.92 },
      { id: 'lockup-white-tagline', label: 'Lockup · White + Tagline', src: '/logos/storagemoguls/lockup-white-tagline.svg', luma: 0.92 },
      { id: 'lockup-black', label: 'Lockup · Black', src: '/logos/storagemoguls/lockup-black.svg', luma: 0.1 },
      { id: 'lockup-black-tagline', label: 'Lockup · Black + Tagline', src: '/logos/storagemoguls/lockup-black-tagline.svg', luma: 0.1 },
      { id: 'icon-color', label: 'Icon · Color', src: '/logos/storagemoguls/icon-color.svg', luma: 0.5 },
      { id: 'icon-white', label: 'Icon · White', src: '/logos/storagemoguls/icon-white.svg', luma: 0.92 },
      { id: 'icon-black', label: 'Icon · Black', src: '/logos/storagemoguls/icon-black.svg', luma: 0.1 },
    ],
    // Default in-template mark is the functional-tier ledger mark: templates
    // already carry the wordmark typographically, and it stays crisp small.
    logoFor: { dark: '/logos/storagemoguls/mark-white.svg', light: '/logos/storagemoguls/mark-navy.svg' },
    person: { name: 'Joe Downs', role: 'Founder, Storage Moguls' },
    copy: {
      quote: { title: 'The best storage deals are boring on paper and beautiful in the bank account.', variant: 'mark' },
      blogcover: { title: 'The Numbers Behind a First Facility', subtitle: 'OPERATOR INTELLIGENCE', date: 'AUGUST 2026', bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5', variant: 'front' },
      editorial: { title: 'What a Full Facility Actually Takes', subtitle: 'THE MOGUL · FIELD NOTES', body: 'How working operators underwrite, buy, and fill self storage. No guru hype, just the deals as they actually happened.', variant: 'field' },
      splitpanel: { title: 'Real People. Real Deals. Real Results.', subtitle: 'STORAGE MOGULS', date: 'AUGUST 2026' },
      newsletter: { subtitle: 'THE MOGUL', title: 'The deals we walked away from this quarter, and why', metric: '001', date: 'AUGUST 2026', body: 'This issue: the underwriting that killed three deals before closing day, what occupancy numbers hide, and a question from an operator raising a first fund.', features: 'Underwriting a 40,000 sq ft facility\nWhy occupancy is not the whole story\nOperator Q&A: raising your first fund\nOne chart: small-bay cap rates, twelve months', bgColor: '#FAFAF8', accentColor: '#2E7DF6', textColor: '#10182B', variant: 'issue' },
      podcast: { subtitle: 'THE STORAGE MOGULS PODCAST', title: 'Buying Your First Facility Without Losing Your Shirt', metric: '01', date: 'STREAMING NOW', bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5', variant: 'feature' },
      youtubethumb: { title: 'REAL DEALS REAL NUMBERS', subtitle: 'STORAGE MOGULS', metric: 'EP 01', bgColor: '#0B1322', accentColor: '#2E7DF6', textColor: '#F5F5F5' },
      titlecard: { title: 'Operator Intelligence, In Session', subtitle: 'STORAGE MOGULS SESSIONS', metric: '01', date: 'AUGUST 2026', bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5' },
      endcard: { title: 'Learn storage from people who own storage', subtitle: 'WATCH NEXT', bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5' },
      lowerthird: { bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5' },
      displayad: { title: 'Storage education from working operators', subtitle: 'STORAGE MOGULS', metric: 'JOIN FREE', body: 'Practitioners, not professors. Real numbers from real facilities.', variant: 'ribbon' },
      emailhero: { title: 'This month in storage, from the operators', subtitle: 'THE MOGUL', metric: 'READ THE ISSUE', body: 'The deals, the numbers, and the lessons our operators actually lived this month.', variant: 'hero' },
      // The studio's landing artifact: white seal on Facility brand blue.
      seal: { title: 'STORAGE MOGULS', subtitle: 'OPERATOR INTELLIGENCE', variant: 'accent', bgColor: '#0077FF', accentColor: '#FFFFFF', textColor: '#FFFFFF' },
      chart: { title: 'From 38% to 89% occupancy in nine months', subtitle: 'OPERATOR DATA', metric: '+51 PTS', body: 'One facility, month by month, after the management turnaround.', date: 'Q3 2026', variant: 'bars', bgColor: '#FAFAF8', accentColor: '#2E7DF6', textColor: '#10182B', dataJson: '[\n  {"label":"JAN","value":38},\n  {"label":"FEB","value":42},\n  {"label":"MAR","value":47},\n  {"label":"APR","value":55},\n  {"label":"MAY","value":61},\n  {"label":"JUN","value":68},\n  {"label":"JUL","value":76},\n  {"label":"AUG","value":83},\n  {"label":"SEP","value":89}\n]' },
      bignumber: { metric: '$29M+', title: 'Acquired in self-storage, deal by deal.', subtitle: 'THE RECORD', body: 'What disciplined underwriting returns when you hold the line on price.', date: 'AUGUST 2026', bgColor: '#10182B', accentColor: '#E8B23C', textColor: '#F5F3EE', variant: 'total' },
      announcement: { subtitle: 'ANNOUNCEMENT', title: 'The Mogul newsletter is live', body: 'Operator intelligence in your inbox. The deals, the numbers, and the lessons behind them.', metric: 'JOIN FREE', date: 'AUGUST 2026', variant: 'notice', ctaUrl: 'https://storagemoguls.ai' },
      report: { subtitle: 'OPERATOR REPORT', metric: 'NO. 004 · Q3 2026', title: 'The State of Small-Bay Self-Storage', body: 'Where the deals are, what they trade at, and why disciplined operators keep winning the small-bay segment while institutions look the other way.', author: 'Joe Downs · Storage Moguls Research', bgColor: '#E9EEF9', accentColor: '#14337E', textColor: '#0B1322', variant: 'plate' },
      podcastannounce: { subtitle: 'NEW EPISODE', title: 'The First Facility Is the Hardest. Here Is Why.', metric: '09', author: 'Joe Downs', role: 'Founder, Storage Moguls', date: 'OUT NOW', features: 'APPLE\nSPOTIFY\nYOUTUBE', bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5', variant: 'numeral' },
      webinar: { subtitle: 'LIVE VIRTUAL EVENT', title: 'Storage 101: Buy Your First Self-Storage Facility', author: 'Joe Downs', role: 'Founder, Storage Moguls', date: 'MONDAY · 8:00 PM ET', metric: 'FREE', variant: 'ticket' },
      speaking: { subtitle: 'KEYNOTE', title: 'Why Self-Storage Wins the Next Decade', author: 'Joe Downs', role: 'CEO, Belrose Group · Founder, Storage Moguls', date: 'Self-Storage Investing Summit · Dallas · October 2026', variant: 'bill' },
      partnership: { subtitle: 'PARTNERSHIP', title: 'Two operators. One playbook.', partnerName: 'STORPRO', body: 'Storage Moguls education meets StorPro facilities. Real deals, taught from the inside.', date: 'AUGUST 2026', variant: 'contract' },
      officehours: { title: 'Bring your deal questions', subtitle: 'OPERATOR OFFICE HOURS', author: 'Joe Downs', role: 'Founder, Storage Moguls', date: 'EVERY MONDAY · 8:00 PM ET', metric: 'FREE', variant: 'marquee' },
      // Seeded with the real White Marsh event so every design shows the sheet the way it ships.
      liveevent: { subtitle: 'STORAGE MOGULS LIVE · WHITE MARSH, MD', title: 'Find. Fund. Close.', body: 'What it really takes to own your first self-storage facility. A one-day deep dive into how real deals get done.\nDon’t just learn about storage. Walk a real facility with the owners.', features: 'How real storage deals get sourced and found\nA live walkthrough of how we underwrite a deal, line by line\nSBA and conventional financing, explained live by a lender\nWhat negotiating, closing, and operating a facility actually look like', date: 'FRIDAY, OCTOBER 16, 2026 · 8:30 AM REGISTRATION · HILTON GARDEN INN, WHITE MARSH, MD', metric: '$349 · FOR TWO PEOPLE', role: 'Expert panel · Lunch · Facility tour · Cocktails & hors d’oeuvres', author: 'Aspiring and active investors ready to buy a first or next facility · Passive investors who want to understand the business before backing a deal', url: 'storagemoguls.ai/whitemarsh', ctaUrl: 'https://storagemoguls.ai/whitemarsh', variant: 'bill' },
      storage101: { title: 'You do not need a fortune to buy a self-storage facility.', subtitle: 'STORAGE 101', metric: 'LESSON 01', body: 'What lenders actually ask for when you buy your first facility.', features: 'A credit score around 680\nProof you can manage the asset\nA deal that cash-flows on paper\n10 to 20 percent down', bgColor: '#F5F3EE', accentColor: '#2E7DF6', textColor: '#10182B', variant: 'primer' },
      mythfact: { subtitle: 'SELF-STORAGE INVESTING', metric: 'MYTH 01', title: 'Storage is only for people with millions.', body: 'SBA lending puts a first self-storage facility within reach at 10 to 20 percent down. Most owners started with one small property.', bgColor: '#F5F3EE', accentColor: '#B9271B', textColor: '#10182B', variant: 'classic' },
      motionlower: { bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5' },
      logosting: { bgColor: '#10182B', accentColor: '#2E7DF6', textColor: '#F5F5F5' },
    },
  },
  {
    id: 'successfulidiots',
    name: 'Successful Idiots',
    shortName: 'Idiots',
    comingSoon: true,
    wordmark: 'SUCCESSFUL IDIOTS',
    url: 'successfulidiots.ai',
    tagline: 'TWO IDIOTS · ONE PODCAST',
    masthead: 'CASE FILE',
    signoff: 'Successful Idiots',
    disclaimer: '© 2026 Successful Idiots',
    newsletterName: 'THE IDIOT REPORT',
    newsletterNote: 'YOU ARE RECEIVING THIS BECAUSE YOU LISTEN TO SUCCESSFUL IDIOTS',
    fonts: {
      heading: "'Oswald', 'Arial Narrow', Arial, sans-serif",
      display: "'Oswald', 'Arial Narrow', Arial, sans-serif",
      body: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
      serif: 'Georgia, serif',
      mono: "'Space Mono', ui-monospace, Menlo, monospace",
    },
    palettes: [
      { id: 'si-dossier', label: 'Case File', bg: '#1A1A2E', accent: '#FDE801', text: '#FFFFFF' },
      { id: 'si-pop', label: 'Sticker Pop', bg: '#FDE801', accent: '#1A1A2E', text: '#1A1A2E' },
      { id: 'si-clean', label: 'Clean White', bg: '#FFFFFF', accent: '#16A34A', text: '#1A1A2E' },
    ],
    logos: [],
    person: { name: 'Joe Downs & Peter Swain', role: 'Hosts, Successful Idiots' },
    copy: {
      podcast: { subtitle: 'THE SUCCESSFUL IDIOTS PODCAST', title: 'We Did the Dumb Thing So You Don’t Have To', metric: '01', date: 'STREAMING NOW' },
    },
  },
  {
    id: 'joedowns',
    name: 'Joe Downs',
    shortName: 'Joe',
    comingSoon: true,
    wordmark: 'JOE DOWNS',
    url: 'joedowns.ai',
    tagline: 'NO GURU STUFF. JUST WHAT’S WORKING IN THE DIRT.',
    masthead: 'THE REAL REPS',
    signoff: 'Joe Downs',
    disclaimer: '© 2026 Joe Downs',
    newsletterName: 'THE REAL REPS',
    newsletterNote: 'YOU ARE RECEIVING THE REAL REPS BECAUSE YOU BUILD IN THE DIRT',
    fonts: {
      heading: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      display: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      serif: 'Georgia, serif',
      mono: "'Space Mono', ui-monospace, Menlo, monospace",
    },
    palettes: [
      { id: 'jd-ink', label: 'Operator Navy', bg: '#0A0E16', accent: '#2E6BFF', text: '#FFFFFF' },
      { id: 'jd-electric', label: 'Electric', bg: '#0A0E16', accent: '#3D7BFF', text: '#FFFFFF' },
    ],
    logos: [],
    person: { name: 'Joe Downs', role: 'CEO, Belrose Group · Founder, Storage Moguls' },
    copy: {},
  },
  {
    id: 'storpro',
    name: 'StorPro',
    shortName: 'StorPro',
    comingSoon: true,
    wordmark: 'STORPRO',
    url: 'storpro.com',
    tagline: 'MAKING ROOM FOR BIG DREAMS',
    masthead: 'STORPRO',
    signoff: 'StorPro',
    disclaimer: '© 2026 StorPro',
    newsletterName: 'STORPRO DISPATCH',
    newsletterNote: 'YOU ARE RECEIVING THIS BECAUSE YOU STORE WITH STORPRO',
    fonts: {
      heading: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      display: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      serif: 'Georgia, serif',
      mono: "ui-monospace, 'SF Mono', Menlo, monospace",
    },
    palettes: [
      { id: 'sp-deep', label: 'Deep Blue', bg: '#1B212D', accent: '#F29E0D', text: '#F1F8FE' },
      { id: 'sp-light', label: 'Light Blue', bg: '#F1F8FE', accent: '#E78B0D', text: '#1B212D' },
      { id: 'sp-steel', label: 'Steel', bg: '#424856', accent: '#78B8F5', text: '#FFFFFF' },
    ],
    logos: [],
    person: { name: 'StorPro', role: 'Premium Storage · Greenville, SC' },
    copy: {},
  },
  {
    id: 'belrose',
    name: 'Belrose Group',
    shortName: 'Belrose',
    comingSoon: true,
    wordmark: 'BELROSE GROUP',
    url: 'belrosegroup.com',
    tagline: 'INSTITUTIONAL SELF STORAGE',
    masthead: 'BELROSE GROUP',
    signoff: 'The Belrose Group',
    disclaimer: '© 2026 The Belrose Group',
    newsletterName: 'BELROSE BRIEFING',
    newsletterNote: 'YOU ARE RECEIVING THE BRIEFING AS A BELROSE PARTNER',
    fonts: {
      heading: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      display: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      body: "Arial, 'Helvetica Neue', sans-serif",
      serif: 'Georgia, serif',
      mono: "ui-monospace, 'SF Mono', Menlo, monospace",
    },
    palettes: [
      { id: 'bg-institutional', label: 'Institutional', bg: '#00161F', accent: '#F26801', text: '#FFFFFF' },
      { id: 'bg-navy', label: 'Deep Navy', bg: '#012E40', accent: '#F26801', text: '#FFFFFF' },
    ],
    logos: [],
    person: { name: 'Joe Downs', role: 'CEO, Belrose Group' },
    copy: {},
  },
]

export const brandById = (id) => BRANDS.find(b => b.id === id) || BRANDS[0]

// Per-template seed content for a brand: a generic base built from the brand's
// own facts, with the brand's curated copy overrides layered on top. Every
// template also resets to the brand's primary palette so switching brands
// re-themes the canvas in one move.
export function buildDefaults(brand) {
  const p = brand.palettes[0]
  const base = {
    bgColor: p.bg, accentColor: p.accent, textColor: p.text,
    logoSrc: '',
    author: brand.person.name, role: brand.person.role,
    url: brand.url, disclaimer: brand.disclaimer,
  }
  const generic = {
    quote: { ...base, title: 'A sharp line worth putting on the wall.', subtitle: brand.masthead, variant: 'mark' },
    blogcover: { ...base, title: 'A headline that earns the click', subtitle: brand.masthead, date: 'AUGUST 2026', variant: 'front' },
    editorial: { ...base, title: 'An editorial cover story', subtitle: `${brand.masthead} · FIELD NOTES`, body: 'A measured standfirst that tells the reader exactly what they are about to learn.', date: 'AUGUST 2026', variant: 'field' },
    splitpanel: { ...base, title: brand.tagline, subtitle: brand.wordmark, date: 'AUGUST 2026', variant: 'panes' },
    newsletter: { ...base, subtitle: brand.newsletterName, title: 'The lead story of this issue', metric: '001', date: 'AUGUST 2026', body: 'A short standfirst introducing the issue.', features: 'First story teaser\nSecond story teaser\nThird story teaser', variant: 'issue' },
    podcast: { ...base, subtitle: `THE ${brand.name.toUpperCase()} PODCAST`, title: 'An episode title that promises a payoff', metric: '01', date: 'STREAMING NOW', variant: 'feature' },
    youtubethumb: { ...base, title: 'A THUMBNAIL THAT STOPS THE SCROLL', subtitle: brand.wordmark, metric: 'EP 01', variant: 'punch' },
    titlecard: { ...base, title: 'The Session Title', subtitle: `${brand.wordmark} SESSIONS`, metric: '01', date: 'AUGUST 2026' },
    lowerthird: { ...base },
    endcard: { ...base, title: 'One line on why they should watch next', subtitle: 'WATCH NEXT' },
    displayad: { ...base, title: 'A benefit the reader can see immediately', subtitle: brand.wordmark, metric: 'LEARN MORE', body: 'One supporting line, no jargon.', variant: 'ribbon' },
    emailhero: { ...base, title: 'An email hero that leads with the win', subtitle: brand.newsletterName, metric: 'READ MORE', body: 'One supporting sentence that sets up the click.', variant: 'hero' },
    seal: { ...base, title: brand.wordmark, subtitle: brand.masthead, variant: 'accent' },
    swag: { ...base, variant: 'tshirt', garment: '#16161A', print: 'mark', metric: brand.tagline, title: 'Brand Kit' },
    chart: { ...base, title: 'The number that tells the story', subtitle: 'DATA', metric: '+00%', body: 'One line on what the chart proves.', variant: 'bars', dataJson: '[\n  {"label":"Q1","value":20},\n  {"label":"Q2","value":34},\n  {"label":"Q3","value":47},\n  {"label":"Q4","value":62}\n]' },
    bignumber: { ...base, metric: '10X', title: 'The claim the number proves.', subtitle: 'CASE STUDY', body: 'One supporting sentence with the context.', date: 'AUGUST 2026', variant: 'total' },
    announcement: { ...base, subtitle: 'ANNOUNCEMENT', title: 'The news, stated plainly', body: 'One standfirst sentence on why it matters.', metric: 'LEARN MORE', date: 'AUGUST 2026', variant: 'notice', ctaUrl: '' },
    report: { ...base, subtitle: 'REPORT', metric: 'NO. 001', title: 'A titled report worth citing', body: 'The abstract: what was studied, what was found, why it matters.', author: brand.person.name, variant: 'plate' },
    podcastannounce: { ...base, subtitle: 'NEW EPISODE', title: 'An episode title with a payoff', metric: '01', date: 'OUT NOW', features: 'APPLE\nSPOTIFY\nYOUTUBE', variant: 'numeral' },
    webinar: { ...base, subtitle: 'LIVE VIRTUAL EVENT', title: 'A session worth showing up for', date: 'THURSDAY · 10:00 AM ET', metric: 'FREE', variant: 'ticket' },
    speaking: { ...base, subtitle: 'KEYNOTE', title: 'A talk title that promises a thesis', date: 'Conference · City · 2026', variant: 'bill' },
    partnership: { ...base, subtitle: 'PARTNERSHIP', title: 'Two names, one announcement', partnerName: 'PARTNER', body: 'What the partnership unlocks, in one sentence.', date: 'AUGUST 2026', variant: 'contract' },
    officehours: { ...base, title: 'Bring your questions', subtitle: 'OFFICE HOURS', date: 'EVERY WEEK', metric: 'FREE', variant: 'marquee' },
    liveevent: { ...base, subtitle: `${brand.wordmark} LIVE · CITY, ST`, title: 'Learn. Decide. Act.', body: 'One standfirst sentence on what the day delivers.\nOne callout line on why it is worth the trip.', features: 'First session\nSecond session\nThird session\nFourth session', date: 'FRIDAY, MONTH 00, 2026 · 8:30 AM DOORS · VENUE, CITY', metric: '$000 · PER SEAT', role: 'Lunch · Panel · Tour', author: 'Who the day is built for · And who else should be in the room', variant: 'bill', ctaUrl: '' },
    storage101: { ...base, title: 'One teachable idea, set large.', subtitle: 'LESSON', metric: 'LESSON 01', body: 'One plain sentence that sets up the rows.', features: 'First point\nSecond point\nThird point', variant: 'primer' },
    mythfact: { ...base, subtitle: brand.masthead, metric: 'MYTH 01', title: 'The wrong belief, stated as people say it.', body: 'The fact that corrects it, with the number that proves it.', variant: 'classic' },
    motionlower: { ...base },
    logosting: { ...base, subtitle: brand.wordmark },
  }
  const out = {}
  for (const [id, seed] of Object.entries(generic)) {
    const merged = { ...seed, ...(brand.copy[id] || {}) }
    // Default mark follows the ground: reversed on dark, color lockup on light.
    if (!merged.logoSrc && brand.logoFor) {
      merged.logoSrc = hexLuma(merged.bgColor) > 0.5 ? brand.logoFor.light : brand.logoFor.dark
    }
    out[id] = merged
  }
  return out
}

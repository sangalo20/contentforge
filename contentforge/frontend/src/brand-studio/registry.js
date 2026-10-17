// Template registry. Rows carry their component directly, so adding a
// template is one entry here plus a copy seed in brands.js — no separate
// render switch. Motion templates carry a `motion` kind instead of a
// component; the studio shell mounts the MotionCanvas for those.
import { TplLiveEvent,
  TplQuote, TplBlogCover, TplEditorial, TplSplitPanel, TplPodcast,
  TplYouTubeThumb, TplTitleCard, TplLowerThird, TplEndCard,
  TplDisplayAd, TplEmailHero, TplNewsletter,
  TplSeal, TplChart, TplBigNumber, TplAnnouncement, TplReport,
  TplPodcastAnnounce, TplWebinar, TplSpeaking, TplPartnership,
  TplOfficeHours, TplStorage101, TplMythFact,
} from './templates'
import { TplSwag } from './swag'

export const TEMPLATES = [
  { id: 'seal', name: 'Brand Seal', group: 'Brand & Data', desc: 'The mark of the house, ink or gold', component: TplSeal, fields: ['title', 'subtitle'] },
  { id: 'swag', name: 'Merch Mockup', group: 'Brand Kit', desc: 'Tee, hoodie, cap, mug, notebook, bottle', component: TplSwag, fields: ['url'] },
  { id: 'chart', name: 'Operator Chart', group: 'Brand & Data', desc: 'Reporting chart with insight headline', component: TplChart, fields: ['title', 'subtitle', 'body', 'metric', 'date', 'url'] },
  { id: 'bignumber', name: 'Big Number', group: 'Brand & Data', desc: 'One stat set like a ledger total', component: TplBigNumber, fields: ['title', 'subtitle', 'body', 'metric', 'date', 'url'] },
  { id: 'report', name: 'Operator Report', group: 'Brand & Data', desc: 'Numbered report cover with plate', component: TplReport, res: '1080x1350', fields: ['title', 'subtitle', 'body', 'metric', 'author', 'url'], media: ['image'] },
  { id: 'announcement', name: 'Announcement', group: 'Events & Announcements', desc: 'Official notice between ticker rails', component: TplAnnouncement, fields: ['title', 'subtitle', 'body', 'metric', 'date', 'url'] },
  { id: 'partnership', name: 'Partnership', group: 'Events & Announcements', desc: 'Signed-deal document, two marks', component: TplPartnership, fields: ['title', 'subtitle', 'body', 'date', 'url'] },
  { id: 'webinar', name: 'Virtual Event Ticket', group: 'Events & Announcements', desc: 'Webinar/live call as an event ticket', component: TplWebinar, fields: ['title', 'subtitle', 'metric', 'author', 'role', 'date', 'url'] },
  { id: 'speaking', name: 'Speaking Event', group: 'Events & Announcements', desc: 'Keynote bill with vertical rail type', component: TplSpeaking, fields: ['title', 'subtitle', 'author', 'role', 'date', 'url'], media: ['image'] },
  { id: 'officehours', name: 'Office Hours', group: 'Events & Announcements', desc: 'Standing session, stacked type', component: TplOfficeHours, fields: ['title', 'subtitle', 'metric', 'author', 'role', 'date', 'url'] },
  { id: 'liveevent', name: 'Live Event Bill', group: 'Events & Announcements', desc: 'The whole event on one sheet · QR to register', component: TplLiveEvent, res: '1080x1350', fields: ['title', 'subtitle', 'body', 'metric', 'author', 'role', 'date', 'url', 'features'] },
  { id: 'storage101', name: 'Storage 101 Lesson', group: 'Editorial', desc: 'Light educational poster (approved recipe)', component: TplStorage101, res: '1080x1350', fields: ['title', 'subtitle', 'body', 'metric', 'url'] },
  { id: 'mythfact', name: 'Myth vs Fact', group: 'Editorial', desc: 'Flag the myth, land the fact', component: TplMythFact, res: '1080x1350', fields: ['title', 'subtitle', 'body', 'metric', 'url'] },
  { id: 'blogcover', name: 'Blog Cover', group: 'Editorial', desc: 'Full-bleed article cover art', component: TplBlogCover, fields: ['title', 'subtitle', 'author', 'date'], media: ['background'], logo: true },
  { id: 'editorial', name: 'Editorial Cover', group: 'Editorial', desc: 'Magazine-style field notes cover', component: TplEditorial, fields: ['title', 'subtitle', 'body', 'date', 'url'], media: ['image'], logo: true },
  { id: 'quote', name: 'Quote Card', group: 'Editorial', desc: 'One sharp line, attributed', component: TplQuote, fields: ['title', 'author', 'role'], logo: true },
  { id: 'splitpanel', name: 'Split Panel', group: 'Editorial', desc: 'Color panel and art split', component: TplSplitPanel, fields: ['title', 'subtitle', 'date', 'url'], media: ['image'], logo: true },
  { id: 'deck', name: 'Carousel Deck', group: 'Editorial', desc: 'Multi-page PDF deck · LinkedIn document', deck: true, res: '1080x1350', fields: [] },
  { id: 'newsletter', name: 'Newsletter Issue', group: 'Editorial', desc: 'Issue masthead layout', component: TplNewsletter, res: '1200x1600', fields: ['title', 'subtitle', 'body', 'metric', 'date', 'url'], logo: true },
  { id: 'podcastannounce', name: 'Podcast Announcement', group: 'Podcast & Video', desc: 'New-episode notice, outlined numeral', component: TplPodcastAnnounce, fields: ['title', 'subtitle', 'metric', 'author', 'role', 'date'], media: ['image'] },
  { id: 'podcast', name: 'Episode Art', group: 'Podcast & Video', desc: 'The episode’s cover — guest portrait forward', component: TplPodcast, fields: ['title', 'subtitle', 'metric', 'author', 'role', 'date'], media: ['image'], logo: true },
  { id: 'youtubethumb', name: 'YouTube Thumbnail', group: 'Podcast & Video', desc: 'High-punch 1280×720 thumb', component: TplYouTubeThumb, res: '1280x720', fields: ['title', 'subtitle', 'metric', 'url'], media: ['image'], logo: true },
  { id: 'titlecard', name: 'Video Title Card', group: 'Podcast & Video', desc: 'Episode intro slate', component: TplTitleCard, res: '1920x1080', fields: ['title', 'subtitle', 'metric', 'author', 'date'], logo: true },
  { id: 'lowerthird', name: 'Lower Third', group: 'Podcast & Video', desc: 'Alpha overlay for edits', component: TplLowerThird, res: '1920x1080', fields: ['author', 'role', 'url'], media: ['background'], logo: true },
  { id: 'endcard', name: 'YouTube End Card', group: 'Podcast & Video', desc: 'Outro with watch-next zone', component: TplEndCard, res: '1920x1080', fields: ['title', 'subtitle', 'url'], logo: true },
  { id: 'displayad', name: 'Display / Social Ad', group: 'Ads & Email', desc: 'Campaign banner 1200×628', component: TplDisplayAd, res: '1200x628', fields: ['title', 'subtitle', 'body', 'metric', 'url'], logo: true },
  { id: 'emailhero', name: 'Email Campaign Hero', group: 'Ads & Email', desc: 'Hero banner 1200×600', component: TplEmailHero, res: '1200x600', fields: ['title', 'subtitle', 'body', 'metric', 'url'], media: ['image'], logo: true },
  { id: 'motionlower', name: 'Animated Lower Third', group: 'Motion', desc: 'Slide-in overlay · alpha PNG seq', motion: 'lower', res: '1920x1080', fields: ['author', 'role', 'url'], logo: true },
  { id: 'logosting', name: 'Logo Sting', group: 'Motion', desc: 'Intro/outro brand animation', motion: 'sting', res: '1920x1080', fields: ['subtitle', 'url'], logo: true },
]

export const TEMPLATE_GROUPS = ['Brand & Data', 'Brand Kit', 'Events & Announcements', 'Editorial', 'Podcast & Video', 'Ads & Email', 'Motion']

// Templates whose centerpiece upload is a person, so uploads get an AI cutout
export const PORTRAIT_TEMPLATES = ['podcast', 'speaking', 'podcastannounce']

export const SPLIT_VARIANTS = [
  { id: 'panes', label: 'Glass' },
  { id: 'ribbons', label: 'Ribbons' },
  { id: 'prisms', label: 'Prisms' },
  { id: 'stack', label: 'Stack' },
  { id: 'mosaic', label: 'Mosaic' },
  { id: 'contour', label: 'Contour' },
  { id: 'slats', label: 'Slats' },
  { id: 'radar', label: 'Radar' },
]

export const THUMB_VARIANTS = [
  { id: 'punch', label: 'Punch' },
  { id: 'tutorial', label: 'Tutorial' },
  { id: 'demo', label: 'Demo' },
  { id: 'live', label: 'Live' },
]

export const SEAL_VARIANTS = [
  { id: 'accent', label: 'Accent' },
  { id: 'blue', label: 'Blue Foil' },
  { id: 'gold', label: 'Gold Foil' },
  { id: 'ink', label: 'Ink' },
]

export const CHART_VARIANTS = [
  { id: 'bars', label: 'Bars' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
  { id: 'dots', label: 'Dots' },
  { id: 'rows', label: 'Rows' },
  { id: 'donut', label: 'Donut' },
]

export const ANNOUNCE_VARIANTS = [
  { id: 'notice', label: 'Notice' },
  { id: 'decree', label: 'Decree' },
  { id: 'poster', label: 'Poster' },
  { id: 'wire', label: 'Wire' },
  { id: 'gate', label: 'Gate' },
  { id: 'folio', label: 'Folio' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'split', label: 'Split' },
]

export const PARTNER_VARIANTS = [
  { id: 'contract', label: 'Contract' },
  { id: 'venn', label: 'Venn' },
  { id: 'plaque', label: 'Plaque' },
  { id: 'wire', label: 'Wire' },
  { id: 'split', label: 'Split' },
  { id: 'memo', label: 'Memo' },
]

export const S101_VARIANTS = [
  { id: 'primer', label: 'Primer' },
  { id: 'chalk', label: 'Chalk' },
  { id: 'card', label: 'Card' },
  { id: 'notes', label: 'Notes' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'sticky', label: 'Sticky' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'folder', label: 'Folder' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'unit', label: 'Unit' },
  { id: 'slide', label: 'Slide' },
]

export const BLOG_VARIANTS = [
  { id: 'front', label: 'Front' },
  { id: 'band', label: 'Band' },
  { id: 'panel', label: 'Panel' },
  { id: 'frame', label: 'Frame' },
  { id: 'ticker', label: 'Ticker' },
  { id: 'folio', label: 'Folio' },
  { id: 'slats', label: 'Slats' },
  { id: 'seal', label: 'Seal' },
]

export const REPORT_VARIANTS = [
  { id: 'plate', label: 'Plate' },
  { id: 'journal', label: 'Journal' },
  { id: 'memo', label: 'Memo' },
  { id: 'annual', label: 'Annual' },
  { id: 'binder', label: 'Binder' },
  { id: 'thesis', label: 'Thesis' },
  { id: 'tabs', label: 'Tabs' },
  { id: 'redacted', label: 'Redacted' },
]

export const BIGNUM_VARIANTS = [
  { id: 'total', label: 'Total' },
  { id: 'outline', label: 'Outline' },
  { id: 'counter', label: 'Counter' },
  { id: 'sum', label: 'Sum' },
  { id: 'roundel', label: 'Roundel' },
  { id: 'split', label: 'Split' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'delta', label: 'Delta' },
]

export const AD_VARIANTS = [
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'type', label: 'Type' },
  { id: 'proof', label: 'Proof' },
  { id: 'offer', label: 'Offer' },
  { id: 'question', label: 'Question' },
  { id: 'dark', label: 'Dark' },
  { id: 'badge', label: 'Badge' },
  { id: 'split', label: 'Split' },
]

export const EMAIL_VARIANTS = [
  { id: 'hero', label: 'Hero' },
  { id: 'type', label: 'Type' },
  { id: 'offer', label: 'Offer' },
  { id: 'note', label: 'Note' },
  { id: 'band', label: 'Band' },
  { id: 'seal', label: 'Seal' },
  { id: 'dark', label: 'Dark' },
  { id: 'ticker', label: 'Ticker' },
]

export const EPISODE_VARIANTS = [
  { id: 'feature', label: 'Feature' },
  { id: 'duotone', label: 'Duotone' },
  { id: 'arch', label: 'Arch' },
  { id: 'ring', label: 'Ring' },
  { id: 'sticker', label: 'Sticker' },
  { id: 'band', label: 'Band' },
  { id: 'frame', label: 'Frame' },
  { id: 'noir', label: 'Noir' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'bauhaus', label: 'Bauhaus' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'riso', label: 'Riso' },
]

export const LIVEEVENT_VARIANTS = [
  { id: 'bill', label: 'Bill' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'door', label: 'Door' },
]

export const WEBINAR_VARIANTS = [
  { id: 'ticket', label: 'Ticket' },
  { id: 'stream', label: 'Stream' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'invite', label: 'Invite' },
  { id: 'pass', label: 'Pass' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'signal', label: 'Signal' },
]

export const PODCAST_VARIANTS = [
  { id: 'numeral', label: 'Numeral' },
  { id: 'studio', label: 'Studio' },
  { id: 'player', label: 'Player' },
  { id: 'onair', label: 'On Air' },
  { id: 'wave', label: 'Wave' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'cassette', label: 'Cassette' },
  { id: 'vu', label: 'VU' },
  { id: 'dial', label: 'Dial' },
  { id: 'transcript', label: 'Script' },
]

export const NEWSLETTER_VARIANTS = [
  { id: 'issue', label: 'Issue' },
  { id: 'frontpage', label: 'Frontpage' },
  { id: 'contents', label: 'Contents' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'post', label: 'Post' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'marquee', label: 'Marquee' },
]

export const QUOTE_VARIANTS = [
  { id: 'mark', label: 'Mark' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'press', label: 'Press' },
  { id: 'highlight', label: 'Highlight' },
  { id: 'plaque', label: 'Plaque' },
  { id: 'testimony', label: 'Testimony' },
  { id: 'social', label: 'Social' },
  { id: 'byline', label: 'Byline' },
]

export const EDITORIAL_VARIANTS = [
  { id: 'field', label: 'Field' },
  { id: 'cover', label: 'Cover' },
  { id: 'type', label: 'Type' },
  { id: 'quote', label: 'Quote' },
  { id: 'plate', label: 'Plate' },
  { id: 'dossier', label: 'Dossier' },
  { id: 'grid', label: 'Grid' },
  { id: 'letter', label: 'Letter' },
]

export const MYTH_VARIANTS = [
  { id: 'classic', label: 'Classic' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'split', label: 'Split' },
  { id: 'cards', label: 'Cards' },
  { id: 'verdict', label: 'Verdict' },
  { id: 'chat', label: 'Chat' },
  { id: 'redline', label: 'Redline' },
  { id: 'torn', label: 'Torn' },
]

export const OFFICE_VARIANTS = [
  { id: 'marquee', label: 'Marquee' },
  { id: 'door', label: 'Door' },
  { id: 'clock', label: 'Clock' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'sign', label: 'Sign' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'board', label: 'Board' },
]

export const SPEAKING_VARIANTS = [
  { id: 'bill', label: 'Bill' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'poster', label: 'Poster' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'wire', label: 'Wire' },
  { id: 'split', label: 'Split' },
]

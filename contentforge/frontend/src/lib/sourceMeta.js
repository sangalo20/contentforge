// Display metadata for source types, shared by every surface that shows what
// fed an item (library cards, the item viewer's Sources tab, history rows).
// The composer keeps its own action labels ("Paste text"); these are the
// DESCRIPTIVE labels ("Pasted text").
import { Video, Globe, ClipboardList, FolderGit2, Code, Layers } from 'lucide-react';

export const SOURCE_TYPE_META = {
  youtube: { label: 'YouTube video', plural: 'YouTube videos', icon: Video, accent: 'text-rose-500' },
  url: { label: 'Web article', plural: 'Web articles', icon: Globe, accent: 'text-sky-600' },
  text: { label: 'Pasted text', plural: 'Pasted texts', icon: ClipboardList, accent: 'text-amber-600' },
  github: { label: 'GitHub repo', plural: 'GitHub repos', icon: FolderGit2, accent: 'text-violet-600' },
  code: { label: 'Code', plural: 'Code snippets', icon: Code, accent: 'text-emerald-600' },
};

export const FALLBACK_META = { label: 'Source', plural: 'Sources', icon: Layers, accent: 'text-slate-500' };

export const metaOf = (type) => SOURCE_TYPE_META[type] || FALLBACK_META;

// Normalized source list for any item generation: new items carry sources[];
// legacy items are derived from their youtubeUrls/titles.
export function sourcesOf(item) {
  if (Array.isArray(item?.sources) && item.sources.length) return item.sources;
  const urls = item?.youtubeUrls || (item?.youtubeUrl ? [item.youtubeUrl] : []);
  return urls.map((url, i) => ({
    type: 'youtube',
    url,
    title: (item.titles && item.titles[i]) || 'YouTube video',
  }));
}

// Human summary of a source stack: "YouTube video", "2 YouTube videos",
// "YouTube video + Web article", "Video + article + 2 more".
export function sourceSummary(sources) {
  if (!sources.length) return null;
  const counts = new Map();
  for (const s of sources) counts.set(s.type, (counts.get(s.type) || 0) + 1);
  const parts = [...counts.entries()].map(([type, n]) => {
    const meta = metaOf(type);
    return n === 1 ? meta.label : `${n} ${meta.plural.toLowerCase()}`;
  });
  if (parts.length <= 2) return parts.join(' + ');
  return `${parts.slice(0, 2).join(' + ')} + ${parts.length - 2} more`;
}

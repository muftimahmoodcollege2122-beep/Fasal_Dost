// Class-string helpers that translate web (Tailwind v4 / CSS) semantics to NativeWind/RN.
import colors from './colors.json';

const STRIP = /^(rtl:|ltr:|group$|sticky|max-w-md|mx-auto|tabular|whitespace-|break-|object-|overflow-x|overflow-y|hover:|focus:|focus-within:|focus-visible:|group-hover:|transition|duration-|ease-|delay-|cursor-|select-|outline|backdrop-|appearance-|placeholder:|scrollbar-|will-change|resize|sm:|md:|lg:|animate-in|fade-in|slide-in|zoom-in)/;

export function normalize(cls: string = ''): string {
  const toks = cls.split(/\s+/).filter(Boolean).filter((t) => !STRIP.test(t));
  const out: string[] = [];
  const has = (t: string) => toks.includes(t);
  const isFlex = has('flex') || has('inline-flex');
  const hasDir = has('flex-col') || has('flex-row') || has('flex-col-reverse') || has('flex-row-reverse');
  for (const t of toks) {
    if (t === 'min-h-screen' || t === 'h-screen') { out.push('flex-1'); continue; }
    if (t === 'fixed') { out.push('relative'); continue; }
    if (t === 'inline-flex') { out.push('flex'); continue; }
    if (t === 'block' || t === 'inline-block' || t === 'inline' || t === 'grid' || /^grid-cols-/.test(t)) continue;
    const sp = t.match(/^space-[xy]-(.+)$/);
    if (sp) { out.push(`gap-${sp[1]}`); continue; }
    out.push(t);
  }
  // web `display:flex` defaults to a ROW; RN defaults to column
  if (isFlex && !hasDir) out.push('flex-row');
  return out.join(' ').replace(/\[(\d+)vh\]/g, '[$1%]');
}

// --- inherited text styling (CSS inheritance emulation) ---
const cat = (t: string): string | null => {
  const b = t.replace(/^[a-z]+:/, '');
  if (/^text-(xs|sm|base|lg|xl|[2-9]xl|\[[\d.]+(px|rem)\])$/.test(b)) return 'size';
  if (/^text-(left|center|right|justify|start|end)$/.test(b)) return 'align';
  if (/^text-(white|black|transparent|current|[a-z]+-\d{2,3}(\/\d+)?)$/.test(b) || /^text-\[#/.test(b)) return 'color';
  if (/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(b)) return 'weight';
  if (/^font-(mono|sans|serif)$/.test(b)) return 'family';
  if (/^leading-/.test(b)) return 'leading';
  if (/^tracking-/.test(b)) return 'tracking';
  if (/^(uppercase|lowercase|capitalize|normal-case)$/.test(b)) return 'transform';
  if (/^(italic|not-italic)$/.test(b)) return 'italic';
  if (/^(underline|no-underline|line-through)$/.test(b)) return 'deco';
  return null;
};

export function textTokens(cls: string = ''): string[] {
  return cls.split(/\s+/).filter((t) => t && cat(t) && !/^(hover|focus|sm|md|lg):/.test(t));
}

export function mergeText(inherited: string[], own: string = ''): string[] {
  const ownT = textTokens(own);
  const ownCats = new Set(ownT.map(cat));
  return [...inherited.filter((t) => !ownCats.has(cat(t))), ...ownT];
}

export function resolveColor(cls: string = '', fallback?: string): string | undefined {
  let found = fallback;
  for (const t of cls.split(/\s+/)) {
    const m = t.match(/^text-(white|black|transparent|current|[a-z]+-\d{2,3})(?:\/\d+)?$/);
    if (m && (colors as any)[m[1]]) found = (colors as any)[m[1]];
    const h = t.match(/^text-\[(#[0-9a-fA-F]{3,8})\]$/);
    if (h) found = h[1];
  }
  return found;
}

export function sizeFromClass(cls: string = ''): number | undefined {
  const m = cls.match(/(?:^|\s)(?:w|h|size)-(\d+(?:\.\d+)?)(?:\s|$)/) || cls.match(/(?:^|\s)w-\[(\d+)px\]/);
  if (!m) return undefined;
  return cls.includes('-[') ? Number(m[1]) : Number(m[1]) * 4;
}

export function gridInfo(cls: string = ''): { cols: number; gap: number } | null {
  const c = cls.match(/(?:^|\s)grid-cols-(\d+)(?:\s|$)/);
  if (!c) return null;
  const g = cls.match(/(?:^|\s)gap-(\d+(?:\.\d+)?)(?:\s|$)/);
  return { cols: Number(c[1]), gap: g ? Number(g[1]) * 4 : 0 };
}

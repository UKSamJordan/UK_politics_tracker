import React from 'react';
import { safeUrl } from '../utils/safeUrl';

export interface OutletBrandSpec {
  shortLabel: string;
  monogram: string;
  bg: string;
  text: string;
  border: string;
  serif?: boolean;
  isBbcBlocks?: boolean;
}

const OUTLET_BRANDS: Array<{ match: RegExp; spec: OutletBrandSpec }> = [
  {
    match: /bbc/i,
    spec: {
      shortLabel: 'BBC News',
      monogram: 'BBC',
      bg: '#B80000',
      text: '#FFFFFF',
      border: '#EF4444',
      isBbcBlocks: true,
    },
  },
  {
    match: /guardian|observer/i,
    spec: {
      shortLabel: 'Guardian',
      monogram: 'G',
      bg: '#052962',
      text: '#FFFFFF',
      border: '#3B82F6',
      serif: true,
    },
  },
  {
    match: /telegraph/i,
    spec: {
      shortLabel: 'Telegraph',
      monogram: 'T',
      bg: '#0F172A',
      text: '#F8FAFC',
      border: '#38BDF8',
      serif: true,
    },
  },
  {
    match: /daily mail|mail on sunday|\bmail\b/i,
    spec: {
      shortLabel: 'Daily Mail',
      monogram: 'DM',
      bg: '#004DB3',
      text: '#FFFFFF',
      border: '#60A5FA',
      serif: true,
    },
  },
  {
    match: /financial times|\bft\b/i,
    spec: {
      shortLabel: 'FT',
      monogram: 'FT',
      bg: '#FCD0B1',
      text: '#1A1817',
      border: '#F59E0B',
      serif: true,
    },
  },
  {
    match: /the times|sunday times/i,
    spec: {
      shortLabel: 'The Times',
      monogram: 'TT',
      bg: '#111827',
      text: '#FFFFFF',
      border: '#94A3B8',
      serif: true,
    },
  },
  {
    match: /sky news|\bsky\b/i,
    spec: {
      shortLabel: 'Sky News',
      monogram: 'SKY',
      bg: '#00338D',
      text: '#FFFFFF',
      border: '#E11D48',
    },
  },
  {
    match: /mirror/i,
    spec: {
      shortLabel: 'Mirror',
      monogram: 'M',
      bg: '#DC2626',
      text: '#FFFFFF',
      border: '#FCA5A5',
    },
  },
  {
    match: /new statesman/i,
    spec: {
      shortLabel: 'New Statesman',
      monogram: 'NS',
      bg: '#991B1B',
      text: '#FEF2F2',
      border: '#F87171',
      serif: true,
    },
  },
  {
    match: /independent/i,
    spec: {
      shortLabel: 'Independent',
      monogram: 'IND',
      bg: '#DC2626',
      text: '#FFFFFF',
      border: '#FB7185',
    },
  },
  {
    match: /express/i,
    spec: {
      shortLabel: 'Express',
      monogram: 'DE',
      bg: '#B91C1C',
      text: '#FFFFFF',
      border: '#F87171',
      serif: true,
    },
  },
  {
    match: /gb news/i,
    spec: {
      shortLabel: 'GB News',
      monogram: 'GBN',
      bg: '#172554',
      text: '#FFFFFF',
      border: '#EF4444',
    },
  },
  {
    match: /spectator/i,
    spec: {
      shortLabel: 'Spectator',
      monogram: 'SP',
      bg: '#7F1D1D',
      text: '#FEF2F2',
      border: '#F87171',
      serif: true,
    },
  },
  {
    match: /\bsun\b/i,
    spec: {
      shortLabel: 'The Sun',
      monogram: 'SUN',
      bg: '#DC2626',
      text: '#FFFFFF',
      border: '#FCA5A5',
    },
  },
  {
    match: /itv/i,
    spec: {
      shortLabel: 'ITV News',
      monogram: 'ITV',
      bg: '#0D9488',
      text: '#FFFFFF',
      border: '#5EEAD4',
    },
  },
  {
    match: /channel 4/i,
    spec: {
      shortLabel: 'Channel 4',
      monogram: 'C4',
      bg: '#4F46E5',
      text: '#FFFFFF',
      border: '#A5B4FC',
    },
  },
];

export function getOutletBrand(outletName: string): OutletBrandSpec {
  for (const entry of OUTLET_BRANDS) {
    if (entry.match.test(outletName)) {
      return entry.spec;
    }
  }
  const initials = outletName
    .replace(/^the\s+/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  return {
    shortLabel: outletName,
    monogram: initials || 'UK',
    bg: '#1E293B',
    text: '#F8FAFC',
    border: '#64748B',
  };
}

/**
 * Ensures clicking an outlet source ALWAYS opens the specific story:
 * - Uses the exact article URL if `rawUrl` points to a real article path or Google News article link.
 * - Falls back to a targeted Google News UK search for `outletName + headline` if `rawUrl` is empty or just a generic `/politics` section index.
 */
export function resolveOutletArticleUrl(
  rawUrl: string | undefined,
  outletName: string,
  headline: string
): string {
  const cleaned = safeUrl(rawUrl);
  if (cleaned && cleaned !== '#') {
    try {
      const u = new URL(cleaned);
      const pathClean = u.pathname.replace(/\/+$/, '');
      const segments = pathClean.split('/').filter(Boolean);
      const isGoogleRssArticle = u.hostname.includes('news.google.com') && pathClean.includes('/articles/');
      const isDeepArticle =
        isGoogleRssArticle ||
        segments.length >= 3 ||
        (segments.length === 2 && (segments[1].length > 22 || /\d{4,}/.test(segments[1]))) ||
        (segments.length === 1 && segments[0].length > 28 && segments[0].includes('-'));

      if (isDeepArticle) {
        return cleaned;
      }
    } catch {
      // fall through to headline search
    }
  }

  const query = `${outletName} ${headline}`.slice(0, 140);
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
}

interface OutletLogoProps {
  outletName: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const OutletLogo: React.FC<OutletLogoProps> = ({
  outletName,
  size = 'sm',
  className = '',
}) => {
  const brand = getOutletBrand(outletName);

  if (brand.isBbcBlocks) {
    const boxCls =
      size === 'xs'
        ? 'w-3.5 h-3.5 text-[8px]'
        : size === 'md'
        ? 'w-5 h-5 text-[10px]'
        : 'w-4 h-4 text-[9px]';
    return (
      <span
        className={`inline-flex items-center space-x-0.5 px-1 py-0.5 rounded bg-[#B80000] border border-red-400/60 shrink-0 select-none ${className}`}
        title={outletName}
      >
        {['B', 'B', 'C'].map((ch, idx) => (
          <span
            key={idx}
            className={`${boxCls} bg-white text-[#B80000] font-black inline-flex items-center justify-center rounded-[2px] leading-none`}
          >
            {ch}
          </span>
        ))}
      </span>
    );
  }

  const dims =
    size === 'xs'
      ? 'h-5 min-w-[20px] px-1 text-[9px]'
      : size === 'md'
      ? 'h-7 min-w-[28px] px-1.5 text-xs'
      : 'h-6 min-w-[24px] px-1.5 text-[10px]';

  return (
    <span
      style={{
        backgroundColor: brand.bg,
        color: brand.text,
        borderColor: brand.border,
        fontFamily: brand.serif ? 'Georgia, "Times New Roman", serif' : undefined,
      }}
      className={`inline-flex items-center justify-center rounded-md border font-black tracking-tight leading-none shrink-0 select-none shadow-2xs ${dims} ${className}`}
      title={outletName}
    >
      {brand.monogram}
    </span>
  );
};

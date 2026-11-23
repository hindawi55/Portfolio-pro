/**
 * Harmonized Design System Presets
 * Provides museum-grade 60-30-10 color palettes, bilingual typography pairings,
 * and safe vertical rhythm scales for the unified Design Tokens & Admin Studio Engine.
 */

export interface ColorPalettePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  mode: 'dark' | 'light';
  swatches: [string, string, string];
  tokens: {
    primary: string;
    secondary: string;
    bgDark: string;
    bgCard: string;
    bgElevated: string;
    accent: string;
    accentLight: string;
    accentRgb: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    gradient1: string;
  };
}

export interface TypographyPairingPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  googleFontsQuery: string;
  tokens: {
    fontDisplayEn: string;
    fontDisplayAr: string;
    fontBodyEn: string;
    fontBodyAr: string;
  };
}

export interface RhythmPreset {
  id: 'compact' | 'balanced' | 'airy';
  nameAr: string;
  nameEn: string;
  tokens: {
    leadingAr: string;
    leadingEn: string;
    headingToBody: string;
    paragraphGap: string;
    cardPadding: string;
    sectionBlock: string;
  };
}

export interface SiteThemeConfig {
  paletteId: string;
  typographyId: string;
  rhythmId: 'compact' | 'balanced' | 'airy';
  customAccent?: string;
}

export const COLOR_PALETTE_PRESETS: ColorPalettePreset[] = [
  {
    id: 'obsidian-gold',
    nameAr: 'السبج المتحفي والذهب الدافئ',
    nameEn: 'Obsidian & Champagne Gold',
    mode: 'dark',
    swatches: ['#090a0d', '#161920', '#e2b170'],
    tokens: {
      primary: '#0c0e12',
      secondary: '#161920',
      bgDark: '#090a0d',
      bgCard: '#12151b',
      bgElevated: '#191d26',
      accent: '#e2b170',
      accentLight: '#f5cf96',
      accentRgb: '226, 177, 112',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#8a95a8',
      border: '#252b37',
      gradient1: 'linear-gradient(135deg, #e2b170 0%, #f7d6a5 50%, #d49c55 100%)',
    },
  },
  {
    id: 'midnight-sapphire',
    nameAr: 'الياقوت الليلي والعنبر',
    nameEn: 'Midnight Sapphire & Amber',
    mode: 'dark',
    swatches: ['#070b14', '#111a2e', '#eab308'],
    tokens: {
      primary: '#0a101d',
      secondary: '#111a2e',
      bgDark: '#070b14',
      bgCard: '#0f172a',
      bgElevated: '#18243f',
      accent: '#eab308',
      accentLight: '#fde047',
      accentRgb: '234, 179, 8',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#23314f',
      gradient1: 'linear-gradient(135deg, #eab308 0%, #fde047 50%, #ca8a04 100%)',
    },
  },
  {
    id: 'warm-espresso',
    nameAr: 'الإسبريسو الدافئ والنحاس',
    nameEn: 'Warm Espresso & Copper',
    mode: 'dark',
    swatches: ['#100c0a', '#1d1613', '#d99163'],
    tokens: {
      primary: '#140f0d',
      secondary: '#1d1613',
      bgDark: '#100c0a',
      bgCard: '#191310',
      bgElevated: '#241b17',
      accent: '#d99163',
      accentLight: '#f0b892',
      accentRgb: '217, 145, 99',
      textPrimary: '#faf5f0',
      textSecondary: '#d6cbc2',
      textMuted: '#9e8f84',
      border: '#332721',
      gradient1: 'linear-gradient(135deg, #d99163 0%, #f0b892 50%, #b86f44 100%)',
    },
  },
  {
    id: 'emerald-noir',
    nameAr: 'الزمرد الداكن والشامبانيا',
    nameEn: 'Emerald Noir & Soft Gold',
    mode: 'dark',
    swatches: ['#070f0c', '#0f1e18', '#d6b87c'],
    tokens: {
      primary: '#0a1410',
      secondary: '#0f1e18',
      bgDark: '#070f0c',
      bgCard: '#0e1b16',
      bgElevated: '#152922',
      accent: '#d6b87c',
      accentLight: '#eed6a5',
      accentRgb: '214, 184, 124',
      textPrimary: '#f4f8f6',
      textSecondary: '#c7d7d0',
      textMuted: '#849c92',
      border: '#1f362d',
      gradient1: 'linear-gradient(135deg, #d6b87c 0%, #eed6a5 50%, #b89658 100%)',
    },
  },
  {
    id: 'monochrome-leica',
    nameAr: 'اللايكا الفضي الكلاسيكي',
    nameEn: 'Leica Graphite & Silver',
    mode: 'dark',
    swatches: ['#0a0a0b', '#17171a', '#e4e4e7'],
    tokens: {
      primary: '#0e0e10',
      secondary: '#17171a',
      bgDark: '#0a0a0b',
      bgCard: '#141417',
      bgElevated: '#1f1f24',
      accent: '#e4e4e7',
      accentLight: '#ffffff',
      accentRgb: '228, 228, 231',
      textPrimary: '#fafafa',
      textSecondary: '#d4d4d8',
      textMuted: '#9ca3af',
      border: '#2c2c33',
      gradient1: 'linear-gradient(135deg, #e4e4e7 0%, #ffffff 50%, #a1a1aa 100%)',
    },
  },
  {
    id: 'editorial-ivory',
    nameAr: 'العاجي النهاري الفاخر',
    nameEn: 'Editorial Ivory & Bronze',
    mode: 'light',
    swatches: ['#f8f6f2', '#ffffff', '#9a6b2f'],
    tokens: {
      primary: '#f1ede6',
      secondary: '#e8e2d8',
      bgDark: '#f8f6f2',
      bgCard: '#ffffff',
      bgElevated: '#f3efe8',
      accent: '#9a6b2f',
      accentLight: '#b9833d',
      accentRgb: '154, 107, 47',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#64748b',
      border: '#dfd7ca',
      gradient1: 'linear-gradient(135deg, #9a6b2f 0%, #c08a42 50%, #7c5422 100%)',
    },
  },
];

export const TYPOGRAPHY_PAIRING_PRESETS: TypographyPairingPreset[] = [
  {
    id: 'luxe-cairo-inter',
    nameAr: 'كايرو + إنتر (هوية Luxe Pro المعتمدة)',
    nameEn: 'Cairo + Inter (Luxe Pro Editorial)',
    descriptionAr: 'توازن بصري مثالي للعناوين والنصوص الطويلة مع وضوح فائق للتشكيل العربي',
    descriptionEn: 'Crisp editorial clarity pairing Cairo for Arabic with Inter & Bebas Neue for English',
    googleFontsQuery:
      'Cairo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Bebas+Neue',
    tokens: {
      fontDisplayEn: "'Bebas Neue', 'Inter', sans-serif",
      fontDisplayAr: "'Cairo', 'IBM Plex Sans Arabic', sans-serif",
      fontBodyEn: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontBodyAr: "'Cairo', 'IBM Plex Sans Arabic', sans-serif",
    },
  },
  {
    id: 'editorial-plex',
    nameAr: 'آي بي إم بليكس + جاكارتا (توثيقي صحفي)',
    nameEn: 'IBM Plex Arabic + Plus Jakarta (Journalistic)',
    descriptionAr: 'طابع صحفي دولي رصين مناسب للمنظمات الدولية والتقارير الوثائقية',
    descriptionEn: 'Authoritative photojournalism pairing built for international editorial desks',
    googleFontsQuery:
      'IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bebas+Neue',
    tokens: {
      fontDisplayEn: "'Bebas Neue', 'Plus Jakarta Sans', sans-serif",
      fontDisplayAr: "'IBM Plex Sans Arabic', 'Cairo', sans-serif",
      fontBodyEn: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      fontBodyAr: "'IBM Plex Sans Arabic', 'Cairo', sans-serif",
    },
  },
  {
    id: 'museum-tajawal',
    nameAr: 'تجوّل + بلايفير (معرض فني فاخر)',
    nameEn: 'Tajawal + Playfair Display (Fine Art Museum)',
    descriptionAr: 'أناقة كلاسيكية فنية تبرز المعارض المتحفية والأعمال المطبوعة',
    descriptionEn: 'Refined serif gallery elegance suited for fine-art monographs and exhibitions',
    googleFontsQuery:
      'Tajawal:wght@400;500;700;800&family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600',
    tokens: {
      fontDisplayEn: "'Playfair Display', Georgia, serif",
      fontDisplayAr: "'Tajawal', 'Cairo', sans-serif",
      fontBodyEn: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontBodyAr: "'Tajawal', 'Cairo', sans-serif",
    },
  },
  {
    id: 'modern-readex',
    nameAr: 'ريدكس برو + أوتفيت (معاصر حداثي)',
    nameEn: 'Readex Pro + Outfit (Contemporary Studio)',
    descriptionAr: 'خطوط هندسية ناعمة ومقروئية عالية جداً على الهواتف الذكية',
    descriptionEn: 'Geometric contemporary pairing engineered for effortless mobile reading',
    googleFontsQuery:
      'Readex+Pro:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Bebas+Neue',
    tokens: {
      fontDisplayEn: "'Outfit', 'Bebas Neue', sans-serif",
      fontDisplayAr: "'Readex Pro', 'Cairo', sans-serif",
      fontBodyEn: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      fontBodyAr: "'Readex Pro', 'Cairo', sans-serif",
    },
  },
];

export const RHYTHM_PRESETS: RhythmPreset[] = [
  {
    id: 'compact',
    nameAr: 'مكثّف أنيق',
    nameEn: 'Editorial Compact',
    tokens: {
      leadingAr: '1.72',
      leadingEn: '1.58',
      headingToBody: 'clamp(0.75rem, 1.4vw, 1rem)',
      paragraphGap: 'clamp(0.85rem, 1.6vw, 1.15rem)',
      cardPadding: 'clamp(1rem, 2.2vw, 1.5rem)',
      sectionBlock: 'clamp(3.25rem, 6vw, 5.25rem)',
    },
  },
  {
    id: 'balanced',
    nameAr: 'متوازن آمن (موصى به)',
    nameEn: 'Safe Balanced (Recommended)',
    tokens: {
      leadingAr: '1.85',
      leadingEn: '1.68',
      headingToBody: 'clamp(0.9rem, 1.8vw, 1.25rem)',
      paragraphGap: 'clamp(1.05rem, 2vw, 1.4rem)',
      cardPadding: 'clamp(1.25rem, 2.8vw, 1.85rem)',
      sectionBlock: 'clamp(4rem, 7.5vw, 6.5rem)',
    },
  },
  {
    id: 'airy',
    nameAr: 'متحفي واسع',
    nameEn: 'Museum Airy',
    tokens: {
      leadingAr: '1.98',
      leadingEn: '1.78',
      headingToBody: 'clamp(1.1rem, 2.2vw, 1.5rem)',
      paragraphGap: 'clamp(1.25rem, 2.4vw, 1.7rem)',
      cardPadding: 'clamp(1.5rem, 3.2vw, 2.25rem)',
      sectionBlock: 'clamp(4.75rem, 8.5vw, 7.5rem)',
    },
  },
];

export const DEFAULT_THEME_CONFIG: SiteThemeConfig = {
  paletteId: 'obsidian-gold',
  typographyId: 'luxe-cairo-inter',
  rhythmId: 'balanced',
};

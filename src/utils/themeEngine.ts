import {
  COLOR_PALETTE_PRESETS,
  DEFAULT_THEME_CONFIG,
  RHYTHM_PRESETS,
  SiteThemeConfig,
  TYPOGRAPHY_PAIRING_PRESETS,
} from '../data/themePresets';
import { safeRun } from './errorDiagnostics';

/**
 * Converts a 6-digit hex color (#e2b170) to an "r, g, b" tuple string
 * so rgba(var(--accent-rgb), alpha) scales seamlessly with any theme accent.
 */
export function hexToRgbTuple(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '226, 177, 112';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors (1.0 - 21.0).
 * Used by the Theme Studio to guard against unreadable text/surface pairs.
 */
export function getContrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string): number => {
    const clean = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 0;
    const channels = [0, 2, 4].map((offset) => {
      const srgb = parseInt(clean.slice(offset, offset + 2), 16) / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const lumA = luminance(hexA);
  const lumB = luminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function ensureGoogleFontLoaded(query: string, id: string): void {
  if (typeof document === 'undefined' || !query) return;
  const linkId = `dynamic-font-${id}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Applies a complete harmonized SiteThemeConfig (colors, typography, safe rhythm)
 * onto document.documentElement (:root) with zero-crash protection.
 */
export function applySiteTheme(config: SiteThemeConfig = DEFAULT_THEME_CONFIG): void {
  safeRun(
    'themeEngine',
    'applySiteTheme',
    () => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;

      const palette =
        COLOR_PALETTE_PRESETS.find((p) => p.id === config.paletteId) || COLOR_PALETTE_PRESETS[0];
      const typography =
        TYPOGRAPHY_PAIRING_PRESETS.find((t) => t.id === config.typographyId) ||
        TYPOGRAPHY_PAIRING_PRESETS[0];
      const rhythm =
        RHYTHM_PRESETS.find((r) => r.id === config.rhythmId) || RHYTHM_PRESETS[1];

      const effectiveAccent = config.customAccent || palette.tokens.accent;
      const effectiveAccentRgb = config.customAccent
        ? hexToRgbTuple(config.customAccent)
        : palette.tokens.accentRgb;

      // Color Tokens
      root.dataset.themeMode = palette.mode;
      root.dataset.paletteId = palette.id;
      root.style.setProperty('--primary', palette.tokens.primary);
      root.style.setProperty('--secondary', palette.tokens.secondary);
      root.style.setProperty('--bg-dark', palette.tokens.bgDark);
      root.style.setProperty('--bg-card', palette.tokens.bgCard);
      root.style.setProperty('--bg-elevated', palette.tokens.bgElevated);
      root.style.setProperty('--accent', effectiveAccent);
      root.style.setProperty('--accent-light', palette.tokens.accentLight);
      root.style.setProperty('--accent-rgb', effectiveAccentRgb);
      root.style.setProperty('--text-primary', palette.tokens.textPrimary);
      root.style.setProperty('--text-secondary', palette.tokens.textSecondary);
      root.style.setProperty('--text-muted', palette.tokens.textMuted);
      root.style.setProperty('--border', palette.tokens.border);
      root.style.setProperty('--gradient-1', palette.tokens.gradient1);
      root.style.setProperty(
        '--gradient-2',
        `linear-gradient(180deg, rgba(${effectiveAccentRgb}, 0.08) 0%, transparent 100%)`
      );
      root.style.setProperty(
        '--shadow-accent',
        `0 8px 30px rgba(${effectiveAccentRgb}, 0.22)`
      );

      // Typography Pairing Tokens
      ensureGoogleFontLoaded(typography.googleFontsQuery, typography.id);
      root.style.setProperty('--font-display-en', typography.tokens.fontDisplayEn);
      root.style.setProperty('--font-display-ar', typography.tokens.fontDisplayAr);
      root.style.setProperty('--font-body-en', typography.tokens.fontBodyEn);
      root.style.setProperty('--font-body-ar', typography.tokens.fontBodyAr);

      // Safe Vertical Rhythm & Spacing Tokens
      root.style.setProperty('--leading-ar', rhythm.tokens.leadingAr);
      root.style.setProperty('--leading-en', rhythm.tokens.leadingEn);
      root.style.setProperty('--space-heading-body', rhythm.tokens.headingToBody);
      root.style.setProperty('--space-paragraph-gap', rhythm.tokens.paragraphGap);
      root.style.setProperty('--space-card-padding', rhythm.tokens.cardPadding);
      root.style.setProperty('--space-section-block', rhythm.tokens.sectionBlock);
    },
    undefined,
    'warning'
  );
}

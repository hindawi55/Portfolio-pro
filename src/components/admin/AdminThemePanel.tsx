import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import {
  COLOR_PALETTE_PRESETS,
  RHYTHM_PRESETS,
  SiteThemeConfig,
  TYPOGRAPHY_PAIRING_PRESETS,
} from '../../data/themePresets';
import { getContrastRatio } from '../../utils/themeEngine';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface AdminThemePanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const AdminThemePanel: React.FC<AdminThemePanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { theme, previewTheme, saveTheme } = useSiteCMS();
  const [draft, setDraft] = useState<SiteThemeConfig>(theme);
  const [saving, setSaving] = useState(false);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    setDraft(theme);
  }, [theme]);

  const activePalette =
    COLOR_PALETTE_PRESETS.find((p) => p.id === draft.paletteId) || COLOR_PALETTE_PRESETS[0];
  const effectiveAccent = draft.customAccent || activePalette.tokens.accent;
  const accentContrast = getContrastRatio(effectiveAccent, activePalette.tokens.bgCard);
  const textContrast = getContrastRatio(
    activePalette.tokens.textPrimary,
    activePalette.tokens.bgCard
  );
  const contrastGrade =
    accentContrast >= 7 ? 'AAA' : accentContrast >= 4.5 ? 'AA' : 'LOW';

  const applyDraftLive = (next: SiteThemeConfig) => {
    setDraft(next);
    previewTheme(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTheme(draft);
      onShowToast(
        isAr
          ? 'تم حفظ منظومة الألوان والخطوط والمسافات الآمنة سحابياً بنجاح.'
          : 'Harmonized theme, typography, and safe rhythm saved to cloud.'
      );
    } catch {
      onShowToast(
        isAr
          ? 'تعذّر حفظ الإعدادات سحابياً، يرجى التحقق من الاتصال والصلاحيات.'
          : 'Failed to save theme settings to cloud.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel-stack">
      {/* Section 1: Harmonized Color Palettes */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'استوديو الألوان المتجانسة (60-30-10)' : 'Harmonized Color Palettes (60-30-10)'}</h3>
            <p>
              {isAr
                ? 'لوحات متحفية متوازنة علمياً تطبق فورياً على كامل الموقع من الهيدر حتى التذييل.'
                : 'Scientifically balanced museum palettes applied live across every surface from header to footer.'}
            </p>
          </div>
          <div className={`admin-wcag-pill grade-${contrastGrade.toLowerCase()}`}>
            <i className="fas fa-universal-access"></i>
            <span>
              WCAG {contrastGrade} ({accentContrast}:1 · {isAr ? 'النص' : 'Ink'} {textContrast}:1)
            </span>
          </div>
        </div>

        <div className="admin-palette-grid">
          {COLOR_PALETTE_PRESETS.map((preset) => {
            const isSelected = draft.paletteId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`admin-palette-card ${isSelected ? 'active' : ''}`}
                onClick={() =>
                  applyDraftLive({ ...draft, paletteId: preset.id, customAccent: undefined })
                }
              >
                <div className="admin-swatch-row">
                  {preset.swatches.map((hex, i) => (
                    <span
                      key={i}
                      className="admin-swatch-dot"
                      style={{ backgroundColor: hex }}
                    ></span>
                  ))}
                  <span className="admin-mode-chip">
                    {preset.mode === 'dark'
                      ? isAr
                        ? 'داكن'
                        : 'Dark'
                      : isAr
                      ? 'نهاري'
                      : 'Daylight'}
                  </span>
                </div>
                <strong className="admin-palette-name">
                  {isAr ? preset.nameAr : preset.nameEn}
                </strong>
              </button>
            );
          })}
        </div>

        {/* Custom Accent Fine-Tuning + WCAG Guard */}
        <div className="admin-custom-accent-row">
          <label className="admin-accent-label" htmlFor="customAccentPicker">
            <span>{isAr ? 'تخصيص لون التمييز الذكي (Accent):' : 'Custom Brand Accent Override:'}</span>
            <input
              id="customAccentPicker"
              type="color"
              value={effectiveAccent}
              onChange={(e) => applyDraftLive({ ...draft, customAccent: e.target.value })}
              className="admin-color-input"
            />
            <code dir="ltr">{effectiveAccent.toUpperCase()}</code>
          </label>

          {draft.customAccent && (
            <button
              type="button"
              className="admin-btn-ghost admin-btn-sm"
              onClick={() => applyDraftLive({ ...draft, customAccent: undefined })}
            >
              {isAr ? 'استعادة لون اللوحة' : 'Reset Accent'}
            </button>
          )}
        </div>

        {contrastGrade === 'LOW' && (
          <div className="admin-alert-warn" role="alert">
            <i className="fas fa-exclamation-circle"></i>
            <span>
              {isAr
                ? 'تحذير التباين (WCAG): اللون المختار منخفض التباين مقابل الخلفية وقد يضعف وضوح الأزرار. يُنصح باختيار درجة أوضح.'
                : 'WCAG Contrast Warning: Selected accent has low contrast against the card surface. Consider a brighter or darker tone.'}
            </span>
          </div>
        )}
      </section>

      {/* Section 2: Harmonized Fluid Typography Pairings */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'منظومة الخطوط السائلة والمتجانسة (AR + EN)' : 'Harmonized Fluid Typography Pairings'}</h3>
            <p>
              {isAr
                ? 'تشكيلات ثنائية اللغة متوافقة تماماً مع مقاسات clamp() السائلة دون أي تعارض.'
                : 'Paired Arabic and English font families routed through universal fluid clamp() scaling.'}
            </p>
          </div>
        </div>

        <div className="admin-typo-grid">
          {TYPOGRAPHY_PAIRING_PRESETS.map((pair) => {
            const isSelected = draft.typographyId === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                className={`admin-typo-card ${isSelected ? 'active' : ''}`}
                onClick={() => applyDraftLive({ ...draft, typographyId: pair.id })}
              >
                <div className="admin-typo-head">
                  <strong>{isAr ? pair.nameAr : pair.nameEn}</strong>
                  {isSelected && <i className="fas fa-check-circle text-gold"></i>}
                </div>
                <p className="admin-typo-desc">
                  {isAr ? pair.descriptionAr : pair.descriptionEn}
                </p>
                <div className="admin-typo-specimen">
                  <span style={{ fontFamily: pair.tokens.fontDisplayAr }}>أبجد هوز · العنوان</span>
                  <span style={{ fontFamily: pair.tokens.fontDisplayEn }}>Aa Bb · Display</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3: Safe Vertical Rhythm & Spacing Scale */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'مُعاير المسافات الآمنة والإيقاع الرأسي' : 'Safe Vertical Rhythm & Spacing Scale'}</h3>
            <p>
              {isAr
                ? 'يتحكم تلقائياً في المسافة الآمنة بين العناوين والفقرات وبين الفقرات وبعضها وارتفاع السطر العربي.'
                : 'Controls safe clearance between headings and body text, paragraph gaps, and Arabic diacritic-safe line height.'}
            </p>
          </div>
        </div>

        <div className="admin-rhythm-row">
          {RHYTHM_PRESETS.map((rhythm) => {
            const isSelected = draft.rhythmId === rhythm.id;
            return (
              <button
                key={rhythm.id}
                type="button"
                className={`admin-rhythm-card ${isSelected ? 'active' : ''}`}
                onClick={() => applyDraftLive({ ...draft, rhythmId: rhythm.id })}
              >
                <strong>{isAr ? rhythm.nameAr : rhythm.nameEn}</strong>
                <span className="admin-rhythm-meta" dir="ltr">
                  AR Line: {rhythm.tokens.leadingAr} · EN Line: {rhythm.tokens.leadingEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sticky Save Action Bar */}
      <div className="admin-save-bar">
        <button
          type="button"
          className="admin-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
          <span>
            {saving
              ? isAr
                ? 'جاري الحفظ السحابي...'
                : 'Saving to Cloud...'
              : isAr
              ? 'حفظ واعتماد المظهر في قاعدة البيانات'
              : 'Publish Theme to Cloud'}
          </span>
        </button>
      </div>
    </div>
  );
};

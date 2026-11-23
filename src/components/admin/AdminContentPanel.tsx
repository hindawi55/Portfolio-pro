import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Language } from '../../types';
import { translations, TranslationDictionary } from '../../data/translations';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { SiteContentOverrides, SiteLayoutConfig } from '../../types/cms';
import { FALLBACK_IMAGE_URL, resolveAssetUrl } from '../../utils/assets';
import { optimizePhotoFile } from '../../utils/mediaExif';

interface AdminContentPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

interface ContentGroup {
  id: string;
  labelAr: string;
  labelEn: string;
  keys: { key: keyof TranslationDictionary; labelAr: string; labelEn: string; multiline?: boolean }[];
}

const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'header_hero',
    labelAr: 'الهيدر والقسم الافتتاحي (Header & Hero)',
    labelEn: 'Header & Hero Section',
    keys: [
      { key: 'nav_home', labelAr: 'رابط الرئيسية', labelEn: 'Nav: Home' },
      { key: 'nav_about', labelAr: 'رابط عني', labelEn: 'Nav: About' },
      { key: 'nav_cv', labelAr: 'رابط السيرة الذاتية', labelEn: 'Nav: CV' },
      { key: 'nav_portfolio', labelAr: 'رابط الأعمال', labelEn: 'Nav: Works' },
      { key: 'nav_services', labelAr: 'رابط الخدمات', labelEn: 'Nav: Services' },
      { key: 'nav_contact', labelAr: 'رابط التواصل', labelEn: 'Nav: Contact' },
      { key: 'hero_label', labelAr: 'شارة الهيرو العلوية', labelEn: 'Hero Top Badge' },
      { key: 'hero_name_ar', labelAr: 'الجزء الأول من العنوان', labelEn: 'Hero Title Part 1' },
      { key: 'hero_name_en', labelAr: 'الجزء الثاني من العنوان', labelEn: 'Hero Title Part 2' },
      { key: 'hero_subtitle', labelAr: 'الوصف الافتتاحي', labelEn: 'Hero Subtitle', multiline: true },
      { key: 'btn_works', labelAr: 'زر الأعمال الرئيسي', labelEn: 'Primary CTA Button' },
      { key: 'btn_contact', labelAr: 'زر التواصل الثانوي', labelEn: 'Secondary CTA Button' },
    ],
  },
  {
    id: 'about',
    labelAr: 'نبذة عن المصورة والبورتريه (About)',
    labelEn: 'About, Portrait & Stats',
    keys: [
      { key: 'about_label', labelAr: 'وسم القسم', labelEn: 'Section Label' },
      { key: 'about_title', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { key: 'about_desc', labelAr: 'وصف القسم', labelEn: 'Section Description', multiline: true },
      { key: 'arch_name', labelAr: 'اسم التوثيق أسفل البورتريه', labelEn: 'Portrait Colophon Name' },
      { key: 'arch_role', labelAr: 'التخصص أسفل البورتريه', labelEn: 'Portrait Colophon Role' },
      { key: 'arch_code_prefix', labelAr: 'بادئة الأرشيف (مثال EAO)', labelEn: 'Archive Code Prefix' },
      { key: 'arch_code_num', labelAr: 'رقم الأرشيف (مثال ARCHIVE 01)', labelEn: 'Archive Code Number' },
      { key: 'about_heading', labelAr: 'العنوان الفرعي', labelEn: 'Bio Heading' },
      { key: 'about_p1', labelAr: 'الفقرة الأولى', labelEn: 'Bio Paragraph 1', multiline: true },
      { key: 'about_p2', labelAr: 'الفقرة الثانية', labelEn: 'Bio Paragraph 2', multiline: true },
      { key: 'stat_years', labelAr: 'تسمية سنوات الخبرة', labelEn: 'Stat: Years Label' },
      { key: 'stat_projects', labelAr: 'تسمية المشاريع', labelEn: 'Stat: Projects Label' },
      { key: 'stat_workshops', labelAr: 'تسمية الورش', labelEn: 'Stat: Workshops Label' },
    ],
  },
  {
    id: 'portfolio_cv',
    labelAr: 'المعرض والسيرة الذاتية (Portfolio & CV)',
    labelEn: 'Portfolio & CV Section',
    keys: [
      { key: 'cv_label', labelAr: 'وسم السيرة الذاتية', labelEn: 'CV Label' },
      { key: 'cv_title', labelAr: 'عنوان السيرة الذاتية', labelEn: 'CV Title' },
      { key: 'btn_download_cv', labelAr: 'زر تحميل PDF', labelEn: 'CV Download Button' },
      { key: 'portfolio_label', labelAr: 'وسم المعرض', labelEn: 'Portfolio Label' },
      { key: 'portfolio_title', labelAr: 'عنوان المعرض', labelEn: 'Portfolio Title' },
      { key: 'portfolio_desc', labelAr: 'وصف المعرض', labelEn: 'Portfolio Description', multiline: true },
    ],
  },
  {
    id: 'mission_services',
    labelAr: 'الرسالة والخدمات (Mission & Services)',
    labelEn: 'Mission & Services',
    keys: [
      { key: 'mission_title', labelAr: 'عنوان الرسالة', labelEn: 'Mission Title' },
      { key: 'mission_desc', labelAr: 'وصف الرسالة', labelEn: 'Mission Description', multiline: true },
      { key: 'mission_1_title', labelAr: 'الركيزة 1 — العنوان', labelEn: 'Mission 1 Title' },
      { key: 'mission_1_desc', labelAr: 'الركيزة 1 — الوصف', labelEn: 'Mission 1 Desc', multiline: true },
      { key: 'mission_2_title', labelAr: 'الركيزة 2 — العنوان', labelEn: 'Mission 2 Title' },
      { key: 'mission_2_desc', labelAr: 'الركيزة 2 — الوصف', labelEn: 'Mission 2 Desc', multiline: true },
      { key: 'services_title', labelAr: 'عنوان الخدمات', labelEn: 'Services Title' },
      { key: 'services_desc', labelAr: 'وصف الخدمات', labelEn: 'Services Description', multiline: true },
      { key: 'service_1_title', labelAr: 'الخدمة 1 — العنوان', labelEn: 'Service 1 Title' },
      { key: 'service_1_desc', labelAr: 'الخدمة 1 — الوصف', labelEn: 'Service 1 Desc', multiline: true },
      { key: 'service_2_title', labelAr: 'الخدمة 2 — العنوان', labelEn: 'Service 2 Title' },
      { key: 'service_2_desc', labelAr: 'الخدمة 2 — الوصف', labelEn: 'Service 2 Desc', multiline: true },
      { key: 'service_3_title', labelAr: 'الخدمة 3 — العنوان', labelEn: 'Service 3 Title' },
      { key: 'service_3_desc', labelAr: 'الخدمة 3 — الوصف', labelEn: 'Service 3 Desc', multiline: true },
    ],
  },
  {
    id: 'contact_footer',
    labelAr: 'التواصل والتذييل (Contact & Footer)',
    labelEn: 'Contact & Footer',
    keys: [
      { key: 'contact_title', labelAr: 'عنوان التواصل', labelEn: 'Contact Title' },
      { key: 'contact_desc', labelAr: 'وصف التواصل', labelEn: 'Contact Description', multiline: true },
      { key: 'contact_heading', labelAr: 'عنوان عمود المعلومات', labelEn: 'Contact Heading' },
      { key: 'contact_p', labelAr: 'فقرة التواصل', labelEn: 'Contact Paragraph', multiline: true },
      { key: 'contact_location', labelAr: 'الموقع الجغرافي', labelEn: 'Location Text' },
      { key: 'footer_copy', labelAr: 'نص حقوق الملكية بالتذييل', labelEn: 'Footer Copyright Text' },
    ],
  },
];

export const AdminContentPanel: React.FC<AdminContentPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { content, saveContent, layout, saveLayout } = useSiteCMS();
  const [draft, setDraft] = useState<SiteContentOverrides>(content);
  const [portraitDraft, setPortraitDraft] = useState<{
    portraitUrl: string;
    portraitFocusY: number;
    portraitZoom: number;
    portraitDefaultMode: 'color' | 'mono';
  }>({
    portraitUrl: layout.portraitUrl || '',
    portraitFocusY: typeof layout.portraitFocusY === 'number' ? layout.portraitFocusY : 38,
    portraitZoom: typeof layout.portraitZoom === 'number' ? layout.portraitZoom : 1.06,
    portraitDefaultMode: layout.portraitDefaultMode || 'color',
  });
  const [activeGroupId, setActiveGroupId] = useState<string>(CONTENT_GROUPS[0].id);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPortrait, setSavingPortrait] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    setDraft(content);
  }, [content]);

  useEffect(() => {
    setPortraitDraft({
      portraitUrl: layout.portraitUrl || '',
      portraitFocusY: typeof layout.portraitFocusY === 'number' ? layout.portraitFocusY : 38,
      portraitZoom: typeof layout.portraitZoom === 'number' ? layout.portraitZoom : 1.06,
      portraitDefaultMode: layout.portraitDefaultMode || 'color',
    });
  }, [layout]);

  const activeGroup = useMemo(
    () => CONTENT_GROUPS.find((g) => g.id === activeGroupId) || CONTENT_GROUPS[0],
    [activeGroupId]
  );

  const visibleFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? CONTENT_GROUPS.flatMap((g) => g.keys) : activeGroup.keys;

    if (!q) return list;
    return list.filter(
      (item) =>
        item.labelAr.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        String(item.key).toLowerCase().includes(q) ||
        (translations.ar[item.key] || '').toLowerCase().includes(q) ||
        (translations.en[item.key] || '').toLowerCase().includes(q)
    );
  }, [activeGroup, search]);

  const updateField = (lang: Language, key: keyof TranslationDictionary, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [lang]: {
        ...(prev[lang] || {}),
        [key]: value,
      },
    }));
  };

  const resetField = (key: keyof TranslationDictionary) => {
    setDraft((prev) => {
      const nextAr = { ...(prev.ar || {}) };
      const nextEn = { ...(prev.en || {}) };
      delete nextAr[key];
      delete nextEn[key];
      return { ar: nextAr, en: nextEn };
    });
  };

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortrait(true);
    try {
      // Compress portrait cleanly so it stays light (~80-160KB) and safe for Firestore
      const optimized = await optimizePhotoFile(file, 960, 0.8);
      if (optimized.sizeKb > 420) {
        const tighter = await optimizePhotoFile(file, 760, 0.72);
        setPortraitDraft((prev) => ({ ...prev, portraitUrl: tighter.dataUrl }));
        onShowToast(
          isAr
            ? `تم تجهيز الصورة وضغطها تلقائياً (${tighter.sizeKb} KB). اضغط «حفظ إعدادات البورتريه» للنشر.`
            : `Portrait optimized (${tighter.sizeKb} KB). Click "Save Portrait Settings" to publish.`
        );
      } else {
        setPortraitDraft((prev) => ({ ...prev, portraitUrl: optimized.dataUrl }));
        onShowToast(
          isAr
            ? `تم تجهيز الصورة الشخصية (${optimized.sizeKb} KB). اضغط «حفظ إعدادات البورتريه» للنشر.`
            : `Portrait ready (${optimized.sizeKb} KB). Click "Save Portrait Settings" to publish.`
        );
      }
    } catch {
      onShowToast(
        isAr
          ? 'تعذّر قراءة ملف الصورة. تأكد من اختيار صورة JPG أو PNG أو WebP صالحة.'
          : 'Could not process image file. Please pick a valid JPG, PNG, or WebP.'
      );
    } finally {
      setUploadingPortrait(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePortrait = async () => {
    setSavingPortrait(true);
    try {
      const nextLayout: SiteLayoutConfig = {
        ...layout,
        portraitUrl: portraitDraft.portraitUrl.trim(),
        portraitFocusY: portraitDraft.portraitFocusY,
        portraitZoom: portraitDraft.portraitZoom,
        portraitDefaultMode: portraitDraft.portraitDefaultMode,
      };
      await saveLayout(nextLayout);
      onShowToast(
        isAr
          ? 'تم حفظ الصورة الشخصية وإعدادات القص والعدسة السحابية بنجاح.'
          : 'Portrait photo, focal crop, and film mode published live to cloud.'
      );
    } catch {
      onShowToast(
        isAr
          ? 'تعذّر حفظ إعدادات الصورة الشخصية. تأكد من حجم الصورة أو صلاحية الإدارة.'
          : 'Failed to save portrait settings to cloud.'
      );
    } finally {
      setSavingPortrait(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveContent(draft);
      onShowToast(
        isAr
          ? 'تم حفظ كافة التعديلات النصية الحرة وتحديث الموقع حياً بنجاح.'
          : 'All bilingual content overrides published live to cloud.'
      );
    } catch {
      onShowToast(
        isAr ? 'تعذّر حفظ التعديلات النصية.' : 'Failed to save content overrides.'
      );
    } finally {
      setSaving(false);
    }
  };

  const previewImgSrc = portraitDraft.portraitUrl.trim()
    ? resolveAssetUrl(portraitDraft.portraitUrl.trim())
    : FALLBACK_IMAGE_URL;

  return (
    <div className="admin-panel-stack">
      {/* Editorial Portrait Studio: Live Upload, Focal Crop, Zoom & Default Darkroom Film Mode */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>
              {isAr
                ? 'استوديو الصورة الشخصية والقص الذهبي (Portrait & Focal Studio)'
                : 'Editorial Portrait & Focal Framing Studio'}
            </h3>
            <p>
              {isAr
                ? 'ارفع صورة شخصية جديدة أو عدّل نقطة التركيز والتكبير مع معاينة حية لخطوط الأثلاث الذهبية قبل النشر.'
                : 'Upload a custom portrait or fine-tune vertical focal alignment, zoom, and default film mode with live Rule-of-Thirds preview.'}
            </p>
          </div>
        </div>

        <div className="admin-portrait-studio">
          {/* Live 4:5 Rule-of-Thirds Preview */}
          <div className="admin-portrait-preview-col">
            <div className="admin-portrait-preview-frame">
              <img
                src={previewImgSrc}
                alt={isAr ? 'معاينة البورتريه الشخصي' : 'Portrait Framing Preview'}
                className={`admin-portrait-preview-img ${
                  portraitDraft.portraitDefaultMode === 'mono' ? 'is-mono' : ''
                }`}
                style={{
                  objectPosition: `50% ${portraitDraft.portraitFocusY}%`,
                  transformOrigin: `50% ${portraitDraft.portraitFocusY}%`,
                  transform: `scale(${portraitDraft.portraitZoom})`,
                }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src !== FALLBACK_IMAGE_URL) {
                    el.onerror = null;
                    el.src = FALLBACK_IMAGE_URL;
                  }
                }}
              />
              {/* Rule-of-Thirds Guide Lines for Golden-Ratio Eye Alignment */}
              <div className="admin-portrait-thirds" aria-hidden="true">
                <span className="apt-v1"></span>
                <span className="apt-v2"></span>
                <span className="apt-h1"></span>
                <span className="apt-h2"></span>
              </div>
              <div className="admin-portrait-preview-bar" aria-hidden="true">
                <span>
                  Y: {portraitDraft.portraitFocusY}% · {portraitDraft.portraitZoom.toFixed(2)}×
                </span>
                <span>{portraitDraft.portraitDefaultMode === 'mono' ? 'MONO' : 'COLOR'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="admin-portrait-controls-col">
            <div className="admin-portrait-upload-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePortraitUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPortrait}
              >
                <i className={`fas ${uploadingPortrait ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
                <span>
                  {uploadingPortrait
                    ? isAr
                      ? 'جاري ضغط وتجهيز الصورة...'
                      : 'Optimizing Portrait...'
                    : isAr
                    ? 'رفع صورة شخصية من جهازك'
                    : 'Upload Portrait Photo'}
                </span>
              </button>

              <button
                type="button"
                className="admin-btn-ghost admin-btn-sm"
                onClick={() =>
                  setPortraitDraft({
                    portraitUrl: '',
                    portraitFocusY: 38,
                    portraitZoom: 1.06,
                    portraitDefaultMode: 'color',
                  })
                }
              >
                <i className="fas fa-undo"></i>
                <span>{isAr ? 'استعادة الافتراضي' : 'Reset Default'}</span>
              </button>
            </div>

            <div className="admin-field">
              <label>
                {isAr
                  ? 'أو رابط صورة مباشر (HTTPS / مسار محلي)'
                  : 'Or Direct Portrait Image URL (HTTPS / Local Path)'}
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="https://... or images/1.jpg"
                value={
                  portraitDraft.portraitUrl.startsWith('data:')
                    ? ''
                    : portraitDraft.portraitUrl
                }
                onChange={(e) =>
                  setPortraitDraft((prev) => ({ ...prev, portraitUrl: e.target.value }))
                }
              />
              {portraitDraft.portraitUrl.startsWith('data:') && (
                <small className="admin-field-hint">
                  {isAr
                    ? '✓ تم تحميل صورة مخصصة مضغوطة جاهزة للنشر السحابي.'
                    : '✓ Optimized custom uploaded portrait attached and ready to publish.'}
                </small>
              )}
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-head">
                <label htmlFor="portrait-focus-y">
                  {isAr
                    ? 'نقطة التركيز الرأسية (ارفع القيمة لتقليص الفراغ فوق الرأس)'
                    : 'Vertical Focal Alignment (Higher trims top headroom)'}
                </label>
                <strong className="admin-tabular">{portraitDraft.portraitFocusY}%</strong>
              </div>
              <input
                id="portrait-focus-y"
                type="range"
                min={0}
                max={100}
                step={1}
                value={portraitDraft.portraitFocusY}
                onChange={(e) =>
                  setPortraitDraft((prev) => ({
                    ...prev,
                    portraitFocusY: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="admin-slider-row">
              <div className="admin-slider-head">
                <label htmlFor="portrait-zoom">
                  {isAr ? 'درجة التكبير والقص التحريري (Editorial Zoom)' : 'Editorial Crop Zoom'}
                </label>
                <strong className="admin-tabular">{portraitDraft.portraitZoom.toFixed(2)}×</strong>
              </div>
              <input
                id="portrait-zoom"
                type="range"
                min={1}
                max={1.45}
                step={0.01}
                value={portraitDraft.portraitZoom}
                onChange={(e) =>
                  setPortraitDraft((prev) => ({
                    ...prev,
                    portraitZoom: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="admin-field">
              <label>
                {isAr
                  ? 'وضع الفيلم الافتراضي للزوار (Default Darkroom Mode)'
                  : 'Default Visitor Darkroom Mode'}
              </label>
              <div className="admin-pill-strip">
                <button
                  type="button"
                  className={`admin-sub-pill ${
                    portraitDraft.portraitDefaultMode === 'color' ? 'active' : ''
                  }`}
                  onClick={() =>
                    setPortraitDraft((prev) => ({ ...prev, portraitDefaultMode: 'color' }))
                  }
                >
                  {isAr ? 'ألوان طبيعية دافئة (Color)' : 'Natural Editorial Color'}
                </button>
                <button
                  type="button"
                  className={`admin-sub-pill ${
                    portraitDraft.portraitDefaultMode === 'mono' ? 'active' : ''
                  }`}
                  onClick={() =>
                    setPortraitDraft((prev) => ({ ...prev, portraitDefaultMode: 'mono' }))
                  }
                >
                  {isAr ? 'أبيض وأسود وثائقي (Leica Mono)' : 'Leica Monochrome B&W'}
                </button>
              </div>
            </div>

            <div className="admin-save-bar" style={{ justifyContent: 'flex-start', paddingTop: 4 }}>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={handleSavePortrait}
                disabled={savingPortrait}
              >
                <i className={`fas ${savingPortrait ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                <span>
                  {savingPortrait
                    ? isAr
                      ? 'جاري حفظ البورتريه...'
                      : 'Publishing Portrait...'
                    : isAr
                    ? 'حفظ إعدادات البورتريه في السحابة'
                    : 'Save Portrait Settings to Cloud'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bilingual Free Content Editor */}
      <form onSubmit={handleSave} className="admin-panel-stack">
        <section className="admin-card-group">
          <div className="admin-card-group-head">
            <div>
              <h3>
                {isAr
                  ? 'محرر التعديل الحر الشامل (من الهيدر إلى التذييل)'
                  : 'Free Visual Content Editor (Header to Footer)'}
              </h3>
              <p>
                {isAr
                  ? 'حرّر أي عنوان أو زر أو فقرة باللغتين العربية والإنجليزية جنباً إلى جنب مع إمكانية استعادة النص الأصلي.'
                  : 'Edit any headline, button, or paragraph side-by-side in Arabic and English with instant 1-click default reset.'}
              </p>
            </div>
          </div>

          {/* Search & Group Filter Chips */}
          <div className="admin-field">
            <input
              type="search"
              placeholder={
                isAr
                  ? 'ابحث عن أي نص أو عنوان أو زر للتعديل السريع...'
                  : 'Search any text, heading, or button across the entire site...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!search.trim() && (
            <div className="admin-pill-strip">
              {CONTENT_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`admin-sub-pill ${activeGroupId === g.id ? 'active' : ''}`}
                  onClick={() => setActiveGroupId(g.id)}
                >
                  {isAr ? g.labelAr : g.labelEn}
                </button>
              ))}
            </div>
          )}

          {/* Bilingual Side-by-Side Fields */}
          <div className="admin-bilingual-list">
            {visibleFields.map((field) => {
              const arVal =
                draft.ar?.[field.key] !== undefined
                  ? draft.ar[field.key]
                  : translations.ar[field.key];
              const enVal =
                draft.en?.[field.key] !== undefined
                  ? draft.en[field.key]
                  : translations.en[field.key];
              const isModified =
                draft.ar?.[field.key] !== undefined || draft.en?.[field.key] !== undefined;

              return (
                <div key={String(field.key)} className="admin-bilingual-row">
                  <div className="admin-bilingual-row-head">
                    <strong>{isAr ? field.labelAr : field.labelEn}</strong>
                    {isModified && (
                      <button
                        type="button"
                        className="admin-btn-ghost admin-btn-sm"
                        onClick={() => resetField(field.key)}
                      >
                        <i className="fas fa-undo"></i>
                        <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>{isAr ? 'النص العربي (AR)' : 'Arabic Text (AR)'}</label>
                      {field.multiline ? (
                        <textarea
                          rows={3}
                          dir="rtl"
                          value={arVal}
                          onChange={(e) => updateField('ar', field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          dir="rtl"
                          value={arVal}
                          onChange={(e) => updateField('ar', field.key, e.target.value)}
                        />
                      )}
                    </div>
                    <div className="admin-field">
                      <label>{isAr ? 'النص الإنجليزي (EN)' : 'English Text (EN)'}</label>
                      {field.multiline ? (
                        <textarea
                          rows={3}
                          dir="ltr"
                          value={enVal}
                          onChange={(e) => updateField('en', field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          dir="ltr"
                          value={enVal}
                          onChange={(e) => updateField('en', field.key, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="admin-save-bar">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
            <span>
              {saving
                ? isAr
                  ? 'جاري النشر السحابي...'
                  : 'Publishing Content...'
                : isAr
                ? 'حفظ ونشر كافة التعديلات النصية'
                : 'Publish All Content Changes'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

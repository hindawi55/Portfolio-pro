import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { SiteLayoutConfig } from '../../types/cms';
import { FALLBACK_IMAGE_URL, resolveAssetUrl } from '../../utils/assets';
import { optimizePhotoFile } from '../../utils/mediaExif';

interface AdminPortraitStudioCardProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const AdminPortraitStudioCard: React.FC<AdminPortraitStudioCardProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { layout, saveLayout } = useSiteCMS();
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
  const [savingPortrait, setSavingPortrait] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    setPortraitDraft({
      portraitUrl: layout.portraitUrl || '',
      portraitFocusY: typeof layout.portraitFocusY === 'number' ? layout.portraitFocusY : 38,
      portraitZoom: typeof layout.portraitZoom === 'number' ? layout.portraitZoom : 1.06,
      portraitDefaultMode: layout.portraitDefaultMode || 'color',
    });
  }, [layout]);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortrait(true);
    try {
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

  const previewImgSrc = portraitDraft.portraitUrl.trim()
    ? resolveAssetUrl(portraitDraft.portraitUrl.trim())
    : FALLBACK_IMAGE_URL;

  return (
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
              ? 'ارفع صورة شخصية جديدة أو أضف رابطاً مباشراً، وعدّل نقطة التركيز والتكبير مع معاينة حية لخطوط الأثلاث الذهبية.'
              : 'Upload a custom portrait or paste a URL, then tune vertical focal alignment, zoom, and default film mode live.'}
          </p>
        </div>
      </div>

      <div className="admin-portrait-studio">
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
              value={portraitDraft.portraitUrl.startsWith('data:') ? '' : portraitDraft.portraitUrl}
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
                setPortraitDraft((prev) => ({ ...prev, portraitFocusY: Number(e.target.value) }))
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
                setPortraitDraft((prev) => ({ ...prev, portraitZoom: Number(e.target.value) }))
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
  );
};

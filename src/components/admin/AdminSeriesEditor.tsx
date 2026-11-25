import React, { useMemo, useRef, useState } from 'react';
import { Language, PhotoItem, PhotoSeries } from '../../types';
import { getPhotoUrl } from '../../data/portfolioData';
import {
  estimatePayloadBytes,
  extractJpegExif,
  MAX_SAFE_DOC_BYTES,
  optimizePhotoForBudget,
} from '../../utils/mediaExif';

export type EditableSeries = PhotoSeries & { order?: number; visible?: boolean };

interface AdminSeriesEditorProps {
  currentLang: Language;
  selected: EditableSeries;
  saving: boolean;
  onChange: (next: EditableSeries) => void;
  onCancel: () => void;
  onSave: (e: React.FormEvent) => void;
  onShowToast: (message: string) => void;
}

export const AdminSeriesEditor: React.FC<AdminSeriesEditorProps> = ({
  currentLang,
  selected,
  saving,
  onChange,
  onCancel,
  onSave,
  onShowToast,
}) => {
  const isAr = currentLang === 'ar';
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usedBytes = useMemo(() => estimatePayloadBytes(selected), [selected]);
  const usedKb = Math.round(usedBytes / 1024);
  const maxKb = Math.round(MAX_SAFE_DOC_BYTES / 1024);
  const budgetRatio = Math.min(100, Math.round((usedBytes / MAX_SAFE_DOC_BYTES) * 100));
  const isOverBudget = usedBytes > MAX_SAFE_DOC_BYTES;

  const handlePhotoFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      let draftSeries = { ...selected, photos: [...selected.photos] };
      let addedCount = 0;

      for (const file of files) {
        const currentBytes = estimatePayloadBytes(draftSeries);
        const remainingBytes = MAX_SAFE_DOC_BYTES - currentBytes;
        if (remainingBytes < 35 * 1024) {
          onShowToast(
            isAr
              ? `تم بلوغ الحد الآمن للمستند السحابي (${maxKb} KB). لإضافة المزيد من الصور عالية الدقة استخدم خيار رابط HTTPS / CDN.`
              : `Cloud doc capacity reached (${maxKb} KB). Attach external HTTPS / CDN URLs for unlimited extra frames.`
          );
          break;
        }

        const perPhotoCapKb = Math.max(55, Math.min(115, Math.floor((remainingBytes * 0.72) / 1024)));
        const [exif, optimized] = await Promise.all([
          extractJpegExif(file),
          optimizePhotoForBudget(file, perPhotoCapKb),
        ]);

        const nextPhoto: PhotoItem = {
          file: optimized.dataUrl,
          captionAr: file.name.replace(/\.[^.]+$/, ''),
          captionEn: file.name.replace(/\.[^.]+$/, ''),
          camera: exif.camera || 'Sony Alpha 7 IV',
          lens: exif.lens || 'FE 35mm f/1.4 GM',
          settings: exif.settings || '1/500s · f/2.0 · ISO 200',
          locationAr: draftSeries.locationAr,
          locationEn: draftSeries.locationEn,
        };

        const candidate = { ...draftSeries, photos: [...draftSeries.photos, nextPhoto] };
        if (estimatePayloadBytes(candidate) > MAX_SAFE_DOC_BYTES) {
          onShowToast(
            isAr
              ? 'تعذّرت إضافة بعض الصور لتجاوز سعة المستند. استخدم روابط CDN للصور الإضافية.'
              : 'Skipped remaining file(s) to stay inside cloud document budget. Use CDN URLs for additional frames.'
          );
          break;
        }
        draftSeries = candidate;
        addedCount++;
      }

      if (addedCount > 0) {
        onChange(draftSeries);
        onShowToast(
          isAr
            ? `تم رفع وضغط ${addedCount} صورة مع استخراج EXIF تلقائياً!`
            : `Uploaded & optimized ${addedCount} photo(s) with EXIF metadata!`
        );
      }
    } catch {
      onShowToast(
        isAr ? 'تعذّرت معالجة ملف الصورة المرفوع.' : 'Could not process the uploaded image file.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  const handleAddPhotoByUrl = () => {
    const rawLines = newPhotoUrl
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (!rawLines.length) return;

    const newItems: PhotoItem[] = rawLines.map((url, idx) => ({
      file: url,
      captionAr: `صورة رقم ${selected.photos.length + idx + 1}`,
      captionEn: `Documentary Frame #${selected.photos.length + idx + 1}`,
      camera: 'Sony Alpha 7 IV',
      lens: 'FE 35mm f/1.4 GM',
      settings: '1/640s · f/2.2 · ISO 200',
      locationAr: selected.locationAr,
      locationEn: selected.locationEn,
    }));

    onChange({
      ...selected,
      photos: [...selected.photos, ...newItems].slice(0, 40),
    });
    setNewPhotoUrl('');
    onShowToast(
      isAr
        ? `تمت إضافة ${newItems.length} صورة عبر الرابط المباشر!`
        : `Attached ${newItems.length} photo(s) via direct URL!`
    );
  };

  const updatePhotoItem = (index: number, patch: Partial<PhotoItem>) => {
    onChange({
      ...selected,
      photos: selected.photos.map((p, idx) => (idx === index ? { ...p, ...patch } : p)),
    });
  };

  const movePhotoItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= selected.photos.length) return;
    const next = [...selected.photos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...selected, photos: next });
  };

  const removePhotoItem = (index: number) => {
    onChange({
      ...selected,
      photos: selected.photos.filter((_, idx) => idx !== index),
    });
  };

  return (
    <form onSubmit={onSave} className="admin-panel-stack">
      <div className="admin-editor-topbar">
        <button type="button" className="admin-btn-ghost admin-btn-sm" onClick={onCancel}>
          <i className={`fas ${isAr ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
          <span>{isAr ? 'العودة لقائمة السلاسل' : 'Back to Series List'}</span>
        </button>
        <strong>{isAr ? selected.titleAr : selected.titleEn}</strong>
      </div>

      <section className="admin-card-group">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>{isAr ? 'عنوان السلسلة (عربي) *' : 'Series Title (AR) *'}</label>
            <input
              type="text"
              required
              value={selected.titleAr}
              onChange={(e) => onChange({ ...selected, titleAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'عنوان السلسلة (إنجليزي) *' : 'Series Title (EN) *'}</label>
            <input
              type="text"
              dir="ltr"
              required
              value={selected.titleEn}
              onChange={(e) => onChange({ ...selected, titleEn: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'الوصف الفرعي (عربي)' : 'Subtitle (AR)'}</label>
            <input
              type="text"
              value={selected.subtitleAr}
              onChange={(e) => onChange({ ...selected, subtitleAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'الوصف الفرعي (إنجليزي)' : 'Subtitle (EN)'}</label>
            <input
              type="text"
              dir="ltr"
              value={selected.subtitleEn}
              onChange={(e) => onChange({ ...selected, subtitleEn: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'التصنيف' : 'Category'}</label>
            <select
              value={selected.category}
              onChange={(e) =>
                onChange({
                  ...selected,
                  category: e.target.value as PhotoSeries['category'],
                })
              }
            >
              <option value="humanitarian">{isAr ? 'إنساني' : 'Humanitarian'}</option>
              <option value="community">{isAr ? 'مجتمعي' : 'Community'}</option>
              <option value="documentary">{isAr ? 'وثائقي' : 'Documentary'}</option>
              <option value="workshops">{isAr ? 'ورش عمل' : 'Workshops'}</option>
            </select>
          </div>
          <div className="admin-field">
            <label>{isAr ? 'رقم السلسلة والتاريخ' : 'Series Date / Year'}</label>
            <input
              type="text"
              dir="ltr"
              value={selected.date}
              onChange={(e) => onChange({ ...selected, date: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'الموقع (عربي)' : 'Location (AR)'}</label>
            <input
              type="text"
              value={selected.locationAr}
              onChange={(e) => onChange({ ...selected, locationAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'الموقع (إنجليزي)' : 'Location (EN)'}</label>
            <input
              type="text"
              dir="ltr"
              value={selected.locationEn}
              onChange={(e) => onChange({ ...selected, locationEn: e.target.value })}
            />
          </div>
        </div>

        <label className="admin-switch-item">
          <input
            type="checkbox"
            checked={selected.visible !== false}
            onChange={(e) => onChange({ ...selected, visible: e.target.checked })}
          />
          <span>
            {isAr ? 'نشر وإظهار هذه السلسلة للزوار' : 'Publish & display this series publicly'}
          </span>
        </label>
      </section>

      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>
              {isAr
                ? `صور السلسلة (${selected.photos.length}/40) · طريقتان للإضافة`
                : `Series Photos (${selected.photos.length}/40) · Dual Upload`}
            </h3>
            <p>
              {isAr
                ? '1) ارفع صوراً متعددة من جهازك (ضغط ذكي + EXIF تلقائي) أو 2) ألصق روابط CDN مباشرة (حتى 40 صورة).'
                : '1) Batch upload from your device (adaptive WebP + auto EXIF) or 2) Paste external HTTPS CDN URLs.'}
            </p>
          </div>
          <span className={`admin-status-badge ${isOverBudget ? 'status-archived' : 'status-booked'}`}>
            {usedKb} / {maxKb} KB ({budgetRatio}%)
          </span>
        </div>

        <div className="admin-upload-bar">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
            <span>
              {uploading
                ? isAr
                  ? 'جاري الضغط الذكي...'
                  : 'Optimizing Photos...'
                : isAr
                ? 'رفع صور من الجهاز (+ EXIF)'
                : 'Upload Device Photos (+ EXIF)'}
            </span>
          </button>

          <div className="admin-url-adder">
            <input
              type="url"
              dir="ltr"
              placeholder="https://cdn.example.com/photo.jpg"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={handleAddPhotoByUrl}
              disabled={!newPhotoUrl.trim()}
            >
              <i className="fas fa-plus"></i>
              <span>{isAr ? 'إضافة رابط' : 'Add URL'}</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoFilesUpload}
          style={{ display: 'none' }}
        />

        <div className="admin-photo-editor-list">
          {selected.photos.map((photo, idx) => (
            <div key={idx} className="admin-photo-editor-card">
              <img
                src={getPhotoUrl(selected.folder, photo.file)}
                alt={photo.captionEn}
                className="admin-photo-thumb"
              />
              <div className="admin-photo-fields">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>{isAr ? 'وصف الصورة (عربي)' : 'Caption (AR)'}</label>
                    <input
                      type="text"
                      value={photo.captionAr}
                      onChange={(e) => updatePhotoItem(idx, { captionAr: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'وصف الصورة (إنجليزي)' : 'Caption (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={photo.captionEn}
                      onChange={(e) => updatePhotoItem(idx, { captionEn: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'الكاميرا (EXIF)' : 'Camera (EXIF)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={photo.camera || ''}
                      onChange={(e) => updatePhotoItem(idx, { camera: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'العدسة والتعريض' : 'Lens & Exposure'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={photo.settings || ''}
                      onChange={(e) => updatePhotoItem(idx, { settings: e.target.value })}
                    />
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => movePhotoItem(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move photo up"
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => movePhotoItem(idx, 1)}
                    disabled={idx === selected.photos.length - 1}
                    aria-label="Move photo down"
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger admin-btn-sm"
                    onClick={() => removePhotoItem(idx)}
                  >
                    <i className="fas fa-trash-alt"></i>
                    <span>{isAr ? 'إزالة الصورة' : 'Remove Photo'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-save-bar">
        <button type="submit" className="admin-btn-primary" disabled={saving || isOverBudget}>
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
          <span>{isAr ? 'حفظ ونشر السلسلة في المعرض' : 'Publish Series to Cloud'}</span>
        </button>
      </div>
    </form>
  );
};

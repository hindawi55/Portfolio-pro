import React, { useMemo, useRef, useState } from 'react';
import { Language } from '../../types';
import { ClientProofPhoto, ClientSession } from '../../data/clientPortalData';
import { getPhotoUrl } from '../../data/portfolioData';
import {
  estimatePayloadBytes,
  extractJpegExif,
  MAX_SAFE_DOC_BYTES,
  optimizePhotoForBudget,
} from '../../utils/mediaExif';

interface AdminClientSessionEditorProps {
  currentLang: Language;
  editing: ClientSession;
  saving: boolean;
  onChange: (next: ClientSession) => void;
  onCancel: () => void;
  onSave: (e: React.FormEvent) => void;
  onShowToast: (message: string) => void;
}

export const AdminClientSessionEditor: React.FC<AdminClientSessionEditorProps> = ({
  currentLang,
  editing,
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

  const usedBytes = useMemo(() => estimatePayloadBytes(editing), [editing]);
  const usedKb = Math.round(usedBytes / 1024);
  const maxKb = Math.round(MAX_SAFE_DOC_BYTES / 1024);
  const budgetRatio = Math.min(100, Math.round((usedBytes / MAX_SAFE_DOC_BYTES) * 100));
  const isOverBudget = usedBytes > MAX_SAFE_DOC_BYTES;

  const handleUploadProofPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      let draft = { ...editing, photos: [...editing.photos] };
      let added = 0;

      for (const file of files) {
        const currentBytes = estimatePayloadBytes(draft);
        const remainingBytes = MAX_SAFE_DOC_BYTES - currentBytes;
        if (remainingBytes < 35 * 1024) {
          onShowToast(
            isAr
              ? `تم بلوغ الحد الآمن للمستند السحابي (${maxKb} KB). أضف المزيد عبر روابط CDN المباشرة.`
              : `Cloud doc capacity reached (${maxKb} KB). Attach CDN URLs for unlimited extra proofs.`
          );
          break;
        }

        const perPhotoCapKb = Math.max(55, Math.min(115, Math.floor((remainingBytes * 0.72) / 1024)));
        const [exif, optimized] = await Promise.all([
          extractJpegExif(file),
          optimizePhotoForBudget(file, perPhotoCapKb),
        ]);

        const nextIdx = draft.photos.length + 1;
        const newPhoto: ClientProofPhoto = {
          id: `PRF-${draft.pin}-${String(nextIdx).padStart(3, '0')}`,
          file: optimized.dataUrl,
          folder: '/images/series-01',
          titleAr: file.name.replace(/\.[^.]+$/, ''),
          titleEn: file.name.replace(/\.[^.]+$/, ''),
          resolution: `${optimized.width} × ${optimized.height}`,
          filesize: `${optimized.sizeKb} KB`,
          camera: exif.camera || 'Sony Alpha 7 IV',
          lens: exif.lens || 'FE 35mm f/1.4 GM',
          settings: exif.settings || '1/500s · f/2.0 · ISO 200',
        };

        const candidate = {
          ...draft,
          photos: [...draft.photos, newPhoto],
          totalPhotos: draft.photos.length + 1,
        };
        if (estimatePayloadBytes(candidate) > MAX_SAFE_DOC_BYTES) {
          onShowToast(
            isAr
              ? 'تم التوقف عند الحد الآمن للسحابة — أكمل الباقي بروابط CDN.'
              : 'Stopped at safe cloud limit — add remaining frames via CDN URL.'
          );
          break;
        }
        draft = candidate;
        added++;
      }

      if (added > 0) {
        onChange(draft);
        onShowToast(
          isAr
            ? `تمت إضافة ${added} صورة إثبات مضغوطة مع بيانات EXIF!`
            : `Added ${added} optimized proof photo(s) with EXIF metadata!`
        );
      }
    } catch {
      onShowToast(isAr ? 'تعذّرت معالجة الصورة.' : 'Failed to process proof photo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  const handleAddProofUrl = () => {
    const urls = newPhotoUrl
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (!urls.length) return;

    const added: ClientProofPhoto[] = urls.map((url, offset) => {
      const nextIdx = editing.photos.length + offset + 1;
      return {
        id: `PRF-${editing.pin}-${String(nextIdx).padStart(3, '0')}`,
        file: url,
        folder: '/images/series-01',
        titleAr: `صورة رقم ${nextIdx}`,
        titleEn: `Proof Frame #${nextIdx}`,
        resolution: 'High-Res Master',
        filesize: 'CDN Asset',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 35mm f/1.4 GM',
        settings: '1/640s · f/2.2 · ISO 200',
      };
    });

    const nextPhotos = [...editing.photos, ...added].slice(0, 100);
    onChange({
      ...editing,
      photos: nextPhotos,
      totalPhotos: nextPhotos.length,
    });
    setNewPhotoUrl('');
  };

  return (
    <form onSubmit={onSave} className="admin-panel-stack">
      <div className="admin-editor-topbar">
        <button type="button" className="admin-btn-ghost admin-btn-sm" onClick={onCancel}>
          <i className={`fas ${isAr ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
          <span>{isAr ? 'العودة لقائمة الجلسات' : 'Back to Sessions'}</span>
        </button>
        <strong>PIN #{editing.pin}</strong>
      </div>

      <section className="admin-card-group">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>{isAr ? 'رمز المرور السري (PIN — 4 إلى 32 حرف/رقم) *' : 'Access PIN *'}</label>
            <input
              type="text"
              dir="ltr"
              required
              minLength={3}
              maxLength={32}
              value={editing.pin}
              onChange={(e) =>
                onChange({
                  ...editing,
                  pin: e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''),
                })
              }
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'تاريخ الصلاحية (YYYY-MM-DD)' : 'Expiry Date (YYYY-MM-DD)'}</label>
            <input
              type="text"
              dir="ltr"
              value={editing.expiryDate}
              onChange={(e) => onChange({ ...editing, expiryDate: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'اسم العميل / المنظمة (عربي) *' : 'Client Name (AR) *'}</label>
            <input
              type="text"
              required
              value={editing.clientNameAr}
              onChange={(e) => onChange({ ...editing, clientNameAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'اسم العميل / المنظمة (إنجليزي) *' : 'Client Name (EN) *'}</label>
            <input
              type="text"
              dir="ltr"
              required
              value={editing.clientNameEn}
              onChange={(e) => onChange({ ...editing, clientNameEn: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'عنوان المشروع (عربي) *' : 'Project Title (AR) *'}</label>
            <input
              type="text"
              required
              value={editing.projectTitleAr}
              onChange={(e) => onChange({ ...editing, projectTitleAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'عنوان المشروع (إنجليزي) *' : 'Project Title (EN) *'}</label>
            <input
              type="text"
              dir="ltr"
              required
              value={editing.projectTitleEn}
              onChange={(e) => onChange({ ...editing, projectTitleEn: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'حجم الحزمة / الصيغة' : 'Package Size'}</label>
            <input
              type="text"
              dir="ltr"
              value={editing.packageSize}
              onChange={(e) => onChange({ ...editing, packageSize: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>{isAr ? 'رابط تحميل الأرشيف الكامل (اختياري ZIP/Drive)' : 'Master Archive Download URL'}</label>
            <input
              type="url"
              dir="ltr"
              placeholder="https://drive.google.com/..."
              value={editing.downloadUrl || ''}
              onChange={(e) => onChange({ ...editing, downloadUrl: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>
              {isAr
                ? `صور جلسة الاعتماد (${editing.photos.length}/100)`
                : `Session Proofing Photos (${editing.photos.length}/100)`}
            </h3>
            <p>
              {isAr
                ? 'ارفع صوراً متعددة من جهازك أو أضف روابط CDN عالية الجودة.'
                : 'Batch upload proofs from your device or attach high-res CDN URLs.'}
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
            <span>{isAr ? 'رفع صور إثبات' : 'Upload Proof Photos'}</span>
          </button>

          <div className="admin-url-adder">
            <input
              type="url"
              dir="ltr"
              placeholder="https://cdn.example.com/proof-01.jpg"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={handleAddProofUrl}
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
          onChange={handleUploadProofPhotos}
          style={{ display: 'none' }}
        />

        <div className="admin-photo-editor-list">
          {editing.photos.map((photo, idx) => (
            <div key={photo.id + idx} className="admin-photo-editor-card">
              <img
                src={getPhotoUrl(photo.folder, photo.file)}
                alt={photo.titleEn}
                className="admin-photo-thumb"
              />
              <div className="admin-photo-fields">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>{isAr ? 'رمز الصورة (ID)' : 'Frame ID'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={photo.id}
                      onChange={(e) => {
                        const next = editing.photos.map((p, i) =>
                          i === idx
                            ? { ...p, id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') }
                            : p
                        );
                        onChange({ ...editing, photos: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'العنوان (عربي)' : 'Title (AR)'}</label>
                    <input
                      type="text"
                      value={photo.titleAr}
                      onChange={(e) => {
                        const next = editing.photos.map((p, i) =>
                          i === idx ? { ...p, titleAr: e.target.value } : p
                        );
                        onChange({ ...editing, photos: next });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-sm"
                  onClick={() =>
                    onChange({
                      ...editing,
                      photos: editing.photos.filter((_, i) => i !== idx),
                      totalPhotos: editing.photos.length - 1,
                    })
                  }
                >
                  <i className="fas fa-trash-alt"></i>
                  <span>{isAr ? 'حذف الصورة' : 'Remove'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-save-bar">
        <button type="submit" className="admin-btn-primary" disabled={saving || isOverBudget}>
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
          <span>{isAr ? 'حفظ ونشر جلسة العميل سحابياً' : 'Publish Client Session'}</span>
        </button>
      </div>
    </form>
  );
};

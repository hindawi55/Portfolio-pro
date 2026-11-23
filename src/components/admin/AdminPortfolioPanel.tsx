import React, { useRef, useState } from 'react';
import { Language, PhotoItem, PhotoSeries } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { getPhotoUrl } from '../../data/portfolioData';
import { deletePortfolioSeries, savePortfolioSeries } from '../../services/cmsService';
import { extractJpegExif, optimizePhotoFile } from '../../utils/mediaExif';

interface AdminPortfolioPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

type EditableSeries = PhotoSeries & { order?: number; visible?: boolean };

export const AdminPortfolioPanel: React.FC<AdminPortfolioPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { portfolioSeries, refreshCloudData } = useSiteCMS();
  const [selected, setSelected] = useState<EditableSeries | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = currentLang === 'ar';

  const handleCreateNewSeries = () => {
    const nextNum = String(portfolioSeries.length + 1).padStart(2, '0');
    setSelected({
      id: `series-${Date.now()}`,
      number: nextNum,
      order: portfolioSeries.length,
      visible: true,
      category: 'documentary',
      tags: ['documentary'],
      titleAr: 'سلسلة فوتوغرافية جديدة',
      titleEn: 'New Documentary Series',
      subtitleAr: 'وصف قصير للسلسلة الميدانية',
      subtitleEn: 'Short editorial subtitle for this series',
      locationAr: 'السودان',
      locationEn: 'Sudan',
      date: new Date().getFullYear().toString(),
      folder: '/images/series-01',
      photos: [],
    });
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const [exif, optimized] = await Promise.all([
        extractJpegExif(file),
        optimizePhotoFile(file, 1080, 0.78),
      ]);

      const newPhoto: PhotoItem = {
        file: optimized.dataUrl,
        captionAr: file.name.replace(/\.[^.]+$/, ''),
        captionEn: file.name.replace(/\.[^.]+$/, ''),
        camera: exif.camera || 'Sony Alpha 7 IV',
        lens: exif.lens || 'FE 35mm f/1.4 GM',
        settings: exif.settings || '1/500s · f/2.0 · ISO 200',
        locationAr: selected.locationAr,
        locationEn: selected.locationEn,
      };

      setSelected({
        ...selected,
        photos: [...selected.photos, newPhoto],
      });

      onShowToast(
        isAr
          ? `تم ضغط الصورة (${optimized.sizeKb}KB WebP) واستخراج بيانات EXIF تلقائياً!`
          : `Photo optimized (${optimized.sizeKb}KB WebP) with EXIF metadata extracted!`
      );
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
    if (!selected || !newPhotoUrl.trim()) return;
    const item: PhotoItem = {
      file: newPhotoUrl.trim(),
      captionAr: 'عنوان الصورة بالعربية',
      captionEn: 'Photo caption in English',
      camera: 'Sony Alpha 7 IV',
      lens: 'FE 35mm f/1.4 GM',
      settings: '1/640s · f/2.2 · ISO 200',
      locationAr: selected.locationAr,
      locationEn: selected.locationEn,
    };
    setSelected({ ...selected, photos: [...selected.photos, item] });
    setNewPhotoUrl('');
  };

  const updatePhotoItem = (index: number, patch: Partial<PhotoItem>) => {
    if (!selected) return;
    const nextPhotos = selected.photos.map((p, idx) => (idx === index ? { ...p, ...patch } : p));
    setSelected({ ...selected, photos: nextPhotos });
  };

  const removePhotoItem = (index: number) => {
    if (!selected) return;
    setSelected({
      ...selected,
      photos: selected.photos.filter((_, idx) => idx !== index),
    });
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await savePortfolioSeries(selected);
      await refreshCloudData();
      setSelected(null);
      onShowToast(
        isAr
          ? 'تم حفظ السلسلة الفوتوغرافية ونشرها في المعرض السحابي بنجاح.'
          : 'Photo series saved and published to the live gallery.'
      );
    } catch {
      onShowToast(
        isAr
          ? 'تعذّر حفظ السلسلة (تأكد من أن إجمالي حجم الصور المرفوعة ضمن سعة المستند 1MB).'
          : 'Failed to save series (ensure inline uploaded photos stay under the 1MB Firestore doc limit).'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeries = async (seriesId: string) => {
    setSaving(true);
    try {
      await deletePortfolioSeries(seriesId);
      await refreshCloudData();
      if (selected?.id === seriesId) setSelected(null);
      onShowToast(isAr ? 'تم حذف السلسلة من المعرض.' : 'Series deleted from gallery.');
    } catch {
      onShowToast(isAr ? 'تعذّر حذف السلسلة.' : 'Failed to delete series.');
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <form onSubmit={handleSaveSeries} className="admin-panel-stack">
        <div className="admin-editor-topbar">
          <button
            type="button"
            className="admin-btn-ghost admin-btn-sm"
            onClick={() => setSelected(null)}
          >
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
                onChange={(e) => setSelected({ ...selected, titleAr: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'عنوان السلسلة (إنجليزي) *' : 'Series Title (EN) *'}</label>
              <input
                type="text"
                dir="ltr"
                required
                value={selected.titleEn}
                onChange={(e) => setSelected({ ...selected, titleEn: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'الوصف الفرعي (عربي)' : 'Subtitle (AR)'}</label>
              <input
                type="text"
                value={selected.subtitleAr}
                onChange={(e) => setSelected({ ...selected, subtitleAr: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'الوصف الفرعي (إنجليزي)' : 'Subtitle (EN)'}</label>
              <input
                type="text"
                dir="ltr"
                value={selected.subtitleEn}
                onChange={(e) => setSelected({ ...selected, subtitleEn: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'التصنيف' : 'Category'}</label>
              <select
                value={selected.category}
                onChange={(e) =>
                  setSelected({
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
              <label>{isAr ? 'التاريخ / العام' : 'Date / Year'}</label>
              <input
                type="text"
                dir="ltr"
                value={selected.date}
                onChange={(e) => setSelected({ ...selected, date: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'الموقع (عربي)' : 'Location (AR)'}</label>
              <input
                type="text"
                value={selected.locationAr}
                onChange={(e) => setSelected({ ...selected, locationAr: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'الموقع (إنجليزي)' : 'Location (EN)'}</label>
              <input
                type="text"
                dir="ltr"
                value={selected.locationEn}
                onChange={(e) => setSelected({ ...selected, locationEn: e.target.value })}
              />
            </div>
          </div>

          <label className="admin-switch-item">
            <input
              type="checkbox"
              checked={selected.visible !== false}
              onChange={(e) => setSelected({ ...selected, visible: e.target.checked })}
            />
            <span>{isAr ? 'نشر وإظهار هذه السلسلة للزوار' : 'Publish & display this series publicly'}</span>
          </label>
        </section>

        {/* Photo Manager with Smart Upload + EXIF Extraction */}
        <section className="admin-card-group">
          <div className="admin-card-group-head">
            <div>
              <h3>
                {isAr
                  ? `صور السلسلة (${selected.photos.length}) + قارئ EXIF التلقائي`
                  : `Series Photos (${selected.photos.length}) + Auto EXIF`}
              </h3>
              <p>
                {isAr
                  ? 'ارفع صورة من جهازك (يتم ضغطها تلقائياً لـ WebP واستخراج بيانات الكاميرا EXIF) أو أضف رابط CDN مباشر.'
                  : 'Upload from device (auto-compressed WebP + EXIF extraction) or attach a direct HTTPS CDN URL.'}
              </p>
            </div>
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
                    ? 'جاري الضغط وقراءة EXIF...'
                    : 'Optimizing & Reading EXIF...'
                  : isAr
                  ? 'رفع صورة + استخراج EXIF'
                  : 'Upload Photo + Auto EXIF'}
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
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoFileUpload}
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
            ))}
          </div>
        </section>

        <div className="admin-save-bar">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            <span>{isAr ? 'حفظ ونشر السلسلة في المعرض' : 'Publish Series to Cloud'}</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="admin-panel-stack">
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'مدير السلاسل الفوتوغرافية والصور' : 'Portfolio Series & Media Manager'}</h3>
            <p>
              {isAr
                ? 'أضف سلاسل جديدة، ارفع صوراً مع استخراج EXIF تلقائياً، وعدّل النصوص والتصنيفات مباشرة.'
                : 'Create series, upload optimized WebP photos with auto EXIF extraction, and edit captions live.'}
            </p>
          </div>
          <button type="button" className="admin-btn-primary" onClick={handleCreateNewSeries}>
            <i className="fas fa-plus"></i>
            <span>{isAr ? 'إضافة سلسلة جديدة' : 'New Series'}</span>
          </button>
        </div>

        <div className="admin-grouped-list">
          {portfolioSeries.map((series, idx) => (
            <div key={series.id} className="admin-grouped-row">
              <div className="admin-row-info">
                <strong>
                  #{series.number} · {isAr ? series.titleAr : series.titleEn}
                </strong>
                <span className="admin-row-meta">
                  {series.photos.length} {isAr ? 'صورة' : 'photos'} · {series.category} · {series.date}
                </span>
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className="admin-btn-secondary admin-btn-sm"
                  onClick={() => setSelected({ ...series, order: idx, visible: true })}
                >
                  <i className="fas fa-edit"></i>
                  <span>{isAr ? 'تعديل الصور والبيانات' : 'Edit Series'}</span>
                </button>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-sm"
                  onClick={() => handleDeleteSeries(series.id)}
                  disabled={saving}
                  aria-label="Delete series"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

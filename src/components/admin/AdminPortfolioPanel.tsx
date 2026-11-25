import React, { useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { deletePortfolioSeries, savePortfolioSeries } from '../../services/cmsService';
import { AdminSeriesEditor, EditableSeries } from './AdminSeriesEditor';

interface AdminPortfolioPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const AdminPortfolioPanel: React.FC<AdminPortfolioPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { portfolioSeries, refreshCloudData } = useSiteCMS();
  const [selected, setSelected] = useState<EditableSeries | null>(null);
  const [saving, setSaving] = useState(false);

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
          ? 'تعذّر حفظ السلسلة (تأكد من أن إجمالي حجم الصور المرفوعة ضمن سعة المستند 900 KB).'
          : 'Failed to save series (ensure inline uploaded photos stay under the 900 KB doc budget).'
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
      <AdminSeriesEditor
        currentLang={currentLang}
        selected={selected}
        saving={saving}
        onChange={setSelected}
        onCancel={() => setSelected(null)}
        onSave={handleSaveSeries}
        onShowToast={onShowToast}
      />
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
                ? 'أضف سلاسل جديدة، ارفع صوراً مع استخراج EXIF تلقائياً أو ألصق روابط CDN مباشرة.'
                : 'Create series, batch-upload optimized WebP photos with auto EXIF, or attach CDN URLs.'}
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

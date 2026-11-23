import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { DEFAULT_THEME_CONFIG } from '../../data/themePresets';
import {
  DEFAULT_CONTENT_OVERRIDES,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_SEO_CONFIG,
  FullTemplateExportBundle,
  ThemeBackupRecord,
} from '../../types/cms';
import {
  createThemeBackup,
  deleteThemeBackup,
  listThemeBackups,
  seedInitialStudioData,
} from '../../services/cmsService';

interface AdminBackupPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const AdminBackupPanel: React.FC<AdminBackupPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const {
    theme,
    layout,
    seo,
    content,
    saveTheme,
    saveLayout,
    saveSeo,
    saveContent,
    refreshCloudData,
  } = useSiteCMS();

  const [backups, setBackups] = useState<ThemeBackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = currentLang === 'ar';

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listThemeBackups();
      setBackups(records);
    } catch {
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setBusyAction('create');
    try {
      await createThemeBackup({
        label: label.trim(),
        note: note.trim(),
        theme,
        layout,
        seo,
        content,
      });
      setLabel('');
      setNote('');
      await loadBackups();
      onShowToast(
        isAr
          ? 'تم إنشاء لقطة النسخ الاحتياطي السحابية بنجاح.'
          : 'Cloud template snapshot created successfully.'
      );
    } catch {
      onShowToast(
        isAr ? 'تعذّر حفظ اللقطة السحابية.' : 'Failed to create cloud snapshot.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestoreSnapshot = async (snap: ThemeBackupRecord) => {
    setBusyAction(`restore-${snap.id}`);
    try {
      await Promise.all([
        saveTheme(snap.theme || DEFAULT_THEME_CONFIG),
        saveLayout(snap.layout || DEFAULT_LAYOUT_CONFIG),
        saveSeo(snap.seo || DEFAULT_SEO_CONFIG),
        saveContent(snap.content || DEFAULT_CONTENT_OVERRIDES),
      ]);
      onShowToast(
        isAr
          ? `تمت استعادة النسخة "${snap.label}" وتطبيقها على الموقع بالكامل.`
          : `Snapshot "${snap.label}" restored across the live site.`
      );
    } catch {
      onShowToast(
        isAr ? 'تعذّرت استعادة النسخة الاحتياطية.' : 'Failed to restore snapshot.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteSnapshot = async (backupId: string) => {
    setBusyAction(`del-${backupId}`);
    try {
      await deleteThemeBackup(backupId);
      setBackups((prev) => prev.filter((b) => b.id !== backupId));
      onShowToast(isAr ? 'تم حذف اللقطة الاحتياطية.' : 'Snapshot deleted.');
    } catch {
      onShowToast(isAr ? 'تعذّر حذف اللقطة.' : 'Failed to delete snapshot.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportJson = () => {
    const bundle: FullTemplateExportBundle = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      theme,
      layout,
      seo,
      content,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luxe-studio-template-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(
      isAr
        ? 'تم تصدير ملف النسخة الاحتياطية الكامل للقالب (JSON).'
        : 'Full template configuration exported as JSON.'
    );
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAction('import');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<FullTemplateExportBundle>;
      if (!parsed || typeof parsed !== 'object' || !parsed.theme || !parsed.layout) {
        throw new Error('Invalid template backup structure.');
      }
      await Promise.all([
        saveTheme({ ...DEFAULT_THEME_CONFIG, ...parsed.theme }),
        saveLayout({ ...DEFAULT_LAYOUT_CONFIG, ...parsed.layout }),
        saveSeo({ ...DEFAULT_SEO_CONFIG, ...(parsed.seo || {}) }),
        saveContent({ ...DEFAULT_CONTENT_OVERRIDES, ...(parsed.content || {}) }),
      ]);
      onShowToast(
        isAr
          ? 'تم استيراد القالب وتطبيقه وحفظه سحابياً بنجاح.'
          : 'Template bundle imported and published to cloud.'
      );
    } catch {
      onShowToast(
        isAr
          ? 'ملف JSON غير صالح أو تالف؛ لم يتم إجراء أي تعديل.'
          : 'Invalid JSON template file; no changes were applied.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setBusyAction(null);
    }
  };

  const handleSeedCloud = async () => {
    setBusyAction('seed');
    try {
      await seedInitialStudioData();
      await refreshCloudData();
      onShowToast(
        isAr
          ? 'تمت تهيئة قاعدة البيانات السحابية بكامل المعارض والسيرة وجلسات العملاء بنجاح!'
          : 'Cloud database bootstrapped with all series, CV wings, and sessions!'
      );
    } catch {
      onShowToast(
        isAr
          ? 'تعذّرت تهيئة قاعدة البيانات، يرجى التأكد من صلاحية المالك.'
          : 'Could not seed database; please confirm owner permissions.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleFactoryReset = async () => {
    setBusyAction('reset');
    try {
      await Promise.all([
        saveTheme(DEFAULT_THEME_CONFIG),
        saveLayout(DEFAULT_LAYOUT_CONFIG),
        saveSeo(DEFAULT_SEO_CONFIG),
        saveContent(DEFAULT_CONTENT_OVERRIDES),
      ]);
      onShowToast(
        isAr
          ? 'تمت استعادة الإعدادات الافتراضية الآمنة للقالب بنجاح.'
          : 'Template safely restored to factory defaults.'
      );
    } catch {
      onShowToast(isAr ? 'تعذّرت الاستعادة الافتراضية.' : 'Factory reset failed.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="admin-panel-stack">
      {/* Cloud Bootstrap & JSON Cloning Tools */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'التصدير، الاستنساخ، والتهيئة السحابية' : 'Template Export, Cloning & Cloud Seed'}</h3>
            <p>
              {isAr
                ? 'صدّر القالب بالكامل كملف JSON لاستنساخه لأي عميل جديد في ثوانٍ، أو هيّئ قاعدة البيانات السحابية بنقرة واحدة.'
                : 'Export a complete JSON template bundle to clone for a new buyer in seconds, or bootstrap Firestore in one click.'}
            </p>
          </div>
        </div>

        <div className="admin-action-grid">
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSeedCloud}
            disabled={busyAction !== null}
          >
            <i className={`fas ${busyAction === 'seed' ? 'fa-spinner fa-spin' : 'fa-database'}`}></i>
            <span>{isAr ? 'تهيئة ورفع بيانات الموقع للسحابة' : '1-Click Cloud Seed'}</span>
          </button>

          <button
            type="button"
            className="admin-btn-secondary"
            onClick={handleExportJson}
            disabled={busyAction !== null}
          >
            <i className="fas fa-download"></i>
            <span>{isAr ? 'تصدير نسخة القالب (JSON)' : 'Export Template (JSON)'}</span>
          </button>

          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={busyAction !== null}
          >
            <i className={`fas ${busyAction === 'import' ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i>
            <span>{isAr ? 'استيراد قالب (JSON)' : 'Import Template (JSON)'}</span>
          </button>

          <button
            type="button"
            className="admin-btn-danger"
            onClick={handleFactoryReset}
            disabled={busyAction !== null}
          >
            <i className="fas fa-undo"></i>
            <span>{isAr ? 'استعادة ضبط المصنع الآمن' : 'Safe Factory Reset'}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportJson}
          style={{ display: 'none' }}
        />
      </section>

      {/* Create Cloud Snapshot */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'إنشاء لقطة نسخ احتياطي سحابية (Cloud Snapshot)' : 'Create Cloud Restore Point'}</h3>
            <p>
              {isAr
                ? 'احفظ نسخة مؤرخة من المظهر والألوان والخطوط والهيكل والنصوص قبل أي تعديل كبير.'
                : 'Save a timestamped cloud snapshot of theme, layout, SEO, and content overrides before making major edits.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateSnapshot} className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="snapLabel">{isAr ? 'اسم النسخة الاحتياطية *' : 'Snapshot Label *'}</label>
            <input
              id="snapLabel"
              type="text"
              required
              maxLength={120}
              placeholder={isAr ? 'مثال: نسخة ما قبل تغيير الهوية اللونية' : 'e.g. Pre-Rebrand Museum Dark'}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="snapNote">{isAr ? 'ملاحظة اختيارية' : 'Optional Note'}</label>
            <input
              id="snapNote"
              type="text"
              maxLength={400}
              placeholder={isAr ? 'تفاصيل التعديلات المحفوظة...' : 'Summary of changes in this snapshot...'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="admin-field-full">
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={busyAction !== null || !label.trim()}
            >
              <i className={`fas ${busyAction === 'create' ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
              <span>{isAr ? 'حفظ اللقطة السحابية الآن' : 'Save Cloud Snapshot'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Saved Cloud Snapshots List */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'سجل اللقطات السحابية المحفوظة' : 'Saved Cloud Restore Points'}</h3>
            <p>
              {isAr
                ? 'يمكنك استعادة أي نسخة سابقة بنقرة واحدة مع الحفاظ على أمان الموقع.'
                : 'Restore any previously archived configuration in a single click.'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-skeleton-list">
            <div className="admin-skeleton-bar"></div>
            <div className="admin-skeleton-bar"></div>
          </div>
        ) : backups.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-history"></i>
            <p>
              {isAr
                ? 'لا توجد لقطات نسخ احتياطي سحابية بعد. أنشئ أول لقطة من النموذج أعلاه.'
                : 'No cloud snapshots yet. Create your first restore point above.'}
            </p>
          </div>
        ) : (
          <div className="admin-grouped-list">
            {backups.map((snap) => (
              <div key={snap.id} className="admin-grouped-row">
                <div className="admin-row-info">
                  <strong>{snap.label}</strong>
                  {snap.note && <p className="admin-row-sub">{snap.note}</p>}
                  <span className="admin-row-meta" dir="ltr">
                    {new Date(snap.createdAtIso).toLocaleString()} · Palette: {snap.theme?.paletteId || 'default'}
                  </span>
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn-secondary admin-btn-sm"
                    onClick={() => handleRestoreSnapshot(snap)}
                    disabled={busyAction !== null}
                  >
                    <i className="fas fa-history"></i>
                    <span>{isAr ? 'استعادة' : 'Restore'}</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger admin-btn-sm"
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    disabled={busyAction !== null}
                    aria-label="Delete snapshot"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

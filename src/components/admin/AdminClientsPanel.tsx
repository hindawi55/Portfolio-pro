import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import {
  ClientProofPhoto,
  ClientSession,
  sampleClientSessions,
} from '../../data/clientPortalData';
import { ProofFeedbackRecord } from '../../types/cms';
import { getPhotoUrl } from '../../data/portfolioData';
import {
  deleteClientSession,
  fetchProofFeedback,
  listClientSessions,
  saveClientSession,
} from '../../services/cmsService';
import { extractJpegExif, optimizePhotoFile } from '../../utils/mediaExif';
import { copyTextSafely } from '../../utils/errorDiagnostics';

interface AdminClientsPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const AdminClientsPanel: React.FC<AdminClientsPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ClientSession | null>(null);
  const [inspectingPin, setInspectingPin] = useState<string | null>(null);
  const [feedbackRows, setFeedbackRows] = useState<ProofFeedbackRecord[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = currentLang === 'ar';

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listClientSessions();
      setSessions(list);
    } catch {
      onShowToast(
        isAr ? 'تعذّر تحميل جلسات العملاء السحابية.' : 'Failed to load cloud client sessions.'
      );
    } finally {
      setLoading(false);
    }
  }, [isAr, onShowToast]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleSeedDemos = async () => {
    setSaving(true);
    try {
      await Promise.all(sampleClientSessions.map((s) => saveClientSession(s)));
      await loadSessions();
      onShowToast(
        isAr
          ? 'تم تفعيل وحفظ الجلسات التجريبية (2026 / 7788) في السحابة بنجاح!'
          : 'Demo client sessions (2026 / 7788) synced to Cloud Firestore!'
      );
    } catch {
      onShowToast(isAr ? 'تعذّر مزامنة الجلسات التجريبية.' : 'Failed to sync demo sessions.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setEditing({
      pin: randomPin,
      clientNameAr: 'اسم الجهة أو العميل',
      clientNameEn: 'Client / Organization Name',
      projectTitleAr: 'مشروع توثيق ميداني جديد',
      projectTitleEn: 'New Documentary Mission Coverage',
      date: new Date().getFullYear().toString(),
      statusAr: 'جاهز للاختيار والاعتماد النهائي',
      statusEn: 'Ready for Review & Proofing',
      expiryDate: `${new Date().getFullYear() + 1}-12-31`,
      totalPhotos: 0,
      packageSize: '24MP Original Masters',
      downloadUrl: '',
      photos: [],
    });
  };

  const handleUploadProofPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const [exif, optimized] = await Promise.all([
        extractJpegExif(file),
        optimizePhotoFile(file, 1080, 0.78),
      ]);
      const nextIdx = editing.photos.length + 1;
      const newPhoto: ClientProofPhoto = {
        id: `PRF-${editing.pin}-${String(nextIdx).padStart(3, '0')}`,
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
      setEditing({
        ...editing,
        photos: [...editing.photos, newPhoto],
        totalPhotos: editing.photos.length + 1,
      });
      onShowToast(
        isAr
          ? `تمت إضافة صورة الإثبات (${optimized.sizeKb}KB WebP) مع بيانات EXIF!`
          : `Proof photo added (${optimized.sizeKb}KB WebP) with EXIF metadata!`
      );
    } catch {
      onShowToast(isAr ? 'تعذّرت معالجة الصورة.' : 'Failed to process proof photo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  const handleAddProofUrl = () => {
    if (!editing || !newPhotoUrl.trim()) return;
    const nextIdx = editing.photos.length + 1;
    const newPhoto: ClientProofPhoto = {
      id: `PRF-${editing.pin}-${String(nextIdx).padStart(3, '0')}`,
      file: newPhotoUrl.trim(),
      folder: '/images/series-01',
      titleAr: `صورة رقم ${nextIdx}`,
      titleEn: `Proof Frame #${nextIdx}`,
      resolution: 'High-Res Master',
      filesize: 'CDN Asset',
      camera: 'Sony Alpha 7 IV',
      lens: 'FE 35mm f/1.4 GM',
      settings: '1/640s · f/2.2 · ISO 200',
    };
    setEditing({
      ...editing,
      photos: [...editing.photos, newPhoto],
      totalPhotos: editing.photos.length + 1,
    });
    setNewPhotoUrl('');
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await saveClientSession({ ...editing, totalPhotos: editing.photos.length });
      await loadSessions();
      setEditing(null);
      onShowToast(
        isAr
          ? `تم حفظ وتفعيل جلسة العميل برمز PIN #${editing.pin} سحابياً!`
          : `Client session PIN #${editing.pin} published to Cloud!`
      );
    } catch {
      onShowToast(
        isAr
          ? 'تعذّر حفظ الجلسة (تحقق من صحة رمز PIN وحجم الصور).'
          : 'Failed to save session (verify PIN format and document size).'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (pin: string) => {
    setSaving(true);
    try {
      await deleteClientSession(pin);
      setSessions((prev) => prev.filter((s) => s.pin !== pin));
      if (inspectingPin === pin) setInspectingPin(null);
      onShowToast(isAr ? 'تم حذف جلسة العميل.' : 'Client session deleted.');
    } catch {
      onShowToast(isAr ? 'تعذّر حذف الجلسة.' : 'Failed to delete client session.');
    } finally {
      setSaving(false);
    }
  };

  const handleInspectFeedback = async (pin: string) => {
    if (inspectingPin === pin) {
      setInspectingPin(null);
      return;
    }
    setInspectingPin(pin);
    setLoadingFeedback(true);
    try {
      const rows = await fetchProofFeedback(pin);
      setFeedbackRows(rows);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleCopySessionLink = async (pin: string) => {
    const link = `${window.location.origin}${window.location.pathname}#portal?pin=${pin}`;
    const copied = await copyTextSafely('AdminClientsPanel', link);
    onShowToast(
      copied
        ? isAr
          ? `تم نسخ رابط بوابة العميل السري (#${pin})!`
          : `Copied secret portal link for PIN #${pin}!`
        : link
    );
  };

  if (editing) {
    return (
      <form onSubmit={handleSaveSession} className="admin-panel-stack">
        <div className="admin-editor-topbar">
          <button
            type="button"
            className="admin-btn-ghost admin-btn-sm"
            onClick={() => setEditing(null)}
          >
            <i className={`fas ${isAr ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
            <span>{isAr ? 'العودة لقائمة الجلسات' : 'Back to Sessions'}</span>
          </button>
          <strong>PIN #{editing.pin}</strong>
        </div>

        <section className="admin-card-group">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>{isAr ? 'رمز المرور السري (PIN — حروف أو أرقام) *' : 'Access PIN *'}</label>
              <input
                type="text"
                dir="ltr"
                required
                minLength={3}
                maxLength={32}
                value={editing.pin}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    pin: e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''),
                  })
                }
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'تاريخ الصلاحية' : 'Expiry Date'}</label>
              <input
                type="text"
                dir="ltr"
                value={editing.expiryDate}
                onChange={(e) => setEditing({ ...editing, expiryDate: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'اسم العميل / المنظمة (عربي) *' : 'Client Name (AR) *'}</label>
              <input
                type="text"
                required
                value={editing.clientNameAr}
                onChange={(e) => setEditing({ ...editing, clientNameAr: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'اسم العميل / المنظمة (إنجليزي) *' : 'Client Name (EN) *'}</label>
              <input
                type="text"
                dir="ltr"
                required
                value={editing.clientNameEn}
                onChange={(e) => setEditing({ ...editing, clientNameEn: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'عنوان المشروع (عربي) *' : 'Project Title (AR) *'}</label>
              <input
                type="text"
                required
                value={editing.projectTitleAr}
                onChange={(e) => setEditing({ ...editing, projectTitleAr: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'عنوان المشروع (إنجليزي) *' : 'Project Title (EN) *'}</label>
              <input
                type="text"
                dir="ltr"
                required
                value={editing.projectTitleEn}
                onChange={(e) => setEditing({ ...editing, projectTitleEn: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'حجم الحزمة / الصيغة' : 'Package Size'}</label>
              <input
                type="text"
                dir="ltr"
                value={editing.packageSize}
                onChange={(e) => setEditing({ ...editing, packageSize: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>{isAr ? 'رابط تحميل الأرشيف الكامل (اختياري ZIP/Drive)' : 'Master Download Archive URL (Optional)'}</label>
              <input
                type="url"
                dir="ltr"
                placeholder="https://drive.google.com/..."
                value={editing.downloadUrl || ''}
                onChange={(e) => setEditing({ ...editing, downloadUrl: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="admin-card-group">
          <div className="admin-card-group-head">
            <div>
              <h3>
                {isAr
                  ? `صور جلسة الاعتماد (${editing.photos.length})`
                  : `Session Proofing Photos (${editing.photos.length})`}
              </h3>
              <p>
                {isAr
                  ? 'ارفع صور الإثبات للعميل مباشرة أو أضف روابط CDN عالية الجودة.'
                  : 'Upload client proof frames directly or attach high-res CDN URLs.'}
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
              <span>{isAr ? 'رفع صورة إثبات' : 'Upload Proof Frame'}</span>
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
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUploadProofPhoto}
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
                          setEditing({ ...editing, photos: next });
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
                          setEditing({ ...editing, photos: next });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-btn-danger admin-btn-sm"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        photos: editing.photos.filter((_, i) => i !== idx),
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
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            <span>{isAr ? 'حفظ ونشر جلسة العميل سحابياً' : 'Publish Client Session'}</span>
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
            <h3>{isAr ? 'إدارة بوابة العملاء والاعتماد الحي (Client Proofing CRM)' : 'Live Client Proofing CRM'}</h3>
            <p>
              {isAr
                ? 'أنشئ جلسات تسليم خاصة برموز PIN مشفرة وراجع اختيارات العملاء وملاحظات التعديل (Retouch Notes) لحظياً.'
                : 'Create PIN-protected client delivery galleries and review client favorites & retouch notes in real time.'}
            </p>
          </div>
          <div className="admin-row-actions">
            {sessions.length === 0 && (
              <button
                type="button"
                className="admin-btn-secondary admin-btn-sm"
                onClick={() => void handleSeedDemos()}
                disabled={saving}
              >
                <i className="fas fa-magic"></i>
                <span>{isAr ? 'تفعيل جلسات العرض (2026)' : 'Sync Demo Sessions'}</span>
              </button>
            )}
            <button type="button" className="admin-btn-primary admin-btn-sm" onClick={handleCreateNew}>
              <i className="fas fa-plus"></i>
              <span>{isAr ? 'جلسة عميل جديدة' : 'New Client Session'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-skeleton-list">
            <div className="admin-skeleton-bar"></div>
            <div className="admin-skeleton-bar"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-user-shield"></i>
            <p>
              {isAr
                ? 'لا توجد جلسات عملاء محفوظة في السحابة بعد. أنشئ جلسة جديدة أو فعّل جلسات العرض التجريبية.'
                : 'No cloud client sessions yet. Create a new session or sync the sample demo sessions.'}
            </p>
          </div>
        ) : (
          <div className="admin-bilingual-list">
            {sessions.map((session) => {
              const isInspecting = inspectingPin === session.pin;
              return (
                <div key={session.pin} className="admin-bilingual-row">
                  <div className="admin-bilingual-row-head">
                    <div className="admin-row-info">
                      <div className="admin-row-info-inline">
                        <span className="admin-order-index">#{session.pin}</span>
                        <strong>{isAr ? session.clientNameAr : session.clientNameEn}</strong>
                      </div>
                      <span className="admin-row-meta">
                        {isAr ? session.projectTitleAr : session.projectTitleEn} · {session.photos.length}{' '}
                        {isAr ? 'صورة' : 'photos'} · {session.expiryDate}
                      </span>
                    </div>

                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => void handleCopySessionLink(session.pin)}
                        title={isAr ? 'نسخ الرابط السري المباشر' : 'Copy Secret Link'}
                      >
                        <i className="fas fa-link"></i>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-ghost admin-btn-sm"
                        onClick={() => void handleInspectFeedback(session.pin)}
                      >
                        <i className="fas fa-heart"></i>
                        <span>{isAr ? 'اختيارات العميل' : 'Client Picks'}</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => setEditing(session)}
                      >
                        <i className="fas fa-edit"></i>
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-danger admin-btn-sm"
                        onClick={() => void handleDeleteSession(session.pin)}
                        disabled={saving}
                        aria-label="Delete session"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>

                  {isInspecting && (
                    <div className="admin-lead-editor">
                      {loadingFeedback ? (
                        <div className="admin-skeleton-bar"></div>
                      ) : feedbackRows.length === 0 ? (
                        <p className="admin-row-sub">
                          {isAr
                            ? 'لم يقم العميل بتحديد صور مفضلة أو كتابة ملاحظات تعديل بعد في هذه الجلسة.'
                            : 'No client favorites or retouch notes submitted for this session yet.'}
                        </p>
                      ) : (
                        <div className="admin-grouped-list">
                          {feedbackRows.map((fb) => (
                            <div key={fb.photoId} className="admin-grouped-row">
                              <div className="admin-row-info">
                                <div className="admin-row-info-inline">
                                  <strong>{fb.photoId}</strong>
                                  {fb.isFavorite && (
                                    <span className="admin-status-badge status-booked">
                                      <i className="fas fa-heart"></i>{' '}
                                      {isAr ? 'مفضلة معتمدة' : 'Approved Favorite'}
                                    </span>
                                  )}
                                </div>
                                {fb.note && <p className="admin-row-sub">💬 {fb.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../../types';
import { ClientSession, sampleClientSessions } from '../../data/clientPortalData';
import { ProofFeedbackRecord } from '../../types/cms';
import {
  deleteClientSession,
  fetchProofFeedback,
  listClientSessions,
  saveClientSession,
} from '../../services/cmsService';
import { copyTextSafely } from '../../utils/errorDiagnostics';
import { AdminClientSessionEditor } from './AdminClientSessionEditor';

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
      <AdminClientSessionEditor
        currentLang={currentLang}
        editing={editing}
        saving={saving}
        onChange={setEditing}
        onCancel={() => setEditing(null)}
        onSave={handleSaveSession}
        onShowToast={onShowToast}
      />
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

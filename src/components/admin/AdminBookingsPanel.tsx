import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Language } from '../../types';
import { BookingInquiryRecord, BookingStatus } from '../../types/cms';
import {
  deleteBookingInquiry,
  listBookingInquiries,
  updateBookingInquiryStatus,
} from '../../services/cmsService';

interface AdminBookingsPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

const STATUS_META: Record<
  BookingStatus,
  { ar: string; en: string; badgeClass: string; icon: string }
> = {
  new: { ar: 'جديد', en: 'New Lead', badgeClass: 'status-new', icon: 'fa-sparkles' },
  reviewed: { ar: 'قيد المراجعة', en: 'Reviewed', badgeClass: 'status-reviewed', icon: 'fa-eye' },
  booked: { ar: 'تم الحجز', en: 'Booked', badgeClass: 'status-booked', icon: 'fa-check-circle' },
  archived: { ar: 'مؤرشف', en: 'Archived', badgeClass: 'status-archived', icon: 'fa-archive' },
};

export const AdminBookingsPanel: React.FC<AdminBookingsPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const [inquiries, setInquiries] = useState<BookingInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | BookingStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<BookingStatus>('new');
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const isAr = currentLang === 'ar';

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const records = await listBookingInquiries();
      setInquiries(records);
    } catch {
      onShowToast(
        isAr ? 'تعذّر تحميل صندوق طلبات الحجز.' : 'Failed to load booking inquiries inbox.'
      );
    } finally {
      setLoading(false);
    }
  }, [isAr, onShowToast]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const counts = useMemo(() => {
    return inquiries.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { new: 0, reviewed: 0, booked: 0, archived: 0 } as Record<BookingStatus, number>
    );
  }, [inquiries]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return inquiries;
    return inquiries.filter((i) => i.status === filterStatus);
  }, [inquiries, filterStatus]);

  const openEditor = (item: BookingInquiryRecord) => {
    if (selectedId === item.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(item.id);
    setStatusDraft(item.status);
    setNotesDraft(item.adminNotes || '');
  };

  const handleSaveUpdate = async (item: BookingInquiryRecord) => {
    setSaving(true);
    try {
      await updateBookingInquiryStatus(item, statusDraft, notesDraft);
      setInquiries((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, status: statusDraft, adminNotes: notesDraft } : row
        )
      );
      onShowToast(
        isAr ? 'تم تحديث حالة الطلب والملاحظات بنجاح.' : 'Booking status and notes saved.'
      );
    } catch {
      onShowToast(isAr ? 'تعذّر حفظ التحديث.' : 'Failed to update booking inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteBookingInquiry(id);
      setInquiries((prev) => prev.filter((row) => row.id !== id));
      if (selectedId === id) setSelectedId(null);
      onShowToast(isAr ? 'تم حذف الطلب من الصندوق.' : 'Booking inquiry deleted.');
    } catch {
      onShowToast(isAr ? 'تعذّر حذف الطلب.' : 'Failed to delete inquiry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel-stack">
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'صندوق طلبات الحجز والعملاء (CRM Inbox)' : 'Booking Inquiries CRM Inbox'}</h3>
            <p>
              {isAr
                ? 'كل طلب يُرسل عبر نموذج الحجز بالموقع يُحفظ هنا تلقائياً بأمان لمتابعة الحالات والرد السريع.'
                : 'Every mission inquiry submitted through the booking form is archived securely here for CRM follow-up.'}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn-ghost admin-btn-sm"
            onClick={() => void loadInbox()}
            disabled={loading}
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            <span>{isAr ? 'تحديث الصندوق' : 'Refresh'}</span>
          </button>
        </div>

        {/* Status Filter Strip */}
        <div className="admin-pill-strip">
          <button
            type="button"
            className={`admin-sub-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            {isAr ? `الكل (${inquiries.length})` : `All (${inquiries.length})`}
          </button>
          {(['new', 'reviewed', 'booked', 'archived'] as BookingStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              className={`admin-sub-pill ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {isAr ? STATUS_META[st].ar : STATUS_META[st].en} ({counts[st]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-skeleton-list">
            <div className="admin-skeleton-bar"></div>
            <div className="admin-skeleton-bar"></div>
            <div className="admin-skeleton-bar"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-inbox"></i>
            <p>
              {isAr
                ? 'لا توجد طلبات حجز مطابقة حالياً. أي طلب جديد من نموذج التواصل سيظهر هنا فوراً.'
                : 'No booking inquiries in this view yet. New submissions from the website appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="admin-bilingual-list">
            {filtered.map((item) => {
              const meta = STATUS_META[item.status] || STATUS_META.new;
              const isOpen = selectedId === item.id;
              const cleanPhone = (item.phone || '').replace(/[^\d]/g, '');

              return (
                <div key={item.id} className="admin-bilingual-row">
                  <div className="admin-bilingual-row-head">
                    <div className="admin-row-info">
                      <div className="admin-row-info-inline">
                        <strong>{item.name}</strong>
                        <span className={`admin-status-badge ${meta.badgeClass}`}>
                          {isAr ? meta.ar : meta.en}
                        </span>
                      </div>
                      <span className="admin-row-meta">
                        {item.serviceType}
                        {item.budget ? ` · ${item.budget}` : ''}
                        {item.eventDate ? ` · ${item.eventDate}` : ''}
                        {' · '}
                        {new Date(item.createdAtIso).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>

                    <div className="admin-row-actions">
                      <a
                        href={`mailto:${item.email}`}
                        className="admin-icon-btn"
                        title={item.email}
                      >
                        <i className="fas fa-envelope"></i>
                      </a>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-icon-btn"
                          title={item.phone}
                        >
                          <i className="fab fa-whatsapp"></i>
                        </a>
                      )}
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => openEditor(item)}
                      >
                        <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-sliders-h'}`}></i>
                        <span>{isOpen ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إدارة الطلب' : 'Manage')}</span>
                      </button>
                    </div>
                  </div>

                  <p className="admin-row-sub">{item.message}</p>

                  <div className="admin-lead-meta-row">
                    <span>
                      <i className="fas fa-at"></i> {item.email}
                    </span>
                    {item.phone && (
                      <span dir="ltr">
                        <i className="fas fa-phone"></i> {item.phone}
                      </span>
                    )}
                    {item.location && (
                      <span>
                        <i className="fas fa-map-marker-alt"></i> {item.location}
                      </span>
                    )}
                  </div>

                  {isOpen && (
                    <div className="admin-lead-editor">
                      <div className="admin-form-grid">
                        <div className="admin-field">
                          <label>{isAr ? 'حالة الطلب' : 'Pipeline Status'}</label>
                          <select
                            value={statusDraft}
                            onChange={(e) => setStatusDraft(e.target.value as BookingStatus)}
                          >
                            <option value="new">{isAr ? 'جديد' : 'New Lead'}</option>
                            <option value="reviewed">{isAr ? 'قيد المراجعة' : 'Reviewed'}</option>
                            <option value="booked">{isAr ? 'تم الحجز والاتفاق' : 'Booked'}</option>
                            <option value="archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
                          </select>
                        </div>

                        <div className="admin-field admin-field-full">
                          <label>{isAr ? 'ملاحظات المتابعة الداخلية (خاصة بالمدير)' : 'Internal Admin Notes'}</label>
                          <textarea
                            rows={3}
                            placeholder={
                              isAr
                                ? 'سجّل تفاصيل التسعير أو موعد الاجتماع أو ملاحظات التعاقد...'
                                : 'Record pricing quotes, follow-up dates, or contract notes...'
                            }
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="admin-lead-editor-actions">
                        <button
                          type="button"
                          className="admin-btn-danger admin-btn-sm"
                          onClick={() => void handleDelete(item.id)}
                          disabled={saving}
                        >
                          <i className="fas fa-trash-alt"></i>
                          <span>{isAr ? 'حذف الطلب' : 'Delete'}</span>
                        </button>
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-sm"
                          onClick={() => void handleSaveUpdate(item)}
                          disabled={saving}
                        >
                          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                          <span>{isAr ? 'حفظ الحالة والملاحظات' : 'Save Update'}</span>
                        </button>
                      </div>
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

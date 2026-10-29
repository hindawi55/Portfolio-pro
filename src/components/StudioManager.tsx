import React, { useState } from 'react';
import { Language } from '../types';
import { sampleClientSessions, ClientSession } from '../data/clientPortalData';
import { getPhotoUrl } from '../data/portfolioData';

interface StudioManagerProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
  onOpenClientSession: (session: ClientSession) => void;
  onClose: () => void;
}

export const StudioManager: React.FC<StudioManagerProps> = ({
  currentLang,
  onShowToast,
  onOpenClientSession,
  onClose,
}) => {
  const [selectedSession, setSelectedSession] = useState<ClientSession>(sampleClientSessions[0]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const handleCopyClientLink = (session: ClientSession) => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const clientRestrictedLink = `${origin}${path}#portal?pin=${session.pin}&access=client_restricted`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clientRestrictedLink).then(
        () => {
          setCopiedPin(session.pin);
          setTimeout(() => setCopiedPin(null), 3500);
          onShowToast(
            currentLang === 'ar'
              ? `تم توليد ونسخ الرابط السري المقيد لـ (${session.clientNameAr}) بنجاح! يمكن إرساله للعميل الآن 🔗`
              : `Restricted 1-click client link generated & copied for ${session.clientNameEn}! 🔗`
          );
        },
        () => {
          onShowToast(clientRestrictedLink);
        }
      );
    } else {
      onShowToast(clientRestrictedLink);
    }
  };

  return (
    <div className="studio-manager-overlay" role="dialog" aria-modal="true">
      <div className="studio-manager-dialog">
        {/* Studio Top Bar */}
        <div className="studio-topbar">
          <div className="studio-branding">
            <div className="studio-brand-icon">
              <i className="fas fa-sliders-h"></i>
            </div>
            <div className="studio-brand-info">
              <div className="studio-tag-row">
                <span className="studio-tag-badge">
                  <i className="fas fa-lock"></i> {currentLang === 'ar' ? 'لوحة تحكم استوديو المصورة المطور' : 'Lead Photographer Studio Dispatch'}
                </span>
                <span className="studio-tag-env">/studio mode</span>
              </div>
              <h2 className="studio-title">
                {currentLang === 'ar' ? 'إدارة وتسليم معارض العملاء والمنظمات' : 'Client Gallery Dispatch & Deliveries Hub'}
              </h2>
            </div>
          </div>

          <div className="studio-top-actions">
            <button
              type="button"
              className="studio-close-btn"
              onClick={onClose}
              title="Close Studio Manager"
            >
              <i className="fas fa-times"></i>
              <span>{currentLang === 'ar' ? 'العودة للموقع' : 'Exit Studio'}</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="studio-workspace-grid">
          {/* Left Column: Active Client Sessions List */}
          <div className="studio-sessions-sidebar">
            <div className="sidebar-header">
              <h3>
                <i className="fas fa-folder-open"></i>
                <span>{currentLang === 'ar' ? 'الجلسات والمهام المعتمدة' : 'Active Client Sessions'}</span>
              </h3>
              <span className="sessions-count-pill">{sampleClientSessions.length}</span>
            </div>

            <div className="sessions-list">
              {sampleClientSessions.map((session) => {
                const isSelected = selectedSession.pin === session.pin;
                return (
                  <div
                    key={session.pin}
                    className={`studio-session-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="session-card-top">
                      <span className="session-pin-code">PIN: #{session.pin}</span>
                      <span className="session-status-chip">
                        {currentLang === 'ar' ? session.statusAr : session.statusEn}
                      </span>
                    </div>

                    <h4 className="session-client-title">
                      {currentLang === 'ar' ? session.clientNameAr : session.clientNameEn}
                    </h4>
                    <p className="session-project-sub">
                      {currentLang === 'ar' ? session.projectTitleAr : session.projectTitleEn}
                    </p>

                    <div className="session-card-meta">
                      <span>
                        <i className="fas fa-images"></i> {session.photos.length} {currentLang === 'ar' ? 'صور' : 'photos'}
                      </span>
                      <span>
                        <i className="fas fa-database"></i> {session.packageSize}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Session Curation & Link Dispatcher */}
          <div className="studio-delivery-inspect">
            {/* Header Card for Selected Session */}
            <div className="delivery-banner-card">
              <div className="delivery-banner-info">
                <span className="delivery-active-pin">
                  <i className="fas fa-shield-alt"></i> #{selectedSession.pin}
                </span>
                <h3>{currentLang === 'ar' ? selectedSession.clientNameAr : selectedSession.clientNameEn}</h3>
                <p className="delivery-project-name">
                  {currentLang === 'ar' ? selectedSession.projectTitleAr : selectedSession.projectTitleEn}
                </p>

                <div className="delivery-specs-row">
                  <span className="spec-item">
                    <i className="far fa-calendar-alt"></i> {selectedSession.date}
                  </span>
                  <span className="spec-item">
                    <i className="fas fa-clock"></i> {currentLang === 'ar' ? 'صلاحية الرابط حتى:' : 'Valid until:'} {selectedSession.expiryDate}
                  </span>
                  <span className="spec-item">
                    <i className="fas fa-box-open"></i> {selectedSession.packageSize}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Developer / Photographer */}
              <div className="delivery-action-panel">
                <button
                  type="button"
                  className={`btn ${copiedPin === selectedSession.pin ? 'btn-success' : 'btn-primary'} studio-action-main`}
                  onClick={() => handleCopyClientLink(selectedSession)}
                >
                  <i className={`fas ${copiedPin === selectedSession.pin ? 'fa-check-circle' : 'fa-link'}`}></i>
                  <span>
                    {copiedPin === selectedSession.pin
                      ? (currentLang === 'ar' ? 'تم نسخ الرابط المقيد!' : 'Link Copied!')
                      : (currentLang === 'ar' ? 'توليد ونسخ رابط العميل المقيد' : 'Generate & Copy Client Link')}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline studio-action-secondary"
                  onClick={() => onOpenClientSession(selectedSession)}
                >
                  <i className="fas fa-eye"></i>
                  <span>{currentLang === 'ar' ? 'معاينة تجربة العميل' : 'Simulate Client View'}</span>
                </button>
              </div>
            </div>

            {/* Client Permission Shield Notice */}
            <div className="studio-permissions-shield">
              <div className="shield-icon">
                <i className="fas fa-user-lock"></i>
              </div>
              <div className="shield-text">
                <h5>
                  {currentLang === 'ar'
                    ? 'نظام أمان الصلاحيات المحدودة (Restricted Client Access):'
                    : 'Restricted Client Security Scope:'}
                </h5>
                <p>
                  {currentLang === 'ar'
                    ? 'الرابط المولد يفتح حصرياً معرض هذه المنظمة بصلاحيات الاعتماد، وإضافة ملاحظات التعديل، وتحميل الدقة العالية، دون أي إمكانية للوصول لبيانات الاستوديو أو الجلسات الأخرى.'
                    : 'The generated client URL grants access exclusively to this package with proofing, favoriting, retouch notes, and downloads, without exposing other missions.'}
                </p>
              </div>
            </div>

            {/* Photos Deliverables Inspection Grid */}
            <div className="studio-photos-grid-header">
              <h4>
                <i className="fas fa-photo-video"></i>
                <span>{currentLang === 'ar' ? 'الأصول والملفات الجاهزة للتسليم' : 'Deliverable Master Assets'}</span>
              </h4>
              <span className="photos-grid-count">
                {selectedSession.photos.length} {currentLang === 'ar' ? 'أصل رقمي بدقة 24MP' : '24MP Master Files'}
              </span>
            </div>

            <div className="studio-assets-grid">
              {selectedSession.photos.map((photo) => (
                <div key={photo.id} className="studio-asset-card">
                  <div className="asset-thumb-wrap">
                    <img
                      src={getPhotoUrl(photo.folder, photo.file)}
                      alt={photo.titleEn}
                      className="asset-thumb-img"
                      loading="lazy"
                    />
                    <span className="asset-id-tag">{photo.id}</span>
                  </div>
                  <div className="asset-meta-info">
                    <h5 className="asset-name">
                      {currentLang === 'ar' ? photo.titleAr : photo.titleEn}
                    </h5>
                    <div className="asset-specs">
                      <span>{photo.resolution}</span>
                      <span>·</span>
                      <span>{photo.filesize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

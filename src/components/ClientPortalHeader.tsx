import React from 'react';
import { Language } from '../types';
import { ClientSession } from '../data/clientPortalData';

interface ClientPortalHeaderProps {
  currentLang: Language;
  activeSession: ClientSession;
  selectedCount?: number;
  onToggleLang: () => void;
  onToggleIsolated?: () => void;
  isIsolated?: boolean;
  onLogout: () => void;
}

export const ClientPortalHeader: React.FC<ClientPortalHeaderProps> = ({
  currentLang,
  activeSession,
  selectedCount = 0,
  onToggleLang,
  onToggleIsolated,
  isIsolated = true,
  onLogout,
}) => {
  const clientName = currentLang === 'ar' ? activeSession.clientNameAr : activeSession.clientNameEn;
  const projectTitle = currentLang === 'ar' ? activeSession.projectTitleAr : activeSession.projectTitleEn;

  return (
    <header className="client-suite-header">
      <div className="client-header-container">
        {/* Brand & Client Identification */}
        <div className="client-header-brand-group">
          <div className="client-brand-logo">
            <span className="brand-main">ENAAM</span>
            <span className="brand-accent">OSMAN</span>
            <span className="client-suite-pill">
              <i className="fas fa-shield-alt"></i>
              <span>{currentLang === 'ar' ? 'مساحة تسليم العملاء' : 'VIP Client Suite'}</span>
            </span>
          </div>

          <div className="client-session-tag" title={projectTitle}>
            <span className="session-pin-chip">#{activeSession.pin}</span>
            <span className="session-name-chip">{clientName}</span>
          </div>
        </div>

        {/* Live Proofing Indicators */}
        <div className="client-header-status-capsule">
          <div className="status-item">
            <i className="fas fa-star text-gold"></i>
            <span>
              {selectedCount}{' '}
              {currentLang === 'ar' ? 'صورة مختارة للاعتماد' : 'Selected Proofs'}
            </span>
          </div>
          <span className="status-separator">|</span>
          <div className="status-item">
            <i className="fas fa-check-circle text-green"></i>
            <span>{activeSession.packageSize}</span>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="client-header-actions">
          {/* Language Toggle */}
          <button
            type="button"
            className="client-action-btn lang-btn"
            onClick={onToggleLang}
            title={currentLang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <i className="fas fa-globe"></i>
            <span>{currentLang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Toggle Public View / Isolated */}
          {onToggleIsolated && (
            <button
              type="button"
              className="client-action-btn mode-btn"
              onClick={onToggleIsolated}
              title={
                isIsolated
                  ? currentLang === 'ar' ? 'تصفح الموقع العام' : 'View Public Portfolio'
                  : currentLang === 'ar' ? 'التركيز على التسليم' : 'Focus Client Suite'
              }
            >
              <i className={`fas ${isIsolated ? 'fa-external-link-alt' : 'fa-compress-arrows-alt'}`}></i>
              <span className="action-label-desktop">
                {isIsolated
                  ? currentLang === 'ar' ? 'الموقع العام' : 'Public Site'
                  : currentLang === 'ar' ? 'عزل المساحة' : 'Focus Mode'}
              </span>
            </button>
          )}

          {/* Secure Lock & Exit */}
          <button
            type="button"
            className="client-action-btn logout-btn"
            onClick={onLogout}
            title={currentLang === 'ar' ? 'قفل الجلسة والخروج الآمن' : 'Lock & Exit'}
          >
            <i className="fas fa-lock"></i>
            <span className="action-label-desktop">
              {currentLang === 'ar' ? 'قفل الجلسة' : 'Lock & Exit'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

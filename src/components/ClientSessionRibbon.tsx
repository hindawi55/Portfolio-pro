import React from 'react';
import { Language } from '../types';
import { ClientSession } from '../data/clientPortalData';
import { useSiteCMS } from '../context/SiteCMSContext';

interface ClientSessionRibbonProps {
  currentLang: Language;
  session: ClientSession;
  isIsolated: boolean;
  onToggleIsolated: () => void;
  onLockAndExit: () => void;
}

export const ClientSessionRibbon: React.FC<ClientSessionRibbonProps> = ({
  currentLang,
  session,
  isIsolated,
  onToggleIsolated,
  onLockAndExit,
}) => {
  const { getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  return (
    <div className="client-active-ribbon">
      <div className="ribbon-inner">
        <div className="ribbon-client-info">
          <span className="ribbon-pulse"></span>
          <i className="fas fa-user-shield"></i>
          <span className="ribbon-title">
            {currentLang === 'ar' ? 'جلسة عميل نشطة:' : 'Active Client Session:'}{' '}
            <strong>{currentLang === 'ar' ? session.clientNameAr : session.clientNameEn}</strong>
          </span>
        </div>

        <div className="ribbon-actions">
          <button
            type="button"
            className="ribbon-btn ribbon-btn-mode"
            onClick={onToggleIsolated}
          >
            <i className={`fas ${isIsolated ? 'fa-globe' : 'fa-compress-arrows-alt'}`}></i>
            <span>{isIsolated ? t.portal_switch_public : t.portal_switch_isolated}</span>
          </button>

          <button type="button" className="ribbon-btn ribbon-btn-logout" onClick={onLockAndExit}>
            <i className="fas fa-lock"></i>
            <span>{t.portal_lock_and_exit}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';
import { FALLBACK_IMAGE_URL } from '../utils/assets';
import { copyTextSafely, safeRun } from '../utils/errorDiagnostics';
import { CVManifestoWing } from './cv/CVManifestoWing';
import {
  CVExhibitionsWing,
  CVAwardsWing,
  CVGearWing,
  CVPartnersWing,
} from './cv/CVTimelineWings';

interface CVDossierModalProps {
  currentLang: Language;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

type CVWing = 'manifesto' | 'exhibitions' | 'awards' | 'gear' | 'partners';

export const CVDossierModal: React.FC<CVDossierModalProps> = ({
  currentLang,
  onClose,
  onShowToast,
}) => {
  const [activeWing, setActiveWing] = useState<CVWing>('manifesto');
  const { cvDossier, getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  const handlePrint = () => {
    const ok = safeRun(
      'CVDossierModal',
      'printCVDocument',
      () => {
        window.print();
        return true;
      },
      false,
      'warning'
    );
    if (!ok) {
      onShowToast(
        currentLang === 'ar'
          ? 'تعذّر فتح نافذة الطباعة في هذا المتصفح.'
          : 'Unable to open print dialog in this browser.'
      );
    }
  };

  const handleCopyBio = async () => {
    const bioText =
      currentLang === 'ar' ? cvDossier.artistStatementAr : cvDossier.artistStatementEn;
    const copied = await copyTextSafely('CVDossierModal', bioText);
    onShowToast(
      copied
        ? currentLang === 'ar'
          ? 'تم نسخ البيان الفني بنجاح إلى الحافظة.'
          : 'Artist statement copied to clipboard.'
        : currentLang === 'ar'
        ? 'تعذّر النسخ التلقائي في هذا المتصفح، يمكنك تحديد النص ونسخه يدوياً.'
        : 'Automatic copy unavailable in this browser; please select and copy manually.'
    );
  };

  const wings: { id: CVWing; icon: string; title: string; num: string }[] = [
    { id: 'manifesto', icon: 'fa-feather-alt', title: t.cv_tab_statement, num: '01' },
    { id: 'exhibitions', icon: 'fa-landmark', title: t.cv_tab_exhibitions, num: '02' },
    { id: 'awards', icon: 'fa-award', title: t.cv_tab_awards, num: '03' },
    { id: 'gear', icon: 'fa-camera', title: t.cv_tab_gear, num: '04' },
    { id: 'partners', icon: 'fa-handshake', title: t.cv_tab_clients, num: '05' },
  ];

  return (
    <div className="dossier-modal-overlay" role="dialog" aria-modal="true">
      <div className="dossier-modal-dialog">
        {/* Header Bar with Safe Distance Architecture */}
        <div className="dossier-modal-header">
          <div className="dossier-header-profile">
            <div className="dossier-avatar">
              <img
                src={FALLBACK_IMAGE_URL}
                alt="Enaam Ali Osman"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE_URL;
                }}
              />
              <span className="dossier-status-dot" title="Verified Practitioner"></span>
            </div>
            <div className="dossier-profile-text">
              <div className="dossier-badge-row">
                <span className="dossier-pill-gold">
                  <i className="fas fa-certificate"></i>{' '}
                  {currentLang === 'ar' ? 'سيرة معتمدة رسمياً' : 'Official Verified Dossier'}
                </span>
                <span className="accredited-archive-stamp">
                  <i className="fas fa-stamp"></i>{' '}
                  {currentLang === 'ar' ? 'أرشيف توثيقي معتمد' : 'Accredited Archive'}
                </span>
              </div>
              <h2 className="dossier-name">
                {currentLang === 'ar' ? 'إنعام علي عثمان' : 'ENAAM ALI OSMAN'}
              </h2>
              <p className="dossier-sub">
                {currentLang === 'ar'
                  ? 'خبرة ميدانية موثقة في صحافة الصورة، التنمية، وتضخيم أصوات المجتمعات'
                  : 'Documentary Storyteller · Visual Journalist · Community Trainer'}
              </p>
            </div>
          </div>

          <div className="dossier-header-controls">
            <div className="dossier-action-cluster">
              <button
                type="button"
                className="btn btn-outline dossier-btn-sm"
                onClick={handleCopyBio}
                title="Copy Bio"
              >
                <i className="far fa-copy"></i>
                <span>{currentLang === 'ar' ? 'نسخ البيان' : 'Copy Bio'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary dossier-btn-sm"
                onClick={handlePrint}
                title="Download or Print CV"
              >
                <i className="fas fa-file-pdf"></i>
                <span>{t.btn_download_cv}</span>
              </button>
            </div>

            <div className="dossier-controls-divider" aria-hidden="true"></div>

            <div className="dossier-close-safe-zone">
              <button
                type="button"
                className="dossier-close-btn"
                onClick={onClose}
                aria-label={currentLang === 'ar' ? 'إغلاق السيرة الذاتية' : 'Close dossier'}
                title={currentLang === 'ar' ? 'إغلاق (Esc)' : 'Close (Esc)'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Curated Wings Navigation */}
        <div className="dossier-wings-nav" role="tablist" aria-label="Curated CV Wings">
          {wings.map((wing) => (
            <button
              key={wing.id}
              type="button"
              className={`dossier-wing-tab ${activeWing === wing.id ? 'active' : ''}`}
              onClick={() => setActiveWing(wing.id)}
            >
              <i className={`fas ${wing.icon}`}></i>
              <span className="wing-tab-title">{wing.title}</span>
              <span className="wing-badge-num">{wing.num}</span>
            </button>
          ))}
        </div>

        {/* Dossier Content Body */}
        <div className="dossier-modal-body">
          {activeWing === 'manifesto' && <CVManifestoWing currentLang={currentLang} />}
          {activeWing === 'exhibitions' && <CVExhibitionsWing currentLang={currentLang} />}
          {activeWing === 'awards' && <CVAwardsWing currentLang={currentLang} />}
          {activeWing === 'gear' && <CVGearWing currentLang={currentLang} />}
          {activeWing === 'partners' && <CVPartnersWing currentLang={currentLang} />}
        </div>
      </div>
    </div>
  );
};

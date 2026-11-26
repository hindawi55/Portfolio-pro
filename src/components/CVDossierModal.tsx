import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';
import { FALLBACK_IMAGE_URL } from '../utils/assets';
import { copyTextSafely, safeRun, safeRunAsync } from '../utils/errorDiagnostics';
import { downloadCVAsPdf } from '../utils/cvPdfGenerator';
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
  const [isExporting, setIsExporting] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const { cvDossier, layout, seo, getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        actionsMenuOpen &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setActionsMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (actionsMenuOpen) {
          setActionsMenuOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [actionsMenuOpen, onClose]);

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setActionsMenuOpen(false);
    setIsExporting(true);
    try {
      const ok = await safeRunAsync(
        'CVDossierModal',
        'downloadCVPdf',
        async () => {
          await downloadCVAsPdf({ lang: currentLang, cvDossier, layout, seo });
          return true;
        },
        false,
        'warning'
      );
      if (ok) {
        onShowToast(
          currentLang === 'ar'
            ? 'تم تجهيز وتحميل ملف السيرة الذاتية (PDF) بنجاح.'
            : 'CV Dossier (PDF) downloaded successfully.'
        );
      } else {
        onShowToast(
          currentLang === 'ar'
            ? 'تعذّر إنشاء ملف PDF في هذا المتصفح، يمكنك استخدام خيار الطباعة.'
            : 'Unable to export PDF in this browser; please try Print.'
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setActionsMenuOpen(false);
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
    setActionsMenuOpen(false);
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
            {/* Desktop / Wide Tablet Actions Cluster */}
            <div className="dossier-action-cluster">
              <button
                type="button"
                className="btn btn-outline dossier-btn-sm"
                onClick={handleCopyBio}
                title={currentLang === 'ar' ? 'نسخ البيان' : 'Copy Bio'}
              >
                <i className="far fa-copy"></i>
                <span>{currentLang === 'ar' ? 'نسخ البيان' : 'Copy Bio'}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline dossier-btn-sm"
                onClick={handlePrint}
                title={currentLang === 'ar' ? 'طباعة' : 'Print'}
              >
                <i className="fas fa-print"></i>
                <span>{currentLang === 'ar' ? 'طباعة' : 'Print'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary dossier-btn-sm"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                title={currentLang === 'ar' ? 'تحميل السيرة PDF' : 'Download CV PDF'}
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                <span>
                  {isExporting
                    ? currentLang === 'ar'
                      ? 'جاري التحميل...'
                      : 'Exporting...'
                    : t.btn_download_cv}
                </span>
              </button>
            </div>

            {/* Unified Mobile Action Trigger + Popover Menu */}
            <div className="dossier-mobile-actions-wrap" ref={menuContainerRef}>
              <button
                type="button"
                className={`dossier-mobile-trigger ${actionsMenuOpen ? 'is-open' : ''}`}
                onClick={() => setActionsMenuOpen((prev) => !prev)}
                aria-expanded={actionsMenuOpen}
                aria-haspopup="menu"
                disabled={isExporting}
              >
                <span className="dossier-mobile-trigger-label">
                  <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-export'}`}></i>
                  <span>
                    {isExporting
                      ? currentLang === 'ar'
                        ? 'جاري تجهيز PDF...'
                        : 'Exporting PDF...'
                      : currentLang === 'ar'
                      ? 'تصدير وإجراءات السيرة'
                      : 'Export & Dossier Actions'}
                  </span>
                </span>
                <i className="fas fa-chevron-down dossier-mobile-chevron" aria-hidden="true"></i>
              </button>

              {actionsMenuOpen && (
                <div className="dossier-mobile-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="dossier-mobile-menu-item is-primary"
                    onClick={handleDownloadPdf}
                    disabled={isExporting}
                  >
                    <span className="dossier-menu-icon">
                      <i className="fas fa-file-pdf"></i>
                    </span>
                    <span className="dossier-menu-text">
                      <strong>{t.btn_download_cv}</strong>
                      <small>
                        {currentLang === 'ar' ? 'ملف A4 عالي الدقة' : 'Verified A4 Document'}
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="dossier-mobile-menu-item"
                    onClick={handlePrint}
                  >
                    <span className="dossier-menu-icon">
                      <i className="fas fa-print"></i>
                    </span>
                    <span className="dossier-menu-text">
                      <strong>{currentLang === 'ar' ? 'طباعة السيرة' : 'Print Dossier'}</strong>
                      <small>
                        {currentLang === 'ar' ? 'معاينة وطباعة مباشرة' : 'Print official view'}
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="dossier-mobile-menu-item"
                    onClick={handleCopyBio}
                  >
                    <span className="dossier-menu-icon">
                      <i className="far fa-copy"></i>
                    </span>
                    <span className="dossier-menu-text">
                      <strong>{currentLang === 'ar' ? 'نسخ البيان الفني' : 'Copy Bio'}</strong>
                      <small>
                        {currentLang === 'ar' ? 'نسخ النص التعريفي للحافظة' : 'Copy artist statement'}
                      </small>
                    </span>
                  </button>
                </div>
              )}
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

import React, { useState, useEffect } from 'react';
import { Language, PhotoSeries } from './types';
import { translations } from './data/translations';
import { photoSeriesData, getPhotoUrl } from './data/portfolioData';
import { ClientSession } from './data/clientPortalData';
import { Loader } from './components/Loader';
import { CustomCursor } from './components/CustomCursor';
import { Particles } from './components/Particles';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Portfolio } from './components/Portfolio';
import { CVSection } from './components/CVSection';
import { ClientPortal } from './components/ClientPortal';
import { Mission } from './components/Mission';
import { Services } from './components/Services';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { CinemaLightbox } from './components/CinemaLightbox';
import { CVDossierModal } from './components/CVDossierModal';
import { StudioManager } from './components/StudioManager';
import { ClientPortalHeader } from './components/ClientPortalHeader';

export const App: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [lightboxSeries, setLightboxSeries] = useState<PhotoSeries | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxInitialMode, setLightboxInitialMode] = useState<'default' | 'exif' | 'wallart'>('default');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeClientSession, setActiveClientSession] = useState<ClientSession | null>(null);
  const [isClientIsolated, setIsClientIsolated] = useState<boolean>(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState<boolean>(false);
  const [isCVDossierOpen, setIsCVDossierOpen] = useState<boolean>(false);
  const [isStudioManagerOpen, setIsStudioManagerOpen] = useState<boolean>(false);

  const t = translations[currentLang];

  // Sync document language and direction
  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.title = translations[currentLang].pageTitle;
  }, [currentLang]);

  // Listen for hash triggers: #portal?pin=..., #studio, #cv-dossier
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      // Only auto-open client portal if pin is provided explicitly in hash (secure direct client link)
      if (hash.startsWith('#client-portal') || hash.startsWith('#portal')) {
        if (hash.includes('pin=')) {
          setIsClientPortalOpen(true);
        } else {
          // Remove leftover/stale hash so the visitor lands cleanly on the homepage
          try {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          } catch {
            // Ignore if restricted
          }
        }
      } else if (hash.startsWith('#studio')) {
        setIsStudioManagerOpen(true);
      } else if (hash.startsWith('#cv-dossier')) {
        setIsCVDossierOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Image preloading in idle time
  useEffect(() => {
    const urls: string[] = [];
    photoSeriesData.forEach((series) => {
      series.photos.forEach((photo) => {
        urls.push(getPhotoUrl(series.folder, photo.file));
      });
    });

    let qIdx = 0;
    const loadNext = () => {
      if (qIdx >= urls.length) return;
      const img = new Image();
      img.src = urls[qIdx++];
      setTimeout(loadNext, 40);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadNext());
    } else {
      setTimeout(loadNext, 200);
    }
  }, []);

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleOpenLightbox = (
    series: PhotoSeries,
    photoIndex: number,
    mode: 'default' | 'exif' | 'wallart' = 'default'
  ) => {
    setLightboxSeries(series);
    setLightboxIndex(photoIndex);
    setLightboxInitialMode(mode);
  };

  const handleCloseLightbox = () => {
    setLightboxSeries(null);
    setLightboxInitialMode('default');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  return (
    <>
      <Loader />
      <CustomCursor />
      <Particles />

      {/* Persistent Client Session Status Ribbon when active */}
      {activeClientSession && (
        <div className="client-active-ribbon">
          <div className="ribbon-inner">
            <div className="ribbon-client-info">
              <span className="ribbon-pulse"></span>
              <i className="fas fa-user-shield"></i>
              <span className="ribbon-title">
                {currentLang === 'ar' ? 'جلسة عميل نشطة:' : 'Active Client Session:'}{' '}
                <strong>{currentLang === 'ar' ? activeClientSession.clientNameAr : activeClientSession.clientNameEn}</strong>
              </span>
            </div>

            <div className="ribbon-actions">
              <button
                type="button"
                className="ribbon-btn ribbon-btn-mode"
                onClick={() => setIsClientIsolated(!isClientIsolated)}
              >
                <i className={`fas ${isClientIsolated ? 'fa-globe' : 'fa-compress-arrows-alt'}`}></i>
                <span>{isClientIsolated ? t.portal_switch_public : t.portal_switch_isolated}</span>
              </button>

              <button
                type="button"
                className="ribbon-btn ribbon-btn-logout"
                onClick={() => {
                  setActiveClientSession(null);
                  setIsClientIsolated(false);
                  showToast(currentLang === 'ar' ? 'تم قفل جلسة العميل والخروج بأمان' : 'Client session locked');
                }}
              >
                <i className="fas fa-lock"></i>
                <span>{t.portal_lock_and_exit}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeClientSession && isClientIsolated ? (
        <ClientPortalHeader
          currentLang={currentLang}
          activeSession={activeClientSession}
          onToggleLang={toggleLanguage}
          onToggleIsolated={() => setIsClientIsolated(false)}
          isIsolated={true}
          onLogout={() => {
            setActiveClientSession(null);
            setIsClientIsolated(false);
            showToast(currentLang === 'ar' ? 'تم قفل جلسة العميل والخروج بأمان' : 'Client session locked');
          }}
        />
      ) : (
        <Navigation
          currentLang={currentLang}
          onToggleLang={toggleLanguage}
          onOpenCVDossier={() => setIsCVDossierOpen(true)}
        />
      )}

      <main>
        {/* If in Isolated Client Mode, display only the Client Proofing Workspace */}
        {activeClientSession && isClientIsolated ? (
          <div className="isolated-client-view">
            <ClientPortal
              currentLang={currentLang}
              onShowToast={showToast}
              onOpenLightbox={handleOpenLightbox}
              isIsolatedMode={true}
              onToggleIsolatedMode={setIsClientIsolated}
              onSessionStateChange={setActiveClientSession}
              onClose={() => {
                setIsClientIsolated(false);
                setIsClientPortalOpen(false);
              }}
            />
          </div>
        ) : (
          /* Standard Public Website Layout (100% Free of Private Authentication Boxes) */
          <>
            <Hero currentLang={currentLang} />
            <About currentLang={currentLang} />
            <CVSection
              currentLang={currentLang}
              onOpenFullDossier={() => setIsCVDossierOpen(true)}
            />
            <Portfolio currentLang={currentLang} onOpenLightbox={handleOpenLightbox} />
            <Mission currentLang={currentLang} />
            <Services currentLang={currentLang} />
            <Contact currentLang={currentLang} onShowToast={showToast} />
          </>
        )}
      </main>

      {/* Dedicated Client Portal Modal Workspace (Opened only on request) */}
      {isClientPortalOpen && !isClientIsolated && (
        <div className="portal-modal-overlay" role="dialog" aria-modal="true">
          <div className="portal-modal-dialog">
            <ClientPortal
              currentLang={currentLang}
              onShowToast={showToast}
              onOpenLightbox={handleOpenLightbox}
              isIsolatedMode={false}
              onToggleIsolatedMode={setIsClientIsolated}
              onSessionStateChange={setActiveClientSession}
              onClose={() => {
                setIsClientPortalOpen(false);
                if (window.location.hash.startsWith('#client-portal') || window.location.hash.startsWith('#portal')) {
                  history.replaceState(null, '', ' ');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Dedicated Fullscreen CV Dossier Modal */}
      {isCVDossierOpen && (
        <CVDossierModal
          currentLang={currentLang}
          onClose={() => {
            setIsCVDossierOpen(false);
            if (window.location.hash.startsWith('#cv-dossier')) {
              history.replaceState(null, '', ' ');
            }
          }}
          onShowToast={showToast}
        />
      )}

      {/* Developer / Photographer Studio Manager (/studio or #studio) */}
      {isStudioManagerOpen && (
        <StudioManager
          currentLang={currentLang}
          onShowToast={showToast}
          onOpenClientSession={(session) => {
            setIsStudioManagerOpen(false);
            setActiveClientSession(session);
            setIsClientIsolated(true);
          }}
          onClose={() => {
            setIsStudioManagerOpen(false);
            if (window.location.hash.startsWith('#studio')) {
              history.replaceState(null, '', ' ');
            }
          }}
        />
      )}

      {!isClientIsolated && (
        <Footer
          currentLang={currentLang}
          onOpenClientPortal={() => setIsClientPortalOpen(true)}
        />
      )}

      {lightboxSeries && (
        <CinemaLightbox
          currentLang={currentLang}
          series={lightboxSeries}
          currentIndex={lightboxIndex}
          initialMode={lightboxInitialMode}
          onClose={handleCloseLightbox}
          onSelectPhoto={setLightboxIndex}
        />
      )}

      {toastMessage && (
        <div className="toast-notice" role="alert">
          {toastMessage}
        </div>
      )}
    </>
  );
};

export default App;

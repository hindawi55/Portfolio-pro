import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Language, PhotoSeries } from '../types';
import { ClientSession } from '../data/clientPortalData';
import { useSiteCMS } from '../context/SiteCMSContext';
import {
  fetchClientSessionWithMeta,
  fetchProofFeedback,
  saveProofFeedback,
} from '../services/cmsService';
import { ClientPortalFooter } from './ClientPortalFooter';
import { PortalLockScreen } from './portal/PortalLockScreen';
import { PortalProofCard } from './portal/PortalProofCard';
import { copyTextSafely, safeRun } from '../utils/errorDiagnostics';

interface ClientPortalProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
  onOpenLightbox?: (
    series: PhotoSeries,
    photoIndex: number,
    mode?: 'default' | 'exif' | 'wallart'
  ) => void;
  isIsolatedMode?: boolean;
  onToggleIsolatedMode?: (isolated: boolean) => void;
  onSessionStateChange?: (session: ClientSession | null) => void;
  onClose?: () => void;
}

const getLocalFeedbackKey = (pin: string) => `luxe_portal_feedback_${pin}`;

export const ClientPortal: React.FC<ClientPortalProps> = ({
  currentLang,
  onShowToast,
  onOpenLightbox,
  isIsolatedMode = false,
  onToggleIsolatedMode,
  onSessionStateChange,
  onClose,
}) => {
  const { getTranslation, seo, layout } = useSiteCMS();
  const t = getTranslation(currentLang);

  const [pinInput, setPinInput] = useState('');
  const [activeSession, setActiveSession] = useState<ClientSession | null>(null);
  const [isCloudSession, setIsCloudSession] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeNotePhotoId, setActiveNotePhotoId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');

  const waDigits = (seo.whatsappNumber || '249112135062').replace(/[^\d]/g, '');
  const brandName =
    currentLang === 'ar'
      ? layout.brandNameAr || 'إنعام علي عثمان'
      : layout.brandNameEn || 'Enaam Ali Osman';

  const hydrateSessionFeedback = useCallback(async (pin: string, cloudSynced: boolean) => {
    const nextFavs: Record<string, boolean> = {};
    const nextNotes: Record<string, string> = {};

    if (cloudSynced) {
      const records = await fetchProofFeedback(pin);
      records.forEach((rec) => {
        if (rec.isFavorite) nextFavs[rec.photoId] = true;
        if (rec.note) nextNotes[rec.photoId] = rec.note;
      });
    } else {
      safeRun(
        'ClientPortal',
        'readLocalFeedback',
        () => {
          const raw = window.localStorage.getItem(getLocalFeedbackKey(pin));
          if (!raw) return;
          const parsed = JSON.parse(raw) as {
            favorites?: Record<string, boolean>;
            notes?: Record<string, string>;
          };
          if (parsed.favorites) Object.assign(nextFavs, parsed.favorites);
          if (parsed.notes) Object.assign(nextNotes, parsed.notes);
        },
        undefined,
        'warning'
      );
    }

    setFavorites(nextFavs);
    setNotes(nextNotes);
  }, []);

  const activateSession = useCallback(
    async (found: ClientSession, cloudSynced: boolean, fromLink = false) => {
      setActiveSession(found);
      setIsCloudSession(cloudSynced);
      setPinError(false);
      onSessionStateChange?.(found);
      onToggleIsolatedMode?.(true);
      await hydrateSessionFeedback(found.pin, cloudSynced);
      onShowToast(
        fromLink
          ? currentLang === 'ar'
            ? `تم فتح جلسة العميل الخاصة تلقائياً عبر الرابط السري: ${found.clientNameAr}`
            : `Client session auto-unlocked via secure link: ${found.clientNameEn}`
          : currentLang === 'ar'
          ? `تم فتح الجلسة الخاصة بنجاح: ${found.clientNameAr}`
          : `Session unlocked: ${found.clientNameEn}`
      );
    },
    [currentLang, hydrateSessionFeedback, onSessionStateChange, onShowToast, onToggleIsolatedMode]
  );

  // Auto-unlock session if pin is passed in URL query or hash params
  useEffect(() => {
    let pinFromUrl: string | null = null;
    const searchParams = new URLSearchParams(window.location.search);
    pinFromUrl = searchParams.get('pin');

    if (!pinFromUrl && window.location.hash.includes('pin=')) {
      const parts = window.location.hash.split('?');
      if (parts[1]) {
        const hashParams = new URLSearchParams(parts[1]);
        pinFromUrl = hashParams.get('pin');
      }
    }

    if (pinFromUrl) {
      let cancelled = false;
      void (async () => {
        const result = await fetchClientSessionWithMeta(pinFromUrl);
        if (!cancelled && result) {
          await activateSession(result.session, result.isCloudSynced, true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [activateSession]);

  const clientPhotoSeries: PhotoSeries | null = useMemo(() => {
    if (!activeSession) return null;
    return {
      id: `client-${activeSession.pin}`,
      number: `PROOF-${activeSession.pin}`,
      category: 'humanitarian',
      tags: ['Client Delivery', activeSession.clientNameEn],
      titleAr: activeSession.projectTitleAr,
      titleEn: activeSession.projectTitleEn,
      subtitleAr: activeSession.clientNameAr,
      subtitleEn: activeSession.clientNameEn,
      locationAr: 'جلسة التوثيق الميداني المعتمدة',
      locationEn: 'Certified Field Mission Proofing',
      date: activeSession.date,
      folder: activeSession.photos[0]?.folder || '/images/series-01',
      photos: activeSession.photos.map((p) => ({
        file: p.file,
        captionAr: p.titleAr,
        captionEn: p.titleEn,
        camera: p.camera || 'Sony Alpha 7 IV',
        lens: p.lens || 'FE 35mm f/1.4 GM',
        settings: p.settings || '1/800s · f/2.2 · ISO 160 · 35mm',
        locationAr: p.locationAr || activeSession.clientNameAr,
        locationEn: p.locationEn || activeSession.clientNameEn,
      })),
    };
  }, [activeSession]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) return;
    setUnlocking(true);
    try {
      const result = await fetchClientSessionWithMeta(cleanPin);
      if (result) {
        await activateSession(result.session, result.isCloudSynced, false);
      } else {
        setPinError(true);
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleAutofillPin = async (pin: string) => {
    setPinInput(pin);
    setUnlocking(true);
    try {
      const result = await fetchClientSessionWithMeta(pin);
      if (result) {
        await activateSession(result.session, result.isCloudSynced, false);
      } else {
        setPinError(true);
      }
    } finally {
      setUnlocking(false);
    }
  };

  const persistFeedback = async (
    photoId: string,
    nextFav: boolean,
    nextNote: string,
    nextFavMap: Record<string, boolean>,
    nextNoteMap: Record<string, string>
  ) => {
    if (!activeSession) return;
    if (isCloudSession) {
      try {
        await saveProofFeedback(activeSession.pin, photoId, nextFav, nextNote);
      } catch {
        onShowToast(
          currentLang === 'ar'
            ? 'تعذّرت مزامنة التعديل سحابياً، تحقق من اتصالك بالإنترنت.'
            : 'Could not sync feedback to cloud; please check your connection.'
        );
      }
    } else {
      safeRun(
        'ClientPortal',
        'saveLocalFeedback',
        () => {
          window.localStorage.setItem(
            getLocalFeedbackKey(activeSession.pin),
            JSON.stringify({ favorites: nextFavMap, notes: nextNoteMap })
          );
        },
        undefined,
        'warning'
      );
    }
  };

  const toggleFavorite = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextIsFav = !favorites[photoId];
    const nextFavs = { ...favorites, [photoId]: nextIsFav };
    setFavorites(nextFavs);

    onShowToast(
      nextIsFav
        ? currentLang === 'ar'
          ? `تمت إضافة الصورة ${photoId} إلى المفضلات المعتمدة ❤️`
          : `Photo ${photoId} marked as favorite ❤️`
        : currentLang === 'ar'
        ? `تمت إزالة الصورة ${photoId} من المفضلات`
        : `Photo ${photoId} removed from favorites`
    );

    void persistFeedback(photoId, nextIsFav, notes[photoId] || '', nextFavs, notes);
  };

  const handleOpenNote = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveNotePhotoId(photoId);
    setNoteDraft(notes[photoId] || '');
  };

  const handleSaveNote = (photoId: string) => {
    const trimmed = noteDraft.trim().slice(0, 1000);
    const nextNotes = { ...notes, [photoId]: trimmed };
    setNotes(nextNotes);
    setActiveNotePhotoId(null);
    onShowToast(
      currentLang === 'ar'
        ? 'تم حفظ ملاحظة التعديل ومزامنتها بنجاح 💬'
        : 'Retouch note saved & synced successfully 💬'
    );
    void persistFeedback(photoId, Boolean(favorites[photoId]), trimmed, favorites, nextNotes);
  };

  const handleDownloadSingle = (photoId: string, url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    safeRun(
      'ClientPortal',
      'downloadSinglePhoto',
      () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      undefined,
      'warning'
    );
    onShowToast(
      currentLang === 'ar'
        ? `جاري بدء تحميل الصورة ${photoId} بدقة عالية...`
        : `Downloading high-resolution photo ${photoId}...`
    );
  };

  const handleDownloadAll = () => {
    if (!activeSession) return;
    if (activeSession.downloadUrl && activeSession.downloadUrl.startsWith('http')) {
      safeRun(
        'ClientPortal',
        'openArchiveDownload',
        () => {
          const link = document.createElement('a');
          link.href = activeSession.downloadUrl!;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
        undefined,
        'warning'
      );
      onShowToast(
        currentLang === 'ar'
          ? 'جاري فتح رابط تحميل الأرشيف الكامل عالي الدقة...'
          : 'Opening full high-resolution master archive...'
      );
      return;
    }

    onShowToast(
      currentLang === 'ar'
        ? `تم تجهيز طلب حزمة التحميل (${activeSession.packageSize}) — يمكنك اعتماد اختياراتك لإرسال النسخة النهائية.`
        : `Complete package (${activeSession.packageSize}) ready — approve your picks to receive final masters.`
    );
  };

  const handleSubmitProofs = () => {
    if (!activeSession) return;
    const favKeys = Object.keys(favorites).filter((k) => favorites[k]);

    let text =
      `*اعتماد واختيار صور الجلسة الميدانية*\n` +
      `--------------------------------\n` +
      `🏢 *الجهة / العميل:* ${currentLang === 'ar' ? activeSession.clientNameAr : activeSession.clientNameEn}\n` +
      `📁 *المشروع:* ${currentLang === 'ar' ? activeSession.projectTitleAr : activeSession.projectTitleEn}\n` +
      `🔢 *رمز الجلسة:* #${activeSession.pin}\n` +
      `⭐️ *الصور المعتمدة (${favKeys.length} من إجمالي ${activeSession.photos.length}):*\n`;

    if (favKeys.length === 0) {
      text += `(لم يتم تحديد صور مفضلة بعد)\n`;
    } else {
      favKeys.forEach((k) => {
        const userNote = notes[k] ? ` 💬 [ملاحظة: ${notes[k]}]` : '';
        text += `• ${k}${userNote}\n`;
      });
    }

    text += `--------------------------------\n_مرسل عبر بوابة تسليم العملاء الخاصة - ${brandName}_`;

    const opened = safeRun(
      'ClientPortal',
      'submitSelectionToWhatsApp',
      () => {
        const link = document.createElement('a');
        link.href = `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      },
      false,
      'warning'
    );

    onShowToast(
      opened
        ? t.portal_submit_success
        : currentLang === 'ar'
        ? 'تم حفظ اختياراتك سحابياً؛ تعذّر فتح واتساب تلقائياً.'
        : 'Selections synced to cloud; could not launch WhatsApp automatically.'
    );
  };

  const handleCopyDirectLink = async () => {
    if (!activeSession) return;
    const directUrl = safeRun(
      'ClientPortal',
      'buildDirectSessionLink',
      () => `${window.location.origin}${window.location.pathname}#portal?pin=${activeSession.pin}`,
      `#portal?pin=${activeSession.pin}`,
      'warning'
    );

    const copied = await copyTextSafely('ClientPortal', directUrl);
    onShowToast(
      copied
        ? currentLang === 'ar'
          ? `تم نسخ الرابط السري لجلسة (${activeSession.clientNameAr}) بنجاح! 🔗`
          : `Direct secret link for ${activeSession.clientNameEn} copied to clipboard! 🔗`
        : currentLang === 'ar'
        ? `الرابط السري للجلسة: ${directUrl}`
        : `Direct secret link: ${directUrl}`
    );
  };

  const handleLogout = () => {
    setActiveSession(null);
    setIsCloudSession(false);
    setPinInput('');
    setFavorites({});
    setNotes({});
    onSessionStateChange?.(null);
    onToggleIsolatedMode?.(false);
    onShowToast(currentLang === 'ar' ? 'تم قفل الجلسة وتسجيل الخروج بأمان.' : 'Session locked securely.');
  };

  const handleOpenPhotoInLightbox = (
    photoIndex: number,
    mode: 'default' | 'exif' | 'wallart' = 'default'
  ) => {
    if (onOpenLightbox && clientPhotoSeries) {
      onOpenLightbox(clientPhotoSeries, photoIndex, mode);
    }
  };

  const selectedCount = Object.keys(favorites).filter((k) => favorites[k]).length;

  return (
    <section
      className={`section client-portal-section ${isIsolatedMode ? 'portal-isolated-active' : ''}`}
      id="client-portal"
    >
      {onClose && !isIsolatedMode && (
        <div className="portal-overlay-topbar">
          <div className="portal-overlay-title">
            <i className="fas fa-shield-alt"></i>
            <span>
              {currentLang === 'ar'
                ? 'بوابة تسليم واعتماد أعمال العملاء المشفرة'
                : 'Encrypted Client Proofing Portal'}
            </span>
          </div>
          <button
            type="button"
            className="portal-overlay-close-btn"
            onClick={onClose}
            aria-label={currentLang === 'ar' ? 'إغلاق والعودة للأعمال' : 'Close and return'}
          >
            <i className="fas fa-times"></i>
            <span>
              {currentLang === 'ar' ? 'إغلاق والعودة للمعرض' : 'Close & Return to Portfolio'}
            </span>
          </button>
        </div>
      )}

      {!isIsolatedMode && (
        <div className="section-header reveal active">
          <div className="section-label">{t.portal_label}</div>
          <h2 className="section-title">{t.portal_title}</h2>
          <p className="section-desc">{t.portal_desc}</p>
        </div>
      )}

      <div className="portal-container">
        {!activeSession ? (
          <PortalLockScreen
            currentLang={currentLang}
            pinInput={pinInput}
            pinError={pinError}
            unlocking={unlocking}
            onPinChange={(val) => {
              setPinInput(val);
              setPinError(false);
            }}
            onUnlock={(e) => void handleUnlock(e)}
            onAutofillPin={(pin) => void handleAutofillPin(pin)}
          />
        ) : (
          <div className="portal-workspace">
            {/* Session Info Banner */}
            <div className="portal-session-banner">
              <div className="session-info-main">
                <div className="session-status-row">
                  <div className="session-status-badge">
                    <i className="fas fa-shield-alt"></i>
                    <span>
                      {currentLang === 'ar' ? activeSession.statusAr : activeSession.statusEn}
                    </span>
                  </div>
                  <div className="session-pin-badge">
                    <i className="fas fa-key"></i>
                    <span>PIN #{activeSession.pin}</span>
                  </div>
                  {isCloudSession && (
                    <div className="session-pin-badge">
                      <i className="fas fa-cloud"></i>
                      <span>{currentLang === 'ar' ? 'مزامنة سحابية حية' : 'Live Cloud Sync'}</span>
                    </div>
                  )}
                </div>

                <h3>
                  {currentLang === 'ar'
                    ? activeSession.projectTitleAr
                    : activeSession.projectTitleEn}
                </h3>

                <div className="session-meta-line">
                  <span>
                    <i className="fas fa-building"></i>
                    {currentLang === 'ar'
                      ? activeSession.clientNameAr
                      : activeSession.clientNameEn}
                  </span>
                  <span>
                    <i className="far fa-calendar-alt"></i>
                    {activeSession.date}
                  </span>
                  <span>
                    <i className="fas fa-images"></i>
                    {activeSession.photos.length} {t.photos_count_suffix}
                  </span>
                  <span className="package-size-pill">
                    <i className="fas fa-database"></i>
                    {activeSession.packageSize}
                  </span>
                </div>
              </div>

              <div className="session-actions-top">
                <button
                  type="button"
                  className="btn btn-outline portal-btn-sm portal-btn-share"
                  onClick={() => void handleCopyDirectLink()}
                  title={
                    currentLang === 'ar'
                      ? 'نسخ الرابط السري المباشر للجلسة لمشاركته مع العميل'
                      : 'Copy direct secret link for client'
                  }
                >
                  <i className="fas fa-link"></i>
                  <span>
                    {currentLang === 'ar' ? 'مشاركة الرابط السري' : 'Share Direct Link'}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline portal-btn-sm"
                  onClick={handleDownloadAll}
                >
                  <i className="fas fa-cloud-download-alt"></i>
                  <span>{t.portal_download_all}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary portal-btn-sm"
                  onClick={handleSubmitProofs}
                >
                  <i className="fab fa-whatsapp"></i>
                  <span>
                    {t.portal_export_selection} ({selectedCount})
                  </span>
                </button>
                {onToggleIsolatedMode && (
                  <button
                    type="button"
                    className="btn btn-outline portal-btn-toggle-isolate"
                    onClick={() => onToggleIsolatedMode(!isIsolatedMode)}
                    title={isIsolatedMode ? t.portal_switch_public : t.portal_switch_isolated}
                  >
                    <i className={`fas ${isIsolatedMode ? 'fa-globe' : 'fa-expand-alt'}`}></i>
                    <span>
                      {isIsolatedMode ? t.portal_switch_public : t.portal_switch_isolated}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline portal-btn-logout"
                  onClick={handleLogout}
                  title={t.portal_lock_and_exit}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>{t.portal_lock_and_exit}</span>
                </button>
              </div>
            </div>

            {/* Proofing Filter & Counter Bar */}
            <div className="portal-toolbar">
              <div className="toolbar-left">
                <button
                  type="button"
                  className={`toolbar-tab ${filterMode === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterMode('all')}
                >
                  <i className="fas fa-th"></i>
                  <span>
                    {t.portal_all_photos} ({activeSession.photos.length})
                  </span>
                </button>
                <button
                  type="button"
                  className={`toolbar-tab ${filterMode === 'favorites' ? 'active' : ''}`}
                  onClick={() => setFilterMode('favorites')}
                >
                  <i className="fas fa-heart"></i>
                  <span>
                    {t.portal_favorites_only} ({selectedCount})
                  </span>
                </button>
              </div>

              <div className="toolbar-right">
                <span className="selected-status">
                  {t.portal_favorites_count} <strong>{selectedCount}</strong> /{' '}
                  {activeSession.photos.length}
                </span>
              </div>
            </div>

            {/* Frameless High-End Photography Proofing Grid */}
            <div className="portal-proofing-grid">
              {activeSession.photos
                .filter((photo) => (filterMode === 'favorites' ? favorites[photo.id] : true))
                .map((photo, index) => (
                  <PortalProofCard
                    key={photo.id}
                    currentLang={currentLang}
                    photo={photo}
                    photoIndex={index}
                    isFav={!!favorites[photo.id]}
                    savedNote={notes[photo.id]}
                    isNoteComposerOpen={activeNotePhotoId === photo.id}
                    noteDraft={noteDraft}
                    onOpenLightbox={handleOpenPhotoInLightbox}
                    onToggleFavorite={toggleFavorite}
                    onOpenNote={handleOpenNote}
                    onChangeNoteDraft={setNoteDraft}
                    onCancelNote={() => setActiveNotePhotoId(null)}
                    onSaveNote={handleSaveNote}
                    onDownloadSingle={handleDownloadSingle}
                  />
                ))}
            </div>

            <ClientPortalFooter currentLang={currentLang} activeSession={activeSession} />
          </div>
        )}
      </div>
    </section>
  );
};

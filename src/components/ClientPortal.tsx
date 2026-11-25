import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Language, PhotoSeries } from '../types';
import { ClientSession } from '../data/clientPortalData';
import { useSiteCMS } from '../context/SiteCMSContext';
import {
  fetchClientSessionWithMeta,
  fetchProofFeedback,
  saveProofFeedback,
} from '../services/cmsService';
import { PortalLockScreen } from './portal/PortalLockScreen';
import { PortalSessionWorkspace } from './portal/PortalSessionWorkspace';
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
const PORTAL_GUARD_STORAGE_KEY = 'eao_portal_guard_v1';
const MAX_FAILED_ATTEMPTS = 5;

interface PortalGuardState {
  failures: number;
  lockCount: number;
  lockUntil: number;
}

const readPortalGuard = (): PortalGuardState => {
  try {
    const raw = window.sessionStorage.getItem(PORTAL_GUARD_STORAGE_KEY);
    if (!raw) return { failures: 0, lockCount: 0, lockUntil: 0 };
    const parsed = JSON.parse(raw) as Partial<PortalGuardState>;
    return {
      failures: typeof parsed.failures === 'number' ? parsed.failures : 0,
      lockCount: typeof parsed.lockCount === 'number' ? parsed.lockCount : 0,
      lockUntil: typeof parsed.lockUntil === 'number' ? parsed.lockUntil : 0,
    };
  } catch {
    return { failures: 0, lockCount: 0, lockUntil: 0 };
  }
};

const writePortalGuard = (next: PortalGuardState) => {
  try {
    window.sessionStorage.setItem(PORTAL_GUARD_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
};

const isCloudSessionExpired = (expiryDate: string | undefined, isCloudSynced: boolean): boolean => {
  if (!isCloudSynced || !expiryDate) return false;
  const trimmed = expiryDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const endOfDayMs = Date.parse(`${trimmed}T23:59:59`);
  return !Number.isNaN(endOfDayMs) && Date.now() > endOfDayMs;
};

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
  const [expiredError, setExpiredError] = useState<string | null>(null);
  const [guardState, setGuardState] = useState<PortalGuardState>(() => readPortalGuard());
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(() => {
    const initial = readPortalGuard();
    return initial.lockUntil > Date.now()
      ? Math.ceil((initial.lockUntil - Date.now()) / 1000)
      : 0;
  });
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

  // Live cooldown countdown ticker when brute-force guard is active
  useEffect(() => {
    if (guardState.lockUntil <= Date.now()) {
      setCooldownSeconds(0);
      return;
    }
    const tick = () => {
      const remaining = Math.ceil((guardState.lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownSeconds(0);
        const cleared = { ...guardState, lockUntil: 0 };
        setGuardState(cleared);
        writePortalGuard(cleared);
      } else {
        setCooldownSeconds(remaining);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [guardState]);

  const recordFailedAttempt = useCallback(() => {
    const nextFailures = guardState.failures + 1;
    if (nextFailures >= MAX_FAILED_ATTEMPTS) {
      const nextLockCount = guardState.lockCount + 1;
      const lockSeconds = Math.min(120, 30 * nextLockCount);
      const next: PortalGuardState = {
        failures: 0,
        lockCount: nextLockCount,
        lockUntil: Date.now() + lockSeconds * 1000,
      };
      setGuardState(next);
      writePortalGuard(next);
      setCooldownSeconds(lockSeconds);
    } else {
      const next: PortalGuardState = {
        ...guardState,
        failures: nextFailures,
      };
      setGuardState(next);
      writePortalGuard(next);
    }
  }, [guardState]);

  const resetPortalGuard = useCallback(() => {
    const clean: PortalGuardState = { failures: 0, lockCount: 0, lockUntil: 0 };
    setGuardState(clean);
    writePortalGuard(clean);
    setCooldownSeconds(0);
  }, []);

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
      if (isCloudSessionExpired(found.expiryDate, cloudSynced)) {
        const msg =
          currentLang === 'ar'
            ? `انتهت صلاحية رابط هذه الجلسة (${found.expiryDate}). يرجى استخدام خيار استرجاع الرمز أو تجديد الجلسة.`
            : `This client gallery expired on ${found.expiryDate}. Please request access renewal below.`;
        setExpiredError(msg);
        setPinError(false);
        onShowToast(msg);
        return;
      }

      resetPortalGuard();
      setExpiredError(null);
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
    [
      currentLang,
      hydrateSessionFeedback,
      onSessionStateChange,
      onShowToast,
      onToggleIsolatedMode,
      resetPortalGuard,
    ]
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
    if (cooldownSeconds > 0) return;
    const cleanPin = pinInput.trim();
    if (!cleanPin) return;
    setExpiredError(null);
    setUnlocking(true);
    try {
      const result = await fetchClientSessionWithMeta(cleanPin);
      if (result) {
        await activateSession(result.session, result.isCloudSynced, false);
      } else {
        setPinError(true);
        recordFailedAttempt();
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleAutofillPin = async (pin: string) => {
    if (cooldownSeconds > 0) return;
    setPinInput(pin);
    setExpiredError(null);
    setUnlocking(true);
    try {
      const result = await fetchClientSessionWithMeta(pin);
      if (result) {
        await activateSession(result.session, result.isCloudSynced, false);
      } else {
        setPinError(true);
        recordFailedAttempt();
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
            expiredError={expiredError}
            cooldownSeconds={cooldownSeconds}
            failedAttempts={guardState.failures}
            unlocking={unlocking}
            onPinChange={(val) => {
              setPinInput(val);
              setPinError(false);
              setExpiredError(null);
            }}
            onUnlock={(e) => void handleUnlock(e)}
            onAutofillPin={(pin) => void handleAutofillPin(pin)}
            onShowToast={onShowToast}
          />
        ) : (
          <PortalSessionWorkspace
            currentLang={currentLang}
            t={t}
            activeSession={activeSession}
            isCloudSession={isCloudSession}
            isIsolatedMode={isIsolatedMode}
            selectedCount={selectedCount}
            filterMode={filterMode}
            favorites={favorites}
            notes={notes}
            activeNotePhotoId={activeNotePhotoId}
            noteDraft={noteDraft}
            onChangeFilterMode={setFilterMode}
            onCopyDirectLink={() => void handleCopyDirectLink()}
            onDownloadAll={handleDownloadAll}
            onSubmitProofs={handleSubmitProofs}
            onToggleIsolatedMode={onToggleIsolatedMode}
            onLogout={handleLogout}
            onOpenLightbox={handleOpenPhotoInLightbox}
            onToggleFavorite={toggleFavorite}
            onOpenNote={handleOpenNote}
            onChangeNoteDraft={setNoteDraft}
            onCancelNote={() => setActiveNotePhotoId(null)}
            onSaveNote={handleSaveNote}
            onDownloadSingle={handleDownloadSingle}
          />
        )}
      </div>
    </section>
  );
};

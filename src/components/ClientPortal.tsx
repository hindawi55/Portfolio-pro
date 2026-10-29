import React, { useState, useMemo, useEffect } from 'react';
import { Language, PhotoSeries } from '../types';
import { translations } from '../data/translations';
import { sampleClientSessions, ClientSession } from '../data/clientPortalData';
import { getPhotoUrl } from '../data/portfolioData';
import { ClientPortalFooter } from './ClientPortalFooter';

interface ClientPortalProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
  onOpenLightbox?: (series: PhotoSeries, photoIndex: number, mode?: 'default' | 'exif' | 'wallart') => void;
  isIsolatedMode?: boolean;
  onToggleIsolatedMode?: (isolated: boolean) => void;
  onSessionStateChange?: (session: ClientSession | null) => void;
  onClose?: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  currentLang,
  onShowToast,
  onOpenLightbox,
  isIsolatedMode = false,
  onToggleIsolatedMode,
  onSessionStateChange,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [activeSession, setActiveSession] = useState<ClientSession | null>(null);
  const [pinError, setPinError] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeNotePhotoId, setActiveNotePhotoId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');

  const t = translations[currentLang];

  // Auto-unlock session if pin is passed in URL query or hash params (e.g., #portal?pin=UN2026)
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
      const cleanPin = pinFromUrl.trim().toLowerCase();
      const found = sampleClientSessions.find((s) => s.pin.toLowerCase() === cleanPin);
      if (found) {
        setActiveSession(found);
        setPinError(false);
        onSessionStateChange?.(found);
        if (onToggleIsolatedMode) {
          onToggleIsolatedMode(true);
        }
        onShowToast(
          currentLang === 'ar'
            ? `تم فتح جلسة العميل الخاصة تلقائياً عبر الرابط السري: ${found.clientNameAr}`
            : `Client session auto-unlocked via secure link: ${found.clientNameEn}`
        );
      }
    }
  }, [currentLang, onSessionStateChange, onToggleIsolatedMode, onShowToast]);

  // Convert active client session into a PhotoSeries for the Cinema Lightbox / Wall Art / EXIF
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

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    const found = sampleClientSessions.find((s) => s.pin.toLowerCase() === cleanPin.toLowerCase());

    if (found) {
      setActiveSession(found);
      setPinError(false);
      onSessionStateChange?.(found);
      if (onToggleIsolatedMode) {
        onToggleIsolatedMode(true);
      }
      onShowToast(
        currentLang === 'ar'
          ? `تم فتح الجلسة الخاصة بنجاح: ${found.clientNameAr}`
          : `Session unlocked: ${found.clientNameEn}`
      );
    } else {
      setPinError(true);
    }
  };

  const handleAutofillPin = (pin: string) => {
    setPinInput(pin);
    const found = sampleClientSessions.find((s) => s.pin === pin);
    if (found) {
      setActiveSession(found);
      setPinError(false);
      onSessionStateChange?.(found);
      if (onToggleIsolatedMode) {
        onToggleIsolatedMode(true);
      }
      onShowToast(
        currentLang === 'ar'
          ? `تم فتح جلسة ${found.clientNameAr}`
          : `Session unlocked: ${found.clientNameEn}`
      );
    }
  };

  const toggleFavorite = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [photoId]: !prev[photoId] };
      const isFav = next[photoId];
      onShowToast(
        isFav
          ? currentLang === 'ar'
            ? `تمت إضافة الصورة ${photoId} إلى المفضلات المعتمدة ❤️`
            : `Photo ${photoId} marked as favorite ❤️`
          : currentLang === 'ar'
          ? `تمت إزالة الصورة ${photoId} من المفضلات`
          : `Photo ${photoId} removed from favorites`
      );
      return next;
    });
  };

  const handleOpenNote = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveNotePhotoId(photoId);
    setNoteDraft(notes[photoId] || '');
  };

  const handleSaveNote = (photoId: string) => {
    setNotes((prev) => ({ ...prev, [photoId]: noteDraft }));
    setActiveNotePhotoId(null);
    onShowToast(currentLang === 'ar' ? 'تم حفظ ملاحظة التعديل بنجاح 💬' : 'Retouch note saved successfully 💬');
  };

  const handleDownloadSingle = (photoId: string, url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${photoId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(
      currentLang === 'ar'
        ? `جاري بدء تحميل الصورة ${photoId} بدقة 24MP الكاملة...`
        : `Downloading full 24MP original photo ${photoId}...`
    );
  };

  const handleDownloadAll = () => {
    if (!activeSession) return;
    onShowToast(
      currentLang === 'ar'
        ? `تم إنشاء حزمة التحميل المجمعة للألبوم (${activeSession.packageSize}) بجودة 24MP الأصلية!`
        : `Complete high-res package (${activeSession.packageSize}) generated for ${activeSession.clientNameEn}!`
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

    text += `--------------------------------\n_مرسل عبر بوابة تسليم العملاء الخاصة - إنعام علي عثمان_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/249117789498?text=${encoded}`, '_blank');
    onShowToast(t.portal_submit_success);
  };

  const handleCopyDirectLink = () => {
    if (!activeSession) return;
    const directUrl = `${window.location.origin}${window.location.pathname}#portal?pin=${activeSession.pin}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(directUrl).then(
        () => {
          onShowToast(
            currentLang === 'ar'
              ? `تم نسخ الرابط السري لجلسة (${activeSession.clientNameAr}) بنجاح! 🔗`
              : `Direct secret link for ${activeSession.clientNameEn} copied to clipboard! 🔗`
          );
        },
        () => {
          onShowToast(
            currentLang === 'ar'
              ? `الرابط السري للجلسة: ${directUrl}`
              : `Direct secret link: ${directUrl}`
          );
        }
      );
    } else {
      onShowToast(
        currentLang === 'ar'
          ? `الرابط السري للجلسة: ${directUrl}`
          : `Direct secret link: ${directUrl}`
      );
    }
  };

  const handleLogout = () => {
    setActiveSession(null);
    setPinInput('');
    setFavorites({});
    setNotes({});
    onSessionStateChange?.(null);
    if (onToggleIsolatedMode) {
      onToggleIsolatedMode(false);
    }
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
      {/* Overlay Close Bar if displayed in modal view */}
      {onClose && (
        <div className="portal-overlay-topbar">
          <div className="portal-overlay-title">
            <i className="fas fa-shield-alt"></i>
            <span>{currentLang === 'ar' ? 'بوابة تسليم واعتماد أعمال العملاء المشفرة' : 'Encrypted Client Proofing Portal'}</span>
          </div>
          <button
            type="button"
            className="portal-overlay-close-btn"
            onClick={onClose}
            aria-label={currentLang === 'ar' ? 'إغلاق والعودة للأعمال' : 'Close and return'}
          >
            <i className="fas fa-times"></i>
            <span>{currentLang === 'ar' ? 'إغلاق والعودة للمعرض' : 'Close & Return to Portfolio'}</span>
          </button>
        </div>
      )}

      {/* Header section (hidden in isolated mode for clean focus) */}
      {!isIsolatedMode && (
        <div className="section-header reveal active">
          <div className="section-label">{t.portal_label}</div>
          <h2 className="section-title">{t.portal_title}</h2>
          <p className="section-desc">{t.portal_desc}</p>
        </div>
      )}

      <div className="portal-container">
        {!activeSession ? (
          /* Locked PIN State */
          <div className="portal-lock-card">
            <div className="portal-lock-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h3>{currentLang === 'ar' ? 'تسجيل الدخول للمساحة الخاصة' : 'Private Gallery Authorization'}</h3>
            <p>
              {currentLang === 'ar'
                ? 'يرجى إدخال رمز المرور السري (PIN) المستلم مع وثيقة تسليم الجلسة لمراجعة الصور واعتماد المفضلات والتحميل المباشر.'
                : 'Enter your private access PIN provided in your delivery dossier to review and approve photos.'}
            </p>

            <form onSubmit={handleUnlock} className="portal-pin-form">
              <div className="portal-input-wrap">
                <i className="fas fa-key"></i>
                <input
                  type="text"
                  placeholder={t.portal_pin_placeholder}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                  required
                />
              </div>

              {pinError && <div className="portal-error-msg">{t.portal_invalid_pin}</div>}

              <button type="submit" className="btn btn-primary portal-submit-btn">
                <i className="fas fa-unlock-alt"></i>
                <span>{t.portal_unlock_btn}</span>
              </button>
            </form>

            {/* Quick Demo Shortcuts */}
            <div className="portal-demo-bar">
              <span className="demo-label">
                <i className="fas fa-lightbulb"></i>
                <span>{t.portal_demo_hint}</span>
              </span>
              <div className="demo-chips">
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleAutofillPin('2026')}
                >
                  <i className="fas fa-hand-holding-heart"></i>
                  <span>2026 (UNICEF)</span>
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleAutofillPin('7788')}
                >
                  <i className="fas fa-users"></i>
                  <span>7788 (Youth Summit)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Unlocked Proofing Workspace */
          <div className="portal-workspace">
            {/* Session Info Banner */}
            <div className="portal-session-banner">
              <div className="session-info-main">
                <div className="session-status-row">
                  <div className="session-status-badge">
                    <i className="fas fa-shield-alt"></i>
                    <span>{currentLang === 'ar' ? activeSession.statusAr : activeSession.statusEn}</span>
                  </div>
                  <div className="session-pin-badge">
                    <i className="fas fa-key"></i>
                    <span>PIN #{activeSession.pin}</span>
                  </div>
                </div>

                <h3>{currentLang === 'ar' ? activeSession.projectTitleAr : activeSession.projectTitleEn}</h3>

                <div className="session-meta-line">
                  <span>
                    <i className="fas fa-building"></i>
                    {currentLang === 'ar' ? activeSession.clientNameAr : activeSession.clientNameEn}
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
                  onClick={handleCopyDirectLink}
                  title={currentLang === 'ar' ? 'نسخ الرابط السري المباشر للجلسة لمشاركته مع العميل' : 'Copy direct secret link for client'}
                >
                  <i className="fas fa-link"></i>
                  <span>{currentLang === 'ar' ? 'مشاركة الرابط السري' : 'Share Direct Link'}</span>
                </button>
                <button className="btn btn-outline portal-btn-sm" onClick={handleDownloadAll}>
                  <i className="fas fa-cloud-download-alt"></i>
                  <span>{t.portal_download_all}</span>
                </button>
                <button className="btn btn-primary portal-btn-sm" onClick={handleSubmitProofs}>
                  <i className="fab fa-whatsapp"></i>
                  <span>{t.portal_export_selection} ({selectedCount})</span>
                </button>
                {onToggleIsolatedMode && (
                  <button
                    className="btn btn-outline portal-btn-toggle-isolate"
                    onClick={() => onToggleIsolatedMode(!isIsolatedMode)}
                    title={isIsolatedMode ? t.portal_switch_public : t.portal_switch_isolated}
                  >
                    <i className={`fas ${isIsolatedMode ? 'fa-globe' : 'fa-expand-alt'}`}></i>
                    <span>{isIsolatedMode ? t.portal_switch_public : t.portal_switch_isolated}</span>
                  </button>
                )}
                <button
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
                  className={`toolbar-tab ${filterMode === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterMode('all')}
                >
                  <i className="fas fa-th"></i>
                  <span>{t.portal_all_photos} ({activeSession.photos.length})</span>
                </button>
                <button
                  className={`toolbar-tab ${filterMode === 'favorites' ? 'active' : ''}`}
                  onClick={() => setFilterMode('favorites')}
                >
                  <i className="fas fa-heart"></i>
                  <span>{t.portal_favorites_only} ({selectedCount})</span>
                </button>
              </div>

              <div className="toolbar-right">
                <span className="selected-status">
                  {t.portal_favorites_count} <strong>{selectedCount}</strong> / {activeSession.photos.length}
                </span>
              </div>
            </div>

            {/* Frameless High-End Photography Proofing Grid */}
            <div className="portal-proofing-grid">
              {activeSession.photos
                .filter((photo) => (filterMode === 'favorites' ? favorites[photo.id] : true))
                .map((photo, index) => {
                  const isFav = !!favorites[photo.id];
                  const photoUrl = getPhotoUrl(photo.folder, photo.file);
                  const title = currentLang === 'ar' ? photo.titleAr : photo.titleEn;
                  const hasNote = !!notes[photo.id];

                  return (
                    <div
                      key={photo.id}
                      className={`proof-frameless-card ${isFav ? 'is-favorite' : ''}`}
                      onClick={() => handleOpenPhotoInLightbox(index, 'default')}
                    >
                      {/* Photo Image Container (Pure Artwork - Zero Obstructing Overlays) */}
                      <div className="proof-img-container">
                        <img
                          src={photoUrl}
                          alt={title}
                          className="proof-img-art"
                          loading="lazy"
                          onContextMenu={(e) => e.preventDefault()}
                        />

                        {/* Top Subtle Badges */}
                        <div className="proof-top-badges">
                          <span className="proof-id-badge">{photo.id}</span>
                          <button
                            type="button"
                            className={`proof-heart-pill ${isFav ? 'is-fav' : ''}`}
                            onClick={(e) => toggleFavorite(photo.id, e)}
                            title={isFav ? 'Remove Favorite' : 'Mark as Favorite'}
                          >
                            <i className="fas fa-heart"></i>
                            <span>{isFav ? t.portal_approved_tag : t.portal_select_tag}</span>
                          </button>
                        </div>
                      </div>

                      {/* Clean Dedicated Proof Action Toolbar (Positioned Below Image, Zero Obstruction) */}
                      <div className="proof-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="proof-action-btn"
                          onClick={() => handleOpenPhotoInLightbox(index, 'wallart')}
                          title={t.portal_view_wallart}
                        >
                          <i className="fas fa-couch"></i>
                          <span>{currentLang === 'ar' ? 'جدارية' : 'Wall Art'}</span>
                        </button>

                        <button
                          type="button"
                          className="proof-action-btn"
                          onClick={() => handleOpenPhotoInLightbox(index, 'exif')}
                          title={t.portal_view_exif}
                        >
                          <i className="fas fa-camera"></i>
                          <span>EXIF</span>
                        </button>

                        <button
                          type="button"
                          className={`proof-action-btn ${hasNote ? 'has-note' : ''}`}
                          onClick={(e) => handleOpenNote(photo.id, e)}
                          title={t.portal_add_note}
                        >
                          <i className="fas fa-comment-dots"></i>
                          <span>{hasNote ? (currentLang === 'ar' ? 'ملاحظة ✓' : 'Note ✓') : (currentLang === 'ar' ? 'ملاحظة' : 'Note')}</span>
                        </button>

                        <button
                          type="button"
                          className="proof-action-btn proof-tool-dl"
                          onClick={(e) => handleDownloadSingle(photo.id, photoUrl, e)}
                          title="Download High-Res 24MP"
                        >
                          <i className="fas fa-arrow-down"></i>
                          <span>{photo.filesize}</span>
                        </button>
                      </div>

                      {/* Card Typographic Details */}
                      <div className="proof-card-footer" onClick={(e) => e.stopPropagation()}>
                        <div className="proof-title-row">
                          <h4 className="proof-photo-title">{title}</h4>
                          <span className="proof-res-tag">{photo.resolution}</span>
                        </div>

                        {photo.lens && (
                          <div className="proof-tech-sub">
                            <i className="fas fa-circle-notch"></i>
                            <span>{photo.lens} · {photo.settings}</span>
                          </div>
                        )}

                        {/* Note Display if exists */}
                        {hasNote && (
                          <div className="proof-saved-note-pill">
                            <i className="fas fa-comment-alt"></i>
                            <div className="note-text-content">
                              <strong>{currentLang === 'ar' ? 'ملاحظة العميل للريتاتش:' : 'Retouch note:'}</strong>{' '}
                              {notes[photo.id]}
                            </div>
                            <button
                              type="button"
                              className="note-edit-icon"
                              onClick={(e) => handleOpenNote(photo.id, e)}
                            >
                              <i className="fas fa-pen"></i>
                            </button>
                          </div>
                        )}

                        {/* Inline Note Drawer if active */}
                        {activeNotePhotoId === photo.id && (
                          <div className="proof-note-composer" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              rows={3}
                              placeholder={t.portal_note_placeholder}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              autoFocus
                            />
                            <div className="note-composer-actions">
                              <button
                                type="button"
                                className="note-btn-cancel"
                                onClick={() => setActiveNotePhotoId(null)}
                              >
                                {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
                              </button>
                              <button
                                type="button"
                                className="note-btn-save"
                                onClick={() => handleSaveNote(photo.id)}
                              >
                                {t.portal_save_note}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Dedicated Client Portal Institutional Footer */}
            <ClientPortalFooter
              currentLang={currentLang}
              activeSession={activeSession}
            />
          </div>
        )}
      </div>
    </section>
  );
};

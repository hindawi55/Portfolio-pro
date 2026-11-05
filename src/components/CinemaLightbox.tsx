import React, { useState, useEffect, useRef } from 'react';
import { Language, PhotoSeries } from '../types';
import { getPhotoUrl } from '../data/portfolioData';
import { translations } from '../data/translations';

interface CinemaLightboxProps {
  currentLang: Language;
  series: PhotoSeries | null;
  currentIndex: number;
  initialMode?: 'default' | 'exif' | 'wallart';
  onClose: () => void;
  onSelectPhoto: (index: number) => void;
}

export const CinemaLightbox: React.FC<CinemaLightboxProps> = ({
  currentLang,
  series,
  currentIndex,
  initialMode = 'default',
  onClose,
  onSelectPhoto,
}) => {
  const [showExif, setShowExif] = useState(initialMode === 'exif');
  const [showWallArt, setShowWallArt] = useState(initialMode === 'wallart');
  const [frameType, setFrameType] = useState<'black' | 'wood' | 'gold'>('black');
  const [frameSize, setFrameSize] = useState<'small' | 'large'>('small');

  // Sync mode if initialMode changes
  useEffect(() => {
    if (initialMode === 'exif') setShowExif(true);
    if (initialMode === 'wallart') setShowWallArt(true);
  }, [initialMode]);

  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const t = translations[currentLang];

  const totalPhotos = series?.photos.length || 0;
  const currentPhoto = series && series.photos[currentIndex] ? series.photos[currentIndex] : null;

  const nextPhoto = () => {
    if (!series || totalPhotos === 0) return;
    onSelectPhoto((currentIndex + 1) % totalPhotos);
  };

  const prevPhoto = () => {
    if (!series || totalPhotos === 0) return;
    onSelectPhoto((currentIndex - 1 + totalPhotos) % totalPhotos);
  };

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!series) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showWallArt) {
          setShowWallArt(false);
        } else if (showExif) {
          setShowExif(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        if (currentLang === 'ar') prevPhoto();
        else nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        if (currentLang === 'ar') nextPhoto();
        else prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [series, currentIndex, currentLang, showWallArt, showExif]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartRef.current.x;
    const diffY = endY - touchStartRef.current.y;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  };

  if (!series || !currentPhoto) return null;

  const photoUrl = getPhotoUrl(series.folder, currentPhoto.file);
  const caption = currentLang === 'ar' ? currentPhoto.captionAr : currentPhoto.captionEn;
  const title = currentLang === 'ar' ? series.titleAr : series.titleEn;
  const photoLocation =
    currentLang === 'ar'
      ? currentPhoto.locationAr || series.locationAr
      : currentPhoto.locationEn || series.locationEn;

  const categoryTag =
    currentLang === 'ar'
      ? series.category === 'humanitarian'
        ? 'إنساني'
        : series.category === 'community'
        ? 'مجتمعي'
        : series.category === 'workshops'
        ? 'ورش عمل'
        : 'وثائقي'
      : series.category.toUpperCase();

  return (
    <div
      className="lightbox active"
      id="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Gallery"
    >
      {/* Top Header: Pristine, uncluttered with safe margins */}
      <div className="lightbox-header">
        <div className="lightbox-info">
          <span className="lightbox-series-tag" id="lightboxSeriesTag">
            {categoryTag}
          </span>
          <h3 className="lightbox-series-title" id="lightboxSeriesTitle">
            {title}
          </h3>
        </div>

        <div className="lightbox-actions-clean">
          <div className="lightbox-counter">
            <span id="lightboxCurrentIdx">{String(currentIndex + 1).padStart(2, '0')}</span> /{' '}
            <span id="lightboxTotalIdx">{String(totalPhotos).padStart(2, '0')}</span>
          </div>

          <div className="lightbox-header-spacer"></div>

          <button
            className="lightbox-btn lightbox-btn-close-safe"
            id="lightboxClose"
            title={t.lightbox_close}
            aria-label="Close Gallery"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Center Viewport & Stage (Protected from accidental backdrop taps) */}
      <div
        className="lightbox-stage"
        id="lightboxStage"
        ref={stageRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          className="lightbox-nav-btn lightbox-prev"
          id="lightboxPrev"
          aria-label="Previous Photo"
          onClick={prevPhoto}
        >
          <i className={`fas ${currentLang === 'ar' ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>

        <div className="lightbox-media-wrapper" id="lightboxMediaWrapper">
          <img
            key={photoUrl}
            src={photoUrl}
            alt={caption}
            id="lightboxImg"
            className="lightbox-main-img"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = '/images/1.jpg';
            }}
          />
        </div>

        {/* EXIF Metadata Mobile Bottom Sheet & Desktop Panel */}
        {showExif && (
          <div className="lightbox-exif-backdrop" onClick={() => setShowExif(false)}>
            <div className="lightbox-exif-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="exif-drag-bar"></div>
              <div className="exif-header">
                <div className="exif-header-title">
                  <i className="fas fa-camera"></i>
                  <h5>{currentLang === 'ar' ? 'البيانات التقنية للكادر (EXIF)' : 'Technical Capture Data (EXIF)'}</h5>
                </div>
                <button className="exif-close" onClick={() => setShowExif(false)} aria-label="Close EXIF">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="exif-grid">
                <div className="exif-item">
                  <span className="exif-label">
                    <i className="fas fa-camera-retro"></i> {currentLang === 'ar' ? 'الكاميرا' : 'Camera'}
                  </span>
                  <span className="exif-value">{currentPhoto.camera || 'Sony Alpha 7 IV (Full-Frame)'}</span>
                </div>
                <div className="exif-item">
                  <span className="exif-label">
                    <i className="fas fa-circle-notch"></i> {currentLang === 'ar' ? 'العدسة' : 'Lens'}
                  </span>
                  <span className="exif-value">{currentPhoto.lens || 'FE 35mm f/1.4 GM'}</span>
                </div>
                <div className="exif-item">
                  <span className="exif-label">
                    <i className="fas fa-sliders-h"></i> {currentLang === 'ar' ? 'إعدادات التعريض' : 'Exposure'}
                  </span>
                  <span className="exif-value">{currentPhoto.settings || '1/640s · f/2.2 · ISO 200'}</span>
                </div>
                <div className="exif-item">
                  <span className="exif-label">
                    <i className="fas fa-map-marker-alt"></i> {currentLang === 'ar' ? 'الموقع الجغرافي' : 'Location'}
                  </span>
                  <span className="exif-value">{photoLocation}</span>
                </div>
                <div className="exif-item exif-item-fullwidth">
                  <span className="exif-label">
                    <i className="fas fa-feather-alt text-gold"></i> {currentLang === 'ar' ? 'السياق الميداني والنزاهة التوثيقية' : 'Frontline Documentary Context'}
                  </span>
                  <span className="exif-value exif-context-note">
                    {currentLang === 'ar'
                      ? 'توثيق حي ميداني بضوء طبيعي مباشر دون تدخل أو محاكاة مصطنعة صوناً للكرامة الإنسانية.'
                      : 'Authentic frontline observation under ambient light with strict ethical non-intervention protocols.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          className="lightbox-nav-btn lightbox-next"
          id="lightboxNext"
          aria-label="Next Photo"
          onClick={nextPhoto}
        >
          <i className={`fas ${currentLang === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>
      </div>

      {/* Sleek Floating 2-Action Capsule Bar (Zero clutter, zero wrap on phones) */}
      <div className="lightbox-floating-capsule-bar" role="toolbar" aria-label="Photo Actions">
        <button
          type="button"
          className={`capsule-action-item ${showWallArt ? 'active' : ''}`}
          onClick={() => setShowWallArt(true)}
          title={t.lightbox_wallart}
        >
          <i className="fas fa-couch"></i>
          <span>{currentLang === 'ar' ? 'جدارية' : 'Wall Art'}</span>
        </button>

        <span className="capsule-action-sep">|</span>

        <button
          type="button"
          className={`capsule-action-item ${showExif ? 'active' : ''}`}
          onClick={() => setShowExif(!showExif)}
          title={t.lightbox_exif}
        >
          <i className="fas fa-camera-retro"></i>
          <span>EXIF</span>
        </button>
      </div>

      {/* Bottom Bar: Caption & Filmstrip */}
      <div className="lightbox-footer">
        <div className="lightbox-caption" id="lightboxCaption">
          <i className="fas fa-quote-right lightbox-quote-icon"></i>
          <span id="lightboxCaptionText">{caption}</span>
        </div>
        <div className="lightbox-filmstrip-wrap">
          <div className="lightbox-filmstrip" id="lightboxFilmstrip" role="tablist">
            {series.photos.map((p, idx) => (
              <div
                key={idx}
                className={`lightbox-thumb ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => onSelectPhoto(idx)}
                title={currentLang === 'ar' ? p.captionAr : p.captionEn}
              >
                <img
                  src={getPhotoUrl(series.folder, p.file)}
                  alt={currentLang === 'ar' ? p.captionAr : p.captionEn}
                  loading="lazy"
                  onContextMenu={(e) => e.preventDefault()}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = '/images/1.jpg';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wall Art Room Simulator Modal (Authentic Museum Gallery Presentation) */}
      {showWallArt && (
        <div className="wallart-modal-backdrop" onClick={() => setShowWallArt(false)}>
          <div className="wallart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallart-modal-header">
              <div className="wallart-modal-title">
                <i className="fas fa-couch text-gold"></i>
                <div className="wallart-title-block">
                  <h4>{t.wallart_title}</h4>
                  <span className="wallart-modal-sub">
                    {currentLang === 'ar' ? 'محاكاة المعاينة الجدارية في صالة عرض متحفية راقية' : 'Curated Gallery Wall Simulation'}
                  </span>
                </div>
              </div>
              <button
                className="wallart-modal-close"
                onClick={() => setShowWallArt(false)}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Virtual Gallery Living Room Scene */}
            <div className="wallart-stage-viewport">
              <div className="wallart-living-room">
                {/* Museum Directional Gallery Spotlight */}
                <div className="wallart-gallery-light"></div>

                {/* 3D Museum Framed Artwork with Real Passe-Partout */}
                <div className={`wallart-frame-wrapper frame-${frameType} size-${frameSize}`}>
                  <div className="wallart-passepartout">
                    <img
                      src={photoUrl}
                      alt={caption}
                      className="wallart-framed-img"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                </div>

                {/* Museum Architectural Floor & Drop Shadow */}
                <div className="wallart-gallery-floor-shadow"></div>
                <div className="wallart-gallery-baseboard"></div>

                {/* Archival Print Specs Plaque */}
                <div className="wallart-spec-plaque">
                  <span className="plaque-dim">
                    {frameSize === 'small' ? '50 × 70 cm (A2 Exhibition Print)' : '70 × 100 cm (Grand Collector Edition)'}
                  </span>
                  <span className="plaque-dot">·</span>
                  <span className="plaque-paper">Hahnemühle 308gsm Cotton Rag</span>
                </div>
              </div>
            </div>

            {/* Simulator Controls */}
            <div className="wallart-controls-bar">
              <div className="wallart-control-group">
                <span className="control-label">{currentLang === 'ar' ? 'نوع الإطار المتحفي:' : 'Frame Material:'}</span>
                <div className="control-btn-pills">
                  <button
                    className={`pill-btn ${frameType === 'black' ? 'active' : ''}`}
                    onClick={() => setFrameType('black')}
                  >
                    <span className="dot dot-black"></span>
                    <span>{t.wallart_frame_black}</span>
                  </button>
                  <button
                    className={`pill-btn ${frameType === 'wood' ? 'active' : ''}`}
                    onClick={() => setFrameType('wood')}
                  >
                    <span className="dot dot-wood"></span>
                    <span>{t.wallart_frame_wood}</span>
                  </button>
                  <button
                    className={`pill-btn ${frameType === 'gold' ? 'active' : ''}`}
                    onClick={() => setFrameType('gold')}
                  >
                    <span className="dot dot-gold"></span>
                    <span>{t.wallart_frame_gold}</span>
                  </button>
                </div>
              </div>

              <div className="wallart-control-group">
                <span className="control-label">{currentLang === 'ar' ? 'المقاس الفني:' : 'Print Dimension:'}</span>
                <div className="control-btn-pills">
                  <button
                    className={`pill-btn ${frameSize === 'small' ? 'active' : ''}`}
                    onClick={() => setFrameSize('small')}
                  >
                    {t.wallart_size_small}
                  </button>
                  <button
                    className={`pill-btn ${frameSize === 'large' ? 'active' : ''}`}
                    onClick={() => setFrameSize('large')}
                  >
                    {t.wallart_size_large}
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Print Order CTA */}
            <div className="wallart-action-footer">
              <a
                href={`https://wa.me/249117789498?text=${encodeURIComponent(
                  currentLang === 'ar'
                    ? `مرحباً إنعام، أود الاستفسار عن طلب طباعة هذه اللوحة الجدارية:\n- العمل: "${caption}"\n- نوع الإطار: ${
                        frameType === 'black'
                          ? t.wallart_frame_black
                          : frameType === 'wood'
                          ? t.wallart_frame_wood
                          : t.wallart_frame_gold
                      }\n- المقاس: ${frameSize === 'small' ? t.wallart_size_small : t.wallart_size_large}`
                    : `Hello Enaam, I would like to order a fine art print:\n- Artwork: "${caption}"\n- Frame: ${
                        frameType === 'black'
                          ? t.wallart_frame_black
                          : frameType === 'wood'
                          ? t.wallart_frame_wood
                          : t.wallart_frame_gold
                      }\n- Dimension: ${frameSize === 'small' ? t.wallart_size_small : t.wallart_size_large}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wallart-order"
              >
                <i className="fab fa-whatsapp"></i>
                <span>{t.wallart_order_btn}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

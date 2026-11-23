import React, { useState, useEffect, useRef } from 'react';
import { Language, PhotoSeries } from '../types';
import { getPhotoUrl } from '../data/portfolioData';
import { translations } from '../data/translations';
import { FALLBACK_IMAGE_URL } from '../utils/assets';
import { LightboxExifDrawer } from './lightbox/LightboxExifDrawer';
import { WallArtSimulatorModal } from './lightbox/WallArtSimulatorModal';

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
      if (diffX < 0) nextPhoto();
      else prevPhoto();
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
            type="button"
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
          type="button"
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
              target.src = FALLBACK_IMAGE_URL;
            }}
          />
        </div>

        {showExif && (
          <LightboxExifDrawer
            currentLang={currentLang}
            photo={currentPhoto}
            photoLocation={photoLocation}
            onClose={() => setShowExif(false)}
          />
        )}

        <button
          type="button"
          className="lightbox-nav-btn lightbox-next"
          id="lightboxNext"
          aria-label="Next Photo"
          onClick={nextPhoto}
        >
          <i className={`fas ${currentLang === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>
      </div>

      {/* Sleek Floating 2-Action Capsule Bar */}
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
                    target.src = FALLBACK_IMAGE_URL;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showWallArt && (
        <WallArtSimulatorModal
          currentLang={currentLang}
          photoUrl={photoUrl}
          caption={caption}
          frameType={frameType}
          frameSize={frameSize}
          onChangeFrameType={setFrameType}
          onChangeFrameSize={setFrameSize}
          onClose={() => setShowWallArt(false)}
        />
      )}
    </div>
  );
};

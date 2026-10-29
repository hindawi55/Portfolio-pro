import React, { useState } from 'react';
import { FilterCategory, Language, PhotoSeries } from '../types';
import { photoSeriesData, getPhotoUrl } from '../data/portfolioData';
import { translations } from '../data/translations';

interface PortfolioProps {
  currentLang: Language;
  onOpenLightbox: (
    series: PhotoSeries,
    photoIndex: number,
    mode?: 'default' | 'exif' | 'wallart'
  ) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ currentLang, onOpenLightbox }) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [seriesActiveIndex, setSeriesActiveIndex] = useState<Record<string, number>>({});
  const t = translations[currentLang];

  const getActiveIndex = (seriesId: string) => seriesActiveIndex[seriesId] || 0;

  const handleSelectPhoto = (seriesId: string, index: number, max: number) => {
    let nextIndex = index;
    if (nextIndex < 0) nextIndex = max - 1;
    if (nextIndex >= max) nextIndex = 0;
    setSeriesActiveIndex((prev) => ({ ...prev, [seriesId]: nextIndex }));
  };

  const filteredSeries = photoSeriesData.filter((series) => {
    if (activeFilter === 'all') return true;
    return series.category === activeFilter || series.tags.includes(activeFilter);
  });

  return (
    <section className="section portfolio" id="portfolio">
      <div className="section-header reveal active">
        <div className="section-label">{t.portfolio_label}</div>
        <h2 className="section-title">{t.portfolio_title}</h2>
        <p className="section-desc">{t.portfolio_desc}</p>
      </div>

      {/* Filter Tabs */}
      <div className="portfolio-filter reveal active">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          {t.filter_all}
        </button>
        <button
          className={`filter-btn ${activeFilter === 'humanitarian' ? 'active' : ''}`}
          onClick={() => setActiveFilter('humanitarian')}
        >
          {t.filter_humanitarian}
        </button>
        <button
          className={`filter-btn ${activeFilter === 'community' ? 'active' : ''}`}
          onClick={() => setActiveFilter('community')}
        >
          {t.filter_community}
        </button>
        <button
          className={`filter-btn ${activeFilter === 'documentary' ? 'active' : ''}`}
          onClick={() => setActiveFilter('documentary')}
        >
          {t.filter_documentary}
        </button>
        <button
          className={`filter-btn ${activeFilter === 'workshops' ? 'active' : ''}`}
          onClick={() => setActiveFilter('workshops')}
        >
          {t.filter_workshops}
        </button>
      </div>

      {/* Series Cards Container */}
      <div className="portfolio-series-container" id="portfolioSeriesContainer">
        {filteredSeries.map((series) => {
          const currentIndex = getActiveIndex(series.id);
          const currentPhoto = series.photos[currentIndex] || series.photos[0];
          const photoUrl = getPhotoUrl(series.folder, currentPhoto.file);
          const caption = currentLang === 'ar' ? currentPhoto.captionAr : currentPhoto.captionEn;
          const title = currentLang === 'ar' ? series.titleAr : series.titleEn;
          const subtitle = currentLang === 'ar' ? series.subtitleAr : series.subtitleEn;
          const location = currentLang === 'ar' ? series.locationAr : series.locationEn;

          return (
            <article key={series.id} className="series-card reveal active" id={series.id}>
              {/* Series Header */}
              <div className="series-header">
                <span className="series-number">{series.number}</span>
                <h3 className="series-title">{title}</h3>
                <p className="series-subtitle">{subtitle}</p>
                <div className="series-meta-strip">
                  <span className="series-meta-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span className="series-meta-loc">{location}</span>
                  </span>
                  <span className="series-meta-item">
                    <i className="far fa-calendar-alt"></i>
                    <span>{series.date}</span>
                  </span>
                  <span className="series-meta-item">
                    <i className="fas fa-camera"></i>
                    <span className="series-meta-count">
                      {series.photos.length} {t.photos_count_suffix}
                    </span>
                  </span>
                </div>
              </div>

              {/* Main Viewing Stage (Pure Unobstructed Artwork) */}
              <div
                className="series-viewer-stage"
                onClick={() => onOpenLightbox(series, currentIndex)}
                title={t.fullscreen_title}
              >
                <img
                  className="series-main-img"
                  src={photoUrl}
                  alt={caption}
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = '/images/1.jpg';
                  }}
                />
              </div>

              {/* Dedicated Pro Photo Action Toolbar (Positioned Cleanly Beneath Photo) */}
              <div className="series-photo-actionbar" onClick={(e) => e.stopPropagation()}>
                <div className="photo-action-capsule">
                  <button
                    type="button"
                    className="actionbar-btn btn-tool-wallart"
                    onClick={() => onOpenLightbox(series, currentIndex, 'wallart')}
                    title={currentLang === 'ar' ? 'معاينة كلوحة جدارية في صالة معيشة فاخرة' : 'Preview as framed wall art'}
                  >
                    <i className="fas fa-couch"></i>
                    <span>{currentLang === 'ar' ? 'جدارية فاخرة' : 'Wall Art'}</span>
                  </button>

                  <div className="actionbar-divider"></div>

                  <button
                    type="button"
                    className="actionbar-btn btn-tool-exif"
                    onClick={() => onOpenLightbox(series, currentIndex, 'exif')}
                    title={currentLang === 'ar' ? 'بيانات الكاميرا والعدسة EXIF' : 'View camera EXIF metadata'}
                  >
                    <i className="fas fa-camera"></i>
                    <span>EXIF</span>
                  </button>

                  <div className="actionbar-divider"></div>

                  <button
                    type="button"
                    className="actionbar-btn actionbar-btn-icon btn-tool-expand"
                    onClick={() => onOpenLightbox(series, currentIndex)}
                    title={t.fullscreen_title}
                    aria-label={t.fullscreen_title}
                  >
                    <i className="fas fa-expand"></i>
                  </button>
                </div>
              </div>

              {/* Series Navigation Controls */}
              <div className="series-controls">
                <button
                  className="btn-series-nav btn-prev"
                  onClick={() => handleSelectPhoto(series.id, currentIndex - 1, series.photos.length)}
                  aria-label={t.btn_prev}
                >
                  <i className={`fas ${currentLang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
                  <span className="nav-text">{t.btn_prev}</span>
                </button>
                <div className="series-counter-big">
                  <span className="current-num">{String(currentIndex + 1).padStart(2, '0')}</span> /{' '}
                  <span className="total-num">{String(series.photos.length).padStart(2, '0')}</span>
                </div>
                <button
                  className="btn-series-nav btn-next"
                  onClick={() => handleSelectPhoto(series.id, currentIndex + 1, series.photos.length)}
                  aria-label={t.btn_next}
                >
                  <span className="nav-text">{t.btn_next}</span>
                  <i className={`fas ${currentLang === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
                </button>
              </div>

              {/* Filmstrip Thumbnails */}
              <div className="series-filmstrip" role="tablist">
                {series.photos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    className={`series-thumb-item ${pIdx === currentIndex ? 'active' : ''}`}
                    onClick={() => handleSelectPhoto(series.id, pIdx, series.photos.length)}
                    title={currentLang === 'ar' ? photo.captionAr : photo.captionEn}
                  >
                    <img
                      className="series-thumb-img"
                      src={getPhotoUrl(series.folder, photo.file)}
                      alt={currentLang === 'ar' ? photo.captionAr : photo.captionEn}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = '/images/1.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Clean Typographic Caption Bar */}
              <div className="series-caption-bar">
                <div className="series-caption-info">
                  <span className="series-caption-idx">
                    {String(currentIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="series-caption-line"></span>
                  <i className="fas fa-quote-right series-caption-quote"></i>
                  <span className="series-caption-text">{caption}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

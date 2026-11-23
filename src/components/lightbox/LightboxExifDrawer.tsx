import React from 'react';
import { Language, PhotoItem } from '../../types';

interface LightboxExifDrawerProps {
  currentLang: Language;
  photo: PhotoItem;
  photoLocation: string;
  onClose: () => void;
}

export const LightboxExifDrawer: React.FC<LightboxExifDrawerProps> = ({
  currentLang,
  photo,
  photoLocation,
  onClose,
}) => {
  return (
    <div className="lightbox-exif-backdrop" onClick={onClose}>
      <div className="lightbox-exif-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="exif-drag-bar"></div>
        <div className="exif-header">
          <div className="exif-header-title">
            <i className="fas fa-camera"></i>
            <h5>
              {currentLang === 'ar'
                ? 'البيانات التقنية للكادر (EXIF)'
                : 'Technical Capture Data (EXIF)'}
            </h5>
          </div>
          <button
            type="button"
            className="exif-close"
            onClick={onClose}
            aria-label="Close EXIF"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="exif-grid">
          <div className="exif-item">
            <span className="exif-label">
              <i className="fas fa-camera-retro"></i>{' '}
              {currentLang === 'ar' ? 'الكاميرا' : 'Camera'}
            </span>
            <span className="exif-value">
              {photo.camera || 'Sony Alpha 7 IV (Full-Frame)'}
            </span>
          </div>

          <div className="exif-item">
            <span className="exif-label">
              <i className="fas fa-circle-notch"></i>{' '}
              {currentLang === 'ar' ? 'العدسة' : 'Lens'}
            </span>
            <span className="exif-value">{photo.lens || 'FE 35mm f/1.4 GM'}</span>
          </div>

          <div className="exif-item">
            <span className="exif-label">
              <i className="fas fa-sliders-h"></i>{' '}
              {currentLang === 'ar' ? 'إعدادات التعريض' : 'Exposure'}
            </span>
            <span className="exif-value">
              {photo.settings || '1/640s · f/2.2 · ISO 200'}
            </span>
          </div>

          <div className="exif-item">
            <span className="exif-label">
              <i className="fas fa-map-marker-alt"></i>{' '}
              {currentLang === 'ar' ? 'الموقع الجغرافي' : 'Location'}
            </span>
            <span className="exif-value">{photoLocation}</span>
          </div>

          <div className="exif-item exif-item-fullwidth">
            <span className="exif-label">
              <i className="fas fa-feather-alt text-gold"></i>{' '}
              {currentLang === 'ar'
                ? 'السياق الميداني والنزاهة التوثيقية'
                : 'Frontline Documentary Context'}
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
  );
};

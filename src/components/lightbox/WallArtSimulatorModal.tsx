import React from 'react';
import { Language } from '../../types';
import { translations } from '../../data/translations';

interface WallArtSimulatorModalProps {
  currentLang: Language;
  photoUrl: string;
  caption: string;
  frameType: 'black' | 'wood' | 'gold';
  frameSize: 'small' | 'large';
  onChangeFrameType: (type: 'black' | 'wood' | 'gold') => void;
  onChangeFrameSize: (size: 'small' | 'large') => void;
  onClose: () => void;
}

export const WallArtSimulatorModal: React.FC<WallArtSimulatorModalProps> = ({
  currentLang,
  photoUrl,
  caption,
  frameType,
  frameSize,
  onChangeFrameType,
  onChangeFrameSize,
  onClose,
}) => {
  const t = translations[currentLang];

  const activeFrameLabel =
    frameType === 'black'
      ? t.wallart_frame_black
      : frameType === 'wood'
      ? t.wallart_frame_wood
      : t.wallart_frame_gold;

  const activeSizeLabel =
    frameSize === 'small' ? t.wallart_size_small : t.wallart_size_large;

  const orderText =
    currentLang === 'ar'
      ? `مرحباً إنعام، أود الاستفسار عن طلب طباعة هذه اللوحة الجدارية:\n- العمل: "${caption}"\n- نوع الإطار: ${activeFrameLabel}\n- المقاس: ${activeSizeLabel}`
      : `Hello Enaam, I would like to order a fine art print:\n- Artwork: "${caption}"\n- Frame: ${activeFrameLabel}\n- Dimension: ${activeSizeLabel}`;

  return (
    <div className="wallart-modal-backdrop" onClick={onClose}>
      <div className="wallart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallart-modal-header">
          <div className="wallart-modal-title">
            <i className="fas fa-couch text-gold"></i>
            <div className="wallart-title-block">
              <h4>{t.wallart_title}</h4>
              <span className="wallart-modal-sub">
                {currentLang === 'ar'
                  ? 'محاكاة المعاينة الجدارية في صالة عرض متحفية راقية'
                  : 'Curated Gallery Wall Simulation'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="wallart-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Virtual Gallery Living Room Scene */}
        <div className="wallart-stage-viewport">
          <div className="wallart-living-room">
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

            <div className="wallart-gallery-floor-shadow"></div>
            <div className="wallart-gallery-baseboard"></div>

            <div className="wallart-spec-plaque">
              <span className="plaque-dim">
                {frameSize === 'small'
                  ? '50 × 70 cm (A2 Exhibition Print)'
                  : '70 × 100 cm (Grand Collector Edition)'}
              </span>
              <span className="plaque-dot">·</span>
              <span className="plaque-paper">Hahnemühle 308gsm Cotton Rag</span>
            </div>
          </div>
        </div>

        {/* Simulator Controls */}
        <div className="wallart-controls-bar">
          <div className="wallart-control-group">
            <span className="control-label">
              {currentLang === 'ar' ? 'نوع الإطار المتحفي:' : 'Frame Material:'}
            </span>
            <div className="control-btn-pills">
              <button
                type="button"
                className={`pill-btn ${frameType === 'black' ? 'active' : ''}`}
                onClick={() => onChangeFrameType('black')}
              >
                <span className="dot dot-black"></span>
                <span>{t.wallart_frame_black}</span>
              </button>
              <button
                type="button"
                className={`pill-btn ${frameType === 'wood' ? 'active' : ''}`}
                onClick={() => onChangeFrameType('wood')}
              >
                <span className="dot dot-wood"></span>
                <span>{t.wallart_frame_wood}</span>
              </button>
              <button
                type="button"
                className={`pill-btn ${frameType === 'gold' ? 'active' : ''}`}
                onClick={() => onChangeFrameType('gold')}
              >
                <span className="dot dot-gold"></span>
                <span>{t.wallart_frame_gold}</span>
              </button>
            </div>
          </div>

          <div className="wallart-control-group">
            <span className="control-label">
              {currentLang === 'ar' ? 'المقاس الفني:' : 'Print Dimension:'}
            </span>
            <div className="control-btn-pills">
              <button
                type="button"
                className={`pill-btn ${frameSize === 'small' ? 'active' : ''}`}
                onClick={() => onChangeFrameSize('small')}
              >
                {t.wallart_size_small}
              </button>
              <button
                type="button"
                className={`pill-btn ${frameSize === 'large' ? 'active' : ''}`}
                onClick={() => onChangeFrameSize('large')}
              >
                {t.wallart_size_large}
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Print Order CTA */}
        <div className="wallart-action-footer">
          <a
            href={`https://wa.me/249117789498?text=${encodeURIComponent(orderText)}`}
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
  );
};

import React from 'react';
import { Language } from '../../types';
import { ClientProofPhoto } from '../../data/clientPortalData';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { getPhotoUrl } from '../../data/portfolioData';

interface PortalProofCardProps {
  currentLang: Language;
  photo: ClientProofPhoto;
  photoIndex: number;
  isFav: boolean;
  savedNote?: string;
  isNoteComposerOpen: boolean;
  noteDraft: string;
  onOpenLightbox: (index: number, mode?: 'default' | 'exif' | 'wallart') => void;
  onToggleFavorite: (photoId: string, e?: React.MouseEvent) => void;
  onOpenNote: (photoId: string, e?: React.MouseEvent) => void;
  onChangeNoteDraft: (value: string) => void;
  onCancelNote: () => void;
  onSaveNote: (photoId: string) => void;
  onDownloadSingle: (photoId: string, url: string, e?: React.MouseEvent) => void;
}

export const PortalProofCard: React.FC<PortalProofCardProps> = ({
  currentLang,
  photo,
  photoIndex,
  isFav,
  savedNote,
  isNoteComposerOpen,
  noteDraft,
  onOpenLightbox,
  onToggleFavorite,
  onOpenNote,
  onChangeNoteDraft,
  onCancelNote,
  onSaveNote,
  onDownloadSingle,
}) => {
  const { getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);
  const photoUrl = getPhotoUrl(photo.folder, photo.file);
  const title = currentLang === 'ar' ? photo.titleAr : photo.titleEn;
  const hasNote = !!savedNote;

  return (
    <div
      className={`proof-frameless-card ${isFav ? 'is-favorite' : ''}`}
      onClick={() => onOpenLightbox(photoIndex, 'default')}
    >
      {/* Pure Artwork Container */}
      <div className="proof-img-container">
        <img
          src={photoUrl}
          alt={title}
          className="proof-img-art"
          loading="lazy"
          onContextMenu={(e) => e.preventDefault()}
        />

        <div className="proof-top-badges">
          <span className="proof-id-badge">{photo.id}</span>
          <button
            type="button"
            className={`proof-heart-pill ${isFav ? 'is-fav' : ''}`}
            onClick={(e) => onToggleFavorite(photo.id, e)}
            title={isFav ? 'Remove Favorite' : 'Mark as Favorite'}
          >
            <i className="fas fa-heart"></i>
            <span>{isFav ? t.portal_approved_tag : t.portal_select_tag}</span>
          </button>
        </div>
      </div>

      {/* Dedicated Proof Action Toolbar */}
      <div className="proof-card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="proof-action-btn"
          onClick={() => onOpenLightbox(photoIndex, 'wallart')}
          title={t.portal_view_wallart}
        >
          <i className="fas fa-couch"></i>
          <span>{currentLang === 'ar' ? 'جدارية' : 'Wall Art'}</span>
        </button>

        <button
          type="button"
          className="proof-action-btn"
          onClick={() => onOpenLightbox(photoIndex, 'exif')}
          title={t.portal_view_exif}
        >
          <i className="fas fa-camera"></i>
          <span>EXIF</span>
        </button>

        <button
          type="button"
          className={`proof-action-btn ${hasNote ? 'has-note' : ''}`}
          onClick={(e) => onOpenNote(photo.id, e)}
          title={t.portal_add_note}
        >
          <i className="fas fa-comment-dots"></i>
          <span>
            {hasNote
              ? currentLang === 'ar'
                ? 'ملاحظة ✓'
                : 'Note ✓'
              : currentLang === 'ar'
              ? 'ملاحظة'
              : 'Note'}
          </span>
        </button>

        <button
          type="button"
          className="proof-action-btn proof-tool-dl"
          onClick={(e) => onDownloadSingle(photo.id, photoUrl, e)}
          title="Download High-Res 24MP"
        >
          <i className="fas fa-arrow-down"></i>
          <span>{photo.filesize}</span>
        </button>
      </div>

      {/* Card Typographic Details & Note Drawer */}
      <div className="proof-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="proof-title-row">
          <h4 className="proof-photo-title">{title}</h4>
          <span className="proof-res-tag">{photo.resolution}</span>
        </div>

        {photo.lens && (
          <div className="proof-tech-sub">
            <i className="fas fa-circle-notch"></i>
            <span>
              {photo.lens} · {photo.settings}
            </span>
          </div>
        )}

        {hasNote && (
          <div className="proof-saved-note-pill">
            <i className="fas fa-comment-alt"></i>
            <div className="note-text-content">
              <strong>
                {currentLang === 'ar' ? 'ملاحظة العميل للريتاتش:' : 'Retouch note:'}
              </strong>{' '}
              {savedNote}
            </div>
            <button
              type="button"
              className="note-edit-icon"
              onClick={(e) => onOpenNote(photo.id, e)}
            >
              <i className="fas fa-pen"></i>
            </button>
          </div>
        )}

        {isNoteComposerOpen && (
          <div className="proof-note-composer" onClick={(e) => e.stopPropagation()}>
            <textarea
              rows={3}
              placeholder={t.portal_note_placeholder}
              value={noteDraft}
              onChange={(e) => onChangeNoteDraft(e.target.value)}
              autoFocus
            />
            <div className="note-composer-actions">
              <button type="button" className="note-btn-cancel" onClick={onCancelNote}>
                {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                className="note-btn-save"
                onClick={() => onSaveNote(photo.id)}
              >
                {t.portal_save_note}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Language } from '../../types';
import { ClientSession } from '../../data/clientPortalData';
import { TranslationDictionary } from '../../data/translations';
import { ClientPortalFooter } from '../ClientPortalFooter';
import { PortalProofCard } from './PortalProofCard';

interface PortalSessionWorkspaceProps {
  currentLang: Language;
  t: TranslationDictionary;
  activeSession: ClientSession;
  isCloudSession: boolean;
  isIsolatedMode: boolean;
  selectedCount: number;
  filterMode: 'all' | 'favorites';
  favorites: Record<string, boolean>;
  notes: Record<string, string>;
  activeNotePhotoId: string | null;
  noteDraft: string;
  onChangeFilterMode: (mode: 'all' | 'favorites') => void;
  onCopyDirectLink: () => void;
  onDownloadAll: () => void;
  onSubmitProofs: () => void;
  onToggleIsolatedMode?: (isolated: boolean) => void;
  onLogout: () => void;
  onOpenLightbox: (photoIndex: number, mode?: 'default' | 'exif' | 'wallart') => void;
  onToggleFavorite: (photoId: string, e?: React.MouseEvent) => void;
  onOpenNote: (photoId: string, e?: React.MouseEvent) => void;
  onChangeNoteDraft: (val: string) => void;
  onCancelNote: () => void;
  onSaveNote: (photoId: string) => void;
  onDownloadSingle: (photoId: string, url: string, e?: React.MouseEvent) => void;
}

export const PortalSessionWorkspace: React.FC<PortalSessionWorkspaceProps> = ({
  currentLang,
  t,
  activeSession,
  isCloudSession,
  isIsolatedMode,
  selectedCount,
  filterMode,
  favorites,
  notes,
  activeNotePhotoId,
  noteDraft,
  onChangeFilterMode,
  onCopyDirectLink,
  onDownloadAll,
  onSubmitProofs,
  onToggleIsolatedMode,
  onLogout,
  onOpenLightbox,
  onToggleFavorite,
  onOpenNote,
  onChangeNoteDraft,
  onCancelNote,
  onSaveNote,
  onDownloadSingle,
}) => {
  return (
    <div className="portal-workspace">
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
            {currentLang === 'ar' ? activeSession.projectTitleAr : activeSession.projectTitleEn}
          </h3>

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
            onClick={onCopyDirectLink}
            title={
              currentLang === 'ar'
                ? 'نسخ الرابط السري المباشر للجلسة لمشاركته مع العميل'
                : 'Copy direct secret link for client'
            }
          >
            <i className="fas fa-link"></i>
            <span>{currentLang === 'ar' ? 'مشاركة الرابط السري' : 'Share Direct Link'}</span>
          </button>
          <button
            type="button"
            className="btn btn-outline portal-btn-sm"
            onClick={onDownloadAll}
          >
            <i className="fas fa-cloud-download-alt"></i>
            <span>{t.portal_download_all}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary portal-btn-sm"
            onClick={onSubmitProofs}
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
            onClick={onLogout}
            title={t.portal_lock_and_exit}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>{t.portal_lock_and_exit}</span>
          </button>
        </div>
      </div>

      <div className="portal-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className={`toolbar-tab ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => onChangeFilterMode('all')}
          >
            <i className="fas fa-th"></i>
            <span>
              {t.portal_all_photos} ({activeSession.photos.length})
            </span>
          </button>
          <button
            type="button"
            className={`toolbar-tab ${filterMode === 'favorites' ? 'active' : ''}`}
            onClick={() => onChangeFilterMode('favorites')}
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
              onOpenLightbox={onOpenLightbox}
              onToggleFavorite={onToggleFavorite}
              onOpenNote={onOpenNote}
              onChangeNoteDraft={onChangeNoteDraft}
              onCancelNote={onCancelNote}
              onSaveNote={onSaveNote}
              onDownloadSingle={onDownloadSingle}
            />
          ))}
      </div>

      <ClientPortalFooter currentLang={currentLang} activeSession={activeSession} />
    </div>
  );
};

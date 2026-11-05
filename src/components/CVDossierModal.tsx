import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { cvData } from '../data/cvData';

interface CVDossierModalProps {
  currentLang: Language;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

type CVWing = 'manifesto' | 'exhibitions' | 'awards' | 'gear' | 'partners';

export const CVDossierModal: React.FC<CVDossierModalProps> = ({
  currentLang,
  onClose,
  onShowToast,
}) => {
  const [activeWing, setActiveWing] = useState<CVWing>('manifesto');
  const t = translations[currentLang];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBio = () => {
    const bioText = currentLang === 'ar' ? cvData.artistStatementAr : cvData.artistStatementEn;
    navigator.clipboard.writeText(bioText);
    onShowToast(
      currentLang === 'ar'
        ? 'تم نسخ البيان الفني بنجاح إلى الحافظة.'
        : 'Artist statement copied to clipboard.'
    );
  };

  return (
    <div className="dossier-modal-overlay" role="dialog" aria-modal="true">
      <div className="dossier-modal-dialog">
        {/* Header Bar with Safe Distance Architecture */}
        <div className="dossier-modal-header">
          <div className="dossier-header-profile">
            <div className="dossier-avatar">
              <img
                src="/images/1.jpg"
                alt="Enaam Ali Osman"
                onError={(e) => {
                  e.currentTarget.src = '/images/1.jpg';
                }}
              />
              <span className="dossier-status-dot" title="Verified Practitioner"></span>
            </div>
            <div className="dossier-profile-text">
              <div className="dossier-badge-row">
                <span className="dossier-pill-gold">
                  <i className="fas fa-certificate"></i>{' '}
                  {currentLang === 'ar' ? 'سيرة معتمدة رسمياً' : 'Official Verified Dossier'}
                </span>
                <span className="accredited-archive-stamp">
                  <i className="fas fa-stamp"></i>{' '}
                  {currentLang === 'ar' ? 'أرشيف توثيقي معتمد' : 'Accredited Archive'}
                </span>
              </div>
              <h2 className="dossier-name">
                {currentLang === 'ar' ? 'إنعام علي عثمان' : 'ENAAM ALI OSMAN'}
              </h2>
              <p className="dossier-sub">
                {currentLang === 'ar'
                  ? 'خبرة ميدانية موثقة في صحافة الصورة، التنمية، وتضخيم أصوات المجتمعات'
                  : 'Documentary Storyteller · Visual Journalist · Community Trainer'}
              </p>
            </div>
          </div>

          {/* Action Tools & Isolated Safe Close Container */}
          <div className="dossier-header-controls">
            <div className="dossier-action-cluster">
              <button
                type="button"
                className="btn btn-outline dossier-btn-sm"
                onClick={handleCopyBio}
                title="Copy Bio"
              >
                <i className="far fa-copy"></i>
                <span>{currentLang === 'ar' ? 'نسخ البيان' : 'Copy Bio'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary dossier-btn-sm"
                onClick={handlePrint}
                title="Download or Print CV"
              >
                <i className="fas fa-file-pdf"></i>
                <span>{t.btn_download_cv}</span>
              </button>
            </div>

            {/* Safe Distance Divider */}
            <div className="dossier-controls-divider" aria-hidden="true"></div>

            {/* Isolated Close Button with Safe Distance Target (min 44px) */}
            <div className="dossier-close-safe-zone">
              <button
                type="button"
                className="dossier-close-btn"
                onClick={onClose}
                aria-label={currentLang === 'ar' ? 'إغلاق السيرة الذاتية' : 'Close dossier'}
                title={currentLang === 'ar' ? 'إغلاق (Esc)' : 'Close (Esc)'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Curated Wings Navigation (أركان السيرة والاعتمادات) */}
        <div className="dossier-wings-nav" role="tablist" aria-label="Curated CV Wings">
          <button
            className={`dossier-wing-tab ${activeWing === 'manifesto' ? 'active' : ''}`}
            onClick={() => setActiveWing('manifesto')}
          >
            <i className="fas fa-feather-alt"></i>
            <span className="wing-tab-title">{t.cv_tab_statement}</span>
            <span className="wing-badge-num">01</span>
          </button>
          <button
            className={`dossier-wing-tab ${activeWing === 'exhibitions' ? 'active' : ''}`}
            onClick={() => setActiveWing('exhibitions')}
          >
            <i className="fas fa-landmark"></i>
            <span className="wing-tab-title">{t.cv_tab_exhibitions}</span>
            <span className="wing-badge-num">02</span>
          </button>
          <button
            className={`dossier-wing-tab ${activeWing === 'awards' ? 'active' : ''}`}
            onClick={() => setActiveWing('awards')}
          >
            <i className="fas fa-award"></i>
            <span className="wing-tab-title">{t.cv_tab_awards}</span>
            <span className="wing-badge-num">03</span>
          </button>
          <button
            className={`dossier-wing-tab ${activeWing === 'gear' ? 'active' : ''}`}
            onClick={() => setActiveWing('gear')}
          >
            <i className="fas fa-camera"></i>
            <span className="wing-tab-title">{t.cv_tab_gear}</span>
            <span className="wing-badge-num">04</span>
          </button>
          <button
            className={`dossier-wing-tab ${activeWing === 'partners' ? 'active' : ''}`}
            onClick={() => setActiveWing('partners')}
          >
            <i className="fas fa-handshake"></i>
            <span className="wing-tab-title">{t.cv_tab_clients}</span>
            <span className="wing-badge-num">05</span>
          </button>
        </div>

        {/* Dossier Content Body with Safe Spatial Rhythm */}
        <div className="dossier-modal-body">
          {/* Wing 1: Manifesto, Impact Metrics & Education */}
          {activeWing === 'manifesto' && (
            <div className="dossier-content-card wing-manifesto">
              {/* Impact Highlights Matrix */}
              <div className="wing-impact-matrix">
                <div className="impact-matrix-card">
                  <span className="matrix-number">8+</span>
                  <span className="matrix-label">
                    {currentLang === 'ar' ? 'سنوات توثيق ميداني' : 'Years Field Experience'}
                  </span>
                </div>
                <div className="impact-matrix-card">
                  <span className="matrix-number">12+</span>
                  <span className="matrix-label">
                    {currentLang === 'ar' ? 'معرضاً ومحطة دولية' : 'Exhibitions & Stages'}
                  </span>
                </div>
                <div className="impact-matrix-card">
                  <span className="matrix-number">15+</span>
                  <span className="matrix-label">
                    {currentLang === 'ar' ? 'منظمة وهيئة شريكة' : 'Institutional Partners'}
                  </span>
                </div>
                <div className="impact-matrix-card">
                  <span className="matrix-number">100%</span>
                  <span className="matrix-label">
                    {currentLang === 'ar' ? 'معايير الحماية والكرامة' : 'Protection & Dignity'}
                  </span>
                </div>
              </div>

              {/* Curated Statement Box */}
              <div className="wing-section-block">
                <div className="cv-statement-box">
                  <div className="statement-header-row">
                    <i className="fas fa-quote-right quote-accent"></i>
                    <span className="statement-tag">
                      {currentLang === 'ar' ? 'البيان التوثيقي المعتمد' : 'Official Documentary Manifesto'}
                    </span>
                  </div>
                  <p className="statement-text">
                    {currentLang === 'ar' ? cvData.artistStatementAr : cvData.artistStatementEn}
                  </p>
                </div>
              </div>

              {/* Education & Training Block with Safe Spacing */}
              <div className="wing-section-block">
                <h3 className="sub-title">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{currentLang === 'ar' ? 'المؤهلات الأكاديمية والتدريبية' : 'Academic Education & Specialized Training'}</span>
                </h3>
                <div className="editorial-narrative-spine">
                  {cvData.education.map((edu, idx) => (
                    <div key={idx} className="editorial-story-milestone">
                      <div className="editorial-chrono-node" aria-hidden="true"></div>
                      <div className="editorial-story-card">
                        <div className="editorial-card-header">
                          <span className="timeline-year-chip" dir="ltr">{edu.year}</span>
                          <span className="badge-tag">
                            <i className="fas fa-graduation-cap text-gold" style={{ marginInlineEnd: 6 }}></i>
                            {currentLang === 'ar' ? 'تأهيل أكاديمي موثق' : 'Accredited Qualification'}
                          </span>
                        </div>
                        <h4 className="editorial-card-title">{currentLang === 'ar' ? edu.degreeAr : edu.degreeEn}</h4>
                        <p className="editorial-meta-row">
                          <span className="editorial-meta-item">
                            <i className="fas fa-university text-gold"></i>
                            <span>{currentLang === 'ar' ? edu.institutionAr : edu.institutionEn}</span>
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wing 2: International Exhibitions Timeline */}
          {activeWing === 'exhibitions' && (
            <div className="dossier-content-card wing-exhibitions">
              <div className="wing-intro-bar">
                <i className="fas fa-landmark text-gold"></i>
                <p>
                  {currentLang === 'ar'
                    ? 'المحطات والمعارض الفنية والتوثيقية التي احتضنت أعمال إنعام علي عثمان محلياً ودولياً:'
                    : 'Curated national and international exhibitions, festivals, and cultural forums showcasing Enaam Ali Osman:'}
                </p>
              </div>

              <div className="editorial-narrative-spine">
                {cvData.exhibitions.map((ex, idx) => (
                  <div key={idx} className="editorial-story-milestone">
                    <div className="editorial-chrono-node" aria-hidden="true"></div>
                    <div className="editorial-story-card">
                      <div className="editorial-card-header">
                        <span className="timeline-year-chip" dir="ltr">{ex.year}</span>
                        <span className="badge-tag">
                          {currentLang === 'ar' ? ex.typeAr : ex.typeEn}
                        </span>
                        {(ex.roleAr || ex.roleEn) && (
                          <span className="timeline-role">
                            {currentLang === 'ar' ? ex.roleAr : ex.roleEn}
                          </span>
                        )}
                      </div>
                      <h4 className="editorial-card-title">{currentLang === 'ar' ? ex.titleAr : ex.titleEn}</h4>
                      <p className="editorial-meta-row">
                        <span className="editorial-meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{currentLang === 'ar' ? ex.locationAr : ex.locationEn}</span>
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wing 3: Grants & Honours */}
          {activeWing === 'awards' && (
            <div className="dossier-content-card wing-awards">
              <div className="wing-intro-bar">
                <i className="fas fa-award text-gold"></i>
                <p>
                  {currentLang === 'ar'
                    ? 'الجوائز والزمالات التقديرية والمنح الدولية تقديراً للالتزام بصحافة الصورة الإنسانية:'
                    : 'Fellowships, grants, and international honors recognizing ethical documentary photojournalism:'}
                </p>
              </div>

              <div className="editorial-narrative-spine">
                {cvData.awards.map((award, idx) => (
                  <div key={idx} className="editorial-story-milestone">
                    <div className="editorial-chrono-node" aria-hidden="true"></div>
                    <div className="editorial-story-card">
                      <div className="editorial-card-header">
                        <span className="timeline-year-chip" dir="ltr">{award.year}</span>
                        {award.badge && <span className="badge-tag">{award.badge}</span>}
                        <span className="badge-tag">
                          <i className="fas fa-trophy text-gold" style={{ marginInlineEnd: 6 }}></i>
                          {currentLang === 'ar' ? 'تكريم دولي' : 'Honorary Recognition'}
                        </span>
                      </div>
                      <h4 className="editorial-card-title">{currentLang === 'ar' ? award.titleAr : award.titleEn}</h4>
                      <p className="editorial-meta-row">
                        <span className="editorial-meta-item">
                          <i className="fas fa-landmark text-gold"></i>
                          <span>{currentLang === 'ar' ? award.organizationAr : award.organizationEn}</span>
                        </span>
                      </p>
                      <p className="editorial-card-desc">
                        {currentLang === 'ar' ? award.descriptionAr : award.descriptionEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wing 4: Field Optics & Gear Kit */}
          {activeWing === 'gear' && (
            <div className="dossier-content-card wing-gear">
              <div className="wing-intro-bar">
                <i className="fas fa-camera text-gold"></i>
                <p>
                  {currentLang === 'ar'
                    ? 'العتاد التقني والعدسات الميدانية المصممة للظروف الصعبة وضمان أعلى دقة وضوح للأرشفة الدولية:'
                    : 'Field-ready technical optics, cinema-grade sensors, and rugged gear deployed across missions:'}
                </p>
              </div>

              <div className="editorial-narrative-spine">
                {cvData.gear.map((kit, idx) => (
                  <div key={idx} className="editorial-story-milestone">
                    <div className="editorial-chrono-node" aria-hidden="true"></div>
                    <div className="editorial-story-card">
                      <div className="editorial-card-header">
                        <span className="badge-tag">
                          <i className="fas fa-toolbox text-gold" style={{ marginInlineEnd: 6 }}></i>
                          {currentLang === 'ar' ? 'عتاد ميداني متخصص' : 'Field Technical Kit'}
                        </span>
                      </div>
                      <h4 className="editorial-card-title">{currentLang === 'ar' ? kit.categoryAr : kit.categoryEn}</h4>

                      <div className="gear-editorial-items-grid">
                        {kit.items.map((item, iIdx) => (
                          <div key={iIdx} className="gear-editorial-item-box">
                            <div className="gear-item-head">
                              <i className={item.icon || 'fas fa-camera text-gold'}></i>
                              <strong className="gear-item-name">{item.name}</strong>
                            </div>
                            <p className="editorial-card-desc">{currentLang === 'ar' ? item.descriptionAr : item.descriptionEn}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wing 5: Partner Network */}
          {activeWing === 'partners' && (
            <div className="dossier-content-card wing-partners">
              <div className="wing-intro-bar">
                <i className="fas fa-handshake text-gold"></i>
                <p>
                  {currentLang === 'ar'
                    ? 'المنظمات والهيئات الدولية والمؤسسات المجتمعية التي وثّقت إنعام مشاريعها وبرامجها الميدانية:'
                    : 'International organizations, UN agencies, and community bodies trusting Enaam with field storytelling:'}
                </p>
              </div>

              <div className="editorial-narrative-spine">
                {cvData.clients.map((client, idx) => (
                  <div key={idx} className="editorial-story-milestone">
                    <div className="editorial-chrono-node" aria-hidden="true"></div>
                    <div className="editorial-story-card">
                      <div className="editorial-card-header">
                        <span className="badge-tag">
                          <i className="fas fa-shield-alt text-gold" style={{ marginInlineEnd: 6 }}></i>
                          {currentLang === 'ar' ? 'منظمة وشريك ميداني' : 'Field Partner & Agency'}
                        </span>
                      </div>
                      <h4 className="editorial-card-title">{client.name}</h4>
                      <p className="editorial-card-desc">
                        {currentLang === 'ar' ? client.roleAr : client.roleEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

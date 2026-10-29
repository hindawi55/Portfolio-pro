import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { cvData } from '../data/cvData';

interface CVDossierModalProps {
  currentLang: Language;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

type CVTab = 'statement' | 'exhibitions' | 'awards' | 'gear' | 'clients';

export const CVDossierModal: React.FC<CVDossierModalProps> = ({
  currentLang,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<CVTab>('statement');
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
        {/* Header Bar */}
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
                  <i className="fas fa-certificate"></i> {currentLang === 'ar' ? 'سيرة ذاتية رسمية معتمدة' : 'Official Verified Dossier'}
                </span>
                <span className="dossier-pill-subtle">
                  <i className="fas fa-camera"></i> {currentLang === 'ar' ? 'مصورة توثيقية' : 'Documentary Photojournalist'}
                </span>
              </div>
              <h2 className="dossier-name">
                {currentLang === 'ar' ? 'إنعام علي عثمان' : 'ENAAM ALI OSMAN'}
              </h2>
              <p className="dossier-sub">
                {currentLang === 'ar'
                  ? 'خبرة ميدانية موثقة في صحافة الصورة والتنمية وحقوق الإنسان'
                  : 'Documentary Storyteller · Visual Journalist · Community Trainer'}
              </p>
            </div>
          </div>

          <div className="dossier-header-actions">
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
            <button
              type="button"
              className="dossier-close-btn"
              onClick={onClose}
              aria-label="Close dossier"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dossier-tabs-nav" role="tablist">
          <button
            className={`dossier-tab ${activeTab === 'statement' ? 'active' : ''}`}
            onClick={() => setActiveTab('statement')}
          >
            <i className="fas fa-feather-alt"></i>
            <span>{t.cv_tab_statement}</span>
          </button>
          <button
            className={`dossier-tab ${activeTab === 'exhibitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('exhibitions')}
          >
            <i className="fas fa-landmark"></i>
            <span>{t.cv_tab_exhibitions}</span>
          </button>
          <button
            className={`dossier-tab ${activeTab === 'awards' ? 'active' : ''}`}
            onClick={() => setActiveTab('awards')}
          >
            <i className="fas fa-award"></i>
            <span>{t.cv_tab_awards}</span>
          </button>
          <button
            className={`dossier-tab ${activeTab === 'gear' ? 'active' : ''}`}
            onClick={() => setActiveTab('gear')}
          >
            <i className="fas fa-camera"></i>
            <span>{t.cv_tab_gear}</span>
          </button>
          <button
            className={`dossier-tab ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <i className="fas fa-handshake"></i>
            <span>{t.cv_tab_clients}</span>
          </button>
        </div>

        {/* Dossier Content Body */}
        <div className="dossier-modal-body">
          {/* Tab 1: Statement & Background */}
          {activeTab === 'statement' && (
            <div className="dossier-content-card">
              <div className="cv-statement-box">
                <i className="fas fa-quote-right quote-accent"></i>
                <p className="statement-text">
                  {currentLang === 'ar' ? cvData.artistStatementAr : cvData.artistStatementEn}
                </p>
              </div>

              <div className="cv-education-grid">
                <h3 className="sub-title">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{currentLang === 'ar' ? 'المؤهلات الأكاديمية والتدريبية' : 'Education & Training'}</span>
                </h3>
                <div className="edu-list">
                  {cvData.education.map((edu, idx) => (
                    <div key={idx} className="edu-item">
                      <span className="edu-year">{edu.year}</span>
                      <div className="edu-details">
                        <h4>{currentLang === 'ar' ? edu.degreeAr : edu.degreeEn}</h4>
                        <span className="edu-inst">
                          {currentLang === 'ar' ? edu.institutionAr : edu.institutionEn}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Exhibitions */}
          {activeTab === 'exhibitions' && (
            <div className="dossier-content-card">
              <div className="timeline-grid">
                {cvData.exhibitions.map((ex, idx) => (
                  <div key={idx} className="timeline-card">
                    <div className="timeline-header">
                      <span className="timeline-year">{ex.year}</span>
                      <span className="badge-tag">
                        {currentLang === 'ar' ? ex.typeAr : ex.typeEn}
                      </span>
                    </div>
                    <h4>{currentLang === 'ar' ? ex.titleAr : ex.titleEn}</h4>
                    <p className="timeline-venue">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{currentLang === 'ar' ? ex.locationAr : ex.locationEn}</span>
                    </p>
                    {(ex.roleAr || ex.roleEn) && (
                      <span className="timeline-role">
                        {currentLang === 'ar' ? ex.roleAr : ex.roleEn}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Grants & Awards */}
          {activeTab === 'awards' && (
            <div className="dossier-content-card">
              <div className="awards-grid">
                {cvData.awards.map((award, idx) => (
                  <div key={idx} className="award-card">
                    <div className="award-icon-box">
                      <i className="fas fa-trophy"></i>
                    </div>
                    <div className="award-body">
                      <div className="award-meta-top">
                        <span className="award-year">{award.year}</span>
                        {award.badge && <span className="award-badge-pill">{award.badge}</span>}
                      </div>
                      <h4>{currentLang === 'ar' ? award.titleAr : award.titleEn}</h4>
                      <p className="award-org">
                        {currentLang === 'ar' ? award.organizationAr : award.organizationEn}
                      </p>
                      <p className="award-desc">
                        {currentLang === 'ar' ? award.descriptionAr : award.descriptionEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: What's in My Bag (Gear Specs) */}
          {activeTab === 'gear' && (
            <div className="dossier-content-card">
              <div className="gear-master-grid">
                {cvData.gear.map((kit, idx) => (
                  <div key={idx} className="gear-category-card">
                    <div className="gear-category-header">
                      <i className="fas fa-toolbox"></i>
                      <h4>{currentLang === 'ar' ? kit.categoryAr : kit.categoryEn}</h4>
                    </div>
                    <ul className="gear-items-list">
                      {kit.items.map((item, iIdx) => (
                        <li key={iIdx} className="gear-item-row">
                          <i className={item.icon || 'fas fa-check-circle'}></i>
                          <div className="gear-text">
                            <strong>{item.name}</strong>
                            <p>{currentLang === 'ar' ? item.descriptionAr : item.descriptionEn}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Clients & Partners */}
          {activeTab === 'clients' && (
            <div className="dossier-content-card">
              <div className="clients-press-container">
                <div className="clients-group">
                  <h3 className="group-title">
                    <i className="fas fa-building"></i>
                    <span>{currentLang === 'ar' ? 'المنظمات والشركاء الميدانيين' : 'Selected Partners & Clients'}</span>
                  </h3>
                  <div className="partners-chips-grid">
                    {cvData.clients.map((client, idx) => (
                      <div key={idx} className="partner-chip">
                        <i className="fas fa-shield-alt"></i>
                        <div className="partner-info">
                          <span className="partner-name">{client.name}</span>
                          <span className="partner-role">
                            {currentLang === 'ar' ? client.roleAr : client.roleEn}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

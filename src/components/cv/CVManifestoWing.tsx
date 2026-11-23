import React from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface CVManifestoWingProps {
  currentLang: Language;
}

export const CVManifestoWing: React.FC<CVManifestoWingProps> = ({ currentLang }) => {
  const { cvDossier } = useSiteCMS();
  return (
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
            {currentLang === 'ar' ? cvDossier.artistStatementAr : cvDossier.artistStatementEn}
          </p>
        </div>
      </div>

      {/* Education & Training Block with Safe Spacing */}
      <div className="wing-section-block">
        <h3 className="sub-title">
          <i className="fas fa-graduation-cap"></i>
          <span>
            {currentLang === 'ar'
              ? 'المؤهلات الأكاديمية والتدريبية'
              : 'Academic Education & Specialized Training'}
          </span>
        </h3>
        <div className="editorial-narrative-spine">
          {cvDossier.education.map((edu, idx) => (
            <div key={idx} className="editorial-story-milestone">
              <div className="editorial-chrono-node" aria-hidden="true"></div>
              <div className="editorial-story-card">
                <div className="editorial-card-header">
                  <span className="timeline-year-chip" dir="ltr">
                    {edu.year}
                  </span>
                  <span className="badge-tag">
                    <i
                      className="fas fa-graduation-cap text-gold"
                      style={{ marginInlineEnd: 6 }}
                    ></i>
                    {currentLang === 'ar' ? 'تأهيل أكاديمي موثق' : 'Accredited Qualification'}
                  </span>
                </div>
                <h4 className="editorial-card-title">
                  {currentLang === 'ar' ? edu.degreeAr : edu.degreeEn}
                </h4>
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
  );
};

import React from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface CVWingProps {
  currentLang: Language;
}

export const CVExhibitionsWing: React.FC<CVWingProps> = ({ currentLang }) => {
  const { cvDossier } = useSiteCMS();
  return (
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
        {cvDossier.exhibitions.map((ex, idx) => (
          <div key={idx} className="editorial-story-milestone">
            <div className="editorial-chrono-node" aria-hidden="true"></div>
            <div className="editorial-story-card">
              <div className="editorial-card-header">
                <span className="timeline-year-chip" dir="ltr">
                  {ex.year}
                </span>
                <span className="badge-tag">{currentLang === 'ar' ? ex.typeAr : ex.typeEn}</span>
                {(ex.roleAr || ex.roleEn) && (
                  <span className="timeline-role">
                    {currentLang === 'ar' ? ex.roleAr : ex.roleEn}
                  </span>
                )}
              </div>
              <h4 className="editorial-card-title">
                {currentLang === 'ar' ? ex.titleAr : ex.titleEn}
              </h4>
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
  );
};

export const CVAwardsWing: React.FC<CVWingProps> = ({ currentLang }) => {
  const { cvDossier } = useSiteCMS();
  return (
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
        {cvDossier.awards.map((award, idx) => (
          <div key={idx} className="editorial-story-milestone">
            <div className="editorial-chrono-node" aria-hidden="true"></div>
            <div className="editorial-story-card">
              <div className="editorial-card-header">
                <span className="timeline-year-chip" dir="ltr">
                  {award.year}
                </span>
                {award.badge && <span className="badge-tag">{award.badge}</span>}
                <span className="badge-tag">
                  <i className="fas fa-trophy text-gold" style={{ marginInlineEnd: 6 }}></i>
                  {currentLang === 'ar' ? 'تكريم دولي' : 'Honorary Recognition'}
                </span>
              </div>
              <h4 className="editorial-card-title">
                {currentLang === 'ar' ? award.titleAr : award.titleEn}
              </h4>
              <p className="editorial-meta-row">
                <span className="editorial-meta-item">
                  <i className="fas fa-landmark text-gold"></i>
                  <span>
                    {currentLang === 'ar' ? award.organizationAr : award.organizationEn}
                  </span>
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
  );
};

export const CVGearWing: React.FC<CVWingProps> = ({ currentLang }) => {
  const { cvDossier } = useSiteCMS();
  return (
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
        {cvDossier.gear.map((kit, idx) => (
          <div key={idx} className="editorial-story-milestone">
            <div className="editorial-chrono-node" aria-hidden="true"></div>
            <div className="editorial-story-card">
              <div className="editorial-card-header">
                <span className="badge-tag">
                  <i className="fas fa-toolbox text-gold" style={{ marginInlineEnd: 6 }}></i>
                  {currentLang === 'ar' ? 'عتاد ميداني متخصص' : 'Field Technical Kit'}
                </span>
              </div>
              <h4 className="editorial-card-title">
                {currentLang === 'ar' ? kit.categoryAr : kit.categoryEn}
              </h4>

              <div className="gear-editorial-items-grid">
                {kit.items.map((item, iIdx) => (
                  <div key={iIdx} className="gear-editorial-item-box">
                    <div className="gear-item-head">
                      <i className={item.icon || 'fas fa-camera text-gold'}></i>
                      <strong className="gear-item-name">{item.name}</strong>
                    </div>
                    <p className="editorial-card-desc">
                      {currentLang === 'ar' ? item.descriptionAr : item.descriptionEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CVPartnersWing: React.FC<CVWingProps> = ({ currentLang }) => {
  const { cvDossier } = useSiteCMS();
  return (
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
        {cvDossier.clients.map((client, idx) => (
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
  );
};

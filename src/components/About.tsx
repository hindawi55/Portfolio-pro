import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface AboutProps {
  currentLang: Language;
}

export const About: React.FC<AboutProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <section className="section about" id="about">
      <div className="section-header reveal active">
        <div className="section-label">{t.about_label}</div>
        <h2 className="section-title">{t.about_title}</h2>
        <p className="section-desc">{t.about_desc}</p>
      </div>

      <div className="about-grid">
        <div className="arch-stage reveal active">
          {/* Atmospheric Circular Lens Flare Halo */}
          <div className="arch-lens-halo">
            <div className="halo-ring ring-1"></div>
            <div className="halo-ring ring-2"></div>
          </div>

          {/* Luxury Arch Portrait Card */}
          <div className="arch-card">
            {/* Arched Vault Photo */}
            <div className="arch-photo-frame">
              <img
                src="/images/1.jpg"
                alt="Enaam Ali Osman"
                className="arch-photo-img"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = '/images/1.jpg';
                }}
              />
            </div>

            {/* Archive Metadata Footer */}
            <div className="arch-card-footer">
              <div className="arch-meta-start">
                <span className="arch-meta-name">{t.arch_name}</span>
                <span className="arch-meta-role">{t.arch_role}</span>
              </div>
              <div className="arch-meta-end">
                <span className="arch-meta-code">{t.arch_code_prefix}</span>
                <span className="arch-meta-archive">{t.arch_code_num}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="about-content reveal active">
          <h3>{t.about_heading}</h3>
          <p>{t.about_p1}</p>
          <p>{t.about_p2}</p>
          <div className="about-stats">
            <div className="stat-item">
              <h4>2+</h4>
              <span>{t.stat_years}</span>
            </div>
            <div className="stat-item">
              <h4>57+</h4>
              <span>{t.stat_projects}</span>
            </div>
            <div className="stat-item">
              <h4>7+</h4>
              <span>{t.stat_workshops}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ServicesProps {
  currentLang: Language;
}

export const Services: React.FC<ServicesProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <section className="section services" id="services">
      <div className="section-header reveal active">
        <div className="section-label">{t.services_label}</div>
        <h2 className="section-title">{t.services_title}</h2>
        <p className="section-desc">{t.services_desc}</p>
      </div>

      <div className="services-grid">
        <div className="service-card reveal active">
          <div className="service-icon">
            <i className="fas fa-camera"></i>
          </div>
          <h4>{t.service_1_title}</h4>
          <p>{t.service_1_desc}</p>
        </div>

        <div className="service-card reveal active">
          <div className="service-icon">
            <i className="fas fa-video"></i>
          </div>
          <h4>{t.service_2_title}</h4>
          <p>{t.service_2_desc}</p>
        </div>

        <div className="service-card reveal active">
          <div className="service-icon">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          <h4>{t.service_3_title}</h4>
          <p>{t.service_3_desc}</p>
        </div>

        <div className="service-card reveal active">
          <div className="service-icon">
            <i className="fas fa-pen-nib"></i>
          </div>
          <h4>{t.service_4_title}</h4>
          <p>{t.service_4_desc}</p>
        </div>

        <div className="service-card reveal active">
          <div className="service-icon">
            <i className="fas fa-users"></i>
          </div>
          <h4>{t.service_5_title}</h4>
          <p>{t.service_5_desc}</p>
        </div>

        <div className="service-card reveal active">
          <div className="service-icon">
            <i className="fas fa-globe"></i>
          </div>
          <h4>{t.service_6_title}</h4>
          <p>{t.service_6_desc}</p>
        </div>
      </div>
    </section>
  );
};

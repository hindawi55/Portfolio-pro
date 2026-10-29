import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface MissionProps {
  currentLang: Language;
}

export const Mission: React.FC<MissionProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <section className="section mission" id="mission">
      <div className="section-header reveal active">
        <div className="section-label">{t.mission_label}</div>
        <h2 className="section-title">{t.mission_title}</h2>
        <p className="section-desc">{t.mission_desc}</p>
      </div>

      <div className="mission-grid">
        <div className="mission-card reveal active">
          <div className="mission-number">01</div>
          <h4>{t.mission_1_title}</h4>
          <p>{t.mission_1_desc}</p>
        </div>

        <div className="mission-card reveal active">
          <div className="mission-number">02</div>
          <h4>{t.mission_2_title}</h4>
          <p>{t.mission_2_desc}</p>
        </div>

        <div className="mission-card reveal active">
          <div className="mission-number">03</div>
          <h4>{t.mission_3_title}</h4>
          <p>{t.mission_3_desc}</p>
        </div>

        <div className="mission-card reveal active">
          <div className="mission-number">04</div>
          <h4>{t.mission_4_title}</h4>
          <p>{t.mission_4_desc}</p>
        </div>
      </div>
    </section>
  );
};

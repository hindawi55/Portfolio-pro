import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface HeroProps {
  currentLang: Language;
}

export const Hero: React.FC<HeroProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="home">
      <div className="hero-bg">
        <div className="hero-grid"></div>
      </div>
      <div className="hero-content">
        <div className="hero-label">{t.hero_label}</div>
        <h1 className="hero-title">
          <span className="highlight">{t.hero_name_ar}</span> <span>{t.hero_name_en}</span>
        </h1>
        <p className="hero-subtitle">{t.hero_subtitle}</p>
        <div className="hero-cta">
          <a
            href="#portfolio"
            onClick={(e) => scrollTo(e, '#portfolio')}
            className="btn btn-primary"
          >
            <i className="fas fa-images"></i>
            <span>{t.btn_works}</span>
          </a>
          <a
            href="#contact"
            onClick={(e) => scrollTo(e, '#contact')}
            className="btn btn-outline"
          >
            <i className="fas fa-envelope"></i>
            <span>{t.btn_contact}</span>
          </a>
        </div>
      </div>
      <div className="hero-scroll">
        <span>{t.scroll}</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
};

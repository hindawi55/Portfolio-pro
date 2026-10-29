import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface NavigationProps {
  currentLang: Language;
  onToggleLang: () => void;
  onOpenCVDossier?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentLang,
  onToggleLang,
  onOpenCVDossier,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const t = translations[currentLang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (targetId === '#cv' && onOpenCVDossier) {
      onOpenCVDossier();
      return;
    }
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav ref={navRef} className={`nav ${isScrolled ? 'scrolled' : ''}`} id="nav">
      {/* Shortened 2-word Brand Logo */}
      <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="nav-logo">
        {currentLang === 'ar' ? (
          <>إنعام <span>عثمان</span></>
        ) : (
          <>ENAAM <span>OSMAN</span></>
        )}
      </a>

      {/* Mobile Drawer */}
      <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`} id="navLinks">
        <li className="nav-drawer-header">
          <a
            href="#cv"
            onClick={(e) => handleNavClick(e, '#cv')}
            className="nav-drawer-cv-badge"
            title={currentLang === 'ar' ? 'استعراض السيرة الذاتية والاعتمادات الرسمية' : 'View Verified Credentials & Bio'}
          >
            <div className="cv-badge-icon">
              <i className="fas fa-certificate"></i>
            </div>
            <div className="cv-badge-info">
              <span className="cv-badge-name">{currentLang === 'ar' ? 'إنعام عثمان' : 'Enaam Osman'}</span>
              <span className="cv-badge-role">{currentLang === 'ar' ? 'السيرة والاعتمادات الرسمية ↗' : 'Verified Credentials & Bio ↗'}</span>
            </div>
          </a>
        </li>

        <li className="nav-item">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')}>
            <i className="fas fa-home nav-item-icon"></i>
            <span>{t.nav_home}</span>
          </a>
        </li>
        <li className="nav-item">
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>
            <i className="fas fa-user-circle nav-item-icon"></i>
            <span>{t.nav_about}</span>
          </a>
        </li>
        <li className="nav-item">
          <a href="#cv" onClick={(e) => handleNavClick(e, '#cv')} className="nav-highlight-link">
            <i className="fas fa-award nav-item-icon"></i>
            <span>{t.nav_cv}</span>
            <span className="nav-item-badge">CV</span>
          </a>
        </li>
        <li className="nav-item">
          <a href="#portfolio" onClick={(e) => handleNavClick(e, '#portfolio')}>
            <i className="fas fa-camera-retro nav-item-icon"></i>
            <span>{t.nav_portfolio}</span>
          </a>
        </li>
        <li className="nav-item">
          <a href="#services" onClick={(e) => handleNavClick(e, '#services')}>
            <i className="fas fa-briefcase nav-item-icon"></i>
            <span>{t.nav_services}</span>
          </a>
        </li>
        <li className="nav-item">
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>
            <i className="fas fa-paper-plane nav-item-icon"></i>
            <span>{t.nav_contact}</span>
          </a>
        </li>
      </ul>

      {/* Header Actions */}
      <div className="nav-actions">
        {/* Desktop-only Social Icons */}
        <div className="nav-social desktop-only">
          <a
            href="https://www.instagram.com/enaam_creation?igsh=azVxMWZveDJlOTFz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a
            href="https://www.facebook.com/share/1HD2tAfyVD/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <i className="fab fa-facebook-f"></i>
          </a>
          <a
            href="https://www.linkedin.com/in/enaam-ali-6a482a306?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>

        {/* Smart Unified Capsule: [ CV | Lang | Menu ] */}
        <div className="nav-control-capsule">
          <a
            href="#cv"
            onClick={(e) => handleNavClick(e, '#cv')}
            className="capsule-btn capsule-cv-btn"
            title={t.nav_cv}
            aria-label={t.nav_cv}
          >
            <i className="fas fa-file-contract"></i>
            <span className="capsule-label">CV</span>
          </a>

          <div className="capsule-divider"></div>

          <button
            type="button"
            className="capsule-btn capsule-lang-btn"
            id="langToggle"
            onClick={onToggleLang}
            aria-label="Toggle language"
          >
            <i className="fas fa-globe"></i>
            <span className="capsule-label">{currentLang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <div className="capsule-divider"></div>

          <button
            type="button"
            className={`capsule-btn capsule-menu-btn ${isMenuOpen ? 'active' : ''}`}
            id="navToggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="capsule-hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

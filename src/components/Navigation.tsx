import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';
import { SiteSectionId } from '../types/cms';

interface NavigationProps {
  currentLang: Language;
  onToggleLang: () => void;
  onOpenCVDossier?: () => void;
  onOpenClientPortal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentLang,
  onToggleLang,
  onOpenCVDossier,
  onOpenClientPortal,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { layout, seo, getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  const brandText = currentLang === 'ar' ? layout.brandNameAr : layout.brandNameEn;
  const brandParts = brandText.trim().split(/\s+/);
  const firstWord = brandParts[0] || (currentLang === 'ar' ? 'إنعام' : 'ENAAM');
  const restWords = brandParts.slice(1).join(' ');

  const isSectionVisible = (id: SiteSectionId) => !layout.hiddenSections.includes(id);
  const waDigits = (seo.whatsappNumber || '249117789498').replace(/[^\d]/g, '');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background page scroll & touch bleed while mobile drawer is open
  useEffect(() => {
    if (!isMenuOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
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
      <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="nav-logo">
        {firstWord} {restWords && <span>{restWords}</span>}
      </a>

      {/* Solid Touch-Blocking Backdrop Behind Mobile Drawer */}
      <div
        className={`nav-drawer-backdrop ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Responsive Navigation Bar / Isolated Mobile Drawer */}
      <ul
        className={`nav-links ${isMenuOpen ? 'active' : ''}`}
        id="navLinks"
        aria-label={currentLang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
      >
        <li className="nav-drawer-header">
          <div className="nav-drawer-top-bar">
            <div className="nav-drawer-brand-chip">
              <span className="nav-drawer-brand-title">{brandText}</span>
              <span className="nav-drawer-brand-sub">
                {currentLang === 'ar' ? 'معرض التوثيق البصري' : 'Documentary Studio'}
              </span>
            </div>
            <button
              type="button"
              className="nav-drawer-close-btn"
              onClick={() => setIsMenuOpen(false)}
              aria-label={currentLang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </li>

        {isSectionVisible('hero') && (
          <li className="nav-item">
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')}>
              <i className="fas fa-home nav-item-icon"></i>
              <span>{t.nav_home}</span>
            </a>
          </li>
        )}

        {isSectionVisible('about') && (
          <li className="nav-item">
            <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>
              <i className="fas fa-user-circle nav-item-icon"></i>
              <span>{t.nav_about}</span>
            </a>
          </li>
        )}

        {layout.showCvButton && isSectionVisible('cv') && (
          <li className="nav-item">
            <a
              href="#cv"
              onClick={(e) => handleNavClick(e, '#cv')}
              className="nav-highlight-link"
            >
              <i className="fas fa-award nav-item-icon"></i>
              <span>{t.nav_cv}</span>
              <span className="nav-item-badge">CV</span>
            </a>
          </li>
        )}

        {isSectionVisible('portfolio') && (
          <li className="nav-item">
            <a href="#portfolio" onClick={(e) => handleNavClick(e, '#portfolio')}>
              <i className="fas fa-camera-retro nav-item-icon"></i>
              <span>{t.nav_portfolio}</span>
            </a>
          </li>
        )}

        {isSectionVisible('mission') && (
          <li className="nav-item">
            <a href="#mission" onClick={(e) => handleNavClick(e, '#mission')}>
              <i className="fas fa-compass nav-item-icon"></i>
              <span>{t.nav_mission}</span>
            </a>
          </li>
        )}

        {isSectionVisible('services') && (
          <li className="nav-item">
            <a href="#services" onClick={(e) => handleNavClick(e, '#services')}>
              <i className="fas fa-briefcase nav-item-icon"></i>
              <span>{t.nav_services}</span>
            </a>
          </li>
        )}

        {isSectionVisible('contact') && (
          <li className="nav-item">
            <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>
              <i className="fas fa-paper-plane nav-item-icon"></i>
              <span>{t.nav_contact}</span>
            </a>
          </li>
        )}

        {layout.showClientPortalButton && onOpenClientPortal && (
          <>
            <li className="nav-drawer-divider" aria-hidden="true" />
            <li className="nav-drawer-utility-item">
              <button
                type="button"
                className="nav-drawer-portal-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenClientPortal();
                }}
              >
                <span className="portal-btn-left">
                  <i className="fas fa-key"></i>
                  <span>{t.footer_client_access || t.nav_client_portal}</span>
                </span>
                <span className="utility-pin-tag">PIN</span>
              </button>
            </li>
          </>
        )}

        <li className="nav-drawer-footer">
          <div className="nav-drawer-social-row">
            {seo.instagramUrl?.trim() && (
              <a
                href={seo.instagramUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-drawer-social-btn"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
            )}
            {seo.facebookUrl?.trim() && (
              <a
                href={seo.facebookUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-drawer-social-btn"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
            )}
            {seo.linkedinUrl?.trim() && (
              <a
                href={seo.linkedinUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-drawer-social-btn"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
            )}
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-drawer-social-btn"
              aria-label="WhatsApp"
            >
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>

          <button
            type="button"
            className="nav-drawer-lang-btn"
            onClick={() => {
              onToggleLang();
              setIsMenuOpen(false);
            }}
          >
            <i className="fas fa-globe"></i>
            <span>{currentLang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </li>
      </ul>

      {/* Header Actions */}
      <div className="nav-actions">
        <div className="nav-social desktop-only">
          {seo.instagramUrl?.trim() && (
            <a
              href={seo.instagramUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          )}
          {seo.facebookUrl?.trim() && (
            <a
              href={seo.facebookUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
          )}
          {seo.linkedinUrl?.trim() && (
            <a
              href={seo.linkedinUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <i className="fab fa-linkedin-in"></i>
            </a>
          )}
        </div>

        <div className="nav-control-capsule">
          {layout.showCvButton && (
            <>
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
            </>
          )}

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

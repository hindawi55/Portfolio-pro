import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface FooterProps {
  currentLang: Language;
  onOpenClientPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ currentLang, onOpenClientPortal }) => {
  const t = translations[currentLang];

  return (
    <footer className="footer">
      <div className="footer-logo">
        {currentLang === 'ar' ? (
          <>إنعام <span>عثمان</span></>
        ) : (
          <>ENAAM <span>OSMAN</span></>
        )}
      </div>
      <div className="footer-social">
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
        <a href="mailto:alienaam634@gmail.com" aria-label="Email">
          <i className="fas fa-envelope"></i>
        </a>
      </div>

      <div className="footer-utility-link-row">
        <button
          type="button"
          onClick={onOpenClientPortal}
          className="footer-client-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        >
          <i className="fas fa-shield-alt"></i>
          <span>{currentLang === 'ar' ? 'بوابة تسليم العملاء (Client Area)' : 'Client Delivery Access'}</span>
        </button>
      </div>

      <p className="footer-copy">{t.footer_copy}</p>
    </footer>
  );
};

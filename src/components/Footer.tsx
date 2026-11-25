import React from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';

interface FooterProps {
  currentLang: Language;
  onOpenClientPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  onOpenClientPortal,
}) => {
  const { layout, seo, getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  const brandText = currentLang === 'ar' ? layout.brandNameAr : layout.brandNameEn;
  const brandParts = brandText.trim().split(/\s+/);
  const firstWord = brandParts[0] || (currentLang === 'ar' ? 'إنعام' : 'ENAAM');
  const restWords = brandParts.slice(1).join(' ');

  return (
    <footer className="footer">
      <div className="footer-logo">
        {firstWord} {restWords && <span>{restWords}</span>}
      </div>
      <div className="footer-social">
        <a
          href={seo.instagramUrl || 'https://www.instagram.com/enaam_creation?igsh=azVxMWZveDJlOTFz'}
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
          href={
            seo.linkedinUrl ||
            'https://www.linkedin.com/in/enaam-ali-6a482a306?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app'
          }
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <i className="fab fa-linkedin-in"></i>
        </a>
        <a href={`mailto:${seo.contactEmail || 'alienaam634@gmail.com'}`} aria-label="Email">
          <i className="fas fa-envelope"></i>
        </a>
      </div>

      {layout.showClientPortalButton && (
        <div className="footer-utility-link-row">
          <button
            type="button"
            onClick={onOpenClientPortal}
            className="footer-client-link"
          >
            <i className="fas fa-shield-alt"></i>
            <span>
              {currentLang === 'ar' ? 'بوابة تسليم العملاء' : 'Client Delivery Access'}
            </span>
          </button>
        </div>
      )}

      <p className="footer-copy">{t.footer_copy}</p>
    </footer>
  );
};

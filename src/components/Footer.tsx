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
        {seo.contactEmail?.trim() && (
          <a href={`mailto:${seo.contactEmail.trim()}`} aria-label="Email">
            <i className="fas fa-envelope"></i>
          </a>
        )}
      </div>

      {layout.showClientPortalButton && (
        <div className="footer-utility-link-row">
          <button
            type="button"
            onClick={onOpenClientPortal}
            className="footer-client-link"
          >
            <i className="fas fa-shield-alt"></i>
            <span>{t.footer_client_access}</span>
          </button>
        </div>
      )}

      <p className="footer-copy">{t.footer_copy}</p>
    </footer>
  );
};

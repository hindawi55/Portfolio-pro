import React from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface ContactInfoColumnProps {
  currentLang: Language;
}

export const ContactInfoColumn: React.FC<ContactInfoColumnProps> = ({ currentLang }) => {
  const { seo, getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);
  const email = seo.contactEmail || 'alienaam634@gmail.com';
  const waDigits = (seo.whatsappNumber || '249112135062').replace(/[^\d]/g, '');

  return (
    <div className="contact-info reveal active">
      <div className="contact-info-badge">
        <i className="fas fa-camera"></i>
        <span>
          {currentLang === 'ar' ? 'حجز وتوثيق ميداني معتمد' : 'Accredited Field Missions'}
        </span>
      </div>

      <h3>{t.contact_heading}</h3>
      <p>{t.contact_p}</p>

      <div className="contact-details">
        <a href={`mailto:${email}`} className="contact-item">
          <div className="contact-item-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="contact-item-info">
            <h5>{t.contact_email_label}</h5>
            <span>{email}</span>
          </div>
        </a>

        <a
          href={`https://wa.me/${waDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-item"
        >
          <div className="contact-item-icon">
            <i className="fab fa-whatsapp"></i>
          </div>
          <div className="contact-item-info">
            <h5>{t.contact_phone_label}</h5>
            <span dir="ltr">+{waDigits}</span>
          </div>
        </a>

        <div className="contact-item">
          <div className="contact-item-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <div className="contact-item-info">
            <h5>{t.contact_location_label}</h5>
            <span>{t.contact_location}</span>
          </div>
        </div>
      </div>

      {/* Institutional Trust Commitment */}
      <div className="contact-trust-card">
        <div className="trust-card-icon">
          <i className="fas fa-shield-alt"></i>
        </div>
        <div className="trust-card-text">
          <h6>
            {currentLang === 'ar'
              ? 'التزام أخلاقي وحماية بيانات كاملة'
              : 'Ethical Storytelling & Data Protection'}
          </h6>
          <p>
            {currentLang === 'ar'
              ? 'التزام تام بمعايير الحماية الإنسانية والموافقة المستنيرة (Informed Consent) وصون كرامة المجتمعات في كافة المهمات الميدانية.'
              : 'Full adherence to humanitarian protection standards, informed consent protocols, and community dignity in every field mission.'}
          </p>
        </div>
      </div>
    </div>
  );
};

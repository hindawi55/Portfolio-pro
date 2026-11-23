import React from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';
import { ContactInfoColumn } from './contact/ContactInfoColumn';
import { BookingInquiryForm } from './contact/BookingInquiryForm';

interface ContactProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ currentLang, onShowToast }) => {
  const { getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  return (
    <section className="section contact" id="contact">
      <div className="section-header reveal active">
        <div className="section-label">{t.contact_label}</div>
        <h2 className="section-title">{t.contact_title}</h2>
        <p className="section-desc">{t.contact_desc}</p>
      </div>

      <div className="contact-grid">
        <ContactInfoColumn currentLang={currentLang} />
        <BookingInquiryForm currentLang={currentLang} onShowToast={onShowToast} />
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ContactProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ currentLang, onShowToast }) => {
  const t = translations[currentLang];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    genre: 'humanitarian',
    budget: '800-2000',
    timeline: '',
    message: '',
  });

  const getGenreLabel = (key: string) => {
    switch (key) {
      case 'humanitarian':
        return currentLang === 'ar' ? 'توثيق إنساني وتنموي للمنظمات' : 'Humanitarian & Development Documentation';
      case 'workshops':
        return currentLang === 'ar' ? 'ورش تدريب وبناء قدرات الشباب' : 'Storytelling & Youth Capacity Building';
      case 'event':
        return currentLang === 'ar' ? 'تغطية مؤتمرات ومبادرات مجتمعية' : 'Conferences & Community Initiatives';
      case 'editorial':
      default:
        return currentLang === 'ar' ? 'سرد بصري وبورتريه ميداني مخصص' : 'Custom Editorial Portraiture & Field Stories';
    }
  };

  const getBudgetLabel = (key: string) => {
    switch (key) {
      case '300-800':
        return currentLang === 'ar' ? '$300 - $800 (مشاريع ومبادرات محلية)' : '$300 - $800 (Local Initiative)';
      case '800-2000':
        return currentLang === 'ar' ? '$800 - $2,000 (تغطية قياسية متكاملة)' : '$800 - $2,000 (Standard Field Coverage)';
      case '2000-5000':
        return currentLang === 'ar' ? '$2,000 - $5,000 (حملة ميدانية متعددة الأيام)' : '$2,000 - $5,000 (Multi-Day Campaign)';
      case '5000+':
        return currentLang === 'ar' ? '$5,000+ (مشروع توثيقي استراتيجي)' : '$5,000+ (Strategic Longitudinal Mission)';
      default:
        return currentLang === 'ar' ? 'مرنة / وفق نطاق المهمة' : 'Flexible / Project-Based';
    }
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, genre, budget, timeline, message } = formData;

    if (!name.trim() || !email.trim() || !message.trim()) {
      onShowToast(currentLang === 'ar' ? 'يرجى إكمال الحقول الإلزامية أولاً' : 'Please complete the required fields first');
      return;
    }

    const text =
      currentLang === 'ar'
        ? `*طلب حجز مهمة وتغطية بصرية — إنعام علي عثمان*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *الاسم / الجهة:* ${name}\n` +
          `📧 *البريد:* ${email}\n` +
          `📱 *الهاتف:* ${phone || 'غير محدد'}\n` +
          `🎯 *نوع المهمة:* ${getGenreLabel(genre)}\n` +
          `💰 *الميزانية:* ${getBudgetLabel(budget)}\n` +
          `🗓️ *التاريخ والمدة والموقع:* ${timeline || 'مرن'}\n` +
          `📝 *أهداف وتفاصيل المهمة:*\n${message}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_مرسل عبر المنصة الرسمية: Enaam Ali Osman Portfolio_`
        : `*Mission Booking & Inquiry Brief — Enaam Ali Osman*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *Name / Organization:* ${name}\n` +
          `📧 *Email:* ${email}\n` +
          `📱 *Phone / WhatsApp:* ${phone || 'Not specified'}\n` +
          `🎯 *Coverage Genre:* ${getGenreLabel(genre)}\n` +
          `💰 *Estimated Budget:* ${getBudgetLabel(budget)}\n` +
          `🗓️ *Timeline & Location:* ${timeline || 'Flexible'}\n` +
          `📝 *Mission Brief:*\n${message}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_Sent from Enaam Ali Osman Official Portfolio_`;

    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/249112135062?text=${encoded}`;
    window.open(waUrl, '_blank');

    onShowToast(
      currentLang === 'ar'
        ? 'تم فتح واتساب مع موجز الحجز المنظم بنجاح!'
        : 'WhatsApp opened with your prefilled mission brief!'
    );
  };

  const handleEmailSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    const { name, email, phone, genre, budget, timeline, message } = formData;

    if (!name.trim() || !email.trim() || !message.trim()) {
      onShowToast(currentLang === 'ar' ? 'يرجى إكمال الحقول الإلزامية أولاً' : 'Please complete the required fields first');
      return;
    }

    const subject = encodeURIComponent(
      currentLang === 'ar'
        ? `طلب تغطية ومهمة بصرية من: ${name}`
        : `Visual Mission Inquiry from: ${name}`
    );

    const body = encodeURIComponent(
      `Name / Organization: ${name}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone || 'N/A'}\n` +
      `Genre: ${getGenreLabel(genre)}\n` +
      `Budget: ${getBudgetLabel(budget)}\n` +
      `Timeline & Location: ${timeline || 'Flexible'}\n\n` +
      `Mission Details & Objectives:\n${message}\n\n` +
      `--- Sent via Enaam Ali Osman Portfolio ---`
    );

    window.open(`mailto:alienaam634@gmail.com?subject=${subject}&body=${body}`, '_blank');

    onShowToast(
      currentLang === 'ar'
        ? 'تم تجهيز مسودة البريد الرسمي بنجاح!'
        : 'Official email inquiry prepared successfully!'
    );
  };

  return (
    <section className="section contact" id="contact">
      <div className="section-header reveal active">
        <div className="section-label">{t.contact_label}</div>
        <h2 className="section-title">{t.contact_title}</h2>
        <p className="section-desc">{t.contact_desc}</p>
      </div>

      <div className="contact-grid">
        {/* Contact Info & Trust Column */}
        <div className="contact-info reveal active">
          <div className="contact-info-badge">
            <i className="fas fa-camera"></i>
            <span>{currentLang === 'ar' ? 'حجز وتوثيق ميداني معتمد' : 'Accredited Field Missions'}</span>
          </div>

          <h3>{t.contact_heading}</h3>
          <p>{t.contact_p}</p>

          <div className="contact-details">
            <a href="mailto:alienaam634@gmail.com" className="contact-item">
              <div className="contact-item-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="contact-item-info">
                <h5>{t.contact_email_label}</h5>
                <span>alienaam634@gmail.com</span>
              </div>
            </a>

            <a
              href="https://wa.me/249112135062"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-item"
            >
              <div className="contact-item-icon">
                <i className="fab fa-whatsapp"></i>
              </div>
              <div className="contact-item-info">
                <h5>{t.contact_phone_label}</h5>
                <span dir="ltr">+249 112 135 062</span>
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
              <h6>{currentLang === 'ar' ? 'التزام أخلاقي وحماية بيانات كاملة' : 'Ethical Storytelling & Data Protection'}</h6>
              <p>
                {currentLang === 'ar'
                  ? 'التزام تام بمعايير الحماية الإنسانية والموافقة المستنيرة (Informed Consent) وصون كرامة المجتمعات في كافة المهمات الميدانية.'
                  : 'Full adherence to humanitarian protection standards, informed consent protocols, and community dignity in every field mission.'}
              </p>
            </div>
          </div>
        </div>

        {/* Unified Booking & Inquiry Form (Single Cohesive Flow) */}
        <div className="contact-form-container reveal active">
          <div className="form-unified-header">
            <div className="form-header-title">
              <i className="fas fa-calendar-check"></i>
              <h4>
                {currentLang === 'ar'
                  ? 'طلب مهمة تصوير أو حجز تغطية'
                  : 'Mission Inquiry & Booking Form'}
              </h4>
            </div>
            <span className="form-header-badge">
              {currentLang === 'ar' ? 'نموذج موحد وسريع' : 'Direct Booking'}
            </span>
          </div>

          <form className="contact-form-inner unified-booking-form" onSubmit={handleWhatsAppSubmit}>
            {/* Row 1: Name and Email */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bookingName">
                  {t.form_name} <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="bookingName"
                  name="name"
                  required
                  placeholder={
                    currentLang === 'ar'
                      ? 'الاسم الكامل أو اسم المنظمة / الجهة'
                      : 'Full Name or Organization Name'
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookingEmail">
                  {t.form_email} <span className="text-accent">*</span>
                </label>
                <input
                  type="email"
                  id="bookingEmail"
                  name="email"
                  required
                  placeholder={
                    currentLang === 'ar'
                      ? 'البريد الإلكتروني الرسمي للتواصل'
                      : 'official.email@organization.org'
                  }
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Row 2: Phone and Genre */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bookingPhone">
                  {currentLang === 'ar' ? 'رقم الهاتف / واتساب (اختياري)' : 'Phone / WhatsApp (Optional)'}
                </label>
                <input
                  type="tel"
                  id="bookingPhone"
                  name="phone"
                  dir="ltr"
                  placeholder="+249 ... / +1 ..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookingGenre">
                  {t.booking_genre} <span className="text-accent">*</span>
                </label>
                <select
                  id="bookingGenre"
                  name="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="form-select"
                >
                  <option value="humanitarian">
                    {currentLang === 'ar' ? 'توثيق إنساني وتنموي للمنظمات' : 'Humanitarian & Development Documentation'}
                  </option>
                  <option value="workshops">
                    {currentLang === 'ar' ? 'ورش تدريب وبناء قدرات الشباب' : 'Storytelling & Youth Capacity Building'}
                  </option>
                  <option value="event">
                    {currentLang === 'ar' ? 'تغطية مؤتمرات ومبادرات مجتمعية' : 'Conferences & Community Initiatives'}
                  </option>
                  <option value="editorial">
                    {currentLang === 'ar' ? 'سرد بصري وبورتريه ميداني مخصص' : 'Custom Editorial Portraiture & Field Stories'}
                  </option>
                </select>
              </div>
            </div>

            {/* Row 3: Budget and Timeline */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bookingBudget">
                  {t.booking_budget}
                </label>
                <select
                  id="bookingBudget"
                  name="budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="form-select"
                >
                  <option value="300-800">
                    {currentLang === 'ar' ? '300$ - 800$ (مشاريع ومبادرات محلية)' : '$300 - $800 (Local Initiative)'}
                  </option>
                  <option value="800-2000">
                    {currentLang === 'ar' ? '800$ - 2,000$ (تغطية قياسية متكاملة)' : '$800 - $2,000 (Standard Coverage)'}
                  </option>
                  <option value="2000-5000">
                    {currentLang === 'ar' ? '2,000$ - 5,000$ (حملة ميدانية متعددة الأيام)' : '$2,000 - $5,000 (Multi-Day Campaign)'}
                  </option>
                  <option value="5000+">
                    {currentLang === 'ar' ? '5,000$+ (مشروع توثيقي استراتيجي)' : '$5,000+ (Strategic Longitudinal Mission)'}
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bookingTimeline">
                  {t.booking_timeline}
                </label>
                <input
                  type="text"
                  id="bookingTimeline"
                  name="timeline"
                  placeholder={
                    currentLang === 'ar'
                      ? 'مثال: نوفمبر 2026، ولاية البحر الأحمر، 5 أيام'
                      : 'e.g. November 2026, Red Sea State, 5 days'
                  }
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                />
              </div>
            </div>

            {/* Row 4: Mission Brief & Objectives */}
            <div className="form-group">
              <label htmlFor="bookingMessage">
                {currentLang === 'ar' ? 'موجز وأهداف المهمة المطلوبة' : 'Mission Objectives & Scope of Work'} <span className="text-accent">*</span>
              </label>
              <textarea
                id="bookingMessage"
                name="message"
                required
                rows={4}
                placeholder={
                  currentLang === 'ar'
                    ? 'اكتب نبذة عن أهداف التوثيق، الفئات المستهدفة، والمخرجات البصرية المطلوبة (تقارير، معارض، مواد تواصل)...'
                    : 'Describe mission goals, target communities, and expected visual deliverables (reports, advocacy, media)...'
                }
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>

            {/* Dual High-Luxe Dispatch Actions */}
            <div className="unified-form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-whatsapp-direct"
                title={currentLang === 'ar' ? 'إرسال مباشر عبر واتساب مع تلخيص البيانات' : 'Send via WhatsApp'}
              >
                <i className="fab fa-whatsapp"></i>
                <span>
                  {currentLang === 'ar' ? 'إرسال موجز الحجز عبر واتساب' : 'Send Brief via WhatsApp'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleEmailSubmit}
                className="btn btn-secondary-luxe"
                title={currentLang === 'ar' ? 'إرسال رسمي عبر البريد الإلكتروني' : 'Send Official Email'}
              >
                <i className="fas fa-envelope"></i>
                <span>
                  {currentLang === 'ar' ? 'إرسال عبر البريد الإلكتروني' : 'Send via Official Email'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

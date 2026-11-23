import React, { useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { submitBookingInquiry } from '../../services/cmsService';
import { safeRun } from '../../utils/errorDiagnostics';

interface BookingInquiryFormProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

export const BookingInquiryForm: React.FC<BookingInquiryFormProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { getTranslation, seo, layout } = useSiteCMS();
  const t = getTranslation(currentLang);
  const contactEmail = seo.contactEmail || 'alienaam634@gmail.com';
  const waDigits = (seo.whatsappNumber || '249112135062').replace(/[^\d]/g, '');
  const brandName =
    currentLang === 'ar'
      ? layout.brandNameAr || 'إنعام علي عثمان'
      : layout.brandNameEn || 'Enaam Ali Osman';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    genre: 'humanitarian',
    budget: '800-2000',
    timeline: '',
    message: '',
  });
  const [submittingCloud, setSubmittingCloud] = useState(false);
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState<string | null>(null);

  const getGenreLabel = (key: string) => {
    switch (key) {
      case 'humanitarian':
        return currentLang === 'ar'
          ? 'توثيق إنساني وتنموي للمنظمات'
          : 'Humanitarian & Development Documentation';
      case 'workshops':
        return currentLang === 'ar'
          ? 'ورش تدريب وبناء قدرات الشباب'
          : 'Storytelling & Youth Capacity Building';
      case 'event':
        return currentLang === 'ar'
          ? 'تغطية مؤتمرات ومبادرات مجتمعية'
          : 'Conferences & Community Initiatives';
      case 'editorial':
      default:
        return currentLang === 'ar'
          ? 'سرد بصري وبورتريه ميداني مخصص'
          : 'Custom Editorial Portraiture & Field Stories';
    }
  };

  const getBudgetLabel = (key: string) => {
    switch (key) {
      case '300-800':
        return currentLang === 'ar'
          ? '$300 - $800 (مشاريع ومبادرات محلية)'
          : '$300 - $800 (Local Initiative)';
      case '800-2000':
        return currentLang === 'ar'
          ? '$800 - $2,000 (تغطية قياسية متكاملة)'
          : '$800 - $2,000 (Standard Field Coverage)';
      case '2000-5000':
        return currentLang === 'ar'
          ? '$2,000 - $5,000 (حملة ميدانية متعددة الأيام)'
          : '$2,000 - $5,000 (Multi-Day Campaign)';
      case '5000+':
        return currentLang === 'ar'
          ? '$5,000+ (مشروع توثيقي استراتيجي)'
          : '$5,000+ (Strategic Longitudinal Mission)';
      default:
        return currentLang === 'ar' ? 'مرنة / وفق نطاق المهمة' : 'Flexible / Project-Based';
    }
  };

  const dispatchExternalLink = (actionName: string, href: string): boolean => {
    return safeRun(
      'BookingInquiryForm',
      actionName,
      () => {
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      },
      false,
      'warning'
    );
  };

  const validateBookingForm = (): boolean => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (name.length < 2 || email.length < 5 || !email.includes('@') || message.length < 5) {
      onShowToast(
        currentLang === 'ar'
          ? 'يرجى إدخال الاسم (حرفين على الأقل)، البريد الإلكتروني الصحيح، وموجز المهمة (5 أحرف على الأقل).'
          : 'Please enter your name (2+ chars), a valid email, and mission details (5+ chars).'
      );
      return false;
    }
    return true;
  };

  const persistLeadToCloud = async (): Promise<boolean> => {
    const signature = `${formData.name.trim()}|${formData.email.trim()}|${formData.message.trim()}`;
    if (lastSubmittedSignature === signature) return true;

    try {
      await submitBookingInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        serviceType: getGenreLabel(formData.genre),
        budget: getBudgetLabel(formData.budget),
        eventDate: formData.timeline.trim() || undefined,
        message: formData.message.trim(),
      });
      setLastSubmittedSignature(signature);
      return true;
    } catch {
      return false;
    }
  };

  const handleDirectCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBookingForm()) return;

    setSubmittingCloud(true);
    try {
      const saved = await persistLeadToCloud();
      if (saved) {
        onShowToast(
          currentLang === 'ar'
            ? 'تم تسجيل طلب الحجز في نظام الاستوديو بنجاح! سنتواصل معك في أقرب وقت.'
            : 'Booking inquiry saved securely to our studio CRM! We will respond shortly.'
        );
        setFormData({
          name: '',
          email: '',
          phone: '',
          genre: 'humanitarian',
          budget: '800-2000',
          timeline: '',
          message: '',
        });
      } else {
        onShowToast(
          currentLang === 'ar'
            ? 'تعذّر الحفظ السحابي حالياً، يمكنك الإرسال الفوري عبر واتساب أو البريد.'
            : 'Could not reach cloud inbox right now; please use WhatsApp or Email below.'
        );
      }
    } finally {
      setSubmittingCloud(false);
    }
  };

  const handleWhatsAppSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateBookingForm()) return;
    const { name, email, phone, genre, budget, timeline, message } = formData;

    void persistLeadToCloud();

    const text =
      currentLang === 'ar'
        ? `*طلب حجز مهمة وتغطية بصرية — ${brandName}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *الاسم / الجهة:* ${name}\n` +
          `📧 *البريد:* ${email}\n` +
          `📱 *الهاتف:* ${phone || 'غير محدد'}\n` +
          `🎯 *نوع المهمة:* ${getGenreLabel(genre)}\n` +
          `💰 *الميزانية:* ${getBudgetLabel(budget)}\n` +
          `🗓️ *التاريخ والمدة والموقع:* ${timeline || 'مرن'}\n` +
          `📝 *أهداف وتفاصيل المهمة:*\n${message}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_مرسل عبر المنصة الرسمية: ${brandName}_`
        : `*Mission Booking & Inquiry Brief — ${brandName}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *Name / Organization:* ${name}\n` +
          `📧 *Email:* ${email}\n` +
          `📱 *Phone / WhatsApp:* ${phone || 'Not specified'}\n` +
          `🎯 *Coverage Genre:* ${getGenreLabel(genre)}\n` +
          `💰 *Estimated Budget:* ${getBudgetLabel(budget)}\n` +
          `🗓️ *Timeline & Location:* ${timeline || 'Flexible'}\n` +
          `📝 *Mission Brief:*\n${message}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_Sent from ${brandName} Official Portfolio_`;

    const opened = dispatchExternalLink(
      'openWhatsAppBooking',
      `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`
    );

    onShowToast(
      opened
        ? currentLang === 'ar'
          ? 'تم تسجيل الطلب وفتح واتساب مع موجز الحجز المنظم بنجاح!'
          : 'Inquiry archived & WhatsApp opened with your prefilled mission brief!'
        : currentLang === 'ar'
        ? 'تم تسجيل الطلب في النظام؛ تعذّر فتح واتساب تلقائياً.'
        : 'Inquiry archived in system; could not launch WhatsApp automatically.'
    );
  };

  const handleEmailSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateBookingForm()) return;
    const { name, email, phone, genre, budget, timeline, message } = formData;

    void persistLeadToCloud();

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
        `--- Sent via ${brandName} Portfolio ---`
    );

    const opened = dispatchExternalLink(
      'openEmailBooking',
      `mailto:${contactEmail}?subject=${subject}&body=${body}`
    );

    onShowToast(
      opened
        ? currentLang === 'ar'
          ? 'تم تسجيل الطلب وتجهيز مسودة البريد الرسمي بنجاح!'
          : 'Inquiry archived & official email draft prepared!'
        : currentLang === 'ar'
        ? `تم تسجيل الطلب؛ يمكنك أيضاً المراسلة على ${contactEmail}`
        : `Inquiry archived; you can also email ${contactEmail}`
    );
  };

  return (
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

      <form className="contact-form-inner unified-booking-form" onSubmit={(e) => void handleDirectCloudSubmit(e)}>
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bookingPhone">
              {currentLang === 'ar'
                ? 'رقم الهاتف / واتساب (اختياري)'
                : 'Phone / WhatsApp (Optional)'}
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
                {currentLang === 'ar'
                  ? 'توثيق إنساني وتنموي للمنظمات'
                  : 'Humanitarian & Development Documentation'}
              </option>
              <option value="workshops">
                {currentLang === 'ar'
                  ? 'ورش تدريب وبناء قدرات الشباب'
                  : 'Storytelling & Youth Capacity Building'}
              </option>
              <option value="event">
                {currentLang === 'ar'
                  ? 'تغطية مؤتمرات ومبادرات مجتمعية'
                  : 'Conferences & Community Initiatives'}
              </option>
              <option value="editorial">
                {currentLang === 'ar'
                  ? 'سرد بصري وبورتريه ميداني مخصص'
                  : 'Custom Editorial Portraiture & Field Stories'}
              </option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bookingBudget">{t.booking_budget}</label>
            <select
              id="bookingBudget"
              name="budget"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="form-select"
            >
              <option value="300-800">
                {currentLang === 'ar'
                  ? '300$ - 800$ (مشاريع ومبادرات محلية)'
                  : '$300 - $800 (Local Initiative)'}
              </option>
              <option value="800-2000">
                {currentLang === 'ar'
                  ? '800$ - 2,000$ (تغطية قياسية متكاملة)'
                  : '$800 - $2,000 (Standard Coverage)'}
              </option>
              <option value="2000-5000">
                {currentLang === 'ar'
                  ? '2,000$ - 5,000$ (حملة ميدانية متعددة الأيام)'
                  : '$2,000 - $5,000 (Multi-Day Campaign)'}
              </option>
              <option value="5000+">
                {currentLang === 'ar'
                  ? '5,000$+ (مشروع توثيقي استراتيجي)'
                  : '$5,000+ (Strategic Longitudinal Mission)'}
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bookingTimeline">{t.booking_timeline}</label>
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

        <div className="form-group">
          <label htmlFor="bookingMessage">
            {currentLang === 'ar'
              ? 'موجز وأهداف المهمة المطلوبة'
              : 'Mission Objectives & Scope of Work'}{' '}
            <span className="text-accent">*</span>
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

        <div className="unified-form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submittingCloud}
          >
            <i className={`fas ${submittingCloud ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            <span>
              {submittingCloud
                ? currentLang === 'ar'
                  ? 'جاري تسجيل الطلب...'
                  : 'Submitting Request...'
                : currentLang === 'ar'
                ? 'إرسال الطلب مباشرة للنظام'
                : 'Submit Booking Request'}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => void handleWhatsAppSubmit(e)}
            className="btn btn-secondary-luxe btn-whatsapp-direct"
            title={
              currentLang === 'ar' ? 'إرسال مباشر عبر واتساب مع تلخيص البيانات' : 'Send via WhatsApp'
            }
          >
            <i className="fab fa-whatsapp"></i>
            <span>
              {currentLang === 'ar' ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleEmailSubmit}
            className="btn btn-secondary-luxe"
            title={
              currentLang === 'ar' ? 'إرسال رسمي عبر البريد الإلكتروني' : 'Send Official Email'
            }
          >
            <i className="fas fa-envelope"></i>
            <span>
              {currentLang === 'ar' ? 'إرسال بالبريد' : 'Send via Email'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { submitBookingInquiry } from '../../services/cmsService';
import { safeRun } from '../../utils/errorDiagnostics';

interface PinRecoveryPanelProps {
  currentLang: Language;
  onBackToLock: () => void;
  onShowToast?: (message: string) => void;
}

type RecoveryChannel = 'whatsapp' | 'email';

export const PinRecoveryPanel: React.FC<PinRecoveryPanelProps> = ({
  currentLang,
  onBackToLock,
  onShowToast,
}) => {
  const isAr = currentLang === 'ar';
  const { seo, layout } = useSiteCMS();

  const [channel, setChannel] = useState<RecoveryChannel>('whatsapp');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const waDigits = (seo.whatsappNumber || '249112135062').replace(/[^\d]/g, '');
  const studioEmail = seo.contactEmail || 'info@enaamaliosman.com';
  const brandName = isAr
    ? layout.brandNameAr || 'إنعام علي عثمان'
    : layout.brandNameEn || 'Enaam Ali Osman';

  const buildWhatsappHref = () => {
    const body =
      `*طلب استرجاع رمز الوصول السري (PIN Recovery)*\n` +
      `--------------------------\n` +
      `👤 *الاسم:* ${name.trim() || '-'}\n` +
      `🏢 *الجهة / المشروع:* ${organization.trim() || '-'}\n` +
      `📧 *البريد الإلكتروني:* ${email.trim() || '-'}\n` +
      `📱 *رقم الواتساب:* ${phone.trim() || '-'}\n` +
      `--------------------------\n` +
      `أرجو إعادة إرسال رمز PIN الخاص بمعرض تسليم الصور لـ ${brandName}.`;
    return `https://wa.me/${waDigits}?text=${encodeURIComponent(body)}`;
  };

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(
      isAr
        ? `طلب استرجاع رمز الوصول (PIN) - ${organization.trim() || name.trim()}`
        : `Client Portal PIN Recovery Request - ${organization.trim() || name.trim()}`
    );
    const body = encodeURIComponent(
      `${isAr ? 'مرحباً' : 'Hello'} ${brandName},\n\n` +
        `${isAr ? 'أرجو المساعدة في استرجاع رمز الوصول (PIN) لبوابة العميل:' : 'Please help verify and resend the private Client Portal PIN for:'}\n` +
        `- ${isAr ? 'الاسم' : 'Name'}: ${name.trim()}\n` +
        `- ${isAr ? 'الجهة / المشروع' : 'Organization / Project'}: ${organization.trim() || '-'}\n` +
        `- ${isAr ? 'البريد المسجل' : 'Email'}: ${email.trim()}\n` +
        `- ${isAr ? 'الهاتف' : 'Phone'}: ${phone.trim() || '-'}\n`
    );
    return `mailto:${studioEmail}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanOrg = organization.trim();

    if (cleanName.length < 2) {
      setErrorMsg(isAr ? 'يرجى إدخال الاسم الكامل (حرفان على الأقل).' : 'Please enter your full name.');
      return;
    }
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال بريد إلكتروني صحيح للتحقق من هويتك وإعادة إرسال الرمز.'
          : 'Please enter a valid email address for identity verification.'
      );
      return;
    }
    if (channel === 'whatsapp' && cleanPhone.length < 6) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال رقم الواتساب المستلم عليه رابط التسليم أو رقمك للتواصل.'
          : 'Please enter your WhatsApp phone number.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitBookingInquiry({
        name: cleanName,
        organization: cleanOrg || undefined,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        serviceType: 'Access PIN Recovery',
        message: `[PIN RECOVERY VIA ${channel.toUpperCase()}] Client requested secure re-issue of Client Delivery Portal PIN. Organization/Project: ${cleanOrg || 'N/A'}.`,
      });
      setSubmitted(true);
      onShowToast?.(
        isAr
          ? 'تم تسجيل طلب الاسترجاع وإشعار الاستوديو بنجاح.'
          : 'Recovery request logged and studio notified securely.'
      );
    } catch {
      setErrorMsg(
        isAr
          ? 'تعذّر إرسال الطلب سحابياً — يمكنك متابعة التحقق مباشرة عبر واتساب أو البريد أدناه.'
          : 'Cloud logging failed — you can verify directly via WhatsApp or Email below.'
      );
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const launchSafeExternal = (url: string) => {
    safeRun(
      'PinRecoveryPanel',
      'openRecoveryChannel',
      () => {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      undefined,
      'warning'
    );
  };

  return (
    <div className="portal-recovery-card">
      <div className="portal-recovery-head">
        <button type="button" className="portal-recovery-back" onClick={onBackToLock}>
          <i className={`fas ${isAr ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
          <span>{isAr ? 'العودة لإدخال الرمز' : 'Back to PIN Entry'}</span>
        </button>
        <span className="portal-recovery-badge">
          <i className="fas fa-user-check"></i>
          <span>{isAr ? 'تحقق آمن' : 'Verified Recovery'}</span>
        </span>
      </div>

      <h4>
        {isAr
          ? 'استرجاع رمز الوصول السري (PIN)'
          : 'Recover Private Session PIN'}
      </h4>
      <p className="portal-recovery-sub">
        {isAr
          ? 'حفاظاً على خصوصية صوركم، لا تُعرض رموز الجلسات تلقائياً. اختر وسيلة التحقق وسيتم تأكيد هويتك وإعادة إرسال الرمز فوراً.'
          : 'For archive privacy, PINs are never exposed publicly. Verify your project details below to receive your PIN via WhatsApp or Email.'}
      </p>

      {submitted ? (
        <div className="portal-recovery-success">
          <div className="recovery-success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h5>
            {isAr
              ? 'تم توثيق طلب الاسترجاع لدى إدارة الاستوديو'
              : 'Recovery Request Logged with Studio Admin'}
          </h5>
          <p>
            {isAr
              ? 'للاستلام الفوري، أرسل رسالة التحقق المعبّأة مسبقاً عبر الوسيلة التي اخترتها:'
              : 'For immediate turnaround, launch your pre-filled verification message:'}
          </p>
          <div className="recovery-handoff-actions">
            <button
              type="button"
              className="btn btn-primary recovery-action-btn"
              onClick={() => launchSafeExternal(buildWhatsappHref())}
            >
              <i className="fab fa-whatsapp"></i>
              <span>{isAr ? 'استرجاع عبر واتساب الآن' : 'Recover via WhatsApp Now'}</span>
            </button>
            <button
              type="button"
              className="btn btn-outline recovery-action-btn"
              onClick={() => launchSafeExternal(buildMailtoHref())}
            >
              <i className="fas fa-envelope"></i>
              <span>{isAr ? 'استرجاع عبر البريد الإلكتروني' : 'Recover via Email'}</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="portal-recovery-form">
          <div className="recovery-channel-grid" role="radiogroup" aria-label={isAr ? 'وسيلة الاسترجاع' : 'Recovery channel'}>
            <button
              type="button"
              role="radio"
              aria-checked={channel === 'whatsapp'}
              className={`recovery-channel-opt ${channel === 'whatsapp' ? 'active' : ''}`}
              onClick={() => setChannel('whatsapp')}
            >
              <i className="fab fa-whatsapp"></i>
              <span>{isAr ? 'عبر واتساب' : 'Via WhatsApp'}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={channel === 'email'}
              className={`recovery-channel-opt ${channel === 'email' ? 'active' : ''}`}
              onClick={() => setChannel('email')}
            >
              <i className="fas fa-envelope"></i>
              <span>{isAr ? 'عبر البريد الإلكتروني' : 'Via Email'}</span>
            </button>
          </div>

          <div className="recovery-fields-grid">
            <div className="recovery-field">
              <label>{isAr ? 'الاسم الكامل *' : 'Full Name *'}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'الاسم كما ورد في العقد' : 'Client or coordinator name'}
              />
            </div>
            <div className="recovery-field">
              <label>{isAr ? 'الجهة أو اسم المشروع' : 'Organization / Project'}</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={isAr ? 'مثال: اليونيسف / قمة الشباب' : 'e.g. UNICEF / Youth Summit'}
              />
            </div>
            <div className="recovery-field">
              <label>{isAr ? 'البريد الإلكتروني *' : 'Verified Email *'}</label>
              <input
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
              />
            </div>
            <div className="recovery-field">
              <label>
                {isAr
                  ? channel === 'whatsapp'
                    ? 'رقم الواتساب *'
                    : 'رقم الهاتف (اختياري)'
                  : channel === 'whatsapp'
                  ? 'WhatsApp Number *'
                  : 'Phone (Optional)'}
              </label>
              <input
                type="tel"
                dir="ltr"
                required={channel === 'whatsapp'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+249 ..."
              />
            </div>
          </div>

          {errorMsg && <div className="portal-error-msg">{errorMsg}</div>}

          <button type="submit" className="btn btn-primary portal-submit-btn" disabled={submitting}>
            <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            <span>
              {submitting
                ? isAr
                  ? 'جاري إرسال طلب الاسترجاع...'
                  : 'Sending recovery request...'
                : isAr
                ? 'تأكيد وإرسال طلب الاسترجاع'
                : 'Submit Secure Recovery Request'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
};

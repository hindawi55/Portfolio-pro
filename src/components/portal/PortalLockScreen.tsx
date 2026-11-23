import React from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface PortalLockScreenProps {
  currentLang: Language;
  pinInput: string;
  pinError: boolean;
  unlocking?: boolean;
  onPinChange: (value: string) => void;
  onUnlock: (e: React.FormEvent) => void;
  onAutofillPin: (pin: string) => void;
}

export const PortalLockScreen: React.FC<PortalLockScreenProps> = ({
  currentLang,
  pinInput,
  pinError,
  unlocking = false,
  onPinChange,
  onUnlock,
  onAutofillPin,
}) => {
  const { getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);

  return (
    <div className="portal-lock-card">
      <div className="portal-lock-icon">
        <i className="fas fa-lock"></i>
      </div>
      <h3>
        {currentLang === 'ar'
          ? 'تسجيل الدخول للمساحة الخاصة'
          : 'Private Gallery Authorization'}
      </h3>
      <p>
        {currentLang === 'ar'
          ? 'يرجى إدخال رمز المرور السري (PIN) المستلم مع وثيقة تسليم الجلسة لمراجعة الصور واعتماد المفضلات والتحميل المباشر.'
          : 'Enter your private access PIN provided in your delivery dossier to review and approve photos.'}
      </p>

      <form onSubmit={onUnlock} className="portal-pin-form">
        <div className="portal-input-wrap">
          <i className="fas fa-key"></i>
          <input
            type="text"
            placeholder={t.portal_pin_placeholder}
            value={pinInput}
            onChange={(e) => onPinChange(e.target.value)}
            autoFocus
            required
          />
        </div>

        {pinError && <div className="portal-error-msg">{t.portal_invalid_pin}</div>}

        <button type="submit" className="btn btn-primary portal-submit-btn" disabled={unlocking}>
          <i className={`fas ${unlocking ? 'fa-spinner fa-spin' : 'fa-unlock-alt'}`}></i>
          <span>
            {unlocking
              ? currentLang === 'ar'
                ? 'جاري التحقق من الرمز...'
                : 'Verifying PIN...'
              : t.portal_unlock_btn}
          </span>
        </button>
      </form>

      {/* Quick Demo Shortcuts */}
      <div className="portal-demo-bar">
        <span className="demo-label">
          <i className="fas fa-lightbulb"></i>
          <span>{t.portal_demo_hint}</span>
        </span>
        <div className="demo-chips">
          <button
            type="button"
            className="demo-chip"
            onClick={() => onAutofillPin('2026')}
          >
            <i className="fas fa-hand-holding-heart"></i>
            <span>2026 (UNICEF)</span>
          </button>
          <button
            type="button"
            className="demo-chip"
            onClick={() => onAutofillPin('7788')}
          >
            <i className="fas fa-users"></i>
            <span>7788 (Youth Summit)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

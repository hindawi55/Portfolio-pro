import React, { useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { SegmentedPinVault } from './SegmentedPinVault';
import { PinRecoveryPanel } from './PinRecoveryPanel';

interface PortalLockScreenProps {
  currentLang: Language;
  pinInput: string;
  pinError: boolean;
  expiredError?: string | null;
  cooldownSeconds?: number;
  failedAttempts?: number;
  unlocking?: boolean;
  onPinChange: (value: string) => void;
  onUnlock: (e: React.FormEvent) => void;
  onAutofillPin: (pin: string) => void;
  onShowToast?: (message: string) => void;
}

export const PortalLockScreen: React.FC<PortalLockScreenProps> = ({
  currentLang,
  pinInput,
  pinError,
  expiredError = null,
  cooldownSeconds = 0,
  failedAttempts = 0,
  unlocking = false,
  onPinChange,
  onUnlock,
  onAutofillPin,
  onShowToast,
}) => {
  const { getTranslation } = useSiteCMS();
  const t = getTranslation(currentLang);
  const isAr = currentLang === 'ar';

  const [showRecovery, setShowRecovery] = useState(false);
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  const isLockedOut = cooldownSeconds > 0;
  const remainingAttempts = Math.max(0, 5 - failedAttempts);

  return (
    <div className="portal-lock-card">
      {showRecovery ? (
        <PinRecoveryPanel
          currentLang={currentLang}
          onBackToLock={() => setShowRecovery(false)}
          onShowToast={onShowToast}
        />
      ) : (
        <>
          <div className="portal-lock-icon">
            <i className={`fas ${isLockedOut ? 'fa-shield-alt' : 'fa-lock'}`}></i>
          </div>

          <h3>
            {isAr ? 'تسجيل الدخول للمساحة الخاصة' : 'Private Gallery Authorization'}
          </h3>
          <p>
            {isAr
              ? 'أدخل رمز المرور السري (PIN) المستلم مع وثيقة تسليم الجلسة لمراجعة الصور واعتماد المفضلات والتحميل المباشر.'
              : 'Enter your private access PIN provided in your delivery dossier to review, proof, and download your archive.'}
          </p>

          <form onSubmit={onUnlock} className="portal-pin-form">
            <SegmentedPinVault
              currentLang={currentLang}
              value={pinInput}
              onChange={onPinChange}
              hasError={pinError || Boolean(expiredError)}
              disabled={unlocking || isLockedOut}
              onSubmitReady={() => {
                if (!unlocking && !isLockedOut && pinInput.trim().length >= 3) {
                  const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                  onUnlock(syntheticEvent);
                }
              }}
            />

            {isLockedOut && (
              <div className="portal-cooldown-banner" role="alert">
                <i className="fas fa-hourglass-half"></i>
                <span>
                  {isAr
                    ? `تم إيقاف المحاولات مؤقتاً لحماية خصوصية العميل — يرجى الانتظار ${cooldownSeconds} ثانية`
                    : `Too many invalid attempts — please wait ${cooldownSeconds}s before trying again`}
                </span>
              </div>
            )}

            {!isLockedOut && expiredError && (
              <div className="portal-error-msg" role="alert">
                <i className="fas fa-calendar-times"></i>{' '}
                <span>{expiredError}</span>
              </div>
            )}

            {!isLockedOut && !expiredError && pinError && (
              <div className="portal-error-msg" role="alert">
                <span>{t.portal_invalid_pin}</span>
                {failedAttempts >= 2 && remainingAttempts > 0 && (
                  <small className="portal-attempts-note">
                    {isAr
                      ? ` (${remainingAttempts} محاولات متبقية قبل القفل المؤقت)`
                      : ` (${remainingAttempts} attempts remaining)`}
                  </small>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary portal-submit-btn"
              disabled={unlocking || isLockedOut || pinInput.trim().length < 3}
            >
              <i
                className={`fas ${
                  unlocking
                    ? 'fa-spinner fa-spin'
                    : isLockedOut
                    ? 'fa-clock'
                    : 'fa-unlock-alt'
                }`}
              ></i>
              <span>
                {unlocking
                  ? isAr
                    ? 'جاري التحقق من الرمز...'
                    : 'Verifying PIN...'
                  : isLockedOut
                  ? isAr
                    ? `مقفل مؤقتاً (${cooldownSeconds}ث)`
                    : `Locked (${cooldownSeconds}s)`
                  : t.portal_unlock_btn}
              </span>
            </button>

            <div className="portal-lock-links">
              <button
                type="button"
                className="portal-recovery-trigger"
                onClick={() => setShowRecovery(true)}
              >
                <i className="fas fa-life-ring"></i>
                <span>
                  {isAr
                    ? 'نسيت رمز الجلسة؟ استرجاعه عبر واتساب أو البريد'
                    : 'Forgot Access PIN? Recover via WhatsApp or Email'}
                </span>
              </button>
            </div>
          </form>

          {/* Discreet collapsible demo preview for evaluators — keeps public client lock screen uncluttered */}
          <div className="portal-demo-bar">
            <button
              type="button"
              className="portal-demo-toggle"
              onClick={() => setShowDemoPreview((prev) => !prev)}
              aria-expanded={showDemoPreview}
            >
              <i className={`fas ${showDemoPreview ? 'fa-chevron-up' : 'fa-eye'}`}></i>
              <span>
                {isAr
                  ? showDemoPreview
                    ? 'إخفاء معاينة العرض التجريبي'
                    : 'هل تود معاينة نموذج تسليم تجريبي؟'
                  : showDemoPreview
                  ? 'Hide Demo Gallery Preview'
                  : 'Preview a sample client delivery?'}
              </span>
            </button>

            {showDemoPreview && (
              <div className="portal-demo-drawer">
                <span className="demo-label">{t.portal_demo_hint}</span>
                <div className="demo-chips">
                  <button
                    type="button"
                    className="demo-chip"
                    disabled={isLockedOut || unlocking}
                    onClick={() => onAutofillPin('2026')}
                  >
                    <i className="fas fa-hand-holding-heart"></i>
                    <span>2026 · UNICEF</span>
                  </button>
                  <button
                    type="button"
                    className="demo-chip"
                    disabled={isLockedOut || unlocking}
                    onClick={() => onAutofillPin('7788')}
                  >
                    <i className="fas fa-users"></i>
                    <span>7788 · Youth Summit</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { FALLBACK_IMAGE_URL, resolveAssetUrl } from '../../utils/assets';

interface AdminAuthGateProps {
  currentLang: Language;
  onToggleLang: () => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  currentLang,
  onToggleLang,
  onClose,
  onShowToast,
}) => {
  const { user, isAdmin, authReady, layout, signInAdmin, signOutAdmin } = useSiteCMS();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAr = currentLang === 'ar';
  const studioBrand = isAr
    ? layout.brandNameAr || 'إنعام علي عثمان'
    : layout.brandNameEn || 'ENAAM ALI OSMAN';

  const portraitSrc = layout.portraitUrl?.trim()
    ? resolveAssetUrl(layout.portraitUrl.trim())
    : FALLBACK_IMAGE_URL;

  const focusY =
    typeof layout.portraitFocusY === 'number'
      ? Math.min(100, Math.max(0, layout.portraitFocusY))
      : 38;

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const granted = await signInAdmin();
      if (granted) {
        onShowToast(
          isAr
            ? 'مرحباً بك في لوحة التحكم السحابية (Luxe Studio OS).'
            : 'Welcome to Luxe Studio OS Cloud Dashboard.'
        );
      } else {
        setAuthError(
          isAr
            ? 'هذا الحساب غير مصرح له بصلاحيات الإدارة. يرجى الدخول بحساب المالك المعتمد.'
            : 'This account does not have administrator privileges. Please sign in with the authorized owner account.'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError(
        isAr
          ? `تعذّر تسجيل الدخول عبر Google: ${msg}`
          : `Google sign-in could not be completed: ${msg}`
      );
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="admin-auth-gate">
      {/* Editorial Darkroom Showcase Panel */}
      <aside className="admin-auth-showcase" aria-label={studioBrand}>
        <div className="admin-auth-showcase-inner">
          <div className="admin-auth-showcase-head">
            <span className="admin-os-badge">LUXE STUDIO OS</span>
            <span className="admin-auth-edition">
              {isAr ? 'بوابة إدارة الاستوديو السحابية' : 'CLOUD EDITORIAL ARCHITECTURE'}
            </span>
          </div>

          <figure className="admin-auth-portrait-plate">
            <img
              src={portraitSrc}
              alt={studioBrand}
              className="admin-auth-portrait-img"
              style={{ objectPosition: `50% ${focusY}%` }}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_IMAGE_URL) {
                  target.onerror = null;
                  target.src = FALLBACK_IMAGE_URL;
                }
              }}
            />
            <figcaption className="admin-auth-portrait-caption">
              <span className="admin-auth-studio-name">{studioBrand}</span>
              <span className="admin-auth-studio-sub">
                {isAr ? 'أرشيف التصوير الوثائقي' : 'Documentary Visual Archive'}
              </span>
            </figcaption>
          </figure>

          <ul className="admin-auth-specs" aria-hidden="true">
            <li>
              <i className="fas fa-database"></i>
              <span>{isAr ? 'نظام محتوى سحابي' : 'Cloud CMS'}</span>
            </li>
            <li>
              <i className="fas fa-user-shield"></i>
              <span>{isAr ? 'بوابة فرز العملاء' : 'Client Proofing'}</span>
            </li>
            <li>
              <i className="fas fa-inbox"></i>
              <span>{isAr ? 'إدارة الحجوزات' : 'Booking CRM'}</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Secure Auth Gateway Panel */}
      <section className="admin-auth-panel">
        <div className="admin-auth-topbar">
          <button
            type="button"
            className="admin-btn-ghost admin-btn-sm"
            onClick={onToggleLang}
            aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <i className="fas fa-globe" aria-hidden="true"></i>
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          <button type="button" className="admin-return-site-btn" onClick={onClose}>
            <i className="fas fa-home" aria-hidden="true"></i>
            <span>{isAr ? 'العودة للموقع العام' : 'Return to Public Site'}</span>
          </button>
        </div>

        <div className="admin-auth-panel-body">
          <div className="admin-auth-badge">
            <i className="fas fa-shield-alt" aria-hidden="true"></i>
            <span>{isAr ? 'بوابة الإدارة المشفرة' : 'Protected Admin Gateway'}</span>
          </div>

          <h1 className="admin-auth-title">
            {isAr ? 'لوحة تحكم Luxe Studio OS' : 'Luxe Studio OS Control Panel'}
          </h1>

          <p className="admin-auth-desc">
            {isAr
              ? 'سجّل الدخول بحساب Google المعتمد للمالك لإدارة المحتوى الثنائي اللغة، معارض الصور، طلبات الحجز، وبوابة العملاء.'
              : 'Sign in with your authorized owner Google account to manage bilingual copy, portfolio archives, booking inquiries, and client proofing.'}
          </p>

          {!authReady ? (
            <div className="admin-skeleton-bar" aria-busy="true"></div>
          ) : user && !isAdmin ? (
            <div className="admin-auth-denied">
              <p>
                {isAr
                  ? `الحساب الحالي (${user.email || 'غير معروف'}) لا يمتلك صلاحية مالك الاستوديو.`
                  : `Signed in as ${user.email || 'unknown'}, which is not an authorized Studio Admin.`}
              </p>
              <div className="admin-auth-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => void signOutAdmin()}
                >
                  <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                  <span>{isAr ? 'تبديل الحساب' : 'Switch Account'}</span>
                </button>
                <button type="button" className="admin-btn-ghost" onClick={onClose}>
                  <span>{isAr ? 'العودة للموقع' : 'Return to Site'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-auth-actions">
              <button
                type="button"
                className="admin-btn-primary admin-auth-submit"
                onClick={handleGoogleLogin}
                disabled={signingIn}
              >
                <i className="fab fa-google" aria-hidden="true"></i>
                <span>
                  {signingIn
                    ? isAr
                      ? 'جاري التحقق الآمن...'
                      : 'Verifying credentials...'
                    : isAr
                    ? 'تسجيل الدخول بحساب Google المعتمد'
                    : 'Sign in with Authorized Google Account'}
                </span>
              </button>
            </div>
          )}

          {authError && (
            <div className="admin-alert-error" role="alert">
              <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
              <span>{authError}</span>
            </div>
          )}

          <p className="admin-auth-security-note">
            <i className="fas fa-lock" aria-hidden="true"></i>
            <span>
              {isAr
                ? 'تحقق مشفّر عبر Firebase Authentication · وصول مقصور على المالك المعتمد فقط.'
                : 'Verified via Firebase Authentication · Access strictly restricted to the authorized studio owner.'}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
};

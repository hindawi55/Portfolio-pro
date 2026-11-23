import React, { useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface AdminAuthGateProps {
  currentLang: Language;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  currentLang,
  onClose,
  onShowToast,
}) => {
  const { user, isAdmin, authReady, signInAdmin, signOutAdmin } = useSiteCMS();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAr = currentLang === 'ar';

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
      <div className="admin-auth-card">
        <div className="admin-auth-badge">
          <i className="fas fa-shield-alt"></i>
          <span>{isAr ? 'بوابة الإدارة المشفرة' : 'Protected Admin Gateway'}</span>
        </div>

        <h2 className="admin-auth-title">
          {isAr ? 'لوحة تحكم Luxe Studio OS' : 'Luxe Studio OS Control Panel'}
        </h2>
        <p className="admin-auth-desc">
          {isAr
            ? 'سجّل الدخول بحساب Google المعتمد للمالك للتحكم الكامل في الألوان المتجانسة، الخطوط السائلة، النسخ الاحتياطي، وهيكل الموقع السحابي.'
            : 'Sign in with your authorized owner Google account to manage harmonized palettes, fluid typography, cloud snapshots, layout, and SEO.'}
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
                <i className="fas fa-sign-out-alt"></i>
                <span>{isAr ? 'تبديل الحساب' : 'Switch Account'}</span>
              </button>
              <button type="button" className="admin-btn-ghost" onClick={onClose}>
                <span>{isAr ? 'إغلاق' : 'Close'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-auth-actions">
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleGoogleLogin}
              disabled={signingIn}
            >
              <i className="fab fa-google"></i>
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
            <button type="button" className="admin-btn-ghost" onClick={onClose}>
              <span>{isAr ? 'العودة للموقع' : 'Return to Site'}</span>
            </button>
          </div>
        )}

        {authError && (
          <div className="admin-alert-error" role="alert">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{authError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

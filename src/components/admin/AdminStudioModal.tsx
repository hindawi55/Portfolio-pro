import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { AdminAuthGate } from './AdminAuthGate';
import { AdminThemePanel } from './AdminThemePanel';
import { AdminLayoutSeoPanel } from './AdminLayoutSeoPanel';
import { AdminBackupPanel } from './AdminBackupPanel';
import { AdminContentPanel } from './AdminContentPanel';
import { AdminPortfolioPanel } from './AdminPortfolioPanel';
import { AdminCVPanel } from './AdminCVPanel';
import { AdminBookingsPanel } from './AdminBookingsPanel';
import { AdminClientsPanel } from './AdminClientsPanel';

interface AdminStudioModalProps {
  currentLang: Language;
  onToggleLang: () => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

type AdminTab =
  | 'content'
  | 'portfolio'
  | 'cv'
  | 'bookings'
  | 'clients'
  | 'theme'
  | 'layout'
  | 'backups';

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  currentLang,
  onToggleLang,
  onClose,
  onShowToast,
}) => {
  const { user, isAdmin, signOutAdmin } = useSiteCMS();
  const [activeTab, setActiveTab] = useState<AdminTab>('content');

  const isAr = currentLang === 'ar';

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const navItems: { id: AdminTab; icon: string; labelAr: string; labelEn: string }[] = [
    {
      id: 'content',
      icon: 'fa-pen-nib',
      labelAr: 'التعديل الحر الشامل',
      labelEn: 'Free Content Editor',
    },
    {
      id: 'portfolio',
      icon: 'fa-images',
      labelAr: 'المعارض والصور و EXIF',
      labelEn: 'Portfolio & EXIF',
    },
    {
      id: 'cv',
      icon: 'fa-id-card',
      labelAr: 'أركان السيرة الذاتية',
      labelEn: '5-Wing CV Dossier',
    },
    {
      id: 'bookings',
      icon: 'fa-inbox',
      labelAr: 'طلبات الحجز (CRM)',
      labelEn: 'Booking Inbox',
    },
    {
      id: 'clients',
      icon: 'fa-user-shield',
      labelAr: 'بوابة العملاء (Proofing)',
      labelEn: 'Client Proofing',
    },
    {
      id: 'theme',
      icon: 'fa-palette',
      labelAr: 'الألوان والخطوط السائلة',
      labelEn: 'Colors & Typography',
    },
    {
      id: 'layout',
      icon: 'fa-layer-group',
      labelAr: 'هيكل الموقع و SEO',
      labelEn: 'Layout & SEO',
    },
    {
      id: 'backups',
      icon: 'fa-history',
      labelAr: 'النسخ الاحتياطي والاستنساخ',
      labelEn: 'Backups & Clone',
    },
  ];

  return (
    <div
      className="admin-os-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Luxe Studio OS Admin Panel"
    >
      <div className="admin-os-shell">
        {!isAdmin ? (
          <AdminAuthGate
            currentLang={currentLang}
            onClose={onClose}
            onShowToast={onShowToast}
          />
        ) : (
          <>
            {/* Top Bar */}
            <header className="admin-os-topbar">
              <div className="admin-os-brand">
                <div className="admin-os-brand-icon">
                  <i className="fas fa-crown"></i>
                </div>
                <div className="admin-os-brand-text">
                  <span className="admin-os-badge">LUXE STUDIO OS</span>
                  <h2>{isAr ? 'لوحة التحكم السحابية الشاملة' : 'Cloud Studio Control Panel'}</h2>
                </div>
              </div>

              <div className="admin-os-top-actions">
                <span className="admin-user-pill" title={user?.email || ''}>
                  <i className="fas fa-user-check"></i>
                  <span>{user?.email?.split('@')[0] || 'Admin'}</span>
                </span>

                <button
                  type="button"
                  className="admin-btn-ghost admin-btn-sm"
                  onClick={onToggleLang}
                >
                  <i className="fas fa-globe"></i>
                  <span>{isAr ? 'EN' : 'عربي'}</span>
                </button>

                <button
                  type="button"
                  className="admin-btn-ghost admin-btn-sm"
                  onClick={() => void signOutAdmin()}
                  title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>

                <button
                  type="button"
                  className="admin-close-btn"
                  onClick={onClose}
                  aria-label={isAr ? 'إغلاق لوحة التحكم' : 'Close Admin Panel'}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </header>

            {/* Body: Pro Sidebar Navigation + Active Module */}
            <div className="admin-os-body">
              <aside className="admin-os-sidebar" role="tablist">
                {navItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`admin-nav-item ${active ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <i className={`fas ${item.icon}`}></i>
                      <span>{isAr ? item.labelAr : item.labelEn}</span>
                    </button>
                  );
                })}
              </aside>

              <main className="admin-os-content">
                {activeTab === 'content' && (
                  <AdminContentPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'portfolio' && (
                  <AdminPortfolioPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'cv' && (
                  <AdminCVPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'bookings' && (
                  <AdminBookingsPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'clients' && (
                  <AdminClientsPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'theme' && (
                  <AdminThemePanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'layout' && (
                  <AdminLayoutSeoPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
                {activeTab === 'backups' && (
                  <AdminBackupPanel currentLang={currentLang} onShowToast={onShowToast} />
                )}
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

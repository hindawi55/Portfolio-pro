import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { subscribeNewBookingCount } from '../../services/cmsService';
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

interface NavGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  items: {
    id: AdminTab;
    icon: string;
    labelAr: string;
    labelEn: string;
  }[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: 'content-media',
    titleAr: 'المحتوى والمعارض',
    titleEn: 'Content & Media',
    items: [
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
    ],
  },
  {
    id: 'client-ops',
    titleAr: 'العملاء والحجوزات',
    titleEn: 'Client Operations',
    items: [
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
    ],
  },
  {
    id: 'design-system',
    titleAr: 'الهوية والنظام',
    titleEn: 'Design & System',
    items: [
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
    ],
  },
];

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  currentLang,
  onToggleLang,
  onClose,
  onShowToast,
}) => {
  const { user, isAdmin, signOutAdmin } = useSiteCMS();
  const [activeTab, setActiveTab] = useState<AdminTab>('content');
  const [newBookingsCount, setNewBookingsCount] = useState<number>(0);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setNewBookingsCount(0);
      return;
    }

    const unsubscribe = subscribeNewBookingCount(
      (count) => setNewBookingsCount(count),
      () => {
        // Non-fatal fallback if offline or listener drops
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  return (
    <div
      className="admin-os-overlay"
      role="region"
      aria-label={isAr ? 'لوحة تحكم Luxe Studio OS' : 'Luxe Studio OS Admin Workspace'}
    >
      <div className="admin-os-shell">
        {!isAdmin ? (
          <AdminAuthGate
            currentLang={currentLang}
            onToggleLang={onToggleLang}
            onClose={onClose}
            onShowToast={onShowToast}
          />
        ) : (
          <>
            {/* Standalone Full-Screen Workspace Top Bar */}
            <header className="admin-os-topbar">
              <div className="admin-os-brand">
                <div className="admin-os-brand-icon">
                  <i className="fas fa-crown" aria-hidden="true"></i>
                </div>
                <div className="admin-os-brand-text">
                  <span className="admin-os-badge">LUXE STUDIO OS</span>
                  <h2>{isAr ? 'لوحة التحكم السحابية الشاملة' : 'Cloud Studio Control Panel'}</h2>
                </div>
              </div>

              <div className="admin-os-top-actions">
                <span className="admin-user-pill" title={user?.email || ''}>
                  <i className="fas fa-user-check" aria-hidden="true"></i>
                  <span>{user?.email?.split('@')[0] || 'Admin'}</span>
                </span>

                <button
                  type="button"
                  className="admin-btn-ghost admin-btn-sm"
                  onClick={onToggleLang}
                  aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
                >
                  <i className="fas fa-globe" aria-hidden="true"></i>
                  <span>{isAr ? 'EN' : 'عربي'}</span>
                </button>

                <button
                  type="button"
                  className="admin-btn-ghost admin-btn-sm"
                  onClick={() => void signOutAdmin()}
                  title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
                  aria-label={isAr ? 'تسجيل الخروج' : 'Sign Out'}
                >
                  <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                  <span className="admin-signout-label">
                    {isAr ? 'خروج' : 'Sign Out'}
                  </span>
                </button>

                <button
                  type="button"
                  className="admin-return-site-btn"
                  onClick={onClose}
                >
                  <i className="fas fa-home" aria-hidden="true"></i>
                  <span>{isAr ? 'العودة للموقع' : 'Return to Site'}</span>
                </button>
              </div>
            </header>

            {/* Body: 3-Group Sidebar Navigation + Active Module */}
            <div className="admin-os-body">
              <aside
                className="admin-os-sidebar"
                role="tablist"
                aria-label={isAr ? 'أقسام لوحة التحكم' : 'Admin Navigation'}
              >
                {ADMIN_NAV_GROUPS.map((group) => (
                  <div key={group.id} className="admin-nav-group">
                    <div className="admin-nav-group-label">
                      {isAr ? group.titleAr : group.titleEn}
                    </div>
                    <div className="admin-nav-group-items">
                      {group.items.map((item) => {
                        const active = activeTab === item.id;
                        const showBookingBadge = item.id === 'bookings' && newBookingsCount > 0;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`admin-nav-item ${active ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                          >
                            <i className={`fas ${item.icon}`} aria-hidden="true"></i>
                            <span className="admin-nav-item-text">
                              {isAr ? item.labelAr : item.labelEn}
                            </span>
                            {showBookingBadge && (
                              <span
                                className="admin-nav-badge"
                                aria-label={
                                  isAr
                                    ? `${newBookingsCount} حجوزات جديدة`
                                    : `${newBookingsCount} new bookings`
                                }
                              >
                                {newBookingsCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

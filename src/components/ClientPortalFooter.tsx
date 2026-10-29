import React from 'react';
import { Language } from '../types';
import { ClientSession } from '../data/clientPortalData';

interface ClientPortalFooterProps {
  currentLang: Language;
  activeSession: ClientSession;
}

export const ClientPortalFooter: React.FC<ClientPortalFooterProps> = ({
  currentLang,
  activeSession,
}) => {
  const clientName = currentLang === 'ar' ? activeSession.clientNameAr : activeSession.clientNameEn;
  const projectTitle = currentLang === 'ar' ? activeSession.projectTitleAr : activeSession.projectTitleEn;

  return (
    <footer className="client-suite-footer">
      <div className="client-footer-container">
        {/* Main 3-Column Dossier Info Grid */}
        <div className="client-footer-grid">
          {/* Column 1: Institutional License Clearance */}
          <div className="client-footer-card">
            <div className="card-top-header">
              <i className="fas fa-file-contract text-gold"></i>
              <h5>{currentLang === 'ar' ? 'وثيقة الترخيص وحقوق الاستخدام' : 'Institutional Media License'}</h5>
            </div>
            <p className="card-desc">
              {currentLang === 'ar'
                ? `هذه الحزمة مخصصة رسمياً لـ (${clientName}) لمشروع (${projectTitle}) بموجب ترخيص استخدام إعلامي وتوثيقي غير حصري للتقارير السنوية وحملات المناصرة والمطبوعات المؤسسية.`
                : `This archival delivery is officially licensed to (${clientName}) for (${projectTitle}) under non-exclusive editorial, annual reports, donor advocacy, and publication rights.`}
            </p>
            <div className="license-badge-row">
              <span className="footer-mini-chip">
                <i className="fas fa-check"></i>
                <span>{currentLang === 'ar' ? 'تصريح نشر دولي معتمد' : 'Verified Publishing Clearance'}</span>
              </span>
              <span className="footer-mini-chip">
                <i className="fas fa-clock"></i>
                <span>{currentLang === 'ar' ? 'صلاحية حتى:' : 'Active Until:'} {activeSession.expiryDate}</span>
              </span>
            </div>
          </div>

          {/* Column 2: Technical Specifications & Print Standards */}
          <div className="client-footer-card">
            <div className="card-top-header">
              <i className="fas fa-sliders-h text-gold"></i>
              <h5>{currentLang === 'ar' ? 'المواصفات الفنية للطباعة والتصدير' : 'Technical Print Specifications'}</h5>
            </div>
            <ul className="tech-specs-list">
              <li>
                <span className="spec-label">{currentLang === 'ar' ? 'أبعاد الماستر:' : 'Master Resolution:'}</span>
                <span className="spec-val">6000 × 4000 px (24.2 MP)</span>
              </li>
              <li>
                <span className="spec-label">{currentLang === 'ar' ? 'كثافة الطباعة:' : 'Print Density:'}</span>
                <span className="spec-val">300 DPI (Exhibition Grade)</span>
              </li>
              <li>
                <span className="spec-label">{currentLang === 'ar' ? 'الفضاء اللوني:' : 'Color Space:'}</span>
                <span className="spec-val">sRGB / Adobe RGB (1998)</span>
              </li>
              <li>
                <span className="spec-label">{currentLang === 'ar' ? 'حجم الحزمة:' : 'Master Package:'}</span>
                <span className="spec-val text-gold">{activeSession.packageSize}</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Humanitarian Ethics & Direct VIP Support */}
          <div className="client-footer-card">
            <div className="card-top-header">
              <i className="fas fa-hand-holding-heart text-gold"></i>
              <h5>{currentLang === 'ar' ? 'أخلاقيات التوثيق والدعم المباشر' : 'Ethics & Dedicated Support'}</h5>
            </div>
            <p className="card-desc">
              {currentLang === 'ar'
                ? 'خاضعة لمعايير حماية الطفل، والموافقة المستنيرة، وصون الكرامة الإنسانية. لأي طلبات تعديل خاصة أو ملفات RAW إضافية:'
                : 'Compliant with child protection protocols and informed consent. For custom color grades or additional RAW files:'}
            </p>
            <div className="client-support-links">
              <a
                href={`https://wa.me/249112135062?text=${encodeURIComponent(
                  currentLang === 'ar'
                    ? `استفسار ودعم مباشر لجلسة العميل #${activeSession.pin} — ${clientName}`
                    : `Direct support request for client session #${activeSession.pin} — ${clientName}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-support-btn whatsapp-btn"
              >
                <i className="fab fa-whatsapp"></i>
                <span>{currentLang === 'ar' ? 'الدعم الفوري للمهمة' : 'Mission Hotline'}</span>
              </a>

              <a
                href={`mailto:alienaam634@gmail.com?subject=${encodeURIComponent(
                  `VIP Support: Session #${activeSession.pin} - ${clientName}`
                )}`}
                className="footer-support-btn email-btn"
              >
                <i className="fas fa-envelope"></i>
                <span>{currentLang === 'ar' ? 'البريد الرسمي' : 'Official Email'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="client-footer-bottom">
          <div className="bottom-credentials">
            <span className="bottom-photographer">
              {currentLang === 'ar' ? 'إنعام علي عثمان' : 'Enaam Ali Osman'}
            </span>
            <span className="bottom-dot">·</span>
            <span className="bottom-role">
              {currentLang === 'ar' ? 'مصورة وثائقية معتمدة' : 'Accredited Documentary Photographer'}
            </span>
          </div>

          <div className="bottom-copy">
            © 2026 {currentLang === 'ar' ? 'جميع حقوق الأرشيف والتسليم محفوظة للمصورة والجهة الشريكة.' : 'All visual archival rights reserved.'}
          </div>
        </div>
      </div>
    </footer>
  );
};

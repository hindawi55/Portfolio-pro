import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface CVSectionProps {
  currentLang: Language;
  onOpenFullDossier: () => void;
}

export const CVSection: React.FC<CVSectionProps> = ({
  currentLang,
  onOpenFullDossier,
}) => {
  const t = translations[currentLang];

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  return (
    <section className="section cv-section" id="cv">
      <div className="section-header reveal active">
        <div className="section-label">{t.cv_label}</div>
        <h2 className="section-title">{t.cv_title}</h2>
        <p className="section-desc">
          {currentLang === 'ar'
            ? 'موجز الاعتمادات والخبرات الميدانية الموثقة في التصوير الصحفي والإنساني وتدريب المجتمعات.'
            : 'Executive summary of accredited field background, visual journalism honors, and verified credentials.'}
        </p>
      </div>

      <div className="cv-executive-container">
        {/* 4 Core Pillars of Executive Credentials */}
        <div className="cv-summary-grid">
          {/* Pillar 1: Education */}
          <div className="cv-summary-card">
            <div className="summary-card-header">
              <div className="summary-icon-box">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <span className="summary-tag">
                {currentLang === 'ar' ? 'التأهيل والتدريب' : 'Education'}
              </span>
            </div>
            <h3 className="summary-card-title">
              {currentLang === 'ar' ? 'صحافة الصورة والدراسات الإنسانية' : 'Visual Journalism & Human Studies'}
            </h3>
            <p className="summary-card-body">
              {currentLang === 'ar'
                ? 'دبلوم متقدم في الصحافة البصرية وسرد القصص، وبكالوريوس دراسات تنمية المجتمع والإعلام.'
                : 'Advanced Diploma in Visual Journalism & Storytelling, alongside Community Development studies.'}
            </p>
            <div className="summary-badge-footer">
              <span>{currentLang === 'ar' ? 'أكاديميات إقليمية معتمدة' : 'Accredited Fellowships'}</span>
            </div>
          </div>

          {/* Pillar 2: Grants & Awards */}
          <div className="cv-summary-card">
            <div className="summary-card-header">
              <div className="summary-icon-box">
                <i className="fas fa-award"></i>
              </div>
              <span className="summary-tag">
                {currentLang === 'ar' ? 'الجوائز والزمالات' : 'Grants & Honors'}
              </span>
            </div>
            <h3 className="summary-card-title">
              {currentLang === 'ar' ? 'منح التوثيق الإنساني الميداني' : 'Humanitarian Storytelling Fellow'}
            </h3>
            <p className="summary-card-body">
              {currentLang === 'ar'
                ? 'حائزة على منحة التوثيق الإنساني (2024) وزمالة صحافة الأزمات الإقليمية وتكريمات التميز البصري.'
                : 'Recipient of Humanitarian Visual Grant (2024), Regional Photojournalism Fellow & documentary honors.'}
            </p>
            <div className="summary-badge-footer">
              <span>2023 — 2025</span>
            </div>
          </div>

          {/* Pillar 3: Gear Standards */}
          <div className="cv-summary-card">
            <div className="summary-card-header">
              <div className="summary-icon-box">
                <i className="fas fa-camera"></i>
              </div>
              <span className="summary-tag">
                {currentLang === 'ar' ? 'العتاد الاحترافي' : 'Production Kit'}
              </span>
            </div>
            <h3 className="summary-card-title">
              {currentLang === 'ar' ? 'منظومة سوني الإطارية الكاملة' : 'Sony Alpha Full-Frame Masters'}
            </h3>
            <p className="summary-card-body">
              {currentLang === 'ar'
                ? 'كاميرات Sony Alpha 7 IV بدقة 24.2MP، وعدسات فئة G-Master (35mm f/1.4 و24-70mm f/2.8 و85mm f/1.4).'
                : 'Dual Sony Alpha 7 IV bodies with GM prime & zoom lenses engineered for harsh frontline lighting.'}
            </p>
            <div className="summary-badge-footer">
              <span>24.2MP RAW Masters</span>
            </div>
          </div>

          {/* Pillar 4: Institutional Partners */}
          <div className="cv-summary-card">
            <div className="summary-card-header">
              <div className="summary-icon-box">
                <i className="fas fa-handshake"></i>
              </div>
              <span className="summary-tag">
                {currentLang === 'ar' ? 'الشركاء والجهات' : 'Partners & NGOs'}
              </span>
            </div>
            <h3 className="summary-card-title">
              {currentLang === 'ar' ? 'هيئات الأمم المتحدة والمجتمع المدني' : 'UN Bodies & International Civil Society'}
            </h3>
            <p className="summary-card-body">
              {currentLang === 'ar'
                ? 'توثيق ميداني معتمد مع منظمة اليونيسف، ومفوضية اللاجئين، ومبادرات الإسناد الإنساني المجتمعي.'
                : 'Accredited documentation for UNICEF missions, UNHCR community hubs, and frontline humanitarian campaigns.'}
            </p>
            <div className="summary-badge-footer">
              <span>{currentLang === 'ar' ? 'مهام توثيق معتمدة' : 'Verified Field Missions'}</span>
            </div>
          </div>
        </div>

        {/* Master Action Banner to open Full Dossier */}
        <div className="cv-open-banner">
          <div className="banner-left">
            <div className="banner-icon">
              <i className="fas fa-file-contract"></i>
            </div>
            <div className="banner-text">
              <h4>
                {currentLang === 'ar'
                  ? 'السيرة الذاتية المهنية والمصورة الكاملة'
                  : 'Official Comprehensive Curriculum Vitae'}
              </h4>
              <p>
                {currentLang === 'ar'
                  ? 'تتضمن بيان الفنان الكامل، وتواريخ المعارض، وقائمة المعدات التفصيلية، والتغطيات الصحفية.'
                  : 'Includes full artist statement, complete exhibition timeline, exhaustive gear kit specs, and press archive.'}
              </p>
            </div>
          </div>

          <div className="banner-actions">
            <button
              type="button"
              className="btn btn-primary cv-btn-open-dossier"
              onClick={onOpenFullDossier}
            >
              <i className="fas fa-folder-open"></i>
              <span>
                {currentLang === 'ar'
                  ? 'استعراض السيرة الذاتية والاعتمادات الكاملة'
                  : 'View Full Official Dossier & Credentials'}
              </span>
            </button>
            <button
              type="button"
              className="btn btn-outline cv-btn-pdf"
              onClick={handlePrint}
              title="Download PDF"
            >
              <i className="fas fa-download"></i>
              <span>{t.btn_download_cv}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

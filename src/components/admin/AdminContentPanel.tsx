import React, { useEffect, useMemo, useState } from 'react';
import { Language } from '../../types';
import { translations, TranslationDictionary } from '../../data/translations';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { SiteContentOverrides } from '../../types/cms';
import { AdminPortraitStudioCard } from './AdminPortraitStudioCard';

interface AdminContentPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

interface ContentGroup {
  id: string;
  labelAr: string;
  labelEn: string;
  keys: { key: keyof TranslationDictionary; labelAr: string; labelEn: string; multiline?: boolean }[];
}

const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'header_hero',
    labelAr: 'الهيدر والقسم الافتتاحي (Header & Hero)',
    labelEn: 'Header & Hero Section',
    keys: [
      { key: 'nav_home', labelAr: 'رابط الرئيسية', labelEn: 'Nav: Home' },
      { key: 'nav_about', labelAr: 'رابط عني', labelEn: 'Nav: About' },
      { key: 'nav_cv', labelAr: 'رابط السيرة الذاتية', labelEn: 'Nav: CV' },
      { key: 'nav_portfolio', labelAr: 'رابط الأعمال', labelEn: 'Nav: Works' },
      { key: 'nav_services', labelAr: 'رابط الخدمات', labelEn: 'Nav: Services' },
      { key: 'nav_contact', labelAr: 'رابط التواصل', labelEn: 'Nav: Contact' },
      { key: 'hero_label', labelAr: 'شارة الهيرو العلوية', labelEn: 'Hero Top Badge' },
      { key: 'hero_name_ar', labelAr: 'الجزء الأول من العنوان', labelEn: 'Hero Title Part 1' },
      { key: 'hero_name_en', labelAr: 'الجزء الثاني من العنوان', labelEn: 'Hero Title Part 2' },
      { key: 'hero_subtitle', labelAr: 'الوصف الافتتاحي', labelEn: 'Hero Subtitle', multiline: true },
      { key: 'btn_works', labelAr: 'زر الأعمال الرئيسي', labelEn: 'Primary CTA Button' },
      { key: 'btn_contact', labelAr: 'زر التواصل الثانوي', labelEn: 'Secondary CTA Button' },
      { key: 'scroll', labelAr: 'نص التمرير السفلي', labelEn: 'Scroll Indicator Text' },
    ],
  },
  {
    id: 'about',
    labelAr: 'نبذة عن المصورة والإحصائيات (About)',
    labelEn: 'About, Portrait & Stats',
    keys: [
      { key: 'about_label', labelAr: 'وسم القسم', labelEn: 'Section Label' },
      { key: 'about_title', labelAr: 'عنوان القسم', labelEn: 'Section Title' },
      { key: 'about_desc', labelAr: 'وصف القسم', labelEn: 'Section Description', multiline: true },
      { key: 'arch_name', labelAr: 'اسم التوثيق أسفل البورتريه', labelEn: 'Portrait Colophon Name' },
      { key: 'arch_role', labelAr: 'التخصص أسفل البورتريه', labelEn: 'Portrait Colophon Role' },
      { key: 'arch_code_prefix', labelAr: 'بادئة الأرشيف (مثال EAO)', labelEn: 'Archive Code Prefix' },
      { key: 'arch_code_num', labelAr: 'رقم الأرشيف (مثال ARCHIVE 01)', labelEn: 'Archive Code Number' },
      { key: 'about_heading', labelAr: 'العنوان الفرعي', labelEn: 'Bio Heading' },
      { key: 'about_p1', labelAr: 'الفقرة الأولى', labelEn: 'Bio Paragraph 1', multiline: true },
      { key: 'about_p2', labelAr: 'الفقرة الثانية', labelEn: 'Bio Paragraph 2', multiline: true },
      { key: 'stat_years_val', labelAr: 'رقم سنوات الخبرة', labelEn: 'Stat: Years Number' },
      { key: 'stat_years', labelAr: 'تسمية سنوات الخبرة', labelEn: 'Stat: Years Label' },
      { key: 'stat_projects_val', labelAr: 'رقم المشاريع المنجزة', labelEn: 'Stat: Projects Number' },
      { key: 'stat_projects', labelAr: 'تسمية المشاريع', labelEn: 'Stat: Projects Label' },
      { key: 'stat_workshops_val', labelAr: 'رقم الورش التدريبية', labelEn: 'Stat: Workshops Number' },
      { key: 'stat_workshops', labelAr: 'تسمية الورش', labelEn: 'Stat: Workshops Label' },
    ],
  },
  {
    id: 'portfolio_cv',
    labelAr: 'المعرض والسيرة الذاتية (Portfolio & CV)',
    labelEn: 'Portfolio & CV Section',
    keys: [
      { key: 'cv_label', labelAr: 'وسم السيرة الذاتية', labelEn: 'CV Label' },
      { key: 'cv_title', labelAr: 'عنوان السيرة الذاتية', labelEn: 'CV Title' },
      { key: 'cv_desc', labelAr: 'وصف السيرة الذاتية', labelEn: 'CV Description', multiline: true },
      { key: 'btn_download_cv', labelAr: 'زر تحميل PDF', labelEn: 'CV Download Button' },
      { key: 'btn_print_cv', labelAr: 'زر طباعة السيرة', labelEn: 'CV Print Button' },
      { key: 'portfolio_label', labelAr: 'وسم المعرض', labelEn: 'Portfolio Label' },
      { key: 'portfolio_title', labelAr: 'عنوان المعرض', labelEn: 'Portfolio Title' },
      { key: 'portfolio_desc', labelAr: 'وصف المعرض', labelEn: 'Portfolio Description', multiline: true },
      { key: 'filter_all', labelAr: 'فلتر: الكل', labelEn: 'Filter: All' },
      { key: 'filter_humanitarian', labelAr: 'فلتر: إنساني', labelEn: 'Filter: Humanitarian' },
      { key: 'filter_community', labelAr: 'فلتر: مجتمعي', labelEn: 'Filter: Community' },
      { key: 'filter_documentary', labelAr: 'فلتر: وثائقي', labelEn: 'Filter: Documentary' },
      { key: 'filter_workshops', labelAr: 'فلتر: ورش عمل', labelEn: 'Filter: Workshops' },
    ],
  },
  {
    id: 'mission_services',
    labelAr: 'الرسالة والخدمات (Mission & Services)',
    labelEn: 'Mission & Services',
    keys: [
      { key: 'mission_label', labelAr: 'وسم قسم الرسالة', labelEn: 'Mission Label' },
      { key: 'mission_title', labelAr: 'عنوان الرسالة', labelEn: 'Mission Title' },
      { key: 'mission_desc', labelAr: 'وصف الرسالة', labelEn: 'Mission Description', multiline: true },
      { key: 'mission_1_title', labelAr: 'الركيزة 1 — العنوان', labelEn: 'Mission 1 Title' },
      { key: 'mission_1_desc', labelAr: 'الركيزة 1 — الوصف', labelEn: 'Mission 1 Desc', multiline: true },
      { key: 'mission_2_title', labelAr: 'الركيزة 2 — العنوان', labelEn: 'Mission 2 Title' },
      { key: 'mission_2_desc', labelAr: 'الركيزة 2 — الوصف', labelEn: 'Mission 2 Desc', multiline: true },
      { key: 'mission_3_title', labelAr: 'الركيزة 3 — العنوان', labelEn: 'Mission 3 Title' },
      { key: 'mission_3_desc', labelAr: 'الركيزة 3 — الوصف', labelEn: 'Mission 3 Desc', multiline: true },
      { key: 'mission_4_title', labelAr: 'الركيزة 4 — العنوان', labelEn: 'Mission 4 Title' },
      { key: 'mission_4_desc', labelAr: 'الركيزة 4 — الوصف', labelEn: 'Mission 4 Desc', multiline: true },
      { key: 'services_label', labelAr: 'وسم قسم الخدمات', labelEn: 'Services Label' },
      { key: 'services_title', labelAr: 'عنوان الخدمات', labelEn: 'Services Title' },
      { key: 'services_desc', labelAr: 'وصف الخدمات', labelEn: 'Services Description', multiline: true },
      { key: 'service_1_title', labelAr: 'الخدمة 1 — العنوان', labelEn: 'Service 1 Title' },
      { key: 'service_1_desc', labelAr: 'الخدمة 1 — الوصف', labelEn: 'Service 1 Desc', multiline: true },
      { key: 'service_2_title', labelAr: 'الخدمة 2 — العنوان', labelEn: 'Service 2 Title' },
      { key: 'service_2_desc', labelAr: 'الخدمة 2 — الوصف', labelEn: 'Service 2 Desc', multiline: true },
      { key: 'service_3_title', labelAr: 'الخدمة 3 — العنوان', labelEn: 'Service 3 Title' },
      { key: 'service_3_desc', labelAr: 'الخدمة 3 — الوصف', labelEn: 'Service 3 Desc', multiline: true },
      { key: 'service_4_title', labelAr: 'الخدمة 4 — العنوان', labelEn: 'Service 4 Title' },
      { key: 'service_4_desc', labelAr: 'الخدمة 4 — الوصف', labelEn: 'Service 4 Desc', multiline: true },
      { key: 'service_5_title', labelAr: 'الخدمة 5 — العنوان', labelEn: 'Service 5 Title' },
      { key: 'service_5_desc', labelAr: 'الخدمة 5 — الوصف', labelEn: 'Service 5 Desc', multiline: true },
      { key: 'service_6_title', labelAr: 'الخدمة 6 — العنوان', labelEn: 'Service 6 Title' },
      { key: 'service_6_desc', labelAr: 'الخدمة 6 — الوصف', labelEn: 'Service 6 Desc', multiline: true },
    ],
  },
  {
    id: 'contact_footer',
    labelAr: 'التواصل والتذييل (Contact & Footer)',
    labelEn: 'Contact, Booking & Footer',
    keys: [
      { key: 'contact_label', labelAr: 'وسم قسم التواصل', labelEn: 'Contact Label' },
      { key: 'contact_title', labelAr: 'عنوان التواصل', labelEn: 'Contact Title' },
      { key: 'contact_desc', labelAr: 'وصف التواصل', labelEn: 'Contact Description', multiline: true },
      { key: 'contact_heading', labelAr: 'عنوان عمود المعلومات', labelEn: 'Contact Heading' },
      { key: 'contact_p', labelAr: 'فقرة التواصل', labelEn: 'Contact Paragraph', multiline: true },
      { key: 'contact_email_label', labelAr: 'تسمية البريد', labelEn: 'Email Label' },
      { key: 'contact_phone_label', labelAr: 'تسمية الواتساب/الهاتف', labelEn: 'WhatsApp/Phone Label' },
      { key: 'contact_location_label', labelAr: 'تسمية الموقع', labelEn: 'Location Label' },
      { key: 'contact_location', labelAr: 'الموقع الجغرافي', labelEn: 'Location Text' },
      { key: 'form_submit', labelAr: 'زر إرسال الرسالة', labelEn: 'Submit Button Text' },
      { key: 'btn_send_whatsapp', labelAr: 'زر الإرسال عبر واتساب', labelEn: 'WhatsApp Button Text' },
      { key: 'portal_label', labelAr: 'وسم بوابة العملاء', labelEn: 'Client Portal Label' },
      { key: 'portal_title', labelAr: 'عنوان بوابة العملاء', labelEn: 'Client Portal Title' },
      { key: 'portal_desc', labelAr: 'وصف بوابة العملاء', labelEn: 'Client Portal Desc', multiline: true },
      { key: 'footer_client_access', labelAr: 'نص زر بوابة العملاء بالتذييل', labelEn: 'Footer Client Access Button' },
      { key: 'footer_copy', labelAr: 'نص حقوق الملكية بالتذييل', labelEn: 'Footer Copyright Text' },
    ],
  },
];

export const AdminContentPanel: React.FC<AdminContentPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { content, saveContent } = useSiteCMS();
  const [draft, setDraft] = useState<SiteContentOverrides>(content);
  const [activeGroupId, setActiveGroupId] = useState<string>(CONTENT_GROUPS[0].id);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const activeGroup = useMemo(
    () => CONTENT_GROUPS.find((g) => g.id === activeGroupId) || CONTENT_GROUPS[0],
    [activeGroupId]
  );

  const visibleFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? CONTENT_GROUPS.flatMap((g) => g.keys) : activeGroup.keys;

    if (!q) return list;
    return list.filter(
      (item) =>
        item.labelAr.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        String(item.key).toLowerCase().includes(q) ||
        (translations.ar[item.key] || '').toLowerCase().includes(q) ||
        (translations.en[item.key] || '').toLowerCase().includes(q)
    );
  }, [activeGroup, search]);

  const updateField = (lang: Language, key: keyof TranslationDictionary, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [lang]: {
        ...(prev[lang] || {}),
        [key]: value,
      },
    }));
  };

  const resetField = (key: keyof TranslationDictionary) => {
    setDraft((prev) => {
      const nextAr = { ...(prev.ar || {}) };
      const nextEn = { ...(prev.en || {}) };
      delete nextAr[key];
      delete nextEn[key];
      return { ar: nextAr, en: nextEn };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveContent(draft);
      onShowToast(
        isAr
          ? 'تم حفظ كافة التعديلات النصية الشاملة وتحديث الموقع حياً بنجاح.'
          : 'All bilingual content overrides published live to cloud.'
      );
    } catch {
      onShowToast(
        isAr ? 'تعذّر حفظ التعديلات النصية.' : 'Failed to save content overrides.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel-stack">
      <AdminPortraitStudioCard currentLang={currentLang} onShowToast={onShowToast} />

      <form onSubmit={handleSave} className="admin-panel-stack">
        <section className="admin-card-group">
          <div className="admin-card-group-head">
            <div>
              <h3>
                {isAr
                  ? 'محرر التعديل الحر الشامل (100% من الهيدر إلى التذييل)'
                  : 'Complete Visual Content Editor (Header to Footer)'}
              </h3>
              <p>
                {isAr
                  ? 'حرّر أي عنوان أو إحصائية أو خدمة أو زر أو نص تذييل باللغتين مع إمكانية الاستعادة الفورية.'
                  : 'Edit any headline, stat number, mission pillar, service, button, or footer line side-by-side.'}
              </p>
            </div>
          </div>

          <div className="admin-field">
            <input
              type="search"
              placeholder={
                isAr
                  ? 'ابحث عن أي نص أو عنوان أو زر للتعديل السريع...'
                  : 'Search any text, heading, or button across the entire site...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!search.trim() && (
            <div className="admin-pill-strip">
              {CONTENT_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`admin-sub-pill ${activeGroupId === g.id ? 'active' : ''}`}
                  onClick={() => setActiveGroupId(g.id)}
                >
                  {isAr ? g.labelAr : g.labelEn}
                </button>
              ))}
            </div>
          )}

          <div className="admin-bilingual-list">
            {visibleFields.map((field) => {
              const arVal =
                draft.ar?.[field.key] !== undefined
                  ? draft.ar[field.key]
                  : translations.ar[field.key];
              const enVal =
                draft.en?.[field.key] !== undefined
                  ? draft.en[field.key]
                  : translations.en[field.key];
              const isModified =
                draft.ar?.[field.key] !== undefined || draft.en?.[field.key] !== undefined;

              return (
                <div key={String(field.key)} className="admin-bilingual-row">
                  <div className="admin-bilingual-row-head">
                    <strong>{isAr ? field.labelAr : field.labelEn}</strong>
                    {isModified && (
                      <button
                        type="button"
                        className="admin-btn-ghost admin-btn-sm"
                        onClick={() => resetField(field.key)}
                      >
                        <i className="fas fa-undo"></i>
                        <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>{isAr ? 'النص العربي (AR)' : 'Arabic Text (AR)'}</label>
                      {field.multiline ? (
                        <textarea
                          rows={3}
                          dir="rtl"
                          value={arVal}
                          onChange={(e) => updateField('ar', field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          dir="rtl"
                          value={arVal}
                          onChange={(e) => updateField('ar', field.key, e.target.value)}
                        />
                      )}
                    </div>
                    <div className="admin-field">
                      <label>{isAr ? 'النص الإنجليزي (EN)' : 'English Text (EN)'}</label>
                      {field.multiline ? (
                        <textarea
                          rows={3}
                          dir="ltr"
                          value={enVal}
                          onChange={(e) => updateField('en', field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          dir="ltr"
                          value={enVal}
                          onChange={(e) => updateField('en', field.key, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="admin-save-bar">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
            <span>
              {saving
                ? isAr
                  ? 'جاري النشر السحابي...'
                  : 'Publishing Content...'
                : isAr
                ? 'حفظ ونشر كافة التعديلات النصية'
                : 'Publish All Content Changes'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

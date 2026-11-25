import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';
import { SiteLayoutConfig, SiteSectionId, SiteSeoConfig } from '../../types/cms';

interface AdminLayoutSeoPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

const SECTION_LABELS: Record<SiteSectionId, { ar: string; en: string; icon: string }> = {
  hero: { ar: 'القسم الافتتاحي (Hero)', en: 'Hero Showcase', icon: 'fa-star' },
  about: { ar: 'نبذة عن المصورة والإحصائيات', en: 'About & Impact Stats', icon: 'fa-user-tie' },
  cv: { ar: 'ملخص السيرة الذاتية والاعتمادات', en: 'CV & Credentials Summary', icon: 'fa-id-card' },
  portfolio: { ar: 'معرض السلاسل الفوتوغرافية', en: 'Portfolio Photo Series', icon: 'fa-images' },
  mission: { ar: 'الرسالة الإنسانية والرؤية', en: 'Documentary Mission', icon: 'fa-compass' },
  services: { ar: 'الخدمات والتعاون المؤسسي', en: 'Services & Commissions', icon: 'fa-briefcase' },
  contact: { ar: 'نموذج الحجز والتواصل المباشر', en: 'Booking & Contact Form', icon: 'fa-envelope' },
};

export const AdminLayoutSeoPanel: React.FC<AdminLayoutSeoPanelProps> = ({
  currentLang,
  onShowToast,
}) => {
  const { layout, seo, saveLayout, saveSeo } = useSiteCMS();
  const [layoutDraft, setLayoutDraft] = useState<SiteLayoutConfig>(layout);
  const [seoDraft, setSeoDraft] = useState<SiteSeoConfig>(seo);
  const [saving, setSaving] = useState(false);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    setLayoutDraft(layout);
  }, [layout]);

  useEffect(() => {
    setSeoDraft(seo);
  }, [seo]);

  const toggleSectionVisibility = (id: SiteSectionId) => {
    setLayoutDraft((prev) => {
      const hidden = prev.hiddenSections.includes(id)
        ? prev.hiddenSections.filter((s) => s !== id)
        : [...prev.hiddenSections, id];
      return { ...prev, hiddenSections: hidden };
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setLayoutDraft((prev) => {
      const nextOrder = [...prev.sectionOrder];
      const target = index + direction;
      if (target < 0 || target >= nextOrder.length) return prev;
      [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
      return { ...prev, sectionOrder: nextOrder };
    });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([saveLayout(layoutDraft), saveSeo(seoDraft)]);
      onShowToast(
        isAr
          ? 'تم حفظ هيكل الصفحة وإعدادات العلامة البيضاء و SEO سحابياً.'
          : 'Page structure, white-label branding, and SEO saved to cloud.'
      );
    } catch {
      onShowToast(
        isAr
          ? 'تعذّر حفظ إعدادات الهيكل و SEO.'
          : 'Failed to save layout and SEO settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="admin-panel-stack">
      {/* Section Visibility & Ordering */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'مدير هيكل الصفحة وترتيب الأقسام' : 'Page Structure & Section Order'}</h3>
            <p>
              {isAr
                ? 'أخفِ أو أظهر أي قسم بضغطة واحدة وأعد ترتيب أقسام الموقع من الهيدر حتى التذييل.'
                : 'Toggle visibility or reorder any website section live without editing code.'}
            </p>
          </div>
        </div>

        <div className="admin-grouped-list">
          {layoutDraft.sectionOrder.map((sectionId, idx) => {
            const meta = SECTION_LABELS[sectionId];
            const isHidden = layoutDraft.hiddenSections.includes(sectionId);
            return (
              <div
                key={sectionId}
                className={`admin-grouped-row ${isHidden ? 'is-muted' : ''}`}
              >
                <div className="admin-row-info-inline">
                  <span className="admin-order-index">{idx + 1}</span>
                  <i className={`fas ${meta.icon} text-gold`}></i>
                  <strong>{isAr ? meta.ar : meta.en}</strong>
                </div>

                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === layoutDraft.sectionOrder.length - 1}
                    aria-label="Move down"
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                  <button
                    type="button"
                    className={`admin-toggle-pill ${isHidden ? 'off' : 'on'}`}
                    onClick={() => toggleSectionVisibility(sectionId)}
                  >
                    <i className={`fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    <span>
                      {isHidden
                        ? isAr
                          ? 'مخفي'
                          : 'Hidden'
                        : isAr
                        ? 'ظاهر'
                        : 'Visible'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Brand Identity & Navigation Options */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'الهوية والعلامة البيضاء (White-Label)' : 'White-Label Brand & Navigation'}</h3>
            <p>
              {isAr
                ? 'خصّص اسم الاستوديو والروابط السريعة لإعادة بيع أو تسليم القالب لأي مصور بدون لمس الكود.'
                : 'Rebrand studio name and navigation toggles cleanly for any photographer or agency.'}
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="brandNameAr">{isAr ? 'اسم العلامة (عربي)' : 'Brand Name (Arabic)'}</label>
            <input
              id="brandNameAr"
              type="text"
              maxLength={80}
              value={layoutDraft.brandNameAr}
              onChange={(e) => setLayoutDraft({ ...layoutDraft, brandNameAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="brandNameEn">{isAr ? 'اسم العلامة (إنجليزي)' : 'Brand Name (English)'}</label>
            <input
              id="brandNameEn"
              type="text"
              maxLength={80}
              dir="ltr"
              value={layoutDraft.brandNameEn}
              onChange={(e) => setLayoutDraft({ ...layoutDraft, brandNameEn: e.target.value })}
            />
          </div>
        </div>

        <div className="admin-switches-row">
          <label className="admin-switch-item">
            <input
              type="checkbox"
              checked={layoutDraft.showCvButton}
              onChange={(e) =>
                setLayoutDraft({ ...layoutDraft, showCvButton: e.target.checked })
              }
            />
            <span>{isAr ? 'إظهار زر ملف السيرة الذاتية في الهيدر' : 'Show CV Dossier button in Navbar'}</span>
          </label>
          <label className="admin-switch-item">
            <input
              type="checkbox"
              checked={layoutDraft.showClientPortalButton}
              onChange={(e) =>
                setLayoutDraft({ ...layoutDraft, showClientPortalButton: e.target.checked })
              }
            />
            <span>{isAr ? 'إظهار رابط بوابة العملاء في التذييل' : 'Show Client Delivery Portal link in Footer'}</span>
          </label>
        </div>
      </section>

      {/* SEO & Contact Channels */}
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'محركات البحث (SEO) وقنوات التواصل المباشرة' : 'SEO Metadata & Contact Channels'}</h3>
            <p>
              {isAr
                ? 'تُحدّث عنوان التبويب والوصف التعريفي وروابط الواتساب والتواصل لحظياً.'
                : 'Dynamically syncs browser tab titles, meta descriptions, WhatsApp dispatch, and social links.'}
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="seoTitleEn">{isAr ? 'عنوان الموقع (EN)' : 'Site Title (English)'}</label>
            <input
              id="seoTitleEn"
              type="text"
              dir="ltr"
              maxLength={140}
              value={seoDraft.siteTitleEn}
              onChange={(e) => setSeoDraft({ ...seoDraft, siteTitleEn: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoTitleAr">{isAr ? 'عنوان الموقع (AR)' : 'Site Title (Arabic)'}</label>
            <input
              id="seoTitleAr"
              type="text"
              maxLength={140}
              value={seoDraft.siteTitleAr}
              onChange={(e) => setSeoDraft({ ...seoDraft, siteTitleAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoDescEn">{isAr ? 'وصف SEO (EN)' : 'Meta Description (English)'}</label>
            <textarea
              id="seoDescEn"
              rows={2}
              dir="ltr"
              maxLength={320}
              value={seoDraft.metaDescriptionEn}
              onChange={(e) => setSeoDraft({ ...seoDraft, metaDescriptionEn: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoDescAr">{isAr ? 'وصف SEO (AR)' : 'Meta Description (Arabic)'}</label>
            <textarea
              id="seoDescAr"
              rows={2}
              maxLength={320}
              value={seoDraft.metaDescriptionAr}
              onChange={(e) => setSeoDraft({ ...seoDraft, metaDescriptionAr: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoWhatsapp">{isAr ? 'رقم واتساب الاستوديو (دولي بدون +)' : 'Studio WhatsApp (Intl digits)'}</label>
            <input
              id="seoWhatsapp"
              type="text"
              dir="ltr"
              maxLength={24}
              value={seoDraft.whatsappNumber}
              onChange={(e) => setSeoDraft({ ...seoDraft, whatsappNumber: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoEmail">{isAr ? 'البريد الإلكتروني الرسمي' : 'Official Contact Email'}</label>
            <input
              id="seoEmail"
              type="email"
              dir="ltr"
              maxLength={140}
              value={seoDraft.contactEmail}
              onChange={(e) => setSeoDraft({ ...seoDraft, contactEmail: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoInstagram">{isAr ? 'رابط إنستغرام (Instagram URL)' : 'Instagram Profile URL'}</label>
            <input
              id="seoInstagram"
              type="url"
              dir="ltr"
              maxLength={320}
              placeholder="https://www.instagram.com/..."
              value={seoDraft.instagramUrl || ''}
              onChange={(e) => setSeoDraft({ ...seoDraft, instagramUrl: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoFacebook">{isAr ? 'رابط فيسبوك (Facebook URL)' : 'Facebook Page/Profile URL'}</label>
            <input
              id="seoFacebook"
              type="url"
              dir="ltr"
              maxLength={320}
              placeholder="https://www.facebook.com/..."
              value={seoDraft.facebookUrl || ''}
              onChange={(e) => setSeoDraft({ ...seoDraft, facebookUrl: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoLinkedin">{isAr ? 'رابط لينكدإن (LinkedIn URL)' : 'LinkedIn Profile URL'}</label>
            <input
              id="seoLinkedin"
              type="url"
              dir="ltr"
              maxLength={320}
              placeholder="https://www.linkedin.com/in/..."
              value={seoDraft.linkedinUrl || ''}
              onChange={(e) => setSeoDraft({ ...seoDraft, linkedinUrl: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="seoOgImage">{isAr ? 'صورة المشاركة الاجتماعية (OG Image URL)' : 'Social Share OG Image URL'}</label>
            <input
              id="seoOgImage"
              type="url"
              dir="ltr"
              maxLength={320}
              placeholder="https://..."
              value={seoDraft.ogImageUrl || ''}
              onChange={(e) => setSeoDraft({ ...seoDraft, ogImageUrl: e.target.value })}
            />
          </div>
        </div>
      </section>

      <div className="admin-save-bar">
        <button type="submit" className="admin-btn-primary" disabled={saving}>
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
          <span>
            {saving
              ? isAr
                ? 'جاري الحفظ السحابي...'
                : 'Publishing Changes...'
              : isAr
              ? 'حفظ هيكل الموقع وإعدادات SEO'
              : 'Save Layout & SEO to Cloud'}
          </span>
        </button>
      </div>
    </form>
  );
};

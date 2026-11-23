import React, { useEffect, useState } from 'react';
import { Language } from '../../types';
import { CVData } from '../../data/cvData';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface AdminCVPanelProps {
  currentLang: Language;
  onShowToast: (message: string) => void;
}

type CVEditorWing = 'statement' | 'education' | 'exhibitions' | 'awards' | 'partners';

export const AdminCVPanel: React.FC<AdminCVPanelProps> = ({ currentLang, onShowToast }) => {
  const { cvDossier, saveCV } = useSiteCMS();
  const [draft, setDraft] = useState<CVData>(cvDossier);
  const [wing, setWing] = useState<CVEditorWing>('statement');
  const [saving, setSaving] = useState(false);

  const isAr = currentLang === 'ar';

  useEffect(() => {
    setDraft(cvDossier);
  }, [cvDossier]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCV(draft);
      onShowToast(
        isAr
          ? 'تم حفظ وتحديث ملف السيرة الذاتية بجميع أركانه سحابياً.'
          : 'CV Dossier saved and published across all wings.'
      );
    } catch {
      onShowToast(isAr ? 'تعذّر حفظ السيرة الذاتية.' : 'Failed to save CV Dossier.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="admin-panel-stack">
      <section className="admin-card-group">
        <div className="admin-card-group-head">
          <div>
            <h3>{isAr ? 'محرر أركان السيرة الذاتية الخمسة' : '5-Wing CV Dossier Editor'}</h3>
            <p>
              {isAr
                ? 'عدّل البيان الفني وأضف أو حدّث المؤهلات والمعارض والجوائز والمنظمات الشريكة.'
                : 'Manage artist manifesto, education, exhibitions, fellowships, and partner organizations.'}
            </p>
          </div>
        </div>

        <div className="admin-pill-strip">
          {(
            [
              { id: 'statement', ar: 'البيان الفني', en: 'Manifesto' },
              { id: 'education', ar: 'المؤهلات', en: 'Education' },
              { id: 'exhibitions', ar: 'المعارض', en: 'Exhibitions' },
              { id: 'awards', ar: 'الجوائز والمنح', en: 'Awards' },
              { id: 'partners', ar: 'الشركاء', en: 'Partners' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-sub-pill ${wing === tab.id ? 'active' : ''}`}
              onClick={() => setWing(tab.id)}
            >
              {isAr ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {wing === 'statement' && (
          <div className="admin-form-grid">
            <div className="admin-field admin-field-full">
              <label>{isAr ? 'البيان التوثيقي الرسمي (عربي)' : 'Official Manifesto (Arabic)'}</label>
              <textarea
                rows={5}
                dir="rtl"
                value={draft.artistStatementAr}
                onChange={(e) => setDraft({ ...draft, artistStatementAr: e.target.value })}
              />
            </div>
            <div className="admin-field admin-field-full">
              <label>{isAr ? 'البيان التوثيقي الرسمي (إنجليزي)' : 'Official Manifesto (English)'}</label>
              <textarea
                rows={5}
                dir="ltr"
                value={draft.artistStatementEn}
                onChange={(e) => setDraft({ ...draft, artistStatementEn: e.target.value })}
              />
            </div>
          </div>
        )}

        {wing === 'education' && (
          <div className="admin-bilingual-list">
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  education: [
                    {
                      year: '2026',
                      degreeAr: 'مؤهل أكاديمي جديد',
                      degreeEn: 'New Academic Qualification',
                      institutionAr: 'المؤسسة التعليمية',
                      institutionEn: 'Academic Institution',
                    },
                    ...draft.education,
                  ],
                })
              }
            >
              <i className="fas fa-plus"></i>
              <span>{isAr ? 'إضافة مؤهل جديد' : 'Add Education Entry'}</span>
            </button>

            {draft.education.map((edu, idx) => (
              <div key={idx} className="admin-bilingual-row">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>{isAr ? 'السنة' : 'Year'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={edu.year}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[idx] = { ...edu, year: e.target.value };
                        setDraft({ ...draft, education: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'الدرجة (عربي)' : 'Degree (AR)'}</label>
                    <input
                      type="text"
                      value={edu.degreeAr}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[idx] = { ...edu, degreeAr: e.target.value };
                        setDraft({ ...draft, education: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'الدرجة (إنجليزي)' : 'Degree (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={edu.degreeEn}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[idx] = { ...edu, degreeEn: e.target.value };
                        setDraft({ ...draft, education: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'المؤسسة (إنجليزي)' : 'Institution (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={edu.institutionEn}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[idx] = { ...edu, institutionEn: e.target.value };
                        setDraft({ ...draft, education: next });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      education: draft.education.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <i className="fas fa-trash-alt"></i>
                  <span>{isAr ? 'حذف' : 'Remove'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {wing === 'exhibitions' && (
          <div className="admin-bilingual-list">
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  exhibitions: [
                    {
                      year: '2026',
                      titleAr: 'معرض دولي جديد',
                      titleEn: 'New International Exhibition',
                      locationAr: 'المدينة / الدولة',
                      locationEn: 'City, Country',
                      typeAr: 'معرض جماعي',
                      typeEn: 'Group Exhibition',
                    },
                    ...draft.exhibitions,
                  ],
                })
              }
            >
              <i className="fas fa-plus"></i>
              <span>{isAr ? 'إضافة معرض جديد' : 'Add Exhibition'}</span>
            </button>

            {draft.exhibitions.map((ex, idx) => (
              <div key={idx} className="admin-bilingual-row">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>{isAr ? 'السنة' : 'Year'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={ex.year}
                      onChange={(e) => {
                        const next = [...draft.exhibitions];
                        next[idx] = { ...ex, year: e.target.value };
                        setDraft({ ...draft, exhibitions: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'المعرض (عربي)' : 'Title (AR)'}</label>
                    <input
                      type="text"
                      value={ex.titleAr}
                      onChange={(e) => {
                        const next = [...draft.exhibitions];
                        next[idx] = { ...ex, titleAr: e.target.value };
                        setDraft({ ...draft, exhibitions: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'المعرض (إنجليزي)' : 'Title (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={ex.titleEn}
                      onChange={(e) => {
                        const next = [...draft.exhibitions];
                        next[idx] = { ...ex, titleEn: e.target.value };
                        setDraft({ ...draft, exhibitions: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'الموقع (إنجليزي)' : 'Location (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={ex.locationEn}
                      onChange={(e) => {
                        const next = [...draft.exhibitions];
                        next[idx] = { ...ex, locationEn: e.target.value };
                        setDraft({ ...draft, exhibitions: next });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      exhibitions: draft.exhibitions.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <i className="fas fa-trash-alt"></i>
                  <span>{isAr ? 'حذف' : 'Remove'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {wing === 'awards' && (
          <div className="admin-bilingual-list">
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  awards: [
                    {
                      year: '2026',
                      titleAr: 'جائزة أو زمالة جديدة',
                      titleEn: 'New Grant or Fellowship',
                      organizationAr: 'الجهة المانحة',
                      organizationEn: 'Granting Organization',
                      descriptionAr: 'وصف الإنجاز التوثيقي',
                      descriptionEn: 'Documentary recognition summary',
                    },
                    ...draft.awards,
                  ],
                })
              }
            >
              <i className="fas fa-plus"></i>
              <span>{isAr ? 'إضافة جائزة / منحة' : 'Add Award / Grant'}</span>
            </button>

            {draft.awards.map((aw, idx) => (
              <div key={idx} className="admin-bilingual-row">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>{isAr ? 'السنة' : 'Year'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={aw.year}
                      onChange={(e) => {
                        const next = [...draft.awards];
                        next[idx] = { ...aw, year: e.target.value };
                        setDraft({ ...draft, awards: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'العنوان (عربي)' : 'Title (AR)'}</label>
                    <input
                      type="text"
                      value={aw.titleAr}
                      onChange={(e) => {
                        const next = [...draft.awards];
                        next[idx] = { ...aw, titleAr: e.target.value };
                        setDraft({ ...draft, awards: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={aw.titleEn}
                      onChange={(e) => {
                        const next = [...draft.awards];
                        next[idx] = { ...aw, titleEn: e.target.value };
                        setDraft({ ...draft, awards: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'الجهة المانحة' : 'Organization'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={aw.organizationEn}
                      onChange={(e) => {
                        const next = [...draft.awards];
                        next[idx] = { ...aw, organizationEn: e.target.value };
                        setDraft({ ...draft, awards: next });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      awards: draft.awards.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <i className="fas fa-trash-alt"></i>
                  <span>{isAr ? 'حذف' : 'Remove'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {wing === 'partners' && (
          <div className="admin-bilingual-list">
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  clients: [
                    {
                      name: 'New Partner Agency',
                      roleAr: 'شريك ميداني وتوثيقي',
                      roleEn: 'Field Documentation Partner',
                      category: 'humanitarian',
                    },
                    ...draft.clients,
                  ],
                })
              }
            >
              <i className="fas fa-plus"></i>
              <span>{isAr ? 'إضافة منظمة شريكة' : 'Add Partner Organization'}</span>
            </button>

            {draft.clients.map((cl, idx) => (
              <div key={idx} className="admin-bilingual-row">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>{isAr ? 'اسم المنظمة' : 'Organization Name'}</label>
                    <input
                      type="text"
                      value={cl.name}
                      onChange={(e) => {
                        const next = [...draft.clients];
                        next[idx] = { ...cl, name: e.target.value };
                        setDraft({ ...draft, clients: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'تصنيف الشريك' : 'Partner Category'}</label>
                    <select
                      value={cl.category}
                      onChange={(e) => {
                        const next = [...draft.clients];
                        next[idx] = {
                          ...cl,
                          category: e.target.value as 'humanitarian' | 'media' | 'community',
                        };
                        setDraft({ ...draft, clients: next });
                      }}
                    >
                      <option value="humanitarian">{isAr ? 'إنساني وتنموي' : 'Humanitarian'}</option>
                      <option value="media">{isAr ? 'إعلامي وصحفي' : 'Media & Press'}</option>
                      <option value="community">{isAr ? 'مجتمعي وثقافي' : 'Community'}</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'طبيعة التعاون (عربي)' : 'Role (AR)'}</label>
                    <input
                      type="text"
                      value={cl.roleAr}
                      onChange={(e) => {
                        const next = [...draft.clients];
                        next[idx] = { ...cl, roleAr: e.target.value };
                        setDraft({ ...draft, clients: next });
                      }}
                    />
                  </div>
                  <div className="admin-field">
                    <label>{isAr ? 'طبيعة التعاون (إنجليزي)' : 'Role (EN)'}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={cl.roleEn}
                      onChange={(e) => {
                        const next = [...draft.clients];
                        next[idx] = { ...cl, roleEn: e.target.value };
                        setDraft({ ...draft, clients: next });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      clients: draft.clients.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <i className="fas fa-trash-alt"></i>
                  <span>{isAr ? 'حذف' : 'Remove'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="admin-save-bar">
        <button type="submit" className="admin-btn-primary" disabled={saving}>
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
          <span>{isAr ? 'حفظ ونشر السيرة الذاتية' : 'Publish CV Dossier to Cloud'}</span>
        </button>
      </div>
    </form>
  );
};

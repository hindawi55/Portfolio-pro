import React from 'react';
import { Language } from '../../types';
import { useSiteCMS } from '../../context/SiteCMSContext';

interface PrintableCVSheetProps {
  currentLang: Language;
}

export const PrintableCVSheet: React.FC<PrintableCVSheetProps> = ({ currentLang }) => {
  const { cvDossier, layout, seo } = useSiteCMS();
  const isAr = currentLang === 'ar';
  const brandName = isAr
    ? layout.brandNameAr || 'إنعام علي عثمان'
    : (layout.brandNameEn || 'ENAAM ALI OSMAN').toUpperCase();

  return (
    <div id="cvPrintableArea" className="cv-print-only-sheet" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="sheet-header">
        <h2>{brandName}</h2>
        <div className="sheet-sub">
          {isAr
            ? 'مصورة وثائقية · صحافة الصورة الإنسانية · مدربة توثيق مجتمعي'
            : 'Documentary Storyteller · Visual Journalist · Community Documentation Trainer'}
        </div>
        <div className="sheet-contact-line" dir="ltr">
          {seo.contactEmail || 'alienaam634@gmail.com'}
          {seo.whatsappNumber ? ` · +${seo.whatsappNumber.replace(/^\+/, '')}` : ''}
        </div>
      </header>

      <section className="sheet-section">
        <h4>{isAr ? 'البيان الفني والمنهج التوثيقي' : 'Documentary Manifesto'}</h4>
        <p>{isAr ? cvDossier.artistStatementAr : cvDossier.artistStatementEn}</p>
      </section>

      <section className="sheet-section">
        <h4>{isAr ? 'المؤهلات الأكاديمية والتدريبية' : 'Academic Education & Training'}</h4>
        <ul>
          {cvDossier.education.map((edu, i) => (
            <li key={i}>
              <strong>{edu.year}</strong> — {isAr ? edu.degreeAr : edu.degreeEn} (
              {isAr ? edu.institutionAr : edu.institutionEn})
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet-section">
        <h4>{isAr ? 'المعارض والمشاركات الدولية' : 'Selected Exhibitions'}</h4>
        <ul>
          {cvDossier.exhibitions.map((ex, i) => (
            <li key={i}>
              <strong>{ex.year}</strong> — {isAr ? ex.titleAr : ex.titleEn} ·{' '}
              {isAr ? ex.locationAr : ex.locationEn}
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet-section">
        <h4>{isAr ? 'المنح والجوائز والزمالات' : 'Grants, Fellowships & Awards'}</h4>
        <ul>
          {cvDossier.awards.map((aw, i) => (
            <li key={i}>
              <strong>{aw.year}</strong> — {isAr ? aw.titleAr : aw.titleEn} (
              {isAr ? aw.organizationAr : aw.organizationEn})
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet-section">
        <h4>{isAr ? 'العتاد الميداني المعتمد' : 'Field Production Kit'}</h4>
        <ul>
          {cvDossier.gear.flatMap((kit, kIdx) =>
            kit.items.map((item, iIdx) => (
              <li key={`${kIdx}-${iIdx}`}>
                <strong>{item.name}</strong> —{' '}
                {isAr ? item.descriptionAr : item.descriptionEn}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="sheet-section">
        <h4>{isAr ? 'الشركاء والهيئات الدولية' : 'Institutional Partners'}</h4>
        <ul>
          {cvDossier.clients.map((cl, i) => (
            <li key={i}>
              <strong>{cl.name}</strong> — {isAr ? cl.roleAr : cl.roleEn}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

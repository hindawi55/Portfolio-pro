import { Language } from '../types';
import { CVData } from '../data/cvData';
import { SiteLayoutConfig, SiteSeoConfig } from '../types/cms';

interface CVPdfExportOptions {
  lang: Language;
  cvDossier: CVData;
  layout: SiteLayoutConfig;
  seo: SiteSeoConfig;
}

const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN_X = 76;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FOOTER_Y = PAGE_H - 64;

function dataUrlToUint8Array(dataUrl: string): Uint8Array<ArrayBuffer> {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeAscii(str: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(str.length));
  for (let i = 0; i < str.length; i++) {
    out[i] = str.charCodeAt(i) & 0xff;
  }
  return out;
}

function buildPdfFromJpegPages(jpegPages: Uint8Array<ArrayBuffer>[]): Blob {
  // Standard PDF 1.4 object layout:
  // 1: Catalog, 2: Pages, then per page (3 + i*3): Page, Content, Image XObject
  const chunks: BlobPart[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushBytes = (bytes: Uint8Array<ArrayBuffer>) => {
    chunks.push(bytes);
    cursor += bytes.length;
  };
  const pushStr = (text: string) => pushBytes(encodeAscii(text));

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  const pageObjectIds: number[] = [];
  for (let i = 0; i < jpegPages.length; i++) {
    pageObjectIds.push(3 + i * 3);
  }

  // Object 1: Catalog
  offsets[1] = cursor;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages root
  offsets[2] = cursor;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${jpegPages.length} >>\nendobj\n`
  );

  // Page dimensions in PDF points (A4: 595.28 x 841.89)
  const ptW = '595.28';
  const ptH = '841.89';

  jpegPages.forEach((jpegBytes, idx) => {
    const pageId = 3 + idx * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const streamCmd = `q\n${ptW} 0 0 ${ptH} 0 0 cm\n/Im${idx} Do\nQ\n`;

    // Page object
    offsets[pageId] = cursor;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] /Resources << /XObject << /Im${idx} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    // Content stream object
    offsets[contentId] = cursor;
    pushStr(
      `${contentId} 0 obj\n<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}endstream\nendobj\n`
    );

    // JPEG XObject
    offsets[imageId] = cursor;
    pushStr(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${PAGE_W} /Height ${PAGE_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');
  });

  const totalObjects = 2 + jpegPages.length * 3;
  const xrefStart = cursor;
  pushStr(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjects; id++) {
    const off = String(offsets[id] || 0).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = String(text || '').split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
}

class EditorialPdfComposer {
  private pages: HTMLCanvasElement[] = [];
  private ctx!: CanvasRenderingContext2D;
  private y = 0;
  private isRtl: boolean;
  private fontStack: string;
  private brandTitle: string;

  constructor(isRtl: boolean, brandTitle: string) {
    this.isRtl = isRtl;
    this.brandTitle = brandTitle;
    this.fontStack = isRtl
      ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif"
      : "'Plus Jakarta Sans', 'Inter', Arial, sans-serif";
    this.startNewPage(true);
  }

  private get anchorX(): number {
    return this.isRtl ? PAGE_W - MARGIN_X : MARGIN_X;
  }

  private setupContext(ctx: CanvasRenderingContext2D) {
    ctx.direction = this.isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = this.isRtl ? 'right' : 'left';
    ctx.textBaseline = 'top';
  }

  private startNewPage(isFirstPage = false) {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    this.ctx = ctx;
    this.pages.push(canvas);

    // Crisp museum-grade off-white archival paper background
    ctx.fillStyle = '#fcfbf8';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    this.setupContext(ctx);

    if (!isFirstPage) {
      // Subtle continuation top header bar
      ctx.fillStyle = '#0c0e12';
      ctx.fillRect(0, 0, PAGE_W, 56);
      ctx.fillStyle = '#e2b170';
      ctx.fillRect(0, 56, PAGE_W, 3);
      ctx.font = `600 18px ${this.fontStack}`;
      ctx.fillStyle = '#e2b170';
      ctx.fillText(this.brandTitle, this.anchorX, 18);
      this.y = 92;
    } else {
      this.y = 0;
    }
  }

  private ensureSpace(neededHeight: number) {
    if (this.y + neededHeight > FOOTER_Y - 24) {
      this.startNewPage(false);
    }
  }

  drawHeroBanner(subtitle: string, contactLine: string, stamp: string) {
    const ctx = this.ctx;
    const bannerH = 228;
    ctx.fillStyle = '#0c0e12';
    ctx.fillRect(0, 0, PAGE_W, bannerH);

    // Gold accent hairline
    ctx.fillStyle = '#e2b170';
    ctx.fillRect(0, bannerH, PAGE_W, 5);

    // Stamp badge
    ctx.font = `700 16px ${this.fontStack}`;
    ctx.fillStyle = '#e2b170';
    ctx.fillText(stamp.toUpperCase(), this.anchorX, 34);

    // Primary Name
    ctx.font = `700 44px ${this.fontStack}`;
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(this.brandTitle, this.anchorX, 70);

    // Role / Subtitle
    ctx.font = `500 22px ${this.fontStack}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtitle, this.anchorX, 130);

    // Contact Strip
    ctx.font = `500 17px ${this.fontStack}`;
    ctx.fillStyle = '#e2b170';
    ctx.fillText(contactLine, this.anchorX, 174);

    this.y = bannerH + 34;
  }

  drawStatsStrip(stats: { value: string; label: string }[]) {
    this.ensureSpace(108);
    const ctx = this.ctx;
    const colW = CONTENT_W / stats.length;
    const boxH = 84;

    ctx.fillStyle = '#f4efe6';
    ctx.strokeStyle = '#dfd2bc';
    ctx.lineWidth = 1.5;
    ctx.fillRect(MARGIN_X, this.y, CONTENT_W, boxH);
    ctx.strokeRect(MARGIN_X, this.y, CONTENT_W, boxH);

    stats.forEach((st, i) => {
      const idx = this.isRtl ? stats.length - 1 - i : i;
      const cellCenter = MARGIN_X + idx * colW + colW / 2;

      if (i > 0) {
        const divX = MARGIN_X + i * colW;
        ctx.beginPath();
        ctx.moveTo(divX, this.y + 14);
        ctx.lineTo(divX, this.y + boxH - 14);
        ctx.strokeStyle = '#dfd2bc';
        ctx.stroke();
      }

      ctx.save();
      ctx.textAlign = 'center';
      ctx.direction = 'ltr';
      ctx.font = `700 28px ${this.fontStack}`;
      ctx.fillStyle = '#9c6c2e';
      ctx.fillText(st.value, cellCenter, this.y + 14);

      ctx.direction = this.isRtl ? 'rtl' : 'ltr';
      ctx.font = `600 15px ${this.fontStack}`;
      ctx.fillStyle = '#334155';
      ctx.fillText(st.label, cellCenter, this.y + 52);
      ctx.restore();
    });

    this.y += boxH + 28;
  }

  drawSectionHeader(title: string) {
    this.ensureSpace(58);
    const ctx = this.ctx;
    ctx.font = `700 24px ${this.fontStack}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(title, this.anchorX, this.y);

    const lineY = this.y + 36;
    ctx.fillStyle = '#e2b170';
    ctx.fillRect(this.isRtl ? PAGE_W - MARGIN_X - 72 : MARGIN_X, lineY, 72, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(
      this.isRtl ? MARGIN_X : MARGIN_X + 76,
      lineY + 1,
      CONTENT_W - 76,
      1
    );

    this.y += 52;
  }

  drawParagraph(text: string, fontSize = 18, color = '#334155', extraBottom = 18) {
    const ctx = this.ctx;
    ctx.font = `400 ${fontSize}px ${this.fontStack}`;
    const lines = wrapTextLines(ctx, text, CONTENT_W);
    const lineHeight = Math.round(fontSize * 1.65);

    for (const line of lines) {
      this.ensureSpace(lineHeight + 4);
      this.ctx.font = `400 ${fontSize}px ${this.fontStack}`;
      this.ctx.fillStyle = color;
      if (line) {
        this.ctx.fillText(line, this.anchorX, this.y);
      }
      this.y += lineHeight;
    }
    this.y += extraBottom;
  }

  drawMilestoneItem(meta: string, title: string, sub?: string, desc?: string) {
    const ctx = this.ctx;
    ctx.font = `400 16px ${this.fontStack}`;
    const descLines = desc ? wrapTextLines(ctx, desc, CONTENT_W - 24) : [];
    const estimatedH = 64 + (sub ? 28 : 0) + descLines.length * 26 + 18;
    this.ensureSpace(Math.min(estimatedH, 220));

    // Left/Right subtle vertical timeline rule
    const barX = this.isRtl ? PAGE_W - MARGIN_X - 4 : MARGIN_X;
    const textX = this.isRtl ? PAGE_W - MARGIN_X - 18 : MARGIN_X + 18;
    const startY = this.y;

    this.ctx.font = `700 15px ${this.fontStack}`;
    this.ctx.fillStyle = '#9c6c2e';
    this.ctx.fillText(meta, textX, this.y);
    this.y += 26;

    this.ctx.font = `700 19px ${this.fontStack}`;
    this.ctx.fillStyle = '#0f172a';
    const titleLines = wrapTextLines(this.ctx, title, CONTENT_W - 24);
    for (const tl of titleLines) {
      this.ctx.fillText(tl, textX, this.y);
      this.y += 28;
    }

    if (sub) {
      this.ctx.font = `500 16px ${this.fontStack}`;
      this.ctx.fillStyle = '#475569';
      const subLines = wrapTextLines(this.ctx, sub, CONTENT_W - 24);
      for (const sl of subLines) {
        this.ctx.fillText(sl, textX, this.y);
        this.y += 24;
      }
    }

    if (descLines.length > 0) {
      this.ctx.font = `400 16px ${this.fontStack}`;
      this.ctx.fillStyle = '#334155';
      for (const dl of descLines) {
        this.ensureSpace(28);
        this.ctx.fillText(dl, textX, this.y);
        this.y += 25;
      }
    }

    // Draw structural gold accent rail matching height
    this.ctx.fillStyle = '#e2b170';
    this.ctx.fillRect(barX, startY + 2, 4, Math.max(24, this.y - startY - 6));
    this.y += 16;
  }

  finalizeToJpegs(footerBrand: string): Uint8Array<ArrayBuffer>[] {
    const total = this.pages.length;
    return this.pages.map((canvas, idx) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(MARGIN_X, FOOTER_Y - 14, CONTENT_W, 1);

        ctx.font = `500 14px ${this.fontStack}`;
        ctx.fillStyle = '#64748b';
        ctx.direction = this.isRtl ? 'rtl' : 'ltr';
        ctx.textAlign = this.isRtl ? 'right' : 'left';
        ctx.fillText(footerBrand, this.anchorX, FOOTER_Y);

        ctx.direction = 'ltr';
        ctx.textAlign = this.isRtl ? 'left' : 'right';
        ctx.fillText(
          `${idx + 1} / ${total}`,
          this.isRtl ? MARGIN_X : PAGE_W - MARGIN_X,
          FOOTER_Y
        );
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      return dataUrlToUint8Array(dataUrl);
    });
  }
}

export async function downloadCVAsPdf({
  lang,
  cvDossier,
  layout,
  seo,
}: CVPdfExportOptions): Promise<string> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed cleanly even if FontFaceSet check fails
    }
  }

  const isRtl = lang === 'ar';
  const name = isRtl
    ? layout.brandNameAr || 'إنعام علي عثمان'
    : (layout.brandNameEn || 'ENAAM ALI OSMAN').toUpperCase();

  const subtitle = isRtl
    ? 'مصورة وثائقية · صحافة الصورة الإنسانية · مدربة توثيق مجتمعي'
    : 'Documentary Storyteller · Visual Journalist · Community Documentation Trainer';

  const email = seo.contactEmail || 'alienaam634@gmail.com';
  const whatsapp = seo.whatsappNumber ? `+${seo.whatsappNumber.replace(/^\+/, '')}` : '+249117789498';
  const contactLine = isRtl
    ? `${email}  |  واتساب: ${whatsapp}`
    : `${email}  |  WhatsApp: ${whatsapp}`;

  const stamp = isRtl
    ? 'ملف السيرة الذاتية المعتمد — الأرشيف التوثيقي'
    : 'Official Verified Curriculum Vitae — Documentary Archive';

  const composer = new EditorialPdfComposer(isRtl, name);
  composer.drawHeroBanner(subtitle, contactLine, stamp);

  composer.drawStatsStrip([
    { value: '8+', label: isRtl ? 'سنوات توثيق' : 'Years Field Work' },
    { value: '12+', label: isRtl ? 'معرضاً دولياً' : 'Exhibitions' },
    { value: '15+', label: isRtl ? 'شريكاً أممياً' : 'UN & NGO Partners' },
    { value: '100%', label: isRtl ? 'معايير الحماية' : 'Dignity Standard' },
  ]);

  // 1. Manifesto
  composer.drawSectionHeader(isRtl ? '01. البيان الفني والمنهج التوثيقي' : '01. Documentary Manifesto');
  composer.drawParagraph(isRtl ? cvDossier.artistStatementAr : cvDossier.artistStatementEn);

  // 2. Education
  composer.drawSectionHeader(isRtl ? '02. المؤهلات الأكاديمية والتدريب' : '02. Academic Education & Training');
  cvDossier.education.forEach((edu) => {
    composer.drawMilestoneItem(
      edu.year,
      isRtl ? edu.degreeAr : edu.degreeEn,
      isRtl ? edu.institutionAr : edu.institutionEn
    );
  });

  // 3. Exhibitions
  composer.drawSectionHeader(isRtl ? '03. المعارض والمشاركات الدولية' : '03. Curated Exhibitions');
  cvDossier.exhibitions.forEach((ex) => {
    const type = isRtl ? ex.typeAr : ex.typeEn;
    const role = isRtl ? ex.roleAr : ex.roleEn;
    composer.drawMilestoneItem(
      `${ex.year} · ${type}`,
      isRtl ? ex.titleAr : ex.titleEn,
      isRtl ? ex.locationAr : ex.locationEn,
      role
    );
  });

  // 4. Awards
  composer.drawSectionHeader(isRtl ? '04. المنح والجوائز والزمالات' : '04. Grants, Fellowships & Awards');
  cvDossier.awards.forEach((award) => {
    composer.drawMilestoneItem(
      `${award.year}${award.badge ? ` · ${award.badge}` : ''}`,
      isRtl ? award.titleAr : award.titleEn,
      isRtl ? award.organizationAr : award.organizationEn,
      isRtl ? award.descriptionAr : award.descriptionEn
    );
  });

  // 5. Field Gear
  composer.drawSectionHeader(isRtl ? '05. العتاد والتجهيزات الميدانية' : '05. Field Production Kit');
  cvDossier.gear.forEach((kit) => {
    const cat = isRtl ? kit.categoryAr : kit.categoryEn;
    kit.items.forEach((item) => {
      composer.drawMilestoneItem(
        cat,
        item.name,
        undefined,
        isRtl ? item.descriptionAr : item.descriptionEn
      );
    });
  });

  // 6. Partners
  composer.drawSectionHeader(isRtl ? '06. الشركاء والهيئات الدولية' : '06. Institutional Partners');
  cvDossier.clients.forEach((client) => {
    composer.drawMilestoneItem(
      client.category.toUpperCase(),
      client.name,
      isRtl ? client.roleAr : client.roleEn
    );
  });

  const footerText = isRtl
    ? `${name} — سيرة مهنية موثقة ومحدثة`
    : `${name} — Verified Documentary Portfolio CV`;

  const jpegPages = composer.finalizeToJpegs(footerText);
  const pdfBlob = buildPdfFromJpegPages(jpegPages);

  const fileName = isRtl ? 'Enaam-Ali-Osman-CV-AR.pdf' : 'Enaam-Ali-Osman-CV-EN.pdf';
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return fileName;
}

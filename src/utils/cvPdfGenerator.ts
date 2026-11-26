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
const RENDER_SCALE = 1.5;
const RENDER_W = Math.round(PAGE_W * RENDER_SCALE);
const RENDER_H = Math.round(PAGE_H * RENDER_SCALE);
const MARGIN_X = 84;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FOOTER_Y = PAGE_H - 64;
const SAFE_BOTTOM_Y = FOOTER_Y - 26;

function dataUrlToUint8Array(dataUrl: string): Uint8Array<ArrayBuffer> {
  if (!dataUrl || !dataUrl.startsWith('data:image/jpeg')) {
    throw new Error('Invalid JPEG canvas output while generating CV PDF.');
  }
  const base64 = dataUrl.split(',')[1] || '';
  if (!base64 || base64.length < 128) {
    throw new Error('Generated PDF page image was unexpectedly empty.');
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  // Verify JPEG Start-Of-Image marker (0xFF 0xD8) so corrupt/blank buffers are rejected
  if (bytes.length < 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('JPEG page encoding verification failed.');
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

    // Page object with explicit ProcSet for broad mobile & desktop PDF viewer support
    offsets[pageId] = cursor;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im${idx} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    // Content stream object
    offsets[contentId] = cursor;
    pushStr(
      `${contentId} 0 obj\n<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}endstream\nendobj\n`
    );

    // Hi-DPI JPEG XObject (1860x2631 mapped cleanly onto A4)
    offsets[imageId] = cursor;
    pushStr(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${RENDER_W} /Height ${RENDER_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
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
    canvas.width = RENDER_W;
    canvas.height = RENDER_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    // Scale drawing plane 1.5x (225 DPI) for laser-sharp typography on retina & print
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    this.ctx = ctx;
    this.pages.push(canvas);

    // Crisp museum-grade archival ivory paper
    ctx.fillStyle = '#fcfbf8';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    this.setupContext(ctx);

    if (!isFirstPage) {
      ctx.fillStyle = '#0c0e12';
      ctx.fillRect(0, 0, PAGE_W, 58);
      ctx.fillStyle = '#e2b170';
      ctx.fillRect(0, 58, PAGE_W, 3);
      ctx.font = `700 18px ${this.fontStack}`;
      ctx.fillStyle = '#e2b170';
      ctx.fillText(this.brandTitle, this.anchorX, 19);
      this.y = 90;
    } else {
      this.y = 0;
    }
  }

  private ensureSpace(neededHeight: number) {
    if (this.y + neededHeight > SAFE_BOTTOM_Y) {
      this.startNewPage(false);
    }
  }

  addSectionGap(extra = 12) {
    if (this.y > 130) {
      this.y += extra;
    }
  }

  drawHeroBanner(subtitle: string, contactLine: string, stamp: string) {
    const ctx = this.ctx;
    const bannerH = 232;
    ctx.fillStyle = '#0c0e12';
    ctx.fillRect(0, 0, PAGE_W, bannerH);

    // Gold accent hairline
    ctx.fillStyle = '#e2b170';
    ctx.fillRect(0, bannerH, PAGE_W, 5);

    // Stamp badge
    ctx.font = `700 16px ${this.fontStack}`;
    ctx.fillStyle = '#e2b170';
    ctx.fillText(stamp.toUpperCase(), this.anchorX, 30);

    // Primary Name
    ctx.font = `700 50px ${this.fontStack}`;
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(this.brandTitle, this.anchorX, 64);

    // Role / Subtitle
    ctx.font = `500 22.5px ${this.fontStack}`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(subtitle, this.anchorX, 128);

    // Contact Strip
    ctx.font = `500 18px ${this.fontStack}`;
    ctx.fillStyle = '#e2b170';
    ctx.fillText(contactLine, this.anchorX, 174);

    this.y = bannerH + 30;
  }

  drawStatsStrip(stats: { value: string; label: string }[]) {
    this.ensureSpace(110);
    const ctx = this.ctx;
    const colW = CONTENT_W / stats.length;
    const boxH = 92;

    ctx.fillStyle = '#f4efe6';
    ctx.strokeStyle = '#d6c5a9';
    ctx.lineWidth = 1.5;
    ctx.fillRect(MARGIN_X, this.y, CONTENT_W, boxH);
    ctx.strokeRect(MARGIN_X, this.y, CONTENT_W, boxH);

    stats.forEach((st, i) => {
      const idx = this.isRtl ? stats.length - 1 - i : i;
      const cellCenter = MARGIN_X + idx * colW + colW / 2;

      if (i > 0) {
        const divX = MARGIN_X + i * colW;
        ctx.beginPath();
        ctx.moveTo(divX, this.y + 16);
        ctx.lineTo(divX, this.y + boxH - 16);
        ctx.strokeStyle = '#d6c5a9';
        ctx.stroke();
      }

      ctx.save();
      ctx.textAlign = 'center';
      ctx.direction = 'ltr';
      ctx.font = `700 31px ${this.fontStack}`;
      ctx.fillStyle = '#744a14';
      ctx.fillText(st.value, cellCenter, this.y + 14);

      ctx.direction = this.isRtl ? 'rtl' : 'ltr';
      ctx.font = `600 16px ${this.fontStack}`;
      ctx.fillStyle = '#1e293b';
      ctx.fillText(st.label, cellCenter, this.y + 56);
      ctx.restore();
    });

    this.y += boxH + 32;
  }

  drawSectionHeader(title: string, minFirstItemReserve = 118) {
    // Always reserve header + first item so headings are never orphaned at page bottom
    this.ensureSpace(64 + minFirstItemReserve);
    const ctx = this.ctx;
    ctx.font = `700 27px ${this.fontStack}`;
    ctx.fillStyle = '#0b1120';
    ctx.fillText(title, this.anchorX, this.y);

    const lineY = this.y + 40;
    ctx.fillStyle = '#b88236';
    ctx.fillRect(this.isRtl ? PAGE_W - MARGIN_X - 84 : MARGIN_X, lineY, 84, 3.5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(
      this.isRtl ? MARGIN_X : MARGIN_X + 88,
      lineY + 1,
      CONTENT_W - 88,
      1.5
    );

    this.y += 60;
  }

  drawParagraph(text: string, fontSize = 19, color = '#1e293b', extraBottom = 22) {
    const ctx = this.ctx;
    ctx.font = `400 ${fontSize}px ${this.fontStack}`;
    const lines = wrapTextLines(ctx, text, CONTENT_W);
    const lineHeight = Math.round(fontSize * 1.68);

    for (const line of lines) {
      this.ensureSpace(lineHeight + 6);
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
    const railInset = 22;
    const availW = CONTENT_W - railInset;

    // Pre-measure exact lines for atomic page-break protection (zero mid-item splits)
    ctx.font = `700 21.5px ${this.fontStack}`;
    const titleLines = wrapTextLines(ctx, title, availW);

    ctx.font = `600 18px ${this.fontStack}`;
    const subLines = sub ? wrapTextLines(ctx, sub, availW) : [];

    ctx.font = `400 17.5px ${this.fontStack}`;
    const descLines = desc ? wrapTextLines(ctx, desc, availW) : [];

    const metaH = meta ? 26 : 0;
    const titleH = titleLines.length * 30;
    const subH = subLines.length > 0 ? 4 + subLines.length * 26 : 0;
    const descH = descLines.length > 0 ? 5 + descLines.length * 27 : 0;
    const totalItemH = metaH + titleH + subH + descH;

    this.ensureSpace(totalItemH + 22);

    const barX = this.isRtl ? PAGE_W - MARGIN_X - 4 : MARGIN_X;
    const textX = this.isRtl ? PAGE_W - MARGIN_X - railInset : MARGIN_X + railInset;
    const startY = this.y;

    if (meta) {
      this.ctx.font = `700 15.5px ${this.fontStack}`;
      this.ctx.fillStyle = '#744a14';
      this.ctx.fillText(meta, textX, this.y);
      this.y += 26;
    }

    this.ctx.font = `700 21.5px ${this.fontStack}`;
    this.ctx.fillStyle = '#0b1120';
    for (const tl of titleLines) {
      this.ctx.fillText(tl, textX, this.y);
      this.y += 30;
    }

    if (subLines.length > 0) {
      this.y += 4;
      this.ctx.font = `600 18px ${this.fontStack}`;
      this.ctx.fillStyle = '#1e293b';
      for (const sl of subLines) {
        this.ctx.fillText(sl, textX, this.y);
        this.y += 26;
      }
    }

    if (descLines.length > 0) {
      this.y += 5;
      this.ctx.font = `400 17.5px ${this.fontStack}`;
      this.ctx.fillStyle = '#334155';
      for (const dl of descLines) {
        this.ctx.fillText(dl, textX, this.y);
        this.y += 27;
      }
    }

    // Gold timeline rail aligned strictly with content block
    this.ctx.fillStyle = '#cc913d';
    this.ctx.fillRect(barX, startY + 4, 4, Math.max(24, this.y - startY - 6));
    this.y += 22;
  }

  drawGearCategory(
    categoryTitle: string,
    items: { name: string; description: string }[]
  ) {
    if (!items.length) return;
    const colGap = 22;
    const halfW = (CONTENT_W - colGap) / 2;
    const innerPadX = 18;
    const innerPadY = 14;

    const measureRow = (pair: { name: string; description: string }[]) => {
      const spanFull = pair.length === 1;
      const cellW = spanFull ? CONTENT_W : halfW;
      const availW = cellW - innerPadX * 2;
      const measured = pair.map((item) => {
        this.ctx.font = `700 19px ${this.fontStack}`;
        const nameLines = wrapTextLines(this.ctx, item.name, availW);
        this.ctx.font = `400 16.5px ${this.fontStack}`;
        const descLines = item.description
          ? wrapTextLines(this.ctx, item.description, availW)
          : [];
        const h =
          innerPadY * 2 +
          nameLines.length * 26 +
          (descLines.length > 0 ? 5 + descLines.length * 24 : 0);
        return { item, nameLines, descLines, h };
      });
      return {
        spanFull,
        cellW,
        rowH: Math.max(...measured.map((m) => m.h)),
        measured,
      };
    };

    const firstPair = items.slice(0, 2);
    const firstRow = measureRow(firstPair);
    const pillH = 34;

    // Ensure category header band stays attached to at least its first row
    this.ensureSpace(pillH + 14 + firstRow.rowH + 16);

    ctxFillCategoryBand: {
      this.ctx.fillStyle = '#f4efe6';
      this.ctx.fillRect(MARGIN_X, this.y, CONTENT_W, pillH);
      this.ctx.fillStyle = '#b88236';
      this.ctx.fillRect(
        this.isRtl ? PAGE_W - MARGIN_X - 4 : MARGIN_X,
        this.y,
        4,
        pillH
      );
      this.ctx.font = `700 15.5px ${this.fontStack}`;
      this.ctx.fillStyle = '#744a14';
      this.ctx.fillText(
        categoryTitle.toUpperCase(),
        this.isRtl ? PAGE_W - MARGIN_X - 16 : MARGIN_X + 16,
        this.y + 9
      );
      this.y += pillH + 14;
      break ctxFillCategoryBand;
    }

    for (let i = 0; i < items.length; i += 2) {
      const pair = items.slice(i, i + 2);
      const row = i === 0 ? firstRow : measureRow(pair);
      if (i > 0) {
        this.ensureSpace(row.rowH + 16);
      }

      row.measured.forEach((m, colIdx) => {
        const visualCol = this.isRtl && !row.spanFull ? 1 - colIdx : colIdx;
        const cardX = MARGIN_X + (row.spanFull ? 0 : visualCol * (halfW + colGap));
        const cardY = this.y;

        this.ctx.fillStyle = '#f9f7f2';
        this.ctx.strokeStyle = '#dfd2bc';
        this.ctx.lineWidth = 1.2;
        this.ctx.fillRect(cardX, cardY, row.cellW, row.rowH);
        this.ctx.strokeRect(cardX, cardY, row.cellW, row.rowH);

        // Subtle side accent bar per equipment spec card
        this.ctx.fillStyle = '#cc913d';
        this.ctx.fillRect(
          this.isRtl ? cardX + row.cellW - 3.5 : cardX,
          cardY,
          3.5,
          row.rowH
        );

        let curY = cardY + innerPadY;
        const textAnchorX = this.isRtl
          ? cardX + row.cellW - innerPadX
          : cardX + innerPadX;

        this.ctx.font = `700 19px ${this.fontStack}`;
        this.ctx.fillStyle = '#0b1120';
        for (const nl of m.nameLines) {
          this.ctx.fillText(nl, textAnchorX, curY);
          curY += 26;
        }

        if (m.descLines.length > 0) {
          curY += 5;
          this.ctx.font = `400 16.5px ${this.fontStack}`;
          this.ctx.fillStyle = '#334155';
          for (const dl of m.descLines) {
            this.ctx.fillText(dl, textAnchorX, curY);
            curY += 24;
          }
        }
      });

      this.y += row.rowH + 14;
    }

    this.y += 10;
  }

  drawPartnersGrid(
    partners: { category: string; name: string; role: string }[]
  ) {
    if (!partners.length) return;
    const colGap = 22;
    const halfW = (CONTENT_W - colGap) / 2;
    const innerPadX = 18;
    const innerPadY = 15;

    for (let i = 0; i < partners.length; i += 2) {
      const pair = partners.slice(i, i + 2);
      // Extend final odd partner across full width so grid closes cleanly with zero orphan gap
      const spanFull = pair.length === 1;
      const cellW = spanFull ? CONTENT_W : halfW;
      const innerW = cellW - innerPadX * 2;

      const measured = pair.map((p) => {
        this.ctx.font = `700 19.5px ${this.fontStack}`;
        const nameLines = wrapTextLines(this.ctx, p.name, innerW);
        this.ctx.font = `400 16.5px ${this.fontStack}`;
        const roleLines = p.role ? wrapTextLines(this.ctx, p.role, innerW) : [];
        const h =
          innerPadY * 2 +
          22 +
          nameLines.length * 27 +
          (roleLines.length ? 5 + roleLines.length * 24 : 0);
        return { p, nameLines, roleLines, h };
      });

      const rowH = Math.max(...measured.map((m) => m.h));
      this.ensureSpace(rowH + 16);

      measured.forEach((m, colIdx) => {
        const visualCol = this.isRtl && !spanFull ? 1 - colIdx : colIdx;
        const cardX = MARGIN_X + (spanFull ? 0 : visualCol * (halfW + colGap));
        const cardY = this.y;

        this.ctx.fillStyle = '#f8f6f1';
        this.ctx.strokeStyle = '#dfd2bc';
        this.ctx.lineWidth = 1.2;
        this.ctx.fillRect(cardX, cardY, cellW, rowH);
        this.ctx.strokeRect(cardX, cardY, cellW, rowH);

        // Top Gold Hairline Stripe
        this.ctx.fillStyle = '#b88236';
        this.ctx.fillRect(cardX, cardY, cellW, 3);

        let curY = cardY + innerPadY + 3;
        const cardAnchorX = this.isRtl
          ? cardX + cellW - innerPadX
          : cardX + innerPadX;

        this.ctx.font = `700 14.5px ${this.fontStack}`;
        this.ctx.fillStyle = '#744a14';
        this.ctx.fillText(m.p.category.toUpperCase(), cardAnchorX, curY);
        curY += 22;

        this.ctx.font = `700 19.5px ${this.fontStack}`;
        this.ctx.fillStyle = '#0b1120';
        for (const nl of m.nameLines) {
          this.ctx.fillText(nl, cardAnchorX, curY);
          curY += 27;
        }

        if (m.roleLines.length > 0) {
          curY += 5;
          this.ctx.font = `400 16.5px ${this.fontStack}`;
          this.ctx.fillStyle = '#334155';
          for (const rl of m.roleLines) {
            this.ctx.fillText(rl, cardAnchorX, curY);
            curY += 24;
          }
        }
      });

      this.y += rowH + 16;
    }
  }

  finalizeToJpegs(footerBrand: string): Uint8Array<ArrayBuffer>[] {
    const total = this.pages.length;
    return this.pages.map((canvas, idx) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(MARGIN_X, FOOTER_Y - 15, CONTENT_W, 1.2);

        ctx.font = `500 16px ${this.fontStack}`;
        ctx.fillStyle = '#334155';
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
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
  const statementText =
    (isRtl ? cvDossier?.artistStatementAr : cvDossier?.artistStatementEn) ||
    (isRtl ? 'ممارسة وثائقية وإنسانية معتمدة.' : 'Verified documentary photography practice.');
  composer.drawParagraph(statementText);
  composer.addSectionGap(10);

  // 2. Education
  const educationList = Array.isArray(cvDossier?.education) ? cvDossier.education : [];
  if (educationList.length > 0) {
    composer.drawSectionHeader(isRtl ? '02. المؤهلات الأكاديمية والتدريب' : '02. Academic Education & Training');
    educationList.forEach((edu) => {
      composer.drawMilestoneItem(
        String(edu.year || ''),
        String((isRtl ? edu.degreeAr : edu.degreeEn) || ''),
        String((isRtl ? edu.institutionAr : edu.institutionEn) || '')
      );
    });
    composer.addSectionGap(10);
  }

  // 3. Exhibitions
  const exhibitionsList = Array.isArray(cvDossier?.exhibitions) ? cvDossier.exhibitions : [];
  if (exhibitionsList.length > 0) {
    composer.drawSectionHeader(isRtl ? '03. المعارض والمشاركات الدولية' : '03. Curated Exhibitions');
    exhibitionsList.forEach((ex) => {
      const type = String((isRtl ? ex.typeAr : ex.typeEn) || '');
      const role = String((isRtl ? ex.roleAr : ex.roleEn) || '');
      const meta = [ex.year, type].filter(Boolean).join(' · ');
      composer.drawMilestoneItem(
        meta,
        String((isRtl ? ex.titleAr : ex.titleEn) || ''),
        String((isRtl ? ex.locationAr : ex.locationEn) || ''),
        role
      );
    });
    composer.addSectionGap(10);
  }

  // 4. Awards
  const awardsList = Array.isArray(cvDossier?.awards) ? cvDossier.awards : [];
  if (awardsList.length > 0) {
    composer.drawSectionHeader(isRtl ? '04. المنح والجوائز والزمالات' : '04. Grants, Fellowships & Awards');
    awardsList.forEach((award) => {
      composer.drawMilestoneItem(
        `${award.year || ''}${award.badge ? ` · ${award.badge}` : ''}`.trim(),
        String((isRtl ? award.titleAr : award.titleEn) || ''),
        String((isRtl ? award.organizationAr : award.organizationEn) || ''),
        String((isRtl ? award.descriptionAr : award.descriptionEn) || '')
      );
    });
    composer.addSectionGap(10);
  }

  // 5. Field Gear (2-Column Archival Spec Cards per Category)
  const gearList = Array.isArray(cvDossier?.gear) ? cvDossier.gear : [];
  if (gearList.length > 0) {
    composer.drawSectionHeader(isRtl ? '05. العتاد والتجهيزات الميدانية' : '05. Field Production Kit', 150);
    gearList.forEach((kit) => {
      const cat = String((isRtl ? kit.categoryAr : kit.categoryEn) || '');
      const items = (Array.isArray(kit.items) ? kit.items : []).map((item) => ({
        name: String(item.name || ''),
        description: String((isRtl ? item.descriptionAr : item.descriptionEn) || ''),
      }));
      composer.drawGearCategory(cat, items);
    });
    composer.addSectionGap(8);
  }

  // 6. Partners (Structured 2-Column Cards with Full-Row Odd Closing)
  const clientsList = Array.isArray(cvDossier?.clients) ? cvDossier.clients : [];
  if (clientsList.length > 0) {
    composer.drawSectionHeader(isRtl ? '06. الشركاء والهيئات الدولية' : '06. Institutional Partners', 136);
    composer.drawPartnersGrid(
      clientsList.map((client) => ({
        category: String(client.category || 'partner'),
        name: String(client.name || ''),
        role: String((isRtl ? client.roleAr : client.roleEn) || ''),
      }))
    );
  }

  const footerText = isRtl
    ? `${name} — سيرة مهنية موثقة ومحدثة`
    : `${name} — Verified Documentary Portfolio CV`;

  const jpegPages = composer.finalizeToJpegs(footerText);
  if (!jpegPages.length) {
    throw new Error('No pages rendered for PDF export.');
  }

  const pdfBlob = buildPdfFromJpegPages(jpegPages);
  if (!pdfBlob || pdfBlob.size < 4096) {
    throw new Error('Assembled PDF document failed non-empty size verification.');
  }

  const fileName = isRtl ? 'Enaam-Ali-Osman-CV-AR.pdf' : 'Enaam-Ali-Osman-CV-EN.pdf';
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Keep blob URL alive long enough for slower mobile download managers
  setTimeout(() => URL.revokeObjectURL(url), 30000);

  return fileName;
}

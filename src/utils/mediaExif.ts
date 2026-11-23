/**
 * Zero-Dependency Client-Side EXIF Reader & Smart WebP Photo Optimizer.
 * Extracts authentic camera/lens/exposure metadata from JPEG files and
 * optimizes photos for fast delivery and safe Firestore document budgets.
 */

export interface ExtractedExifData {
  camera?: string;
  lens?: string;
  settings?: string;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    if (offset + i >= view.byteLength) break;
    const code = view.getUint8(offset + i);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out.trim();
}

function readRational(view: DataView, offset: number, littleEndian: boolean): number | null {
  if (offset + 8 > view.byteLength) return null;
  const num = view.getUint32(offset, littleEndian);
  const den = view.getUint32(offset + 4, littleEndian);
  if (!den) return null;
  return num / den;
}

export async function extractJpegExif(file: File): Promise<ExtractedExifData> {
  try {
    const buffer = await file.slice(0, 131072).arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) {
      return {};
    }

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xffe1) {
        if (readAscii(view, offset + 2, 4) !== 'Exif') return {};
        const tiffStart = offset + 8;
        const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
        const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const ifd0Start = tiffStart + firstIfdOffset;

        const parsed: {
          make: string;
          model: string;
          lens: string;
          focalLength: number | null;
          exposureTime: number | null;
          fNumber: number | null;
          iso: number | null;
          exifIfdPointer: number;
        } = {
          make: '',
          model: '',
          lens: '',
          focalLength: null,
          exposureTime: null,
          fNumber: null,
          iso: null,
          exifIfdPointer: 0,
        };

        const parseIfd = (dirStart: number) => {
          if (dirStart + 2 > view.byteLength) return;
          const entries = view.getUint16(dirStart, littleEndian);
          for (let i = 0; i < entries; i++) {
            const entryOffset = dirStart + 2 + i * 12;
            if (entryOffset + 12 > view.byteLength) break;
            const tag = view.getUint16(entryOffset, littleEndian);
            const count = view.getUint32(entryOffset + 4, littleEndian);
            const valueOffset =
              count > 4
                ? tiffStart + view.getUint32(entryOffset + 8, littleEndian)
                : entryOffset + 8;

            if (tag === 0x010f) parsed.make = readAscii(view, valueOffset, count);
            else if (tag === 0x0110) parsed.model = readAscii(view, valueOffset, count);
            else if (tag === 0x8769) parsed.exifIfdPointer = view.getUint32(entryOffset + 8, littleEndian);
            else if (tag === 0xa434) parsed.lens = readAscii(view, valueOffset, count);
            else if (tag === 0x829a) parsed.exposureTime = readRational(view, valueOffset, littleEndian);
            else if (tag === 0x829d) parsed.fNumber = readRational(view, valueOffset, littleEndian);
            else if (tag === 0x8827) parsed.iso = view.getUint16(entryOffset + 8, littleEndian);
            else if (tag === 0x920a) parsed.focalLength = readRational(view, valueOffset, littleEndian);
          }
        };

        parseIfd(ifd0Start);
        if (parsed.exifIfdPointer) {
          parseIfd(tiffStart + parsed.exifIfdPointer);
        }

        const camera =
          parsed.model &&
          parsed.make &&
          !parsed.model.toLowerCase().startsWith(parsed.make.toLowerCase())
            ? `${parsed.make} ${parsed.model}`
            : parsed.model || parsed.make || undefined;

        const parts: string[] = [];
        if (parsed.exposureTime !== null && parsed.exposureTime > 0) {
          parts.push(
            parsed.exposureTime < 1
              ? `1/${Math.round(1 / parsed.exposureTime)}s`
              : `${parsed.exposureTime.toFixed(1)}s`
          );
        }
        if (parsed.fNumber !== null && parsed.fNumber > 0) {
          parts.push(`f/${parsed.fNumber.toFixed(1).replace(/\.0$/, '')}`);
        }
        if (parsed.iso !== null && parsed.iso > 0) {
          parts.push(`ISO ${parsed.iso}`);
        }
        if (parsed.focalLength !== null && parsed.focalLength > 0) {
          parts.push(`${Math.round(parsed.focalLength)}mm`);
        }

        return {
          camera,
          lens:
            parsed.lens ||
            (parsed.focalLength !== null ? `${Math.round(parsed.focalLength)}mm Prime/Zoom` : undefined),
          settings: parts.length ? parts.join(' · ') : undefined,
        };
      }
      if ((marker & 0xff00) !== 0xff00) break;
      const size = view.getUint16(offset, false);
      offset += size;
    }
    return {};
  } catch {
    return {};
  }
}

export async function optimizePhotoFile(
  file: File,
  maxDimension = 1080,
  quality = 0.78
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode uploaded image.'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
    return { dataUrl, sizeKb, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

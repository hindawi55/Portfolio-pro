import { PhotoSeries } from '../types';
import { resolveAssetUrl } from '../utils/assets';
import { series01Humanitarian } from './series/series01';
import { series02Community } from './series/series02';
import { series03Documentary } from './series/series03';
import { series04Workshops } from './series/series04';
import { series05Advocacy } from './series/series05';

export const photoSeriesData: PhotoSeries[] = [
  series01Humanitarian,
  series02Community,
  series03Documentary,
  series04Workshops,
  series05Advocacy,
];

export function getPhotoUrl(folder: string, file: string): string {
  const trimmed = (file || '').trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const cleanFolder = folder.replace(/^\/+/, '').replace(/\/+$/, '');
  const cleanFile = trimmed.replace(/^\/+/, '');
  return resolveAssetUrl(`${cleanFolder}/${cleanFile}`);
}

export type Language = 'ar' | 'en';

export type FilterCategory = 'all' | 'humanitarian' | 'community' | 'documentary' | 'workshops';

export interface PhotoItem {
  file: string;
  isHero?: boolean;
  captionAr: string;
  captionEn: string;
  camera?: string;
  lens?: string;
  settings?: string;
  locationAr?: string;
  locationEn?: string;
}

export interface PhotoSeries {
  id: string;
  number: string;
  category: 'humanitarian' | 'community' | 'documentary' | 'workshops';
  tags: string[];
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  locationAr: string;
  locationEn: string;
  date: string;
  folder: string;
  photos: PhotoItem[];
}

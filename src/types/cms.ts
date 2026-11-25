import { Language } from '../types';
import { SiteThemeConfig } from '../data/themePresets';

export type SiteSectionId =
  | 'hero'
  | 'about'
  | 'cv'
  | 'portfolio'
  | 'mission'
  | 'services'
  | 'contact';

export interface SiteLayoutConfig {
  sectionOrder: SiteSectionId[];
  hiddenSections: SiteSectionId[];
  defaultLang: Language;
  showCvButton: boolean;
  showClientPortalButton: boolean;
  brandNameAr: string;
  brandNameEn: string;
  portraitUrl: string;
  portraitFocusY: number;
  portraitZoom: number;
  portraitDefaultMode: 'color' | 'mono';
}

export interface SiteSeoConfig {
  siteTitleEn: string;
  siteTitleAr: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
  ogImageUrl: string;
  whatsappNumber: string;
  contactEmail: string;
  instagramUrl: string;
  facebookUrl?: string;
  linkedinUrl: string;
}

export interface SiteContentOverrides {
  ar: Record<string, string>;
  en: Record<string, string>;
}

export interface ThemeBackupRecord {
  id: string;
  label: string;
  note?: string;
  theme: SiteThemeConfig;
  layout: SiteLayoutConfig;
  seo: SiteSeoConfig;
  content: SiteContentOverrides;
  createdBy: string;
  createdAtIso: string;
}

export interface FullTemplateExportBundle {
  version: '2.0';
  exportedAt: string;
  theme: SiteThemeConfig;
  layout: SiteLayoutConfig;
  seo: SiteSeoConfig;
  content: SiteContentOverrides;
}

export type BookingStatus = 'new' | 'reviewed' | 'booked' | 'archived';

export interface BookingInquiryInput {
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  serviceType: string;
  eventDate?: string;
  location?: string;
  budget?: string;
  message: string;
}

export interface BookingInquiryRecord extends BookingInquiryInput {
  id: string;
  status: BookingStatus;
  adminNotes?: string;
  createdAtIso: string;
}

export interface ProofFeedbackRecord {
  sessionId: string;
  photoId: string;
  isFavorite: boolean;
  note: string;
}

export const DEFAULT_LAYOUT_CONFIG: SiteLayoutConfig = {
  sectionOrder: ['hero', 'about', 'cv', 'portfolio', 'mission', 'services', 'contact'],
  hiddenSections: [],
  defaultLang: 'en',
  showCvButton: true,
  showClientPortalButton: true,
  brandNameAr: 'إنعام عثمان',
  brandNameEn: 'ENAAM OSMAN',
  portraitUrl: '',
  portraitFocusY: 38,
  portraitZoom: 1.06,
  portraitDefaultMode: 'color',
};

export const DEFAULT_SEO_CONFIG: SiteSeoConfig = {
  siteTitleEn: 'Enaam Ali Osman | Documentary Photographer',
  siteTitleAr: 'إنعام علي عثمان | مصورة وثائقية وقصص بصرية',
  metaDescriptionEn:
    'Portfolio website of Enaam Ali Osman, a documentary photographer and visual storyteller documenting humanitarian and community initiatives.',
  metaDescriptionAr:
    'الموقع الرسمي للمصورة الوثائقية إنعام علي عثمان — توثيق بصري للمبادرات الإنسانية والمجتمعية والورش الميدانية.',
  ogImageUrl: '',
  whatsappNumber: '249117789498',
  contactEmail: 'enaam.osman@documentary.studio',
  instagramUrl: 'https://www.instagram.com/enaam_creation?igsh=azVxMWZveDJlOTFz',
  facebookUrl: 'https://www.facebook.com/share/1HD2tAfyVD/',
  linkedinUrl:
    'https://www.linkedin.com/in/enaam-ali-6a482a306?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
};

export const DEFAULT_CONTENT_OVERRIDES: SiteContentOverrides = {
  ar: {},
  en: {},
};

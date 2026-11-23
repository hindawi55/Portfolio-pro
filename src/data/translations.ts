import { TranslationDictionary } from './i18n/types';
import { arTranslations } from './i18n/ar';
import { enTranslations } from './i18n/en';

export type { TranslationDictionary };

export const translations: Record<'ar' | 'en', TranslationDictionary> = {
  ar: arTranslations,
  en: enTranslations,
};

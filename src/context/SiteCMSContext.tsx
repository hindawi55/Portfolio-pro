import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { DEFAULT_THEME_CONFIG, SiteThemeConfig } from '../data/themePresets';
import { applySiteTheme } from '../utils/themeEngine';
import { Language, PhotoSeries } from '../types';
import { photoSeriesData } from '../data/portfolioData';
import { cvData, CVData } from '../data/cvData';
import { translations, TranslationDictionary } from '../data/translations';
import {
  DEFAULT_CONTENT_OVERRIDES,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_SEO_CONFIG,
  SiteContentOverrides,
  SiteLayoutConfig,
  SiteSeoConfig,
} from '../types/cms';
import {
  fetchCVDossier,
  fetchPortfolioSeries,
  fetchPublicSiteConfig,
  saveCVDossier,
  saveSiteConfig,
  verifyAdminAccess,
} from '../services/cmsService';
import { safeRun } from '../utils/errorDiagnostics';

interface SiteCMSContextValue {
  user: User | null;
  isAdmin: boolean;
  authReady: boolean;
  cloudLoaded: boolean;
  theme: SiteThemeConfig;
  layout: SiteLayoutConfig;
  seo: SiteSeoConfig;
  content: SiteContentOverrides;
  portfolioSeries: PhotoSeries[];
  cvDossier: CVData;
  signInAdmin: () => Promise<boolean>;
  signOutAdmin: () => Promise<void>;
  refreshCloudData: () => Promise<void>;
  previewTheme: (nextTheme: SiteThemeConfig) => void;
  saveTheme: (nextTheme: SiteThemeConfig) => Promise<void>;
  saveLayout: (nextLayout: SiteLayoutConfig) => Promise<void>;
  saveSeo: (nextSeo: SiteSeoConfig) => Promise<void>;
  saveContent: (nextContent: SiteContentOverrides) => Promise<void>;
  saveCV: (nextCV: CVData) => Promise<void>;
  getTranslation: (lang: Language) => TranslationDictionary;
}

const SiteCMSContext = createContext<SiteCMSContextValue | null>(null);

export const SiteCMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  const [theme, setTheme] = useState<SiteThemeConfig>(DEFAULT_THEME_CONFIG);
  const [layout, setLayout] = useState<SiteLayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [seo, setSeo] = useState<SiteSeoConfig>(DEFAULT_SEO_CONFIG);
  const [content, setContent] = useState<SiteContentOverrides>(DEFAULT_CONTENT_OVERRIDES);
  const [portfolioSeries, setPortfolioSeries] = useState<PhotoSeries[]>(photoSeriesData);
  const [cvDossier, setCVDossier] = useState<CVData>(cvData);

  // Apply harmonized design tokens whenever theme changes
  useEffect(() => {
    applySiteTheme(theme);
  }, [theme]);

  // Synchronize HTML document title & meta description with SEO config
  useEffect(() => {
    safeRun(
      'SiteCMSContext',
      'syncDocumentSeo',
      () => {
        if (seo.siteTitleEn) {
          document.title = seo.siteTitleEn;
        }
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && seo.metaDescriptionEn) {
          metaDesc.setAttribute('content', seo.metaDescriptionEn);
        }
      },
      undefined,
      'warning'
    );
  }, [seo]);

  const refreshCloudData = useCallback(async () => {
    try {
      const [cfg, series, cv] = await Promise.all([
        fetchPublicSiteConfig(),
        fetchPortfolioSeries(isAdmin),
        fetchCVDossier(),
      ]);
      setTheme(cfg.theme);
      setLayout(cfg.layout);
      setSeo(cfg.seo);
      setContent(cfg.content);
      setPortfolioSeries(series);
      setCVDossier(cv);
    } finally {
      setCloudLoaded(true);
    }
  }, [isAdmin]);

  // Monitor Firebase Auth state cleanly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const adminFlag = await verifyAdminAccess(nextUser);
          setIsAdmin(adminFlag);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Load cloud configuration on initial mount and when admin status updates
  useEffect(() => {
    void refreshCloudData();
  }, [refreshCloudData]);

  const signInAdmin = useCallback(async (): Promise<boolean> => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const adminFlag = await verifyAdminAccess(result.user);
    setIsAdmin(adminFlag);
    return adminFlag;
  }, []);

  const signOutAdmin = useCallback(async (): Promise<void> => {
    await signOut(auth);
    setIsAdmin(false);
  }, []);

  const previewTheme = useCallback((nextTheme: SiteThemeConfig) => {
    setTheme(nextTheme);
  }, []);

  const saveTheme = useCallback(async (nextTheme: SiteThemeConfig) => {
    setTheme(nextTheme);
    await saveSiteConfig('theme', nextTheme);
  }, []);

  const saveLayout = useCallback(async (nextLayout: SiteLayoutConfig) => {
    setLayout(nextLayout);
    await saveSiteConfig('layout', nextLayout);
  }, []);

  const saveSeo = useCallback(async (nextSeo: SiteSeoConfig) => {
    setSeo(nextSeo);
    await saveSiteConfig('seo', nextSeo);
  }, []);

  const saveContent = useCallback(async (nextContent: SiteContentOverrides) => {
    setContent(nextContent);
    await saveSiteConfig('content', nextContent);
  }, []);

  const saveCV = useCallback(async (nextCV: CVData) => {
    setCVDossier(nextCV);
    await saveCVDossier(nextCV);
  }, []);

  const getTranslation = useCallback(
    (lang: Language): TranslationDictionary => ({
      ...translations[lang],
      ...(content[lang] || {}),
    }),
    [content]
  );

  return (
    <SiteCMSContext.Provider
      value={{
        user,
        isAdmin,
        authReady,
        cloudLoaded,
        theme,
        layout,
        seo,
        content,
        portfolioSeries,
        cvDossier,
        signInAdmin,
        signOutAdmin,
        refreshCloudData,
        previewTheme,
        saveTheme,
        saveLayout,
        saveSeo,
        saveContent,
        saveCV,
        getTranslation,
      }}
    >
      {children}
    </SiteCMSContext.Provider>
  );
};

export function useSiteCMS(): SiteCMSContextValue {
  const ctx = useContext(SiteCMSContext);
  if (!ctx) {
    throw new Error('useSiteCMS must be used within SiteCMSProvider');
  }
  return ctx;
}

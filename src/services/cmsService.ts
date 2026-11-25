import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { auth, BOOTSTRAPPED_OWNER_EMAIL, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { PhotoSeries } from '../types';
import { DEFAULT_THEME_CONFIG, SiteThemeConfig } from '../data/themePresets';
import { photoSeriesData } from '../data/portfolioData';
import { cvData, CVData } from '../data/cvData';
import { ClientSession, sampleClientSessions } from '../data/clientPortalData';
import {
  BookingInquiryInput,
  BookingInquiryRecord,
  BookingStatus,
  DEFAULT_CONTENT_OVERRIDES,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_SEO_CONFIG,
  ProofFeedbackRecord,
  SiteContentOverrides,
  SiteLayoutConfig,
  SiteSeoConfig,
  ThemeBackupRecord,
} from '../types/cms';

export type SiteConfigKey = 'theme' | 'layout' | 'seo' | 'content';

const sanitizeId = (raw: string): string => {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || `item-${Date.now()}`;
};

const clampStr = (val: string | undefined, max: number): string =>
  (val || '').trim().slice(0, max);

const timestampToIso = (val: unknown): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
};

const requireAdminUid = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Admin authentication required.');
  return uid;
};

/**
 * Verifies if the currently authenticated Firebase user has Studio OS Admin access.
 */
export async function verifyAdminAccess(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAPPED_OWNER_EMAIL.toLowerCase()) {
    return true;
  }

  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Loads all 4 public singleton configuration documents with graceful defaults.
 */
export async function fetchPublicSiteConfig(): Promise<{
  theme: SiteThemeConfig;
  layout: SiteLayoutConfig;
  seo: SiteSeoConfig;
  content: SiteContentOverrides;
}> {
  const readSingleton = async <T,>(key: SiteConfigKey, fallback: T): Promise<T> => {
    try {
      const snap = await getDoc(doc(db, 'site_config', key));
      if (!snap.exists()) return fallback;
      const data = snap.data();
      if (data && typeof data.payload === 'object' && data.payload !== null) {
        return { ...fallback, ...(data.payload as Partial<T>) };
      }
      return fallback;
    } catch {
      // Non-fatal on public boot so the portfolio never crashes if unseeded or offline
      return fallback;
    }
  };

  const [theme, layout, seo, content] = await Promise.all([
    readSingleton<SiteThemeConfig>('theme', DEFAULT_THEME_CONFIG),
    readSingleton<SiteLayoutConfig>('layout', DEFAULT_LAYOUT_CONFIG),
    readSingleton<SiteSeoConfig>('seo', DEFAULT_SEO_CONFIG),
    readSingleton<SiteContentOverrides>('content', DEFAULT_CONTENT_OVERRIDES),
  ]);

  return { theme, layout, seo, content };
}

/**
 * Admin write for any singleton site configuration document.
 */
export async function saveSiteConfig<T extends object>(
  configType: SiteConfigKey,
  payload: T
): Promise<void> {
  const uid = requireAdminUid();
  const path = `site_config/${configType}`;
  try {
    await setDoc(doc(db, 'site_config', configType), {
      configType,
      payload,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches curated portfolio series (visible only for visitors, all for admins).
 */
export async function fetchPortfolioSeries(includeHidden = false): Promise<PhotoSeries[]> {
  const path = 'portfolio_series';
  try {
    const colRef = collection(db, path);
    const q = includeHidden
      ? query(colRef, orderBy('order', 'asc'))
      : query(colRef, where('visible', '==', true));

    const snap = await getDocs(q);
    if (snap.empty) return photoSeriesData;

    const docs = snap.docs
      .map((d) => d.data() as PhotoSeries & { order?: number; visible?: boolean })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return docs;
  } catch {
    return photoSeriesData;
  }
}

/**
 * Admin create/update for a portfolio series document.
 */
export async function savePortfolioSeries(
  series: PhotoSeries & { order?: number; visible?: boolean }
): Promise<void> {
  const uid = requireAdminUid();
  const safeId = sanitizeId(series.id);
  const path = `portfolio_series/${safeId}`;
  try {
    await setDoc(doc(db, 'portfolio_series', safeId), {
      id: safeId,
      number: clampStr(series.number, 24),
      order: typeof series.order === 'number' ? series.order : 0,
      visible: series.visible !== false,
      category: series.category,
      titleAr: clampStr(series.titleAr, 200),
      titleEn: clampStr(series.titleEn, 200),
      subtitleAr: clampStr(series.subtitleAr, 300),
      subtitleEn: clampStr(series.subtitleEn, 300),
      locationAr: clampStr(series.locationAr, 160),
      locationEn: clampStr(series.locationEn, 160),
      date: clampStr(series.date, 64),
      folder: clampStr(series.folder, 300),
      tags: (series.tags || []).slice(0, 12),
      photos: (series.photos || []).slice(0, 40),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePortfolioSeries(seriesId: string): Promise<void> {
  const safeId = sanitizeId(seriesId);
  const path = `portfolio_series/${safeId}`;
  try {
    await deleteDoc(doc(db, 'portfolio_series', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Loads or saves the 5-wing CV Dossier document.
 */
export async function fetchCVDossier(): Promise<CVData> {
  try {
    const snap = await getDoc(doc(db, 'cv_dossier', 'main'));
    if (!snap.exists()) return cvData;
    const d = snap.data();
    return {
      artistStatementAr: d.artistStatementAr || cvData.artistStatementAr,
      artistStatementEn: d.artistStatementEn || cvData.artistStatementEn,
      education: Array.isArray(d.education) ? d.education : cvData.education,
      exhibitions: Array.isArray(d.exhibitions) ? d.exhibitions : cvData.exhibitions,
      awards: Array.isArray(d.awards) ? d.awards : cvData.awards,
      gear: Array.isArray(d.gear) ? d.gear : cvData.gear,
      clients: Array.isArray(d.clients) ? d.clients : cvData.clients,
    };
  } catch {
    return cvData;
  }
}

export async function saveCVDossier(dossier: CVData): Promise<void> {
  const uid = requireAdminUid();
  const path = 'cv_dossier/main';
  try {
    await setDoc(doc(db, 'cv_dossier', 'main'), {
      artistStatementAr: clampStr(dossier.artistStatementAr, 4000),
      artistStatementEn: clampStr(dossier.artistStatementEn, 4000),
      education: (dossier.education || []).slice(0, 30),
      exhibitions: (dossier.exhibitions || []).slice(0, 50),
      awards: (dossier.awards || []).slice(0, 50),
      gear: (dossier.gear || []).slice(0, 20),
      clients: (dossier.clients || []).slice(0, 60),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Cloud Template Snapshots (Backup & Restore Center — Admin Only).
 */
export async function listThemeBackups(): Promise<ThemeBackupRecord[]> {
  const path = 'theme_backups';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        label: String(data.label || ''),
        note: data.note ? String(data.note) : '',
        theme: data.theme as SiteThemeConfig,
        layout: data.layout as SiteLayoutConfig,
        seo: data.seo as SiteSeoConfig,
        content: data.content as SiteContentOverrides,
        createdBy: String(data.createdBy || ''),
        createdAtIso: timestampToIso(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createThemeBackup(input: {
  label: string;
  note?: string;
  theme: SiteThemeConfig;
  layout: SiteLayoutConfig;
  seo: SiteSeoConfig;
  content: SiteContentOverrides;
}): Promise<string> {
  const uid = requireAdminUid();
  const backupId = sanitizeId(`snap-${Date.now()}`);
  const path = `theme_backups/${backupId}`;
  try {
    await setDoc(doc(db, 'theme_backups', backupId), {
      label: clampStr(input.label, 120),
      note: clampStr(input.note, 400),
      theme: input.theme,
      layout: input.layout,
      seo: input.seo,
      content: input.content,
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
    return backupId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteThemeBackup(backupId: string): Promise<void> {
  const safeId = sanitizeId(backupId);
  const path = `theme_backups/${safeId}`;
  try {
    await deleteDoc(doc(db, 'theme_backups', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Private Client Proofing Sessions & Live Persisted Proof Feedback.
 */
export interface ClientSessionLookupResult {
  session: ClientSession;
  isCloudSynced: boolean;
}

export async function fetchClientSessionWithMeta(
  pin: string
): Promise<ClientSessionLookupResult | null> {
  const safePin = sanitizeId(pin);
  try {
    const snap = await getDoc(doc(db, 'client_sessions', safePin));
    if (snap.exists()) {
      return {
        session: snap.data() as ClientSession,
        isCloudSynced: true,
      };
    }
  } catch {
    // Fallback to built-in demo sessions if not yet seeded in Firestore
  }
  const fallback =
    sampleClientSessions.find((s) => s.pin.toLowerCase() === pin.trim().toLowerCase()) || null;
  return fallback ? { session: fallback, isCloudSynced: false } : null;
}

export async function fetchClientSessionByPin(pin: string): Promise<ClientSession | null> {
  const result = await fetchClientSessionWithMeta(pin);
  return result ? result.session : null;
}

export async function listClientSessions(): Promise<ClientSession[]> {
  const path = 'client_sessions';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as ClientSession);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveClientSession(session: ClientSession): Promise<void> {
  const uid = requireAdminUid();
  const safePin = sanitizeId(session.pin);
  const path = `client_sessions/${safePin}`;
  try {
    await setDoc(doc(db, 'client_sessions', safePin), {
      pin: safePin,
      clientNameAr: clampStr(session.clientNameAr, 200),
      clientNameEn: clampStr(session.clientNameEn, 200),
      projectTitleAr: clampStr(session.projectTitleAr, 240),
      projectTitleEn: clampStr(session.projectTitleEn, 240),
      date: clampStr(session.date, 64),
      statusAr: clampStr(session.statusAr, 120),
      statusEn: clampStr(session.statusEn, 120),
      expiryDate: clampStr(session.expiryDate, 32),
      packageSize: clampStr(session.packageSize, 80),
      totalPhotos: session.photos.length,
      ...(session.downloadUrl ? { downloadUrl: clampStr(session.downloadUrl, 500) } : {}),
      photos: session.photos.slice(0, 100),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClientSession(pin: string): Promise<void> {
  const safePin = sanitizeId(pin);
  const path = `client_sessions/${safePin}`;
  try {
    await deleteDoc(doc(db, 'client_sessions', safePin));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchProofFeedback(sessionId: string): Promise<ProofFeedbackRecord[]> {
  const safeSession = sanitizeId(sessionId);
  const path = `client_sessions/${safeSession}/proof_feedback`;
  try {
    const q = query(collection(db, path), where('sessionId', '==', safeSession));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        sessionId: String(data.sessionId),
        photoId: String(data.photoId),
        isFavorite: Boolean(data.isFavorite),
        note: String(data.note || ''),
      };
    });
  } catch {
    return [];
  }
}

export async function saveProofFeedback(
  sessionId: string,
  photoId: string,
  isFavorite: boolean,
  note: string
): Promise<void> {
  const safeSession = sanitizeId(sessionId);
  const safePhoto = sanitizeId(photoId);
  const path = `client_sessions/${safeSession}/proof_feedback/${safePhoto}`;
  try {
    await setDoc(doc(db, 'client_sessions', safeSession, 'proof_feedback', safePhoto), {
      sessionId: safeSession,
      photoId: safePhoto,
      isFavorite: Boolean(isFavorite),
      note: clampStr(note, 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Booking Inquiries CRM (Public Create + Strict Admin-Only Read/Manage).
 */
export async function submitBookingInquiry(input: BookingInquiryInput): Promise<string> {
  const inquiryId = sanitizeId(`inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const path = `booking_inquiries/${inquiryId}`;
  try {
    await setDoc(doc(db, 'booking_inquiries', inquiryId), {
      name: clampStr(input.name, 120),
      ...(input.organization ? { organization: clampStr(input.organization, 160) } : {}),
      email: clampStr(input.email, 200),
      ...(input.phone ? { phone: clampStr(input.phone, 40) } : {}),
      serviceType: clampStr(input.serviceType, 120),
      ...(input.eventDate ? { eventDate: clampStr(input.eventDate, 64) } : {}),
      ...(input.location ? { location: clampStr(input.location, 160) } : {}),
      ...(input.budget ? { budget: clampStr(input.budget, 80) } : {}),
      message: clampStr(input.message, 2500),
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return inquiryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listBookingInquiries(): Promise<BookingInquiryRecord[]> {
  const path = 'booking_inquiries';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name || ''),
        organization: data.organization ? String(data.organization) : undefined,
        email: String(data.email || ''),
        phone: data.phone ? String(data.phone) : undefined,
        serviceType: String(data.serviceType || ''),
        eventDate: data.eventDate ? String(data.eventDate) : undefined,
        location: data.location ? String(data.location) : undefined,
        budget: data.budget ? String(data.budget) : undefined,
        message: String(data.message || ''),
        status: (data.status as BookingStatus) || 'new',
        adminNotes: data.adminNotes ? String(data.adminNotes) : '',
        createdAtIso: timestampToIso(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeNewBookingCount(
  onCount: (count: number) => void,
  onError?: (error: unknown) => void
): () => void {
  const q = query(collection(db, 'booking_inquiries'), where('status', '==', 'new'));
  return onSnapshot(
    q,
    (snapshot) => {
      onCount(snapshot.size);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function updateBookingInquiryStatus(
  inquiry: BookingInquiryRecord,
  status: BookingStatus,
  adminNotes: string
): Promise<void> {
  const safeId = sanitizeId(inquiry.id);
  const path = `booking_inquiries/${safeId}`;
  try {
    const existingSnap = await getDoc(doc(db, 'booking_inquiries', safeId));
    if (!existingSnap.exists()) throw new Error('Inquiry not found.');
    const prev = existingSnap.data();

    await setDoc(doc(db, 'booking_inquiries', safeId), {
      ...prev,
      status,
      adminNotes: clampStr(adminNotes, 1500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBookingInquiry(inquiryId: string): Promise<void> {
  const safeId = sanitizeId(inquiryId);
  const path = `booking_inquiries/${safeId}`;
  try {
    await deleteDoc(doc(db, 'booking_inquiries', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Idempotent 1-Click Cloud Bootstrap: Seeds Firestore with initial default studio records
 * so the Admin Dashboard operates on live cloud data immediately.
 */
export async function seedInitialStudioData(): Promise<void> {
  await Promise.all([
    saveSiteConfig('theme', DEFAULT_THEME_CONFIG),
    saveSiteConfig('layout', DEFAULT_LAYOUT_CONFIG),
    saveSiteConfig('seo', DEFAULT_SEO_CONFIG),
    saveSiteConfig('content', DEFAULT_CONTENT_OVERRIDES),
    saveCVDossier(cvData),
    ...photoSeriesData.map((series, idx) =>
      savePortfolioSeries({ ...series, order: idx, visible: true })
    ),
    ...sampleClientSessions.map((session) => saveClientSession(session)),
  ]);
}

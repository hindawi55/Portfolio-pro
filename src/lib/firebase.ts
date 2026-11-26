import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  Firestore,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

function createFirestoreClient(): Firestore {
  try {
    // Force short-cycle HTTP long-polling (<5s) so mobile proxies, VPNs, and iframes never stall past Firestore's 10s timeout
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 5 },
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreClient();
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export const BOOTSTRAPPED_OWNER_EMAIL = 'mohsentiben@gmail.com';

let bootReachabilityPromise: Promise<boolean> | null = null;

/**
 * Verifies quickly via Firestore REST API whether the device can reach Cloud Firestore
 * and whether the Firebase project/database/API key configuration is valid.
 */
export function checkFirestoreReachable(forceRefresh = false): Promise<boolean> {
  if (!forceRefresh && bootReachabilityPromise) {
    return bootReachabilityPromise;
  }

  const probe = (async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return false;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), 4500) : undefined;

    try {
      const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        firebaseConfig.projectId
      )}/databases/${encodeURIComponent(
        firebaseConfig.firestoreDatabaseId
      )}/documents/site_config/theme?key=${encodeURIComponent(firebaseConfig.apiKey)}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
        signal: controller?.signal,
      });

      if (res.status === 400) {
        console.error('Please check your Firebase configuration (invalid project or API key).');
        return false;
      }

      // 200, 403 (PERMISSION_DENIED), or 404 (NOT_FOUND) confirm the Firestore backend & config are live and reachable
      return res.ok || res.status === 403 || res.status === 404;
    } catch {
      return false;
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  })();

  bootReachabilityPromise = probe;
  return probe;
}

async function testConnection(): Promise<void> {
  const reachable = await checkFirestoreReachable();
  if (!reachable) {
    console.warn(
      '[Firebase] Cloud Firestore is unreachable from this device network right now; operating with local defaults.'
    );
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn(
        '[Firebase] Firestore WatchStream channel was blocked or timed out on this network while REST config is valid.'
      );
    }
  }
}

void testConnection();

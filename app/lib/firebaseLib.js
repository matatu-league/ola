import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "AIzaSyDM4QQgxx3r7QHsB7rISulJtdHZCZrNPBw",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "alxlite-5d4c2.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "alxlite-5d4c2",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "alxlite-5d4c2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "169080100237",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "1:169080100237:web:3b89079980c69c324519c4",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     || "G-41FG7XS9CP",
};

let app, auth, db, storage;

if (typeof window !== 'undefined') {
  app     = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

/**
 * Upload a file to Firebase Storage under a structured path.
 * Handles anonymous auth automatically.
 *
 * @param {File}    file         - The File object to upload.
 * @param {string}  folderPrefix - Organises the path (e.g. 'products/images').
 * @param {boolean} [isTemp]     - When true the file lands in a temp/session sandbox.
 * @param {string}  [sessionId]  - Draft session ID used for temp paths.
 * @returns {Promise<string>}    - Public download URL.
 */
export const uploadFileToFirebase = async (file, folderPrefix, isTemp = false, sessionId = '') => {
  if (!storage || !auth) throw new Error('Firebase Storage or Auth is not initialized.');

  const { user } = await signInAnonymously(auth);
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const tempSegment = isTemp ? `temp/${sessionId}/` : '';
  const filePath = `stores/${user.uid}/${tempSegment}${folderPrefix}_${Date.now()}_${cleanName}`;

  const snap = await uploadBytesResumable(ref(storage, filePath), file);
  return getDownloadURL(snap.ref);
};

/**
 * Delete a file from Firebase Storage by its download URL.
 * Silently ignores errors (e.g. file already removed).
 *
 * @param {string} url - Full Firebase Storage download URL.
 */
export const deleteFileFromFirebase = async (url) => {
  if (!storage || !url) return;
  try {
    await deleteObject(ref(storage, url));
  } catch (e) {
    console.warn('Firebase delete skipped:', e?.code ?? e);
  }
};

/**
 * Move a temp file to a permanent storage path.
 * Returns the new permanent URL, or the original URL if it isn't a temp file.
 *
 * @param {string} url            - Current download URL.
 * @param {string} folderPath     - Destination folder prefix (e.g. 'products/images').
 * @param {object} [base64Cache]  - Optional { [url]: base64String } cache to avoid re-fetching.
 * @returns {Promise<string>}     - Permanent download URL.
 */
export const moveTempFileToPermanent = async (url, folderPath, base64Cache = {}) => {
  if (!url || !url.includes('/temp/')) return url;

  try {
    let blob;
    if (base64Cache[url]) {
      const res = await fetch(`data:image/jpeg;base64,${base64Cache[url]}`);
      blob = await res.blob();
    } else {
      const res = await fetch(url);
      blob = await res.blob();
    }

    const file = new File([blob], `perm_${Date.now()}`, { type: blob.type || 'image/jpeg' });
    const permanentUrl = await uploadFileToFirebase(file, folderPath, false);

    deleteFileFromFirebase(url); // best-effort cleanup, don't await
    return permanentUrl;
  } catch (e) {
    console.error('Failed to promote temp file; keeping original URL.', e);
    return url;
  }
};
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// 1. STANDARD FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM4QQgxx3r7QHsB7rISulJtdHZCZrNPBw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "alxlite-5d4c2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "alxlite-5d4c2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "alxlite-5d4c2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "169080100237",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:169080100237:web:3b89079980c69c324519c4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-41FG7XS9CP"
};

let app, auth, db, storage;

// 2. INITIALIZE FIREBASE (Only runs on the client-side)
if (typeof window !== 'undefined') {
  // Prevent Next.js from initializing Firebase multiple times during hot-reloads
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

/**
 * Generic upload function for Firebase Storage
 * Automatically handles Anonymous Authentication so the UI doesn't have to!
 * @param {File} file - The physical file object from the file input
 * @param {string} folderPrefix - Used to organize files (e.g., 'logo', 'banner', 'products')
 * @returns {Promise<string>} - Returns the public download URL string
 */
// NOTICE: We removed the 'user' parameter here!
export const uploadFileToFirebase = async (file, folderPrefix) => {
  // We now only check if storage and auth are initialized
  if (!storage || !auth) {
    throw new Error('Firebase Storage or Auth is not initialized.');
  }

  // 1. Automatically sign in anonymously before uploading
  const userCredential = await signInAnonymously(auth);
  const currentUser = userCredential.user;

  // 2. Remove spaces and special characters from the filename to prevent URL issues
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  
  // 3. Build a secure, organized path: stores/{userId}/{prefix}_{timestamp}_{filename}
  const filePath = `stores/${currentUser.uid}/${folderPrefix}_${Date.now()}_${cleanFileName}`;
  
  const fileRef = ref(storage, filePath);
  
  // 4. Execute the upload and get the public URL
  const snapshot = await uploadBytesResumable(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
};
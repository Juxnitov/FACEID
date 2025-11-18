// src/lib/firebase-admin.js (VERSIÓN FINAL Y CORREGIDA)
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

const required = { projectId, clientEmail, privateKey, storageBucket };
const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.error(`❌ Firebase Admin env vars faltantes: ${missing.join(', ')}`);
}

let adminDb = null;
let adminStorage = null;

try {
  if (!admin.apps.length) {
    if (missing.length) {
      throw new Error(
        `Variables de entorno faltantes para Firebase Admin: ${missing.join(', ')}`
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
    console.log('✅ Firebase Admin SDK inicializado.');
  }

  adminDb = admin.firestore();
  adminStorage = admin.storage().bucket();
} catch (error) {
  console.error('❌ Firebase Admin no disponible:', error.message);
}

export { adminDb, adminStorage };

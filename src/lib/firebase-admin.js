// src/lib/firebase-admin.js (VERSIÓN FINAL Y CORREGIDA)
import admin from 'firebase-admin';

// --- TAREA: Abre tu archivo 'serviceAccountKey.json' y copia/pega los valores aquí ---
const serviceAccount = {
  "type": "service_account",
  "project_id": "faceid-c3cb4",
  "private_key_id": "TU_PRIVATE_KEY_ID_DE_TU_JSON", 
  "private_key": "-----BEGIN PRIVATE KEY-----\n...TODA_TU_CLAVE_PRIVADA_DE_TU_JSON...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@faceid-c3cb4.iam.gserviceaccount.com", 
  "client_id": "TU_CLIENT_ID_DE_TU_JSON",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "TU_CERT_URL_DE_TU_JSON"
};

const BUCKET_NAME = "faceid-c3cb4.firebasestorage.app"; // Verifica que este sea tu bucket name
// ----------------------------------------------------------------------------------


if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
      // Ya no pasamos el bucket name aquí
    });
    console.log("✅ Firebase Admin SDK inicializado.");
  } catch (error) {
    console.error("❌ ERROR FATAL al inicializar Firebase Admin:", error.message);
  }
}

const adminDb = admin.firestore();

// --- ¡LA CORRECCIÓN MÁS IMPORTANTE ESTÁ AQUÍ! ---
// Le pasamos el BUCKET_NAME directamente a la función bucket()
const adminStorage = admin.storage().bucket(BUCKET_NAME);
// --------------------------------------------

export { adminDb, adminStorage };

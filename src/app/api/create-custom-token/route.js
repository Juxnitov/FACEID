// src/app/api/create-custom-token/route.js
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = require("../../../../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Obtener el usuario por email para conseguir su UID
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    // Crear el token personalizado para ese UID
    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error("Error al crear custom token:", error);
    // Si el usuario no existe, getUserByEmail lanza un error.
    return NextResponse.json({ error: 'Usuario no encontrado o error interno.' }, { status: 500 });
  }
}
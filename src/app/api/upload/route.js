// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(req) {
  // Este es el console.log más importante
  console.log("--- PETICIÓN RECIBIDA en /api/upload ---");
  
  if (!adminStorage) {
    console.error("API Error: Firebase Admin no está configurado.");
    return NextResponse.json(
      {
        success: false,
        error: 'Firebase Admin no está configurado. Verifica las variables de entorno del servidor.',
      },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      console.error("API Error: No se envió ningún archivo.");
      return NextResponse.json({ success: false, error: 'No se encontró el archivo.' }, { status: 400 });
    }
    console.log("Archivo recibido en la API:", file.name);

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    const fileName = `products/product_${Date.now()}_${file.name}`;
    const fileRef = adminStorage.file(fileName);

    console.log("Subiendo archivo a Firebase Storage...");
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });
    console.log("Archivo subido con éxito.");

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });
    console.log("URL generada:", url);

    return NextResponse.json({ success: true, url: url });

  } catch (error) {
    console.error("--- ERROR EN LA API DE SUBIDA ---:", error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
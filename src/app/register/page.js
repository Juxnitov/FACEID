// src/app/dashboard/profile/page.js (VERSIÓN GLOBAL FINAL)
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const videoRef = useRef(null);
  const modelsLoaded = useRef(false);

  const [loadingMessage, setLoadingMessage] = useState('Cargando modelos de IA...');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [message, setMessage] = useState('Apunta tu cara al centro del recuadro.');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      // Espera a que el script global (cargado en layout.js) esté disponible
      if (typeof window.faceapi === 'undefined') {
        setTimeout(loadModels, 100); // Reintenta en 100ms
        return;
      }
      if (modelsLoaded.current) return;
      
      const MODEL_URL = '/models';
      try {
        console.log("Cargando modelos desde /models...");
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded.current = true;
        setLoadingMessage('');
        console.log("Modelos cargados en Perfil.");
      } catch (err) {
        console.error("Error al cargar modelos:", err)
        setError("Error al cargar modelos de IA.");
      }
    };
    loadModels();
  }, []);

  const startCamera = () => {
    if (!modelsLoaded.current) {
      alert("Los servicios de IA todavía se están cargando.");
      return;
    }
    setMessage('Iniciando cámara...');
    setIsCameraOn(true);
  };

  useEffect(() => {
    const activateCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error al activar cámara:", err);
        setMessage('No se pudo acceder a la cámara.');
        setIsCameraOn(false);
      }
    };
    if (isCameraOn) {
      activateCamera();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isCameraOn]);

  const stopCamera = () => {
    setIsCameraOn(false);
    setMessage('Apunta tu cara al centro del recuadro.');
  };

  const handleRegisterFace = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded.current) return;
    setMessage('Procesando...');
    try {
      const detections = await window.faceapi.detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (!detections) {
        setMessage('No se detectó un rostro. Inténtalo de nuevo.');
        return;
      }
      const faceDescriptor = detections.descriptor;
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { 
        email: user.email, 
        faceDescriptor: Array.from(faceDescriptor)
      });
      setMessage('¡Rostro registrado con éxito!');
      stopCamera();
    } catch (err) {
      setError('Ocurrió un error al procesar el rostro.');
      console.error(err);
    }
  }, [user]);

  if (!user) return <div className="flex items-center justify-center min-h-screen">Redirigiendo...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-50 p-4">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold">Perfil de Usuario</h1>
        <p>Hola, {user.email}</p>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Login con Face ID</h2>
          <div className="bg-purple-900 w-full aspect-square rounded-md mx-auto overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay muted playsInline className={isCameraOn ? 'block' : 'hidden'} style={{ transform: 'scaleX(-1)' }}></video>
          </div>
          {loadingMessage && <p>{loadingMessage}</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!error && !loadingMessage && <p className="text-purple-700 h-6">{message}</p>}
          <div className="mt-4 space-y-2">
            {!isCameraOn ? (
              <button onClick={startCamera} disabled={!!loadingMessage} className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-400">Activar Cámara</button>
            ) : (
              <>
                <button onClick={handleRegisterFace} className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">Escanear y Guardar mi Rostro</button>
                <button onClick={stopCamera} className="w-full bg-gray-400 text-white py-2 rounded-md hover:bg-gray-500">Cancelar</button>
              </>
            )}
          </div>
        </div>
        <Link href="/dashboard" className="mt-4 text-purple-600 hover:text-purple-700">Volver al Dashboard</Link>
      </div>
    </div>
  );
}
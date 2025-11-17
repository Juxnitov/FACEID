// src/app/login/page.js — VERSIÓN FINAL CON FACE LOGIN Y TOKEN
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth"; // <-- Nueva importación
import { auth, db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

/* ----------------------------------------------
   CARGA DE MODELOS FACEAPI
------------------------------------------------*/
const loadFaceApiModels = async () => {
  const MODEL_URL = "/models";

  if (!window.faceapi) {
    console.log("FaceAPI aún no está disponible, reintentando...");
    return false;
  }

  try {
    console.log("Cargando modelos...");
    await Promise.all([
      window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    console.log("Modelos cargados correctamente.");
    return true;
  } catch (err) {
    console.error("Error cargando modelos:", err);
    return false;
  }
};

export default function LoginPage() {
  const router = useRouter();

  /* ----------------------------------------------
     ESTADOS
  ------------------------------------------------*/
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const modelsLoaded = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando servicios de IA...");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceIdMessage, setFaceIdMessage] = useState("");
  const [isFaceLoggingIn, setIsFaceLoggingIn] = useState(false);

  /* ----------------------------------------------
     CARGAR MODELOS AUTOMÁTICAMENTE
  ------------------------------------------------*/
  useEffect(() => {
    const load = async () => {
      if (!window.faceapi) return setTimeout(load, 100);

      if (!modelsLoaded.current) {
        const ready = await loadFaceApiModels();
        modelsLoaded.current = ready;
        setLoadingMessage(ready ? "" : "Error al cargar IA");
      }
    };

    load();
  }, []);

  /* ----------------------------------------------
     LOGIN NORMAL
  ------------------------------------------------*/
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------
     START CAMERA
  ------------------------------------------------*/
  const startCamera = () => {
    if (!modelsLoaded.current) {
      alert("Los servicios de IA aún se están cargando.");
      return;
    }
    setFaceIdMessage("Iniciando cámara...");
    setIsCameraOn(true);
  };

  /* ----------------------------------------------
     ACTIVAR / DESACTIVAR CÁMARA
  ------------------------------------------------*/
  useEffect(() => {
    const activateCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error camara:", err);
        setFaceIdMessage("No se pudo acceder a la cámara.");
        setIsCameraOn(false);
      }
    };

    if (isCameraOn) activateCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      if (videoRef.current?.intervalId) {
        clearInterval(videoRef.current.intervalId);
      }
    };
  }, [isCameraOn]);

  const stopCamera = () => {
    setIsCameraOn(false);
    setFaceIdMessage("");
    setIsFaceLoggingIn(false);
  };

  /* ----------------------------------------------
     LOGIN POR FACE ID CON CUSTOM TOKEN
  ------------------------------------------------*/
  const handleFaceLogin = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded.current || isFaceLoggingIn) return;

    console.log("Detectando rostro...");
    setIsFaceLoggingIn(true);
    setFaceIdMessage("Buscando rostro...");

    try {
      const snapshot = await getDocs(collection(db, "users"));
      const labeledDescriptors = snapshot.docs.map((doc) => {
        const data = doc.data();
        return new window.faceapi.LabeledFaceDescriptors(
          data.email,
          [new Float32Array(data.faceDescriptor)]
        );
      });

      if (!labeledDescriptors.length) {
        setFaceIdMessage("No hay rostros registrados.");
        setTimeout(stopCamera, 2000);
        return;
      }

      const faceMatcher = new window.faceapi.FaceMatcher(labeledDescriptors, 0.5);

      const intervalId = setInterval(async () => {
        if (!videoRef.current) return;

        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const match = faceMatcher.findBestMatch(detection.descriptor);

          if (match.label !== "unknown") {
            // ¡Coincidencia encontrada!
            clearInterval(intervalId); // Detenemos la detección
            setFaceIdMessage(`Bienvenido, ${match.label}. Autenticando...`);

            try {
              // ===== INICIO DE LA NUEVA LÓGICA DE AUTENTICACIÓN =====
              const response = await fetch('/api/create-custom-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: match.label }),
              });

              const { token, error } = await response.json();

              if (error) throw new Error(error);

              await signInWithCustomToken(auth, token);
              stopCamera();
              router.push('/dashboard');
              // ===== FIN DE LA NUEVA LÓGICA DE AUTENTICACIÓN =====

            } catch (authError) {
              console.error("Error en la autenticación con token:", authError);
              setFaceIdMessage("Error de autenticación. Intenta con tu contraseña.");
              setTimeout(stopCamera, 3000);
            }

          } else {
            setFaceIdMessage("Rostro detectado, no reconocido.");
          }
        }
      }, 900);

      if (videoRef.current) videoRef.current.intervalId = intervalId;

    } catch (err) {
      console.error("Error en login por Face ID:", err);
      setFaceIdMessage("Ocurrió un error al intentar iniciar sesión.");
      setIsFaceLoggingIn(false);
    }
  }, [isFaceLoggingIn, router]);

  /* ----------------------------------------------
     EVENTO PLAY DEL VIDEO
  ------------------------------------------------*/
  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      videoRef.current.addEventListener("play", handleFaceLogin);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("play", handleFaceLogin);
      }
    };
  }, [isCameraOn, handleFaceLogin]);

  /* ----------------------------------------------
     UI
  ------------------------------------------------*/
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">

        {isCameraOn ? (
          <div className="text-center">
            <div className="bg-gray-800 aspect-square rounded overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <p className="mt-2 h-6">{faceIdMessage}</p>
            <button onClick={stopCamera} className="text-red-500 mt-2">
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-4">Iniciar Sesión</h1>

            {error && (
              <p className="text-center text-sm text-red-500 bg-red-100 p-2 rounded">
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label>Correo electrónico</label>
                <input
                  type="email"
                  required
                  className="w-full border px-3 py-2 rounded"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label>Contraseña</label>
                <input
                  type="password"
                  required
                  className="w-full border px-3 py-2 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button className="w-full bg-indigo-600 text-white py-2 rounded">
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={startCamera}
                disabled={!!loadingMessage}
                className="w-full bg-gray-800 text-white py-2 rounded disabled:bg-gray-400"
              >
                {loadingMessage || "Ingresar con Face ID"}
              </button>
            </div>

            <p className="text-sm text-center mt-4">
              <Link href="/register" className="text-indigo-600">Registrarse</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

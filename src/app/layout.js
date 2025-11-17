// src/app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistema de Ventas',
  description: 'Parcial Final de Bases de Datos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Script 
          src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
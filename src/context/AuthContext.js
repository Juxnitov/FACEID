// src/context/AuthContext.js (VERSIÓN FINAL CORREGIDA)
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  // La corrección está aquí:
  return useContext(AuthContext); 
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
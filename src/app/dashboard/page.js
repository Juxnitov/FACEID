// src/app/dashboard/page.js (VERSIÓN LIMPIA DE INVENTARIO)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

import AddProductForm from '../../components/AddProductForm';
import ProductList from '../../components/ProductList';

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    setPageLoading(false); 
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (pageLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Verificando sesión...</div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Gestión de Inventario</h1>
      <div className="flex flex-col items-center">
        <AddProductForm />
        <div className="w-full max-w-6xl border-t my-12"></div>
        <ProductList />
      </div>
    </>
  );
}
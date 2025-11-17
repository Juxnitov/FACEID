// src/app/dashboard/sales/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import SalesTerminal from '../../../components/SalesTerminal'; // Ajustamos la ruta

export default function SalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  // Proteger la ruta
  useEffect(() => {
    setPageLoading(false); 
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Función para generar la factura en PDF
  const generateInvoice = (saleData) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Factura de Venta", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Factura #: ${Date.now()}`, 190, 30, null, null, "right");
    doc.text(`Fecha: ${saleData.date.toLocaleDateString()}`, 20, 40);
    doc.text(`Cliente: ${saleData.customer.name}`, 20, 50);
    doc.text(`ID Cliente: ${saleData.customer.id}`, 20, 60);
    doc.setFontSize(14);
    doc.text("Productos:", 20, 80);
    let y = 90;
    saleData.items.forEach(item => {
      doc.setFontSize(10);
      doc.text(`${item.name}`, 20, y);
      doc.text(`${item.quantity} x $${item.price.toFixed(2)}`, 110, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 190, y, null, null, "right");
      y += 8;
    });
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(16);
    doc.text(`Total: $${saleData.total.toFixed(2)}`, 190, y, null, null, "right");
    doc.save(`factura_${saleData.customer.name.replace(/\s/g, '_')}.pdf`);
  };

  // Función para procesar la venta
  const handleSaleComplete = async (saleData) => {
    try {
      await runTransaction(db, async (transaction) => {
        for (const item of saleData.items) {
          const productRef = doc(db, "products", item.id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw `El producto ${item.name} ya no existe.`;
          const newStock = productDoc.data().stock - item.quantity;
          if (newStock < 0) throw `Stock insuficiente para ${item.name}.`;
          transaction.update(productRef, { stock: newStock });
        }
        const salesCollectionRef = collection(db, "sales");
        transaction.set(doc(salesCollectionRef), {
            ...saleData,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
        });
      });
      alert("¡Venta procesada con éxito!");
      generateInvoice(saleData);
      router.push('/dashboard'); // Redirigir de vuelta al inventario después de la venta
    } catch (e) {
      console.error("Error en la transacción de venta: ", e);
      alert(`No se pudo procesar la venta: ${e}`);
    }
  };

  if (pageLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Verificando sesión...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-indigo-600">Nueva Venta</span>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600">
                Volver al Inventario
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex flex-col items-center justify-start p-8">
        <SalesTerminal onSaleComplete={handleSaleComplete} />
      </main>
    </div>
  );
}
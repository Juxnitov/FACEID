'use client';

import { useState, useCallback } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import VoiceCommander from '../../../components/VoiceCommander';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');

  // Función genérica para exportar datos a Excel
  const exportToExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // --- REPORTE 1: Valor total de ventas realizadas ---
  const generateSalesValueReport = async () => {
    setLoading(true);
    try {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      let totalSalesValue = 0;
      const salesDataForReport = [];

      salesSnapshot.forEach(doc => {
        const sale = doc.data();
        totalSalesValue += sale.total;
        salesDataForReport.push({
          ID_Venta: doc.id,
          Cliente: sale.customer.name,
          ID_Cliente: sale.customer.id,
          Fecha: sale.date.toDate().toLocaleDateString(),
          Total: sale.total,
        });
      });

      salesDataForReport.push({});
      salesDataForReport.push({ Cliente: "VALOR TOTAL DE VENTAS", Total: totalSalesValue });

      exportToExcel(salesDataForReport, "reporte_valor_total_ventas");

    } catch (err) {
      console.error(err);
      alert("Error al generar el reporte de ventas.");
    }
    setLoading(false);
  };

  // --- REPORTE 2: Total de productos en stock ---
  const generateStockReport = async () => {
    setLoading(true);
    try {
      const productsSnapshot = await getDocs(collection(db, "products"));
      const stockData = [];
      let totalItems = 0;

      productsSnapshot.forEach(doc => {
        const product = doc.data();
        stockData.push({
          Producto: product.name,
          Precio_Unitario: product.price,
          Stock_Actual: product.stock,
          Valor_Inventario: product.price * product.stock,
        });
        totalItems += product.stock;
      });

      stockData.push({});
      stockData.push({ Producto: "TOTAL DE PRODUCTOS EN STOCK", Stock_Actual: totalItems });

      exportToExcel(stockData, "reporte_stock_total");

    } catch (err) {
      console.error(err);
      alert("Error al generar el reporte de stock.");
    }
    setLoading(false);
  };

  // --- REPORTE 3: Total de compras por un solo cliente ---
  const generateCustomerSalesReport = async () => {
    if (!searchId) {
      alert("Por favor, ingresa el ID o nombre del cliente a buscar.");
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, "sales"), where("customer.id", "==", searchId));
      const salesSnapshot = await getDocs(q);

      if (salesSnapshot.empty) {
        alert("No se encontraron ventas para el cliente especificado.");
        setLoading(false);
        return;
      }

      const customerSalesData = [];
      let totalSpent = 0;
      let customerName = '';

      salesSnapshot.forEach(doc => {
        const sale = doc.data();
        customerName = sale.customer.name;
        customerSalesData.push({
          ID_Venta: doc.id,
          Fecha: sale.date.toDate().toLocaleDateString(),
          Total_Venta: sale.total,
        });
        totalSpent += sale.total;
      });

      customerSalesData.push({});
      customerSalesData.push({ Fecha: "TOTAL GASTADO POR EL CLIENTE", Total_Venta: totalSpent });

      exportToExcel(customerSalesData, `reporte_compras_${customerName.replace(/\s/g, '_')}`);

    } catch (err) {
      console.error(err);
      alert("Error al generar el reporte de cliente.");
    }
    setLoading(false);
  };
  
  // --- NUEVO: Función que recibe e interpreta el comando de voz ---
  const handleVoiceCommand = useCallback((command) => {
    console.log("Interpretando comando:", command);
    if (command.includes('venta') || command.includes('ventas')) {
      alert("Comando de voz reconocido: generando reporte de ventas.");
      generateSalesValueReport();
    } else if (command.includes('stock') || command.includes('inventario')) {
      alert("Comando de voz reconocido: generando reporte de stock.");
      generateStockReport();
    } else {
      alert(`Comando no reconocido: "${command}"`);
    }
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Generación de Reportes</h1>
      <div className="space-y-8">

        {/* Card para Reporte 1 */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">1. Valor Total de Ventas</h2>
          <p className="text-gray-600 mb-4">Genera un reporte con el listado de todas las ventas y el valor total acumulado.</p>
          <button onClick={generateSalesValueReport} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-400">
            {loading ? "Generando..." : "Generar Reporte de Ventas"}
          </button>
        </div>

        {/* Card para Reporte 2 */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">2. Total de Productos en Stock</h2>
          <p className="text-gray-600 mb-4">Genera un reporte con el listado de todos los productos, su stock actual y el total de unidades en el inventario.</p>
          <button onClick={generateStockReport} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-400">
            {loading ? "Generando..." : "Generar Reporte de Stock"}
          </button>
        </div>

        {/* Card para Reporte 3 */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">3. Compras por Cliente</h2>
          <p className="text-gray-600 mb-4">Busca todas las compras realizadas por un cliente específico a través de su ID/Cédula.</p>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="Ingresa ID del cliente"
              className="w-full border border-purple-200 px-3 py-2 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
            <button onClick={generateCustomerSalesReport} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-purple-400 whitespace-nowrap">
              {loading ? "Buscando..." : "Buscar y Generar"}
            </button>
          </div>
        </div>

      </div>

      {/* Componente de comandos de voz */}
      <VoiceCommander onCommand={handleVoiceCommand} />
    </div>
  );
}

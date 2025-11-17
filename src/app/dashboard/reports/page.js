// src/app/dashboard/reports/page.js
'use client';

import { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx'; // Importar la librería xlsx

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState(''); // Para buscar cliente por ID

  // Función genérica para exportar datos a Excel
  const exportToExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data); // Convierte un array de objetos JSON a una hoja
    const wb = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, "Reporte"); // Añade la hoja al libro
    XLSX.writeFile(wb, `${fileName}.xlsx`); // Escribe y descarga el archivo
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

      // Añadimos una fila final con el total
      salesDataForReport.push({}); // Fila vacía para separar
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
      // Creamos una consulta que busca en la colección 'sales' donde el campo 'customer.id' o 'customer.name' coincida
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
        customerName = sale.customer.name; // Guardamos el nombre para el título
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Generación de Reportes</h1>
      <div className="space-y-8">
        
        {/* Card para Reporte 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">1. Valor Total de Ventas</h2>
          <p className="text-gray-600 mb-4">Genera un reporte con el listado de todas las ventas y el valor total acumulado.</p>
          <button onClick={generateSalesValueReport} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {loading ? "Generando..." : "Generar Reporte de Ventas"}
          </button>
        </div>

        {/* Card para Reporte 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">2. Total de Productos en Stock</h2>
          <p className="text-gray-600 mb-4">Genera un reporte con el listado de todos los productos, su stock actual y el total de unidades en el inventario.</p>
          <button onClick={generateStockReport} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {loading ? "Generando..." : "Generar Reporte de Stock"}
          </button>
        </div>

        {/* Card para Reporte 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">3. Compras por Cliente</h2>
          <p className="text-gray-600 mb-4">Busca todas las compras realizadas por un cliente específico a través de su ID/Cédula.</p>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="Ingresa ID del cliente"
              className="w-full border px-3 py-2 rounded-md"
            />
            <button onClick={generateCustomerSalesReport} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 whitespace-nowrap">
              {loading ? "Buscando..." : "Buscar y Generar"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
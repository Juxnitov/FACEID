// src/components/SalesTerminal.js
'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export default function SalesTerminal({ onSaleComplete }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // Este será nuestro carrito de compras
  const [customerName, setCustomerName] = useState(''); // Nombre del cliente para la factura
  const [customerId, setCustomerId] = useState(''); // ID/Cédula del cliente

  // Obtener la lista de productos en tiempo real
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Función para añadir un producto al carrito
  const addToCart = (product) => {
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      // Si ya está, incrementamos la cantidad, pero sin pasarnos del stock
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      // Si no está y hay stock, lo añadimos con cantidad 1
      if (product.stock > 0) {
        setCart([...cart, { ...product, quantity: 1 }]);
      }
    }
  };

  // Función para actualizar la cantidad de un item en el carrito
  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    // Permitimos cambiar a 0 (para eliminar) o hasta el máximo del stock
    if (newQuantity >= 0 && newQuantity <= product.stock) {
      if (newQuantity === 0) {
        // Si la cantidad es 0, lo eliminamos del carrito
        setCart(cart.filter(item => item.id !== productId));
      } else {
        setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
      }
    }
  };

  // Calcular el total de la venta
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleProcessSale = () => {
    if (cart.length === 0) {
      alert("El carrito está vacío.");
      return;
    }
    if (!customerName || !customerId) {
        alert("Por favor, ingresa el nombre y la identificación del cliente.");
        return;
    }

    const saleData = {
      customer: {
        name: customerName,
        id: customerId,
      },
      items: cart,
      total: total,
      date: new Date(),
    };
    onSaleComplete(saleData); // Enviamos los datos al componente padre (dashboard) para procesarlos
  };

  if (loading) return <p>Cargando terminal de ventas...</p>;

  return (
    <div className="w-full max-w-6xl mt-12 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Terminal de Ventas</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Izquierda: Lista de Productos */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Productos Disponibles</h3>
          <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-2">
            {products.map(product => (
              <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-600">${product.price.toFixed(2)} - Stock: {product.stock}</p>
                </div>
                <button 
                  onClick={() => addToCart(product)} 
                  disabled={product.stock === 0}
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 disabled:bg-gray-300"
                >
                  Añadir
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Carrito y Datos del Cliente */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Detalle de la Venta</h3>
          <div className="space-y-2 mb-4">
            <div>
              <label className="text-sm">Nombre del Cliente</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border px-3 py-2 rounded-md"/>
            </div>
             <div>
              <label className="text-sm">ID / Cédula del Cliente</label>
              <input type="text" value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full border px-3 py-2 rounded-md"/>
            </div>
          </div>
          <div className="border rounded-md p-4">
            {cart.length === 0 ? (
              <p className="text-gray-500">El carrito está vacío.</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center mb-2">
                    <span className="truncate w-1/2">{item.name}</span>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={e => updateQuantity(item.id, parseInt(e.target.value, 10))}
                      className="w-16 text-center border rounded"
                    />
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-4 pt-4 text-right">
                  <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={handleProcessSale}
            className="w-full bg-indigo-600 text-white py-3 mt-6 rounded-md text-lg font-semibold hover:bg-indigo-700"
          >
            Procesar Venta y Generar Factura
          </button>
        </div>
      </div>
    </div>
  );
}
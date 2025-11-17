// src/components/EditProductModal.js
'use client';

import { useState, useEffect } from 'react';

export default function EditProductModal({ product, onClose, onSave }) {
  // Estados para los campos del formulario, inicializados con los datos del producto actual
  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedStock, setEditedStock] = useState('');

  // useEffect se ejecuta cuando el 'product' que recibe el modal cambia.
  // Esto asegura que si abres el modal para diferentes productos, los campos se actualicen.
  useEffect(() => {
    if (product) {
      setEditedName(product.name);
      setEditedPrice(product.price);
      setEditedStock(product.stock);
    }
  }, [product]);

  // Si no hay producto, no renderizamos nada (el modal está cerrado)
  if (!product) {
    return null;
  }

  const handleSaveChanges = () => {
    const updatedProduct = {
      name: editedName,
      price: parseFloat(editedPrice),
      stock: parseInt(editedStock, 10),
    };
    onSave(product.id, updatedProduct);
  };

  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      {/* Contenedor del Modal */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Editar Producto</h2>
        
        {/* Mostramos la imagen actual (no la editaremos para simplificar) */}
        <div className="mb-4">
          <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover rounded-md mx-auto" />
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="editName" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
            <input 
              type="text" 
              id="editName" 
              value={editedName} 
              onChange={(e) => setEditedName(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700">Precio</label>
            <input 
              type="number" 
              id="editPrice" 
              value={editedPrice} 
              onChange={(e) => setEditedPrice(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="editStock" className="block text-sm font-medium text-gray-700">Cantidad en Stock</label>
            <input 
              type="number" 
              id="editStock" 
              value={editedStock} 
              onChange={(e) => setEditedStock(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSaveChanges} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
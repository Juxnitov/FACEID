// src/components/ProductList.js (VERSIÓN FINAL CON CRUD COMPLETO)
'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // NUEVO: Importar 'updateDoc'
import { ref, deleteObject } from 'firebase/storage';
import EditProductModal from './EditProductModal'; // NUEVO: Importar el componente del modal

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NUEVO: Estados para manejar el modal de edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null); // Producto que se está editando

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
      setLoading(false);
    }, (err) => {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (productId, imageUrl) => {
    // ... (esta función se queda igual que antes)
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar este producto?");
    if (confirmDelete) {
      try {
        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }
        await deleteDoc(doc(db, "products", productId));
        alert("Producto eliminado con éxito.");
      } catch (err) {
        console.error("Error al eliminar el producto:", err);
        alert("Ocurrió un error al eliminar el producto.");
      }
    }
  };

  // NUEVO: Funciones para abrir y cerrar el modal
  const handleEdit = (product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  // NUEVO: Función para guardar los cambios del producto
  const handleSave = async (productId, updatedData) => {
    try {
      const productDocRef = doc(db, "products", productId);
      await updateDoc(productDocRef, updatedData);
      alert("Producto actualizado con éxito.");
      handleCloseModal(); // Cerramos el modal después de guardar
      // onSnapshot se encargará de actualizar la vista automáticamente
    } catch (err) {
      console.error("Error al actualizar el producto:", err);
      alert("Ocurrió un error al actualizar el producto.");
    }
  };


  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Cargando productos...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">{error}</p>;
  }

  return (
    <> {/* Usamos un fragmento para poder renderizar el modal junto a la lista */}
      <div className="w-full max-w-6xl mt-12">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Inventario Actual</h2>
        {products.length === 0 ? (
          <p className="text-center text-gray-500 bg-white p-6 rounded-lg shadow">Aún no hay productos registrados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:scale-105">
                <div className="w-full h-48 bg-gray-200">
                  {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold truncate text-gray-900">{product.name}</h3>
                  <p className="text-gray-800 text-2xl font-bold mt-2">${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-1">Stock: <span className="font-medium text-gray-800">{product.stock}</span> unidades</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <div className="flex justify-between gap-2">
                      <button 
                        onClick={() => handleEdit(product)} // Conectamos el botón de editar
                        className="w-full text-sm bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id, product.imageUrl)}
                        className="w-full text-sm bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NUEVO: Renderizar el modal condicionalmente */}
      <EditProductModal 
        product={currentProduct}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </>
  );
}
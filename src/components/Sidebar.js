// src/components/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Inventario', href: '/dashboard' },
  { name: 'Nueva Venta', href: '/dashboard/sales' },
  { name: 'Reportes', href: '/dashboard/reports' }, // Lo usaremos más adelante
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Menú</h2>
      <nav className="flex flex-col space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-4 py-2 rounded-md text-lg ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
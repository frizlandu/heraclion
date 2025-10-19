/**
 * Sidebar de navigation
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import './Sidebar.css';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Factures', href: '/factures', icon: DocumentTextIcon },
  { name: 'Proformas', href: '/proformas', icon: ClipboardDocumentListIcon },
  { name: 'Stock', href: '/stock', icon: CubeIcon },
  { name: 'Caisse', href: '/caisse', icon: CurrencyEuroIcon },
  { name: 'Rapports', href: '/rapports', icon: ChartBarIcon },
  { name: 'Entreprises', href: '/entreprises', icon: BuildingOfficeIcon },
  { name: 'Configuration PDF', href: '/pdf-config', icon: DocumentTextIcon },
  { name: 'Utilisateurs', href: '/utilisateurs', icon: UsersIcon },
  { name: 'Paramètres', href: '/parametres', icon: Cog6ToothIcon },
];

const Sidebar = ({ onClose }) => {
  return (
    <div className="flex flex-col flex-grow bg-indigo-700 pt-5 pb-4 overflow-y-auto">
      {/* Header avec logo */}
      <div className="flex items-center flex-shrink-0 px-4">
        <img
          className="h-8 w-auto"
          src="/logos/heraclion-logo.png"
          alt="Heraclion"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <span className="ml-2 text-white text-xl font-bold">HERACLION</span>
        
        {/* Bouton fermer pour mobile */}
        {onClose && (
          <button
            type="button"
            className="ml-auto -mr-2 h-10 w-10 rounded-md flex items-center justify-center text-indigo-200 hover:text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden"
            onClick={onClose}
          >
            <span className="sr-only">Fermer le menu</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `${
                isActive
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-100 hover:bg-indigo-600'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`
            }
            onClick={onClose} // Fermer la sidebar mobile après navigation
          >
            <item.icon
              className="mr-3 flex-shrink-0 h-6 w-6"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      {/* Footer avec version */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-indigo-600">
        <p className="text-xs text-indigo-200">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
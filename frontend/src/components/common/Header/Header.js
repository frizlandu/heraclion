/**
 * Header de l'application
 */
import React from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import UserMenu from './UserMenu';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      {/* Bouton menu mobile */}
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Ouvrir le menu</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Titre de la page */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            HERACLION
          </h1>
        </div>

        {/* Actions de droite */}
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="sr-only">Voir les notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Menu utilisateur */}
          <UserMenu user={user} />
        </div>
      </div>
    </div>
  );
};

export default Header;
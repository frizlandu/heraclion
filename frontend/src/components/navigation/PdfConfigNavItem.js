/**
 * Composant de navigation pour intégrer la configuration PDF
 * À utiliser dans votre sidebar ou navigation existante
 */
import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const PdfConfigNavItem = ({ onClick, isActive = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full px-4 py-2 text-left text-sm font-medium rounded-md
        transition-colors duration-200
        ${isActive 
          ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
        ${className}
      `}
    >
      <Cog6ToothIcon className="mr-3 h-5 w-5" />
      Configuration PDF
    </button>
  );
};

export default PdfConfigNavItem;
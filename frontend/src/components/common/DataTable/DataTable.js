/**
 * Composant DataTable réutilisable
 */
import React, { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  onRowClick = null,
  actions = null,
  emptyMessage = "Aucune donnée disponible",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filtrage des données
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    return columns.some(column => {
      const value = item[column.key];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Tri des données
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Barre de recherche */}
      {searchable && (
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="datatable-search"
              name="search"
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      )}

      {/* Actions globales */}
      {actions && (
        <div className="px-6 py-4 border-b border-gray-200">
          {actions}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <ChevronUpDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render 
                        ? column.render(item[column.key], item) 
                        : item[column.key] || '-'
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer avec statistiques */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {searchTerm ? (
              <>Affichage de {sortedData.length} résultat(s) sur {data.length}</>
            ) : (
              <>Total : {data.length} élément(s)</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
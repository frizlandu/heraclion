/**
 * Composant des cartes de statistiques
 */
import React from 'react';
import {
  UsersIcon,
  DocumentTextIcon,
  CubeIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const StatsCards = ({ stats }) => {
  const statsData = [
    {
      name: 'Factures',
      value: stats.totalFactures || stats.totalFacturesTransport + (stats.totalFacturesNonTransport || 0) || 0,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      name: 'Proformas',
      value: stats.totalProformas || stats.totalProformasTransport + (stats.totalProformasNonTransport || 0) || 0,
      icon: DocumentTextIcon,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    },
    {
      name: 'Entreprises',
      value: stats.totalEntreprises || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Clients',
      value: stats.totalClients || 0,
      icon: UsersIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Documents',
      value: stats.total_documents || 0,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    
    {
      name: 'Articles en stock',
      // back-end may expose total_stock_articles or totalStockArticles
      value: stats.total_stock_articles || stats.totalStockArticles || stats.totalStock || 0,
      icon: CubeIcon,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      name: 'CA Total',
      value: `${((stats && stats.montant_total_factures) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      icon: CurrencyEuroIcon,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      name: 'Solde caisse',
      value: `${((stats && stats.solde_caisse) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      icon: CurrencyEuroIcon,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600'
    },
    {
      name: 'Factures en attente',
      value: stats.factures_en_attente || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`inline-flex items-center justify-center p-3 ${stat.bgColor} rounded-md`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
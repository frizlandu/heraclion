import React, { useState } from 'react';
import {
  RapportsVentes,
  RapportsDepenses,
  RapportsTresorerie,
  RapportsStocks,
} from './rapports';

const tabs = [
  { id: 'ventes', label: 'Ventes' },
  { id: 'depenses', label: 'Dépenses' },
  { id: 'tresorerie', label: 'Trésorerie' },
  { id: 'stocks', label: 'Stocks' },
];

const ReportsPage = () => {
  const [active, setActive] = useState('ventes');

  function renderActive() {
    switch (active) {
      case 'ventes':
        return <RapportsVentes />;
      case 'depenses':
        return <RapportsDepenses />;
      case 'tresorerie':
        return <RapportsTresorerie />;
      case 'stocks':
        return <RapportsStocks />;
      default:
        return <div>Onglet inconnu</div>;
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rapports</h1>
            <p className="text-gray-600 mt-1">Consultez les différents rapports de l'application.</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200 px-4">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`py-4 px-1 border-b-2 -mb-px text-sm font-medium ${
                    active === t.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={active === t.id ? 'page' : undefined}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderActive()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

import React from 'react';

const CaisseDashboard = ({ stats, onExportExcel, onExportPdfGlobal, onExportPdfPerOp, onCloseMonth }) => {
  return (
    <>
      <div className="flex gap-2 mb-6">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          onClick={onExportExcel}
        >
          Exporter Excel
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          onClick={onExportPdfGlobal}
        >
          Exporter PDF global
        </button>
        <button
          className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded shadow"
          onClick={onExportPdfPerOp}
        >
          Exporter PDF (par opération)
        </button>
        <button
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow"
          onClick={onCloseMonth}
        >
          Clôturer le mois
        </button>
      </div>
      {/* print icon removed as requested */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-xs">#</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Opérations</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalOperations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-xs">+</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total entrées</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalEntree.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs">-</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total sorties</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalSortie.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">$</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Solde</dt>
                  <dd className={`text-lg font-medium ${stats.solde < 0 ? 'text-red-600' : 'text-green-700'}`}>{stats.solde.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaisseDashboard;

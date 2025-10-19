import React from 'react';

const SoldeCaisse = ({ solde }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg p-5 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">$</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">Solde</dt>
            <dd className={`text-lg font-medium ${solde < 0 ? 'text-red-600' : 'text-green-700'}`}>{solde.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default SoldeCaisse;

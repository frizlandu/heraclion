import React from 'react';
import DataTable from '../../components/common/DataTable/DataTable';
import { PencilIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/outline';

const CaisseOperations = ({ operations, onEditClick, onDelete, onPrint }) => {
  return (
    <DataTable
      data={operations}
      columns={[
        {
          key: 'date_operation',
          label: 'Date',
          sortable: true,
          render: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        {
          key: 'description',
          label: 'Libellé',
          sortable: true
        },
        {
          key: 'type_operation',
          label: 'Type',
          sortable: true,
          render: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
        },
        {
          key: 'montant',
          label: 'Montant',
          sortable: true,
          render: (value) => value !== undefined ? (value < 0 ? <span className="text-red-600">{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span> : <span className="text-green-700">{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>) : ''
        },
        {
          key: 'actions',
          label: 'Actions',
          render: (_, op) => (
            <div className="flex gap-2 justify-center">
              <button title="Imprimer" className="p-1 rounded hover:bg-gray-100 text-indigo-600" onClick={e => { e.stopPropagation(); onPrint(op); }}>
                <PrinterIcon className="h-5 w-5" />
              </button>
              <button title="Éditer" className="p-1 rounded hover:bg-blue-100 text-blue-700" onClick={e => { e.stopPropagation(); onEditClick(op); }}>
                <PencilIcon className="h-5 w-5" />
              </button>
              <button title="Supprimer" className="p-1 rounded hover:bg-red-100 text-red-700" onClick={e => { e.stopPropagation(); onDelete(op.id); }}>
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )
        }
      ]}
      emptyMessage="Aucune opération trouvée."
      searchable={true}
      searchPlaceholder="Rechercher une opération..."
    />
  );
};

export default CaisseOperations;

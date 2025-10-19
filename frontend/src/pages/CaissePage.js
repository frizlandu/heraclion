import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import CaisseDashboard from './caisse/CaisseDashboard';
import CaisseOperations from './caisse/CaisseOperations';
import CaisseForm from './caisse/CaisseForm';

const CaissePage = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ date: '', libelle: '', type: 'entree', montant: '' });
  const [adding, setAdding] = useState(false);

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [selectedOp, setSelectedOp] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', libelle: '', type: 'entree', montant: '' });

  const fetchOperations = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/caisse');
      if (!res.ok) throw new Error('Erreur chargement opérations');
      setOperations(await res.json());
    } catch (err) {
      setError(err.message);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    // eslint-disable-next-line
  }, []);

  const stats = React.useMemo(() => {
    let total = 0;
    let totalEntree = 0;
    let totalSortie = 0;
    for (const op of operations) {
      const montant = Number(op.montant) || 0;
      total += montant;
      if (op.type_operation && op.type_operation.toUpperCase() === 'ENTREE') totalEntree += montant;
      if (op.type_operation && op.type_operation.toUpperCase() === 'SORTIE') totalSortie += Math.abs(montant);
    }
    return {
      totalOperations: operations.length,
      totalEntree,
      totalSortie,
      solde: total
    };
  }, [operations]);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAdd = async e => {
    e.preventDefault();
    const isSortie = form.type === 'sortie';
    const montantAbs = Math.abs(Number(form.montant));
    if (isSortie && montantAbs > 500) {
      const msg = `Confirmez-vous cette sortie importante de ${montantAbs.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} ?`;
      if (!window.confirm(msg)) return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_operation: form.date,
          description: form.libelle,
          type_operation: form.type,
          montant: Number(form.montant) * (form.type === 'sortie' ? -1 : 1),
          reference_document: null
        })
      });
      if (!res.ok) throw new Error('Erreur ajout opération');
      setForm({ date: '', libelle: '', type: 'entree', montant: '' });
      fetchOperations();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleEditClick = (op) => {
    setSelectedOp(op);
    let dateStr = '';
    if (op.date_operation) {
      try {
        const d = new Date(op.date_operation);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 10);
        }
      } catch (e) {
        dateStr = '';
      }
    }
    setEditForm({
      date: dateStr || '',
      libelle: (op.description && typeof op.description === 'string') ? op.description : 'Non renseigné',
      type: op.type || 'entree',
      montant: Math.abs(Number(op.montant)) || 0,
    });
    setFormMode('edit');
    setShowForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const id = selectedOp?.id;
      const res = await fetch(`/api/caisse/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_operation: editForm.date,
          description: editForm.libelle,
          type_operation: editForm.type,
          montant: Number(editForm.montant) * (editForm.type === 'sortie' ? -1 : 1),
          reference_document: null
        })
      });
      if (!res.ok) throw new Error('Erreur modification opération');
      setShowForm(false);
      setSelectedOp(null);
      fetchOperations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette opération ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/caisse/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression opération');
      fetchOperations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/caisse/export/excel');
      if (!response.ok || !response.headers.get('content-type')?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        throw new Error('Erreur lors de l\'export Excel');
      }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'export-caisse.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Export Excel impossible : ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleExportPdfGlobal = async () => {
    if (operations.length === 0) {
      toast.error('Aucune opération à exporter');
      return;
    }
    try {
      const response = await fetch('/api/caisse/export/pdf');
      if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) {
        throw new Error('Erreur lors de l\'export PDF');
      }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'export-caisse.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Export PDF impossible : ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleExportPdfPerOp = () => {
    if (operations.length === 0) {
      toast.error('Aucune opération à exporter');
      return;
    }
    operations.forEach(op => {
      window.open(`/api/caisse/${op.id}/bon`, '_blank');
    });
  };

  const handleCloseMonth = async () => {
    if (!window.confirm('Clôturer et archiver toutes les opérations du mois courant ?')) return;
    const now = new Date();
    const annee = now.getFullYear();
    const mois = now.getMonth() + 1;
    try {
      const res = await fetch('/api/caisse/archiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annee, mois })
      });
      if (!res.ok) throw new Error('Erreur lors de la clôture');
      toast.success('Mois clôturé et archivé !');
      fetchOperations();
    } catch (err) {
      toast.error('Erreur lors de la clôture : ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handlePrint = (op) => {
    window.open(`/api/caisse/${op.id}/bon`, '_blank');
  };

  const handleCreate = () => {
    setForm({ date: '', libelle: '', type: 'entree', montant: '' });
    setFormMode('create');
    setSelectedOp(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
            <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
            <div className="mt-4">
              <button onClick={fetchOperations} className="bg-red-100 px-2 py-1 rounded-md text-red-800 text-sm hover:bg-red-200">Réessayer</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caisse</h1>
          <p className="mt-2 text-sm text-gray-700">Gérez les opérations de caisse, exportez et imprimez les bons.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={handleCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Nouvelle opération
          </button>
        </div>
      </div>

      <CaisseDashboard
        stats={stats}
        onExportExcel={handleExportExcel}
        onExportPdfGlobal={handleExportPdfGlobal}
        onExportPdfPerOp={handleExportPdfPerOp}
        onCloseMonth={handleCloseMonth}
      />

      <CaisseOperations operations={operations} onEditClick={handleEditClick} onDelete={handleDelete} onPrint={handlePrint} />

      {showForm && formMode === 'create' && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Nouvelle opération</h2>
            <CaisseForm form={form} onChange={handleFormChange} onSubmit={async (e) => { await handleAdd(e); setShowForm(false); }} submitting={adding} />
            <div className="mt-3 text-right">
              <button className="text-sm text-gray-600" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showForm && formMode === 'edit' && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Éditer opération</h2>
            <CaisseForm form={editForm} onChange={(e) => { const { name, value } = e.target; setEditForm(f => ({ ...f, [name]: value })); }} onSubmit={handleEditSubmit} submitting={false} />
            <div className="mt-3 text-right">
              <button className="text-sm text-gray-600" onClick={() => { setShowForm(false); setSelectedOp(null); }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

  {/* Solde display removed as requested */}
    </div>
  );
};

export default CaissePage;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

const CorbeillePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCorbeille = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiBaseUrl}/corbeille?page=${page}&limit=20`);
      setItems(res.data.data);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      setError('Erreur lors du chargement de la corbeille');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorbeille();
    // eslint-disable-next-line
  }, []);

  const handleRestore = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${apiBaseUrl}/corbeille/${id}/restaurer`);
      setSuccess('Élément restauré avec succès.');
      fetchCorbeille(page);
    } catch (err) {
      setError('Erreur lors de la restauration.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Corbeille</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{success}</div>}
      {loading ? (
        <div>Chargement…</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Table</th>
              <th className="border px-2 py-1">Date suppression</th>
              <th className="border px-2 py-1">Utilisateur</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border px-2 py-1">{item.id}</td>
                <td className="border px-2 py-1">{item.table_source}</td>
                <td className="border px-2 py-1">{new Date(item.date_suppression).toLocaleString()}</td>
                <td className="border px-2 py-1">{item.utilisateur || '-'}</td>
                <td className="border px-2 py-1">
                  <button onClick={() => handleRestore(item.id)} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Restaurer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex justify-center mt-4 space-x-2">
        <button disabled={page <= 1} onClick={() => fetchCorbeille(page - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Précédent</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => fetchCorbeille(page + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Suivant</button>
      </div>
    </div>
  );
};

export default CorbeillePage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const RapportsStocks = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [valorisation, setValorisation] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get('/api/v1/reports/stocks')
      .then((res) => {
        if (!mounted) return;
        // The API returns { success:true, data: { valorisation, mouvements } }
        const mouvements = res.data?.data?.mouvements || [];
        setData(mouvements);
        // Optionally expose valorisation in UI via state if needed
        if (res.data?.data?.valorisation) {
          setValorisation(res.data.data.valorisation);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erreur lors du chargement');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Rapports - Stocks</h2>
      <p className="text-sm text-gray-600 mb-4">État des stocks et mouvements</p>

      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div style={{ width: '100%', height: 320 }}>
          {valorisation && (
            <div className="mb-4 text-sm text-gray-700">
              <strong>Articles:</strong> {valorisation.nombre_articles} — <strong>Quantité:</strong> {valorisation.quantite_totale} — <strong>Valeur achat:</strong> {valorisation.valeur_achat} — <strong>Valeur vente:</strong> {valorisation.valeur_vente}
            </div>
          )}
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mouvements" barSize={20} fill="#6366F1" />
              <Line type="monotone" dataKey="stock" stroke="#0EA5A4" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RapportsStocks;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const RapportsDepenses = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get('/api/v1/reports/depenses')
      .then((res) => {
        if (!mounted) return;
        const payload = res.data?.data;
        const chartArray = Array.isArray(payload) ? payload : (payload?.mouvements || payload?.data || []);
        setData(chartArray);
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
      <h2 className="text-xl font-semibold mb-4">Rapports - Dépenses</h2>
      <p className="text-sm text-gray-600 mb-4">Dépenses mensuelles</p>

      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="depenses" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RapportsDepenses;

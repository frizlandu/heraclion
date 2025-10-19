import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const RapportsTresorerie = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get('/api/v1/reports/tresorerie')
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
      <h2 className="text-xl font-semibold mb-4">Rapports - Trésorerie</h2>
      <p className="text-sm text-gray-600 mb-4">Évolution du solde de trésorerie</p>

      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="solde" stroke="#059669" fillOpacity={1} fill="url(#colorSolde)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RapportsTresorerie;

// components/RenderStatusWidget.jsx
import React, { useEffect, useState } from 'react';

const RenderStatusWidget = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch('/scan-report.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => setReport(data))
      .catch(() => setReport(null));
  }, []);

  if (!report) {
    return <div style={styles.warn}>🟡 Rapport introuvable</div>;
  }

  const { status, scanIssues, verifyIssues, date } = report;
  const hasIssues = (scanIssues?.length || 0) > 0 || (verifyIssues?.length || 0) > 0;

  return (
    <div style={styles.container}>
      <h3>🧭 État Render ({date})</h3>
      <p><strong>Status :</strong> {status.status === 'ok' && !hasIssues ? '✅ OK' : '❌ Erreurs détectées'}</p>
      <p><strong>Tests :</strong> {status.tests.passed}/{status.tests.total} réussis</p>
      <p><strong>Couverture :</strong> {Object.entries(status.couverture).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
      <p><strong>Logs :</strong> {status.logs}</p>
      {hasIssues && (
        <details>
          <summary>🔍 Problèmes détectés</summary>
          <ul>
            {scanIssues.map((issue, i) => <li key={`scan-${i}`}>{issue}</li>)}
            {verifyIssues.map((issue, i) => <li key={`verify-${i}`}>{issue}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f4f4f4',
    padding: '16px',
    borderRadius: '8px',
    fontFamily: 'sans-serif',
    maxWidth: '600px'
  },
  warn: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px',
    borderRadius: '6px'
  }
};

export default RenderStatusWidget;

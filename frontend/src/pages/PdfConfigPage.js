/**
 * Composant principal pour la gestion de la configuration PDF
 * À intégrer dans votre application React existante
 */
import React, { Suspense, lazy } from 'react';

// Lazy loading du composant principal
const PdfConfigManager = lazy(() => import('../components/pdf/PdfConfigManager'));

const PdfConfigPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Chargement de la configuration PDF...</span>
          </div>
        }
      >
        <PdfConfigManager />
      </Suspense>
    </div>
  );
};

export default PdfConfigPage;
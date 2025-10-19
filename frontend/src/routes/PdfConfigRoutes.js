/**
 * Route pour la configuration PDF
 * À intégrer dans votre Router existant
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PdfConfigPage from '../pages/PdfConfigPage';

const PdfConfigRoutes = () => {
  return (
    <Routes>
      <Route path="/pdf-config" element={<PdfConfigPage />} />
      <Route path="/pdf-config/*" element={<PdfConfigPage />} />
    </Routes>
  );
};

export default PdfConfigRoutes;
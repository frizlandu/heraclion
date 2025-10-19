-- Ajoute une table beneficiaires pour la gestion des agents/bénéficiaires
CREATE TABLE IF NOT EXISTS beneficiaires (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150)
);

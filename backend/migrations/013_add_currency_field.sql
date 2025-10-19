-- Migration 013: Ajout du champ monnaie à la table documents
-- Créé le: 2025-10-09

-- Ajout du champ monnaie avec USD comme valeur par défaut
ALTER TABLE documents 
ADD COLUMN monnaie VARCHAR(3) DEFAULT 'USD';

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN documents.monnaie IS 'Code de la monnaie du document (USD, EUR, GBP, CAD, etc.)';

-- Mise à jour des documents existants pour utiliser USD par défaut
UPDATE documents 
SET monnaie = 'USD' 
WHERE monnaie IS NULL;

-- Index pour améliorer les performances sur les requêtes par monnaie
CREATE INDEX IF NOT EXISTS idx_documents_monnaie ON documents(monnaie);
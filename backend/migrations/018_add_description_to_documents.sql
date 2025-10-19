-- Migration 018: Ajout de la colonne description à la table documents
-- Objectif: assurer la compatibilité entre anciens clients/frontends qui utilisent `notes` et
-- le nouveau champ `description` utilisé par le code.

BEGIN;

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS description text;

-- Copier les valeurs existantes depuis `notes` pour conserver la sémantique actuelle
-- (ne remplace pas les descriptions déjà présentes)
UPDATE documents
SET description = notes
WHERE description IS NULL AND notes IS NOT NULL;

-- Ajouter un commentaire utile
COMMENT ON COLUMN documents.description IS 'Description du document (copie depuis notes pour compatibilité)';

COMMIT;

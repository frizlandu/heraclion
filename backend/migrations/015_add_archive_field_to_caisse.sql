-- Ajoute un champ archive (bool) pour l'archivage mensuel des opérations de caisse
ALTER TABLE caisse ADD COLUMN IF NOT EXISTS archive BOOLEAN DEFAULT FALSE;

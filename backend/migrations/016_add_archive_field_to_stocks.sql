-- Ajoute une colonne archive (booléen) à la table stocks
ALTER TABLE stocks ADD COLUMN archive BOOLEAN DEFAULT FALSE;
-- Table corbeille générique pour toutes les suppressions logiques
CREATE TABLE corbeille (
    id SERIAL PRIMARY KEY,
    table_source VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    date_suppression TIMESTAMP DEFAULT NOW(),
    utilisateur VARCHAR(100)
);

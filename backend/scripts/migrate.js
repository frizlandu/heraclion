/**
 * Script de migration de la base de données
 * Crée toutes les tables nécessaires pour l'application Heraclion
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'heraclion',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

/**
 * Créer la base de données si elle n'existe pas
 */
async function createDatabase() {
  const client = new Client({
    ...config,
    database: 'postgres' // Se connecter à la DB par défaut
  });

  try {
    await client.connect();
    
    // Vérifier si la base existe
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    );

    if (result.rows.length === 0) {
      console.log(`Création de la base de données ${config.database}...`);
      await client.query(`CREATE DATABASE "${config.database}"`);
      console.log('✅ Base de données créée avec succès');
    } else {
      console.log('✅ Base de données existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de la base de données:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Exécuter les migrations SQL
 */
async function runMigrations() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connexion à la base de données établie');

    // Créer la table des migrations si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SQL des tables principales
    const migrations = [
      {
        name: '001_create_entreprises_table',
        sql: `
          CREATE TABLE IF NOT EXISTS entreprises (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            siret VARCHAR(14) UNIQUE,
            adresse TEXT,
            ville VARCHAR(100),
            code_postal VARCHAR(10),
            pays VARCHAR(100) DEFAULT 'France',
            telephone VARCHAR(20),
            email VARCHAR(255),
            site_web VARCHAR(255),
            logo_path VARCHAR(500),
            tva_intracommunautaire VARCHAR(20),
            forme_juridique VARCHAR(100),
            capital DECIMAL(15,2),
            actif BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '002_create_users_table',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            mot_de_passe VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            telephone VARCHAR(20),
            actif BOOLEAN DEFAULT true,
            derniere_connexion TIMESTAMP,
            refresh_token TEXT,
            reset_token VARCHAR(255),
            reset_token_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '003_create_clients_table',
        sql: `
          CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            prenom VARCHAR(100),
            email VARCHAR(255),
            telephone VARCHAR(20),
            adresse TEXT,
            ville VARCHAR(100),
            code_postal VARCHAR(10),
            pays VARCHAR(100) DEFAULT 'France',
            type_client VARCHAR(50) DEFAULT 'particulier',
            siret VARCHAR(14),
            tva_intracommunautaire VARCHAR(20),
            notes TEXT,
            actif BOOLEAN DEFAULT true,
            date_suppression TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '004_create_documents_table',
        sql: `
          CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            numero VARCHAR(50) UNIQUE NOT NULL,
            type_document VARCHAR(50) NOT NULL,
            client_id INTEGER REFERENCES clients(id),
            entreprise_id INTEGER REFERENCES entreprises(id),
            date_emission DATE NOT NULL,
            date_echeance DATE,
            statut VARCHAR(50) DEFAULT 'brouillon',
            montant_ht DECIMAL(15,2) DEFAULT 0,
            montant_tva DECIMAL(15,2) DEFAULT 0,
            taux_tva DECIMAL(5,2) DEFAULT 20,
            montant_ttc DECIMAL(15,2) DEFAULT 0,
            remise_globale DECIMAL(15,2) DEFAULT 0,
            conditions_paiement TEXT,
            notes TEXT,
            pdf_path VARCHAR(500),
            facture_originale_id INTEGER REFERENCES documents(id),
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '005_create_lignes_documents_table',
        sql: `
          CREATE TABLE IF NOT EXISTS lignes_documents (
            id SERIAL PRIMARY KEY,
            document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            quantite DECIMAL(10,2) DEFAULT 1,
            prix_unitaire DECIMAL(15,2) NOT NULL,
            taux_tva DECIMAL(5,2) DEFAULT 20,
            montant_ht DECIMAL(15,2) NOT NULL,
            montant_tva DECIMAL(15,2) NOT NULL,
            montant_ttc DECIMAL(15,2) NOT NULL,
            ordre INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '006_create_stock_table',
        sql: `
          CREATE TABLE IF NOT EXISTS stock (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            description TEXT,
            reference VARCHAR(100) UNIQUE,
            prix_achat DECIMAL(15,2),
            prix_vente DECIMAL(15,2),
            quantite_stock INTEGER DEFAULT 0,
            seuil_alerte INTEGER DEFAULT 5,
            unite VARCHAR(50) DEFAULT 'pièce',
            categorie VARCHAR(100),
            fournisseur VARCHAR(255),
            actif BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '007_create_comptabilite_table',
        sql: `
          CREATE TABLE IF NOT EXISTS comptabilite (
            id SERIAL PRIMARY KEY,
            document_id INTEGER REFERENCES documents(id),
            type_ecriture VARCHAR(50) NOT NULL,
            compte_debit VARCHAR(10),
            compte_credit VARCHAR(10),
            libelle TEXT NOT NULL,
            montant DECIMAL(15,2) NOT NULL,
            date_ecriture DATE NOT NULL,
            piece_comptable VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: '008_create_triggers',
        sql: `
          -- Trigger pour mettre à jour updated_at automatiquement
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';

          -- Appliquer le trigger à toutes les tables
          DROP TRIGGER IF EXISTS update_entreprises_updated_at ON entreprises;
          CREATE TRIGGER update_entreprises_updated_at 
            BEFORE UPDATE ON entreprises 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

          DROP TRIGGER IF EXISTS update_users_updated_at ON users;
          CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

          DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
          CREATE TRIGGER update_clients_updated_at 
            BEFORE UPDATE ON clients 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

          DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
          CREATE TRIGGER update_documents_updated_at 
            BEFORE UPDATE ON documents 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

          DROP TRIGGER IF EXISTS update_lignes_documents_updated_at ON lignes_documents;
          CREATE TRIGGER update_lignes_documents_updated_at 
            BEFORE UPDATE ON lignes_documents 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

          DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
          CREATE TRIGGER update_stock_updated_at 
            BEFORE UPDATE ON stock 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

          DROP TRIGGER IF EXISTS update_comptabilite_updated_at ON comptabilite;
          CREATE TRIGGER update_comptabilite_updated_at 
            BEFORE UPDATE ON comptabilite 
            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
        `
      },
      {
        name: '009_create_sequences_and_functions',
        sql: `
          -- Séquences pour la numérotation automatique des documents
          CREATE SEQUENCE IF NOT EXISTS seq_facture_2024 START 1;
          CREATE SEQUENCE IF NOT EXISTS seq_devis_2024 START 1;
          CREATE SEQUENCE IF NOT EXISTS seq_avoir_2024 START 1;
          CREATE SEQUENCE IF NOT EXISTS seq_proforma_2024 START 1;

          -- Fonction pour générer le numéro de document
          CREATE OR REPLACE FUNCTION generate_document_number(doc_type VARCHAR, doc_year INTEGER)
          RETURNS VARCHAR AS $$
          DECLARE
            sequence_name VARCHAR;
            next_num INTEGER;
            formatted_num VARCHAR;
          BEGIN
            sequence_name := 'seq_' || lower(doc_type) || '_' || doc_year;
            
            EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_num;
            
            formatted_num := upper(doc_type) || '-' || doc_year || '-' || lpad(next_num::text, 4, '0');
            
            RETURN formatted_num;
          END;
          $$ LANGUAGE plpgsql;

          -- Trigger pour générer automatiquement le numéro de document
          CREATE OR REPLACE FUNCTION set_document_numero()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.numero IS NULL OR NEW.numero = '' THEN
              NEW.numero := generate_document_number(NEW.type_document, EXTRACT(YEAR FROM NEW.date_emission));
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          DROP TRIGGER IF EXISTS set_document_numero_trigger ON documents;
          CREATE TRIGGER set_document_numero_trigger
            BEFORE INSERT ON documents
            FOR EACH ROW EXECUTE PROCEDURE set_document_numero();
        `
      },
      {
        name: '010_create_indexes',
        sql: `
          -- Index pour les performances
          CREATE INDEX IF NOT EXISTS idx_documents_type_statut ON documents(type_document, statut);
          CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
          CREATE INDEX IF NOT EXISTS idx_documents_date_emission ON documents(date_emission);
          CREATE INDEX IF NOT EXISTS idx_documents_numero ON documents(numero);
          CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
          CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_stock_reference ON stock(reference);
          CREATE INDEX IF NOT EXISTS idx_comptabilite_document_id ON comptabilite(document_id);
          CREATE INDEX IF NOT EXISTS idx_comptabilite_date_ecriture ON comptabilite(date_ecriture);
        `
      },
      {
        name: '011_add_modele_facture_field',
        sql: `
          -- Ajouter le champ modèle de facture à la table documents
          ALTER TABLE documents 
          ADD COLUMN IF NOT EXISTS modele_facture VARCHAR(100) DEFAULT 'standard';
          
          -- Ajouter un commentaire pour documenter le champ
          COMMENT ON COLUMN documents.modele_facture IS 'Modèle de mise en page de la facture (standard, moderne, minimal, etc.)';
        `
      },
      {
        name: '012_add_lignes_documents_fields',
        sql: `
          -- Ajouter les champs spécifiques pour les lignes de facture transport et non-transport
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS item VARCHAR(100) DEFAULT '';
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS date_transport DATE;
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS plaque_immat VARCHAR(50) DEFAULT '';
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS ticket VARCHAR(100) DEFAULT '';
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS tonnes DECIMAL(10,3) DEFAULT 0;
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS total_poids DECIMAL(10,3) DEFAULT 0;
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS frais_administratif DECIMAL(15,2) DEFAULT 0;
          ALTER TABLE lignes_documents ADD COLUMN IF NOT EXISTS unite VARCHAR(50) DEFAULT '';
          
          -- Ajouter des commentaires pour documenter les nouveaux champs
          COMMENT ON COLUMN lignes_documents.item IS 'Référence ou code de l''item';
          COMMENT ON COLUMN lignes_documents.date_transport IS 'Date de transport (spécifique aux factures transport)';
          COMMENT ON COLUMN lignes_documents.plaque_immat IS 'Plaque d''immatriculation du véhicule';
          COMMENT ON COLUMN lignes_documents.ticket IS 'Numéro de ticket ou bon de commande';
          COMMENT ON COLUMN lignes_documents.tonnes IS 'Poids en tonnes (pour factures transport)';
          COMMENT ON COLUMN lignes_documents.total_poids IS 'Poids total calculé (pour factures transport)';
          COMMENT ON COLUMN lignes_documents.frais_administratif IS 'Frais administratifs supplémentaires';
          COMMENT ON COLUMN lignes_documents.unite IS 'Unité de mesure (kg, m², h, etc.)';
        `
      },
      {
        name: '013_add_currency_field',
        sql: `
          -- Ajouter le champ monnaie à la table documents avec USD comme valeur par défaut
          ALTER TABLE documents ADD COLUMN IF NOT EXISTS monnaie VARCHAR(3) DEFAULT 'USD';
          
          -- Ajouter un commentaire pour documenter le champ
          COMMENT ON COLUMN documents.monnaie IS 'Code de la monnaie du document (USD, EUR, GBP, CAD, etc.)';
          
          -- Mise à jour des documents existants pour utiliser USD par défaut
          UPDATE documents SET monnaie = 'USD' WHERE monnaie IS NULL;
          
          -- Index pour améliorer les performances sur les requêtes par monnaie
          CREATE INDEX IF NOT EXISTS idx_documents_monnaie ON documents(monnaie);
        `
      }
      ,
      {
        name: '018_add_description_to_documents',
        sql: `
          -- Ajouter la colonne description si elle n'existe pas
          ALTER TABLE documents
            ADD COLUMN IF NOT EXISTS description TEXT;

          -- Copier les valeurs depuis notes si description est vide
          UPDATE documents
          SET description = notes
          WHERE description IS NULL AND notes IS NOT NULL;

          COMMENT ON COLUMN documents.description IS 'Description du document (copie depuis notes pour compatibilité)';
        `
      }
    ];

    // Exécuter chaque migration
    for (const migration of migrations) {
      const { rows } = await client.query(
        'SELECT 1 FROM migrations WHERE filename = $1',
        [migration.name]
      );

      if (rows.length === 0) {
        console.log(`Exécution de la migration: ${migration.name}`);
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [migration.name]
        );
        console.log(`✅ Migration ${migration.name} terminée`);
      } else {
        console.log(`⏭️  Migration ${migration.name} déjà exécutée`);
      }
    }

    console.log('🎉 Toutes les migrations ont été exécutées avec succès');

  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Début des migrations...');
    await createDatabase();
    await runMigrations();
    console.log('✅ Migrations terminées avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error);
    process.exit(1);
  }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
  main();
}

module.exports = { main, createDatabase, runMigrations };
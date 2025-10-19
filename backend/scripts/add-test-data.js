const db = require('../config/database');

async function addTestData() {
  try {
    console.log('Ajout de données de test à la facture 8...');
    
    // Ajouter une description à la facture 8
    await db.query('UPDATE documents SET description = $1 WHERE id = 8', 
      ['Facture de test avec prestations de développement et consultation.']);
    
    console.log('✅ Description ajoutée');
    
    // Ajouter quelques lignes de facture
    const lignes = [
      {
        document_id: 8,
        description: 'Développement web - Frontend React',
        quantite: 10,
        prix_unitaire: 800.00,
        taux_tva: 20,
        montant_ht: 8000.00,
        montant_tva: 1600.00,
        montant_ttc: 9600.00,
        ordre: 1
      },
      {
        document_id: 8,
        description: 'Développement web - Backend Node.js',
        quantite: 15,
        prix_unitaire: 750.00,
        taux_tva: 20,
        montant_ht: 11250.00,
        montant_tva: 2250.00,
        montant_ttc: 13500.00,
        ordre: 2
      },
      {
        document_id: 8,
        description: 'Consultation technique',
        quantite: 5,
        prix_unitaire: 900.00,
        taux_tva: 20,
        montant_ht: 4500.00,
        montant_tva: 900.00,
        montant_ttc: 5400.00,
        ordre: 3
      }
    ];
    
    console.log('Ajout des lignes de facture...');
    
    for (const ligne of lignes) {
      await db.query(`
        INSERT INTO lignes_documents 
        (document_id, description, quantite, prix_unitaire, taux_tva, montant_ht, montant_tva, montant_ttc, ordre)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        ligne.document_id, ligne.description, ligne.quantite, ligne.prix_unitaire,
        ligne.taux_tva, ligne.montant_ht, ligne.montant_tva, ligne.montant_ttc, ligne.ordre
      ]);
      console.log(`✅ Ligne ajoutée: ${ligne.description}`);
    }
    
    console.log('🎉 Toutes les données de test ont été ajoutées à la facture 8');
    
    // Vérifier le résultat
    const result = await db.query('SELECT description FROM documents WHERE id = 8');
    const lignesResult = await db.query('SELECT COUNT(*) as count FROM lignes_documents WHERE document_id = 8');
    
    console.log('\n📊 Vérification:');
    console.log('- Description:', result.rows[0]?.description ? 'Présente' : 'Manquante');
    console.log('- Nombre de lignes:', lignesResult.rows[0]?.count || 0);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error);
    process.exit(1);
  }
}

addTestData();
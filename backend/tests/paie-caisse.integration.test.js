const request = require('supertest');
const express = require('express');

describe('Intégration paie/caisse', () => {
  let app;
  let server;
  let paieRoutes;
  let caisseRoutes;

  beforeEach(() => {
    // Réinitialiser les opérations dans app.locals
    delete require.cache[require.resolve('../routes/paie')];
    delete require.cache[require.resolve('../routes/caisse')];
    paieRoutes = require('../routes/paie');
    caisseRoutes = require('../routes/caisse');
  app = express();
  app.use(express.json());
  app.use('/api/paie', paieRoutes);
  app.use('/api/caisse', caisseRoutes);
  app.locals.operations = [
      {
        id: 1,
        date: '2025-10-10',
        libelle: 'Achat carburant',
        type: 'sortie',
        categorie: 'Carburant',
        montant: -20000,
      },
      {
        id: 2,
        date: '2025-10-10',
        libelle: 'Entrée caisse',
        type: 'entree',
        categorie: 'Dépôt',
        montant: 100000,
      },
    ];
  });

  afterEach((done) => {
    delete require.cache[require.resolve('../routes/paie')];
    delete require.cache[require.resolve('../routes/caisse')];
    paieRoutes = undefined;
    caisseRoutes = undefined;
    if (server && server.close) {
      server.close(done);
    } else {
      done();
    }
  });

  it('ajout paie => sortie caisse', async () => {
    const paiement = {
      date: '2025-10-11',
      agent: 'Test Agent',
      montant: 12345,
      commentaire: 'Test salaire',
    };
    // Ajouter un paiement
    const res = await request(app)
      .post('/api/paie')
      .send(paiement)
      .expect(201);
    expect(res.body.agent).toBe('Test Agent');
    // Vérifier la caisse
    const caisseRes = await request(app)
      .get('/api/caisse')
      .expect(200);
    const sortie = caisseRes.body.find(o => o.libelle === 'Salaire Test Agent');
    expect(sortie).toBeDefined();
    expect(sortie.montant).toBe(-12345);
    expect(sortie.categorie).toBe('Salaire');
  });

  it('multi-paiements paie => multi-sorties caisse', async () => {
    const paiements = [
      { date: '2025-10-12', agent: 'Alice', montant: 10000, commentaire: 'Salaire' },
      { date: '2025-10-12', agent: 'Bob', montant: 20000, commentaire: 'Salaire' },
      { date: '2025-10-12', agent: 'Charlie', montant: 30000, commentaire: 'Salaire' },
    ];
    for (const paiement of paiements) {
      await request(app)
        .post('/api/paie')
        .send(paiement)
        .expect(201);
    }
    const caisseRes = await request(app)
      .get('/api/caisse')
      .expect(200);
    for (const paiement of paiements) {
      const sortie = caisseRes.body.find(o => o.libelle === `Salaire ${paiement.agent}`);
      expect(sortie).toBeDefined();
      expect(sortie.montant).toBe(-Math.abs(paiement.montant));
      expect(sortie.categorie).toBe('Salaire');
    }
    // Vérifier le nombre total de nouvelles sorties
    const sortiesSalaire = caisseRes.body.filter(o => o.date === '2025-10-12' && o.categorie === 'Salaire');
    expect(sortiesSalaire.length).toBe(3);
  });

  it('solde caisse après paiements de paie', async () => {
    // Solde initial
    let soldeRes = await request(app)
      .get('/api/caisse/solde')
      .expect(200);
    const soldeInitial = soldeRes.body.solde;

    // Ajouter deux paiements
    const paiements = [
      { date: '2025-10-13', agent: 'Diane', montant: 15000, commentaire: 'Salaire' },
      { date: '2025-10-13', agent: 'Eric', montant: 25000, commentaire: 'Salaire' },
    ];
    let totalSortie = 0;
    for (const paiement of paiements) {
      await request(app)
        .post('/api/paie')
        .send(paiement)
        .expect(201);
      totalSortie += paiement.montant;
    }

    // Solde après paiements
    soldeRes = await request(app)
      .get('/api/caisse/solde')
      .expect(200);
    const soldeFinal = soldeRes.body.solde;
    expect(soldeFinal).toBe(soldeInitial - totalSortie);
  });

  it('refuse paiement si champ obligatoire manquant ou invalide', async () => {
    // Manque agent
    let res = await request(app)
      .post('/api/paie')
      .send({ date: '2025-10-14', montant: 10000, commentaire: 'Salaire' })
      .expect(400);
    expect(res.body.error).toBeDefined();

    // Montant non numérique
    res = await request(app)
      .post('/api/paie')
      .send({ date: '2025-10-14', agent: 'Faux', montant: 'abc', commentaire: 'Salaire' })
      .expect(400);
    expect(res.body.error).toBeDefined();

    // Date manquante
    res = await request(app)
      .post('/api/paie')
      .send({ agent: 'Faux', montant: 10000, commentaire: 'Salaire' })
      .expect(400);
    expect(res.body.error).toBeDefined();
  });
});
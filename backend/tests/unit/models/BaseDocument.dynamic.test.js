const testHelpers = require('../../../utils/testHelpers');
const BaseDocument = require('../../../models/base/BaseDocument');

const testCases = [
  { table: 'factures', type: 'facture' },
  { table: 'devis', type: 'proforma' },
  { table: 'bons_livraison', type: 'livraison' },
  { table: 'bons_commande', type: 'commande' }
];

describe('BaseDocument - tests dynamiques par type', () => {
  testCases.forEach(({ table, type }) => {
    describe(`📄 ${table} (${type})`, () => {
      let model;

      beforeAll(() => {
        model = new BaseDocument(table, type);
      });

      it('should return at least one document', async () => {
        const docs = await model.searchDocuments({ limit: 3 });
        expect(Array.isArray(docs)).toBe(true);
        expect(docs.length).toBeGreaterThan(0);
      });

      it('should contain expected fields', async () => {
        const docs = await model.searchDocuments({ limit: 1 });
        const doc = docs[0];

        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('numero_facture');
        expect(doc).toHaveProperty('client_nom');
        expect(doc).toHaveProperty('entreprise_nom');
      });
    });
  });
});


afterAll(async () => {
  if (global.server && typeof global.server.close === 'function') {
    await new Promise((resolve) => global.server.close(resolve));
  }
});


beforeEach(() => {
  const testUser = testHelpers.createTestUser({ role: 'ADMIN' });
  const testClient = testHelpers.createTestClient();
  const testEntreprise = testHelpers.createTestEntreprise();
  const authToken = testHelpers.createTestToken(testUser.id, testUser.role);
});

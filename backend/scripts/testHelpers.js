// utils/testHelpers.js

module.exports = {
  createTestUser: ({ role = 'USER', id = 1, email = 'user@test.com' } = {}) => ({
    id,
    role,
    email,
    mot_de_passe: '$2b$10$hashedpassword',
    actif: true
  }),

  createTestClient: ({ id = 1, nom = 'Client Test', email = 'client@test.com', type = 'PARTICULIER' } = {}) => ({
    id,
    nom,
    email,
    type,
    telephone: '+243000000000'
  }),

  createTestEntreprise: ({ id = 1, nom = 'Entreprise Test' } = {}) => ({
    id,
    nom,
    nif: 'CD123456789',
    adresse: 'Kinshasa',
    email: 'entreprise@test.com'
  }),

  createTestToken: (id, role) => `mock-token-${id}-${role}`,

  createTestDocument: ({ id = 1, clientId = 1, statut = 'BROUILLON' } = {}) => ({
    id,
    client_id: clientId,
    statut,
    contenu: 'Document de test',
    date_creation: new Date().toISOString()
  })
};

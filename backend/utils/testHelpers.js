module.exports = {
  createTestUser: ({ role = 'USER', id = 1 } = {}) => ({ id, role, email: 'user@test.com' }),
  createTestClient: () => ({ id: 1, nom: 'Client Test', email: 'client@test.com' }),
  createTestEntreprise: () => ({ id: 1, nom: 'Entreprise Test' }),
  createTestToken: (id, role) => `mock-token-${id}-${role}`
};

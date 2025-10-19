/* global cy */
// Test end-to-end paie/caisse avec Cypress

describe('Paie et synchronisation caisse', () => {
  const agent = 'TestCypress';
  const montant = 12345;
  const date = new Date().toISOString().slice(0, 10);
  const commentaire = 'Salaire Cypress';

  it('Ajout d\'un paiement de paie et vérification dans la caisse', () => {
    // Aller sur la page paie
    cy.visit('/paie');

    // Remplir le formulaire
    cy.get('input[name="date"]').clear().type(date);
    cy.get('input[name="agent"]').clear().type(agent);
    cy.get('input[name="montant"]').clear().type(montant);
    cy.get('input[name="commentaire"]').clear().type(commentaire);
    cy.contains('Ajouter paiement').click();

    // Vérifier l'apparition dans l'historique paie
    cy.contains('Historique des paiements');
    cy.get('table').contains('td', agent).should('exist');
    cy.get('table').contains('td', commentaire).should('exist');
    cy.get('table').contains('td', montant.toLocaleString('fr-FR')).should('exist');

    // Aller sur la page caisse
    cy.visit('/caisse');
    cy.contains('Historique des opérations');
    cy.get('table').contains('td', `Salaire ${agent}`).should('exist');
    cy.get('table').contains('td', (-montant).toLocaleString('fr-FR')).should('exist');
  });
});

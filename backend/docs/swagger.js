const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

/**
 * Configuration Swagger/OpenAPI pour l'API Heraclion
 */

class SwaggerGenerator {
  constructor() {
    this.swaggerOptions = {
      definition: this.loadSwaggerBase(),
      apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../models/*.js'),
        path.join(__dirname, '../validators/*.js')
      ]
    };
  }

  /**
   * Charge la configuration de base Swagger
   */
  loadSwaggerBase() {
    const basePath = path.join(__dirname, 'swagger-base.json');
    const pathsFile = path.join(__dirname, 'swagger-paths.json');
    
    const baseConfig = JSON.parse(fs.readFileSync(basePath, 'utf8'));
    const pathsConfig = JSON.parse(fs.readFileSync(pathsFile, 'utf8'));
    
    return {
      ...baseConfig,
      ...pathsConfig
    };
  }

  /**
   * Génère la documentation Swagger complète
   */
  generateDocs() {
    const specs = swaggerJsdoc(this.swaggerOptions);
    
    // Ajout des paths personnalisés depuis les fichiers JSON
    const customPaths = this.loadCustomPaths();
    specs.paths = { ...specs.paths, ...customPaths };
    
    return specs;
  }

  /**
   * Charge les paths personnalisés depuis les fichiers JSON
   */
  loadCustomPaths() {
    try {
      const pathsFile = path.join(__dirname, 'swagger-paths.json');
      const pathsData = JSON.parse(fs.readFileSync(pathsFile, 'utf8'));
      return pathsData.paths || {};
    } catch (error) {
      console.warn('Could not load custom paths:', error.message);
      return {};
    }
  }

  /**
   * Génère la configuration Swagger UI
   */
  getSwaggerUiOptions() {
    return {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'none',
        defaultModelExpandDepth: 2,
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #3b82f6; }
        .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 5px; }
        .swagger-ui .info .description { margin: 20px 0; }
        .swagger-ui .info .description p { margin: 10px 0; }
      `,
      customSiteTitle: 'Heraclion API Documentation',
      customfavIcon: '/favicon.ico'
    };
  }

  /**
   * Middleware pour servir la documentation
   */
  getMiddleware() {
    const specs = this.generateDocs();
    const options = this.getSwaggerUiOptions();
    
    return {
      serve: swaggerUi.serve,
      setup: swaggerUi.setup(specs, options)
    };
  }

  /**
   * Génère et sauvegarde la documentation en format JSON
   */
  exportToFile(outputPath = null) {
    const specs = this.generateDocs();
    const defaultPath = path.join(__dirname, 'swagger-complete.json');
    const filePath = outputPath || defaultPath;
    
    fs.writeFileSync(filePath, JSON.stringify(specs, null, 2), 'utf8');
    console.log(`Swagger documentation exported to: ${filePath}`);
    
    return filePath;
  }

  /**
   * Valide la documentation Swagger
   */
  validateDocs() {
    try {
      const specs = this.generateDocs();
      
      // Validations de base
      const errors = [];
      
      if (!specs.info || !specs.info.title) {
        errors.push('Missing API title');
      }
      
      if (!specs.info || !specs.info.version) {
        errors.push('Missing API version');
      }
      
      if (!specs.paths || Object.keys(specs.paths).length === 0) {
        errors.push('No API paths defined');
      }
      
      // Validation des chemins
      Object.keys(specs.paths || {}).forEach(path => {
        const pathItem = specs.paths[path];
        Object.keys(pathItem).forEach(method => {
          const operation = pathItem[method];
          
          if (!operation.summary) {
            errors.push(`Missing summary for ${method.toUpperCase()} ${path}`);
          }
          
          if (!operation.responses) {
            errors.push(`Missing responses for ${method.toUpperCase()} ${path}`);
          }
          
          if (!operation.tags || operation.tags.length === 0) {
            errors.push(`Missing tags for ${method.toUpperCase()} ${path}`);
          }
        });
      });
      
      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Ajoute des exemples personnalisés aux schémas
   */
  addCustomExamples() {
    const examples = {
      Document: {
        id: 1,
        numero: "FAC-2024-001",
        type_document: "FACTURE",
        client_id: 1,
        entreprise_id: 1,
        date_emission: "2024-01-15",
        date_echeance: "2024-02-15",
        statut: "EMISE",
        sous_total: 1000.00,
        montant_tva: 200.00,
        total_ttc: 1200.00,
        items: [
          {
            id: 1,
            description: "Service de transport Paris-Lyon",
            quantite: 1,
            prix_unitaire: 1000.00,
            taux_tva: 20,
            montant_ht: 1000.00,
            montant_tva: 200.00,
            montant_ttc: 1200.00
          }
        ],
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      },
      Client: {
        id: 1,
        nom: "SARL Durand",
        contact_principal: "Jean Durand",
        email: "contact@durand.com",
        telephone: "01 23 45 67 89",
        adresse: "123 Rue de la Paix",
        code_postal: "75001",
        ville: "Paris",
        pays: "France",
        siret: "12345678901234",
        numero_tva: "FR12345678901",
        delai_paiement: 30,
        actif: true,
        entreprise_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      }
    };
    
    return examples;
  }

  /**
   * Génère des tests d'API basés sur la documentation
   */
  generateApiTests() {
    const specs = this.generateDocs();
    const tests = [];
    
    Object.keys(specs.paths || {}).forEach(path => {
      const pathItem = specs.paths[path];
      Object.keys(pathItem).forEach(method => {
        const operation = pathItem[method];
        
        const test = {
          name: `${method.toUpperCase()} ${path}`,
          method: method.toUpperCase(),
          path: path,
          description: operation.summary || operation.description,
          expectedStatus: this.getExpectedStatus(method, operation),
          requiresAuth: this.requiresAuthentication(operation),
          tags: operation.tags || []
        };
        
        tests.push(test);
      });
    });
    
    return tests;
  }

  /**
   * Détermine le statut de réponse attendu
   */
  getExpectedStatus(method, operation) {
    if (operation.responses) {
      const successCodes = Object.keys(operation.responses).filter(code => 
        code.startsWith('2')
      );
      
      if (successCodes.length > 0) {
        return parseInt(successCodes[0]);
      }
    }
    
    // Valeurs par défaut selon la méthode
    switch (method.toLowerCase()) {
      case 'post': return 201;
      case 'put': 
      case 'patch': 
      case 'delete': 
      case 'get': return 200;
      default: return 200;
    }
  }

  /**
   * Vérifie si l'endpoint nécessite une authentification
   */
  requiresAuthentication(operation) {
    if (operation.security && operation.security.length > 0) {
      return true;
    }
    
    // Par défaut, tous les endpoints nécessitent une auth sauf indication contraire
    return operation.security !== false;
  }
}

// Instance singleton
const swaggerGenerator = new SwaggerGenerator();

module.exports = {
  SwaggerGenerator,
  swaggerGenerator,
  
  // Méthodes de convenance
  generateDocs: () => swaggerGenerator.generateDocs(),
  getMiddleware: () => swaggerGenerator.getMiddleware(),
  exportToFile: (path) => swaggerGenerator.exportToFile(path),
  validateDocs: () => swaggerGenerator.validateDocs(),
  generateApiTests: () => swaggerGenerator.generateApiTests()
};
require('dotenv').config({ path: '.env.test' });

// Configuration globale pour les timeouts
jest.setTimeout(30000);

// Nettoyage des mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

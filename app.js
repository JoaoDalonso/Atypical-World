/**
 * @fileoverview Main Application Entry Point
 * Inicializa a aplicação Atypical World após o carregamento completo do DOM.
 */

import { AppController } from './controllers/AppController.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});

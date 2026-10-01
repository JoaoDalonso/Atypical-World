/**
 * @fileoverview Directory Controller
 * Orquestra a filtragem por categoria dos serviços e contatos de Rio Claro.
 */

import { DirectoryView } from '../ui/views/DirectoryView.js';

export class DirectoryController {
  constructor() {
    this.directoryView = new DirectoryView();
  }

  /**
   * Inicializa os filtros do diretório.
   */
  init() {
    this.directoryView.init();
  }
}

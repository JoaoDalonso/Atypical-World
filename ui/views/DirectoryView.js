/**
 * @fileoverview Directory View
 * Controla os filtros de especialidades do diretório de serviços de Rio Claro.
 */

import { BaseView } from './BaseView.js';

export class DirectoryView extends BaseView {
  constructor() {
    super();
    this.filterButtons = this.$$('.filter');
    this.directoryCards = this.$$('.directory-card');
  }

  /**
   * Inicializa os botões de filtro.
   */
  init() {
    this.filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.setActiveFilter(button);
      });
    });
  }

  /**
   * Aplica a categoria selecionada aos cards do diretório.
   * @param {HTMLElement} selectedButton
   */
  setActiveFilter(selectedButton) {
    this.filterButtons.forEach(btn => btn.classList.remove('active'));
    selectedButton.classList.add('active');

    const selectedType = selectedButton.dataset.filter || 'todos';

    this.directoryCards.forEach(card => {
      const cardType = card.dataset.type;
      const isVisible = selectedType === 'todos' || cardType === selectedType;
      card.hidden = !isVisible;
    });
  }
}

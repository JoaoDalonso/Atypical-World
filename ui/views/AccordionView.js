/**
 * @fileoverview Accordion View
 * Controla o comportamento de expandir e recolher acordeões nas seções sobre TEA e FAQ.
 */

import { BaseView } from './BaseView.js';

export class AccordionView extends BaseView {
  /**
   * Inicializa os ouvintes de clique em todos os botões de acordeão.
   */
  init() {
    const buttons = this.$$('.item button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const parentItem = button.closest('.item');
        if (!parentItem) return;

        const isOpen = parentItem.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }
}

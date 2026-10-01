/**
 * @fileoverview Base View
 * Classe base para todos os componentes de visualização da UI.
 * Centraliza helpers de consulta no DOM e sanitização.
 */

import { Sanitizer } from '../../utils/Sanitizer.js';

export class BaseView {
  /**
   * Helper para buscar um elemento no DOM.
   * @param {string} selector
   * @param {ParentNode} [context=document]
   * @returns {HTMLElement | null}
   */
  $(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Helper para buscar múltiplos elementos no DOM.
   * @param {string} selector
   * @param {ParentNode} [context=document]
   * @returns {Array<HTMLElement>}
   */
  $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  /**
   * Helper para sanitizar strings antes de renderizar no HTML.
   * @param {*} value
   * @returns {string}
   */
  escape(value) {
    return Sanitizer.escapeHTML(value);
  }
}

/**
 * @fileoverview Search View
 * Controla o campo de busca rápida e a renderização dos tópicos encontrados.
 */

import { BaseView } from './BaseView.js';

export class SearchView extends BaseView {
  constructor() {
    super();
    this.searchInput = this.$('#search');
    this.resultsContainer = this.$('#results');
  }

  /**
   * Registra a função de callback executada a cada caractere digitado.
   * @param {function(string): void} onSearchQuery
   */
  bindSearch(onSearchQuery) {
    if (!this.searchInput) return;

    this.searchInput.addEventListener('input', () => {
      const query = this.searchInput.value.trim();
      onSearchQuery(query);
    });
  }

  /**
   * Renderiza a lista de tópicos encontrados ou mensagem de resultado não encontrado.
   * @param {Array<import('../../models/SearchTopic.js').SearchTopic>} matches
   * @param {boolean} hasQuery - Se há texto digitado no campo
   */
  renderResults(matches, hasQuery) {
    if (!this.resultsContainer) return;

    if (!hasQuery) {
      this.resultsContainer.innerHTML = '';
      return;
    }

    if (!matches.length) {
      this.resultsContainer.innerHTML = 'Nenhum resultado encontrado. Tente outra palavra.';
      return;
    }

    const html = matches
      .map(
        topic =>
          `<a href="${this.escape(topic.anchor)}"><b>${this.escape(topic.title)}</b></a>`
      )
      .join(' · ');

    this.resultsContainer.innerHTML = html;
  }
}

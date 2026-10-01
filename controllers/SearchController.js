/**
 * @fileoverview Search Controller
 * Gerencia a pesquisa em tempo real, filtrando o catálogo de tópicos e enviando os resultados para a View.
 */

import { SearchTopic } from '../models/SearchTopic.js';
import { SearchView } from '../ui/views/SearchView.js';

export class SearchController {
  /**
   * @param {Array<SearchTopic>} [topics] - Lista opcional de tópicos (se omitido, usa catálogo padrão)
   */
  constructor(topics = null) {
    this.topics = topics || SearchTopic.getDefaultCatalog();
    this.searchView = new SearchView();
  }

  /**
   * Inicializa o ouvinte de busca na View.
   */
  init() {
    this.searchView.bindSearch(query => this.handleSearch(query));
  }

  /**
   * Processa a consulta do usuário e atualiza a View com os tópicos correspondentes.
   * @param {string} query
   */
  handleSearch(query) {
    if (!query) {
      this.searchView.renderResults([], false);
      return;
    }

    const matches = this.topics.filter(topic => topic.matches(query));
    this.searchView.renderResults(matches, true);
  }
}

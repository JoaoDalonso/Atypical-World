/**
 * @fileoverview SearchTopic Model
 * Representa um tópico indexado para a pesquisa em tempo real do Atypical World.
 */

export class SearchTopic {
  /**
   * @param {string} title - Título visível do tópico
   * @param {string} anchor - Âncora de destino (ex: '#tea')
   * @param {string} keywords - Palavras-chave associadas
   */
  constructor(title, anchor, keywords) {
    this.title = title;
    this.anchor = anchor;
    this.keywords = keywords;
  }

  /**
   * Verifica se o tópico corresponde à consulta digitada pelo usuário.
   * @param {string} query - Termo pesquisado
   * @returns {boolean}
   */
  matches(query) {
    if (!query) return false;
    const normalizedQuery = query.trim().toLowerCase();
    const searchableText = `${this.title} ${this.keywords}`.toLowerCase();
    return searchableText.includes(normalizedQuery);
  }

  /**
   * Retorna o catálogo padrão de seções e tópicos pesquisáveis.
   * @returns {Array<SearchTopic>}
   */
  static getDefaultCatalog() {
    return [
      new SearchTopic('Sobre o TEA', '#tea', 'autismo diagnóstico características suporte meninas adultos'),
      new SearchTopic('Direitos e benefícios', '#direitos', 'BPC LOAS CIPTEA escola transporte direitos auxílio inclusão'),
      new SearchTopic('Saúde mental dos pais', '#saude', 'cansaço culpa ansiedade autocuidado apoio família'),
      new SearchTopic('Redes de apoio', '#apoio', 'Rio Claro serviços instituições contatos eventos'),
      new SearchTopic('Contatos da região', '#contatos', 'UBS CAPS APAE psicologia fono neurologia'),
      new SearchTopic('Dúvidas frequentes', '#faq', 'vacina fala cura escola TDAH crise sensorial telas'),
      new SearchTopic('Escuta Ativa', '#escuta', 'desabafar relatos comentários comunidade curtir')
    ];
  }
}

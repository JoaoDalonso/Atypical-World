/**
 * @fileoverview Sanitizer Utility
 * Fornece métodos de sanitização de texto e prevenção de vulnerabilidades XSS (Cross-Site Scripting).
 * Segue os princípios de Clean Code com métodos puros e responsabilidade única.
 */

export class Sanitizer {
  /**
   * Converte caracteres perigosos em entidades HTML seguras.
   * @param {*} value - Valor de entrada que será sanitizado.
   * @returns {string} Texto seguro para injeção no DOM.
   */
  static escapeHTML(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return String(value).replace(/[&<>"']/g, match => htmlEntities[match]);
  }

  /**
   * Remove espaços extras no início e fim do texto.
   * @param {string} text - Texto bruto.
   * @returns {string} Texto limpo.
   */
  static cleanText(text) {
    if (typeof text !== 'string') {
      return '';
    }
    return text.trim();
  }

  /**
   * Formata uma data ISO para o formato brasileiro (dd/mm/aaaa).
   * @param {string} isoString - Data em formato ISO.
   * @returns {string} Data formatada ou vazia se inválida.
   */
  static formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }
}

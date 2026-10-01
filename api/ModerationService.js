/**
 * @fileoverview Moderation Service
 * Detecta dados de identificação pessoal (PII - Personally Identifiable Information)
 * para manter o anonimato e a segurança da comunidade na Escuta Ativa.
 */

export class ModerationService {
  /**
   * Avalia um texto para encontrar possíveis telefones, e-mails, documentos (CPF/RG) e endereços.
   * @param {string} text - Conteúdo a ser inspecionado
   * @returns {Array<string>} Lista de sinalizações encontradas
   */
  static detectPIIFlags(text) {
    const raw = String(text || '');
    const flags = [];

    // Padrões de telefone brasileiro (com ou sem DDD / código de país)
    const phonePattern = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/;
    if (phonePattern.test(raw)) {
      flags.push('possível telefone');
    }

    // Padrões de e-mail
    const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    if (emailPattern.test(raw)) {
      flags.push('possível e-mail');
    }

    // Padrões de documentos (CPF, RG)
    const documentPattern = /(?:CPF|RG)\s*[:\-]?\s*\d|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/i;
    if (documentPattern.test(raw)) {
      flags.push('possível documento');
    }

    // Padrões de endereços físicos (rua, avenida, bairro, etc)
    const addressPattern = /(?:rua|r\.|avenida|av\.|alameda|travessa|nº|numero|número|bairro|cep)\s+[A-Za-z0-9]/i;
    if (addressPattern.test(raw)) {
      flags.push('possível endereço');
    }

    return flags;
  }

  /**
   * Verifica se o texto possui alguma informação pessoal sensível.
   * @param {string} text
   * @returns {boolean}
   */
  static containsPII(text) {
    return this.detectPIIFlags(text).length > 0;
  }

  /**
   * Retorna mensagem amigável de alerta para o usuário.
   * @param {Array<string>} flags - Sinalizações detectadas
   * @returns {string}
   */
  static getWarningMessage(flags = []) {
    if (!flags.length) return '';
    return `⚠️ Antes de enviar, retire informações pessoais como ${flags.join(', ')}.`;
  }
}

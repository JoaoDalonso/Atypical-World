/**
 * @fileoverview Comment Model
 * Representa um comentário anônimo dentro de um relato na comunidade Escuta Ativa.
 */

import { Sanitizer } from '../utils/Sanitizer.js';

export class Comment {
  /**
   * @param {Object} params
   * @param {string} [params.id=''] - Identificador único do comentário
   * @param {string} [params.postId=''] - Identificador do relato pai
   * @param {string} [params.userId=''] - Identificador do autor
   * @param {string} [params.author='Relato anônimo'] - Rótulo de exibição do autor
   * @param {string} params.body - Texto do comentário
   * @param {('pending'|'approved'|'rejected')} [params.status='pending'] - Estado de moderação
   * @param {string} [params.createdAt] - Data de criação em formato ISO
   */
  constructor({
    id = '',
    postId = '',
    userId = '',
    author = 'Relato anônimo',
    body = '',
    status = 'pending',
    createdAt = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.postId = postId;
    this.userId = userId;
    this.author = author;
    this.body = Sanitizer.cleanText(body);
    this.status = status;
    this.createdAt = createdAt;
  }

  /**
   * Valida se os campos do comentário atendem aos limites do sistema.
   * @returns {{ isValid: boolean, error?: string }}
   */
  validate() {
    if (!this.body || this.body.length < 1) {
      return { isValid: false, error: 'O comentário não pode ficar vazio.' };
    }
    if (this.body.length > 300) {
      return { isValid: false, error: 'O comentário deve ter no máximo 300 caracteres.' };
    }
    return { isValid: true };
  }

  /**
   * Cria uma instância de Comment a partir de um registro do Supabase / Banco de dados.
   * @param {Object} row - Linha vinda da tabela 'comments'
   * @returns {Comment}
   */
  static fromDatabase(row) {
    return new Comment({
      id: row.id,
      postId: row.post_id || row.postId,
      userId: row.user_id || row.userId,
      body: row.body,
      author: 'Relato anônimo',
      status: row.status || 'approved',
      createdAt: row.created_at || row.createdAt
    });
  }

  /**
   * Converte a instância para o formato esperado para inserção no banco de dados.
   * @returns {Object}
   */
  toPayload() {
    return {
      post_id: this.postId,
      user_id: this.userId,
      body: this.body,
      status: this.status
    };
  }
}

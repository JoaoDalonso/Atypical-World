/**
 * @fileoverview Post Model
 * Representa um relato na comunidade Escuta Ativa, contendo título, categoria,
 * conteúdo, contagem de curtidas, comentários associados e resposta oficial da equipe.
 */

import { Sanitizer } from '../utils/Sanitizer.js';
import { Comment } from './Comment.js';

export class Post {
  /**
   * @param {Object} params
   * @param {string} [params.id=''] - Identificador único
   * @param {string} [params.userId=''] - Identificador do autor
   * @param {string} params.category - Categoria (ex: 'Quero desabafar')
   * @param {string} params.title - Título do relato
   * @param {string} params.body - Texto completo do relato
   * @param {number} [params.likes=0] - Quantidade de curtidas
   * @param {boolean} [params.isLiked=false] - Se o usuário ativo curtiu este relato
   * @param {Array<Comment>} [params.comments=[]] - Lista de comentários aprovados
   * @param {string} [params.adminReply=''] - Resposta oficial da equipe Atypical World
   * @param {('pending'|'approved'|'rejected')} [params.status='pending'] - Estado de moderação
   * @param {string} [params.createdAt] - Data de envio
   * @param {string} [params.publishedAt] - Data de aprovação/publicação
   */
  constructor({
    id = '',
    userId = '',
    category = '',
    title = '',
    body = '',
    likes = 0,
    isLiked = false,
    comments = [],
    adminReply = '',
    status = 'pending',
    createdAt = new Date().toISOString(),
    publishedAt = null
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.category = Sanitizer.cleanText(category);
    this.title = Sanitizer.cleanText(title);
    this.body = Sanitizer.cleanText(body);
    this.likes = Math.max(0, Number(likes) || 0);
    this.isLiked = Boolean(isLiked);
    this.comments = Array.isArray(comments) ? comments : [];
    this.adminReply = Sanitizer.cleanText(adminReply);
    this.status = status;
    this.createdAt = createdAt;
    this.publishedAt = publishedAt;
  }

  /**
   * Retorna a categoria formatada em maiúsculas sem o prefixo 'Quero'.
   * Exemplo: 'Quero desabafar' -> 'DESABAFAR'
   * @returns {string}
   */
  getCategoryLabel() {
    return this.category.replace(/^Quero\s+/i, '').toUpperCase();
  }

  /**
   * Valida se os dados do relato estão corretos antes do envio.
   * @returns {{ isValid: boolean, error?: string }}
   */
  validate() {
    if (!this.category) {
      return { isValid: false, error: 'Por favor, selecione uma categoria para o relato.' };
    }
    if (!this.title || this.title.length < 1) {
      return { isValid: false, error: 'Por favor, informe um título para o relato.' };
    }
    if (this.title.length > 90) {
      return { isValid: false, error: 'O título deve ter no máximo 90 caracteres.' };
    }
    if (!this.body || this.body.length < 10) {
      return { isValid: false, error: 'O relato deve conter pelo menos 10 caracteres.' };
    }
    if (this.body.length > 1500) {
      return { isValid: false, error: 'O relato deve ter no máximo 1500 caracteres.' };
    }
    return { isValid: true };
  }

  /**
   * Constrói uma instância de Post a partir de uma linha retornada pelo Supabase.
   * @param {Object} row - Registro da tabela 'posts'
   * @param {Object} [options]
   * @param {number} [options.likesCount=0]
   * @param {boolean} [options.isLiked=false]
   * @param {Array<Comment>} [options.comments=[]]
   * @returns {Post}
   */
  static fromDatabase(row, { likesCount = 0, isLiked = false, comments = [] } = {}) {
    return new Post({
      id: row.id,
      userId: row.user_id,
      category: row.category,
      title: row.title,
      body: row.body,
      likes: likesCount,
      isLiked: isLiked,
      comments: comments,
      adminReply: row.admin_reply || '',
      status: row.status || 'approved',
      createdAt: row.created_at,
      publishedAt: row.published_at
    });
  }

  /**
   * Converte a instância para o formato esperado para inserção no banco.
   * @returns {Object}
   */
  toPayload() {
    return {
      user_id: this.userId,
      category: this.category,
      title: this.title,
      body: this.body,
      status: this.status
    };
  }
}

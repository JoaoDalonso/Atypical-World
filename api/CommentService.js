/**
 * @fileoverview Comment Service
 * Responsável por envio, listagem e moderação de comentários em relatos.
 */

import { SupabaseClient } from './SupabaseClient.js';
import { Comment } from '../models/Comment.js';
import { Storage } from '../utils/Storage.js';

export class CommentService {
  /**
   * Envia um comentário para a moderação.
   * @param {Object} params
   * @param {string} params.postId
   * @param {string} params.body
   * @param {string} params.userId
   * @returns {Promise<{ success: boolean, error?: string, isDemo?: boolean }>}
   */
  async submitComment({ postId, body, userId }) {
    const comment = new Comment({ postId, body, userId, status: 'pending' });
    const validation = comment.validate();
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const client = SupabaseClient.getInstance();
    if (!client) {
      const posts = Storage.getPosts();
      const target = posts.find(p => p.id === postId);
      if (target) {
        target.comments.push(
          new Comment({
            id: `c-demo-${Date.now()}`,
            postId,
            body,
            status: 'pending'
          })
        );
        Storage.savePosts(posts);
      }
      return { success: true, isDemo: true };
    }

    try {
      const { error } = await client.from('comments').insert(comment.toPayload());
      if (error) {
        console.error('[CommentService] Erro ao enviar comentário:', error);
        return { success: false, error: 'Não foi possível enviar o comentário. Tente novamente.' };
      }
      return { success: true, isDemo: false };
    } catch (err) {
      console.error('[CommentService] Exceção ao enviar comentário:', err);
      return { success: false, error: 'Erro de conexão ao enviar comentário.' };
    }
  }

  /**
   * Carrega comentários pendentes para revisão no painel de moderação.
   * @param {Array<string>} postIds
   * @returns {Promise<Array<Comment>>}
   */
  async fetchAdminCommentsQueue(postIds = []) {
    const client = SupabaseClient.getInstance();

    if (!client) {
      const posts = Storage.getPosts();
      const allComments = [];
      posts.forEach(p => {
        (p.comments || []).forEach(c => allComments.push(c));
      });
      return allComments;
    }

    if (!postIds.length) {
      return [];
    }

    try {
      const { data, error } = await client
        .from('comments')
        .select('id,post_id,user_id,body,status,created_at')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('[CommentService] Erro ao buscar comentários na moderação:', error);
        return [];
      }

      return data.map(r => Comment.fromDatabase(r));
    } catch (err) {
      console.error('[CommentService] Exceção ao carregar fila de comentários:', err);
      return [];
    }
  }

  /**
   * Aprova um comentário na moderação.
   * @param {string} commentId
   * @returns {Promise<{ success: boolean }>}
   */
  async approveComment(commentId) {
    const client = SupabaseClient.getInstance();

    if (!client) {
      const posts = Storage.getPosts();
      posts.forEach(p => {
        const c = p.comments.find(item => item.id === commentId);
        if (c) c.status = 'approved';
      });
      Storage.savePosts(posts);
      return { success: true };
    }

    try {
      const { error } = await client
        .from('comments')
        .update({ status: 'approved' })
        .eq('id', commentId);

      return { success: !error };
    } catch (err) {
      console.error('[CommentService] Erro ao aprovar comentário:', err);
      return { success: false };
    }
  }

  /**
   * Recusa um comentário na moderação.
   * @param {string} commentId
   * @returns {Promise<{ success: boolean }>}
   */
  async rejectComment(commentId) {
    const client = SupabaseClient.getInstance();

    if (!client) {
      const posts = Storage.getPosts();
      posts.forEach(p => {
        const c = p.comments.find(item => item.id === commentId);
        if (c) c.status = 'rejected';
      });
      Storage.savePosts(posts);
      return { success: true };
    }

    try {
      const { error } = await client
        .from('comments')
        .update({ status: 'rejected' })
        .eq('id', commentId);

      return { success: !error };
    } catch (err) {
      console.error('[CommentService] Erro ao recusar comentário:', err);
      return { success: false };
    }
  }
}

/**
 * @fileoverview Post Service
 * Responsável por operações de busca, criação, curtidas e moderação de relatos da comunidade.
 */

import { SupabaseClient } from './SupabaseClient.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Storage } from '../utils/Storage.js';

export class PostService {
  /**
   * Busca os relatos aprovados para exibição pública na comunidade.
   * @param {string} [currentUserId] - ID do visitante atual para saber se curtiu cada relato
   * @returns {Promise<Array<Post>>}
   */
  async fetchApprovedPosts(currentUserId = null) {
    const client = SupabaseClient.getInstance();

    // Fallback para modo de demonstração quando o Supabase não estiver conectado
    if (!client) {
      const allPosts = Storage.getPosts();
      const likedIds = Storage.getLikedPostIds();
      return allPosts
        .filter(p => p.status === 'approved')
        .map(p => {
          p.isLiked = likedIds.has(p.id);
          return p;
        });
    }

    try {
      const { data: rows, error } = await client
        .from('posts')
        .select('id,category,title,body,admin_reply,created_at,published_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error || !rows) {
        console.error('[PostService] Erro ao buscar relatos:', error);
        return Storage.getPosts().filter(p => p.status === 'approved');
      }

      const postIds = rows.map(r => r.id);
      if (!postIds.length) {
        return [];
      }

      // Busca comentários aprovados vinculados a esses relatos
      let commentsList = [];
      const { data: commentsData } = await client
        .from('comments')
        .select('id,post_id,body,created_at')
        .in('post_id', postIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (commentsData) {
        commentsList = commentsData;
      }

      // Busca contagem de curtidas via função RPC pública
      const likeCounts = {};
      const { data: countsData } = await client.rpc('public_like_counts', {
        post_ids: postIds
      });

      if (countsData) {
        countsData.forEach(item => {
          likeCounts[item.post_id] = Number(item.like_count) || 0;
        });
      }

      // Identifica quais relatos o usuário atual curtiu
      const userLikes = new Set();
      if (currentUserId) {
        const { data: myLikesData } = await client
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        if (myLikesData) {
          myLikesData.forEach(item => userLikes.add(item.post_id));
        }
      }

      return rows.map(row => {
        const postComments = commentsList
          .filter(c => c.post_id === row.id)
          .map(c => Comment.fromDatabase(c));

        return Post.fromDatabase(row, {
          likesCount: likeCounts[row.id] || 0,
          isLiked: userLikes.has(row.id),
          comments: postComments
        });
      });
    } catch (err) {
      console.error('[PostService] Exceção ao buscar relatos aprovados:', err);
      return Storage.getPosts().filter(p => p.status === 'approved');
    }
  }

  /**
   * Envia um novo relato para a fila de moderação.
   * @param {Object} params
   * @param {string} params.category
   * @param {string} params.title
   * @param {string} params.body
   * @param {string} params.userId
   * @returns {Promise<{ success: boolean, error?: string, isDemo?: boolean }>}
   */
  async submitPost({ category, title, body, userId }) {
    const post = new Post({ category, title, body, userId, status: 'pending' });
    const validation = post.validate();
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const client = SupabaseClient.getInstance();
    if (!client) {
      const posts = Storage.getPosts();
      posts.unshift(
        new Post({
          id: `demo-${Date.now()}`,
          category,
          title,
          body,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      );
      Storage.savePosts(posts);
      return { success: true, isDemo: true };
    }

    try {
      const { error } = await client.from('posts').insert(post.toPayload());
      if (error) {
        console.error('[PostService] Erro ao inserir relato:', error);
        return { success: false, error: 'Não foi possível enviar agora. Tente novamente.' };
      }
      return { success: true, isDemo: false };
    } catch (err) {
      console.error('[PostService] Exceção ao enviar relato:', err);
      return { success: false, error: 'Erro de conexão ao enviar relato.' };
    }
  }

  /**
   * Alterna a curtida (curtir / descurtir) em um relato.
   * @param {string} postId
   * @param {string} userId
   * @param {boolean} isCurrentlyLiked
   * @returns {Promise<{ success: boolean }>}
   */
  async toggleLike(postId, userId, isCurrentlyLiked) {
    const client = SupabaseClient.getInstance();

    if (!client) {
      const likedIds = Storage.getLikedPostIds();
      const posts = Storage.getPosts();
      const target = posts.find(p => p.id === postId);

      if (likedIds.has(postId)) {
        likedIds.delete(postId);
        if (target) target.likes = Math.max(0, target.likes - 1);
      } else {
        likedIds.add(postId);
        if (target) target.likes += 1;
      }

      Storage.saveLikedPostIds(likedIds);
      Storage.savePosts(posts);
      return { success: true };
    }

    try {
      if (isCurrentlyLiked) {
        await client.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await client.from('likes').insert({ post_id: postId, user_id: userId });
      }
      return { success: true };
    } catch (err) {
      console.error('[PostService] Exceção ao curtir:', err);
      return { success: false };
    }
  }

  /**
   * Carrega todos os relatos para visualização no painel administrativo.
   * @returns {Promise<Array<Post>>}
   */
  async fetchAdminPostsQueue() {
    const client = SupabaseClient.getInstance();
    if (!client) {
      return Storage.getPosts();
    }

    try {
      const { data, error } = await client
        .from('posts')
        .select('id,user_id,category,title,body,status,admin_reply,created_at,published_at')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('[PostService] Erro ao carregar fila de moderação:', error);
        return [];
      }

      return data.map(r => Post.fromDatabase(r));
    } catch (err) {
      console.error('[PostService] Exceção na moderação:', err);
      return [];
    }
  }

  /**
   * Aprova um relato na moderação, podendo anexar uma resposta oficial.
   * @param {string} postId
   * @param {string} [adminReply='']
   * @returns {Promise<{ success: boolean }>}
   */
  async approvePost(postId, adminReply = '') {
    const client = SupabaseClient.getInstance();

    if (!client) {
      const posts = Storage.getPosts();
      const target = posts.find(p => p.id === postId);
      if (target) {
        target.status = 'approved';
        target.adminReply = adminReply.trim();
        target.publishedAt = new Date().toISOString();
        Storage.savePosts(posts);
      }
      return { success: true };
    }

    try {
      const { error } = await client
        .from('posts')
        .update({
          status: 'approved',
          admin_reply: adminReply.trim() || null,
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

      return { success: !error };
    } catch (err) {
      console.error('[PostService] Erro ao aprovar relato:', err);
      return { success: false };
    }
  }

  /**
   * Recusa um relato na moderação.
   * @param {string} postId
   * @returns {Promise<{ success: boolean }>}
   */
  async rejectPost(postId) {
    const client = SupabaseClient.getInstance();

    if (!client) {
      const posts = Storage.getPosts();
      const target = posts.find(p => p.id === postId);
      if (target) {
        target.status = 'rejected';
        Storage.savePosts(posts);
      }
      return { success: true };
    }

    try {
      const { error } = await client
        .from('posts')
        .update({ status: 'rejected' })
        .eq('id', postId);

      return { success: !error };
    } catch (err) {
      console.error('[PostService] Erro ao recusar relato:', err);
      return { success: false };
    }
  }
}

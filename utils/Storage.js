/**
 * @fileoverview Storage Adapter
 * Responsável pela persistência em localStorage para quando o backend Supabase não estiver configurado.
 * Garante que a aplicação funcione em modo de demonstração local sem quebrar.
 */

import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';

const STORAGE_KEY_POSTS = 'atypical_demo_posts';
const STORAGE_KEY_LIKES = 'atypical_demo_likes';

export class Storage {
  /**
   * Retorna os relatos iniciais de demonstração.
   * @returns {Array<Post>}
   */
  static getSeedPosts() {
    return [
      new Post({
        id: 'demo-1',
        category: 'Quero compartilhar uma experiência',
        title: 'Um passo de cada vez',
        body: 'Hoje foi um dia cansativo, mas também teve uma pequena conquista que eu queria dividir com outras famílias.',
        likes: 18,
        isLiked: false,
        comments: [
          new Comment({
            id: 'c-demo-1',
            postId: 'demo-1',
            body: 'Obrigada por compartilhar. Também tento lembrar das pequenas conquistas.',
            author: 'Relato anônimo',
            status: 'approved'
          })
        ],
        adminReply: 'Você não precisa resolver tudo de uma vez. Obrigada por dividir esse momento com a comunidade. 💙',
        status: 'approved',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }),
      new Post({
        id: 'demo-2',
        category: 'Quero desabafar',
        title: 'Eu precisava colocar isso para fora',
        body: 'Às vezes a rotina pesa e eu só queria encontrar um espaço onde outras famílias entendessem sem julgamentos.',
        likes: 9,
        isLiked: false,
        comments: [],
        adminReply: 'Estamos felizes que você encontrou este espaço. Sua experiência importa. 💙',
        status: 'approved',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      })
    ];
  }

  /**
   * Obtém a lista de relatos gravados localmente ou os iniciais se vazio.
   * @returns {Array<Post>}
   */
  static getPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      if (!raw) {
        const seed = this.getSeedPosts();
        this.savePosts(seed);
        return seed;
      }
      const parsed = JSON.parse(raw);
      return parsed.map(item => new Post({
        ...item,
        comments: (item.comments || []).map(c => new Comment(c))
      }));
    } catch {
      return this.getSeedPosts();
    }
  }

  /**
   * Salva a lista de relatos no localStorage.
   * @param {Array<Post>} posts
   */
  static savePosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (err) {
      console.warn('Não foi possível salvar no localStorage:', err);
    }
  }

  /**
   * Retorna os IDs de posts curtidos pelo visitante em modo de demonstração.
   * @returns {Set<string>}
   */
  static getLikedPostIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIKES);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  /**
   * Salva os IDs curtidos no localStorage.
   * @param {Set<string>} set
   */
  static saveLikedPostIds(set) {
    try {
      localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify([...set]));
    } catch (err) {
      console.warn('Não foi possível salvar curtidas no localStorage:', err);
    }
  }
}

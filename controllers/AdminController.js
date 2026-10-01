/**
 * @fileoverview Admin Controller
 * Orquestra a autenticação da equipe de moderação e as ações de aprovação/recusa de relatos e comentários.
 */

import { PostService } from '../api/PostService.js';
import { CommentService } from '../api/CommentService.js';
import { AuthService } from '../api/AuthService.js';
import { ModerationService } from '../api/ModerationService.js';
import { AdminView } from '../ui/views/AdminView.js';

export class AdminController {
  /**
   * @param {Object} services
   * @param {PostService} services.postService
   * @param {CommentService} services.commentService
   * @param {AuthService} services.authService
   * @param {function(): Promise<void>} [services.onPublicFeedUpdated]
   */
  constructor({ postService, commentService, authService, onPublicFeedUpdated = null }) {
    this.postService = postService;
    this.commentService = commentService;
    this.authService = authService;
    this.onPublicFeedUpdated = onPublicFeedUpdated;
    this.adminView = new AdminView();
  }

  /**
   * Inicializa ouvintes de login/logout e checa se há sessão ativa de admin.
   */
  async init() {
    this.adminView.bindLoginForm((email, password) => this.handleLogin(email, password));
    this.adminView.bindLogout(() => this.handleLogout());

    const isAdmin = await this.authService.checkAdminStatus();
    this.adminView.setAdminState(isAdmin);

    if (isAdmin) {
      await this.loadQueue();
    }
  }

  /**
   * Carrega os itens pendentes de moderação e renderiza os cards no painel.
   */
  async loadQueue() {
    if (!this.authService.isAdmin) {
      return;
    }

    const allPosts = await this.postService.fetchAdminPostsQueue();
    const pendingPosts = allPosts.filter(p => p.status === 'pending');
    const publishedPosts = allPosts.filter(p => p.status === 'approved');

    const postIds = allPosts.map(p => p.id);
    const allComments = await this.commentService.fetchAdminCommentsQueue(postIds);
    const pendingComments = allComments.filter(c => c.status === 'pending');

    const postTitlesMap = new Map();
    allPosts.forEach(p => postTitlesMap.set(p.id, p.title));

    this.adminView.renderModerationQueue({
      pendingPosts,
      pendingComments,
      postTitlesMap,
      getModerationFlags: text => ModerationService.detectPIIFlags(text),
      publishedCount: publishedPosts.length,
      handlers: {
        onApprovePost: (postId, reply) => this.handleApprovePost(postId, reply),
        onRejectPost: postId => this.handleRejectPost(postId),
        onApproveComment: commentId => this.handleApproveComment(commentId),
        onRejectComment: commentId => this.handleRejectComment(commentId)
      }
    });
  }

  /**
   * Processa a tentativa de login de moderador.
   * @param {string} email
   * @param {string} password
   */
  async handleLogin(email, password) {
    const result = await this.authService.signInAdmin(email, password);

    if (!result.success) {
      this.adminView.setLoginMessage(result.error || 'Falha na autenticação.');
      return;
    }

    this.adminView.setAdminState(true);
    await this.loadQueue();
  }

  /**
   * Encerra a sessão de moderador.
   */
  async handleLogout() {
    await this.authService.signOut();
    this.adminView.setAdminState(false);
    if (this.onPublicFeedUpdated) {
      await this.onPublicFeedUpdated();
    }
  }

  /**
   * Aprova um relato e atualiza os feeds.
   * @param {string} postId
   * @param {string} adminReply
   */
  async handleApprovePost(postId, adminReply) {
    await this.postService.approvePost(postId, adminReply);
    await this.loadQueue();
    if (this.onPublicFeedUpdated) {
      await this.onPublicFeedUpdated();
    }
  }

  /**
   * Recusa um relato.
   * @param {string} postId
   */
  async handleRejectPost(postId) {
    await this.postService.rejectPost(postId);
    await this.loadQueue();
  }

  /**
   * Aprova um comentário e atualiza os feeds.
   * @param {string} commentId
   */
  async handleApproveComment(commentId) {
    await this.commentService.approveComment(commentId);
    await this.loadQueue();
    if (this.onPublicFeedUpdated) {
      await this.onPublicFeedUpdated();
    }
  }

  /**
   * Recusa um comentário.
   * @param {string} commentId
   */
  async handleRejectComment(commentId) {
    await this.commentService.rejectComment(commentId);
    await this.loadQueue();
  }
}

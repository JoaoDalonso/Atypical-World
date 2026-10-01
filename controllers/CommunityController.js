/**
 * @fileoverview Community Controller
 * Orquestra o feed da comunidade Escuta Ativa, envio de novos relatos,
 * comentários, curtidas e compartilhamento de links.
 */

import { PostService } from '../api/PostService.js';
import { CommentService } from '../api/CommentService.js';
import { AuthService } from '../api/AuthService.js';
import { ModerationService } from '../api/ModerationService.js';
import { CommunityView } from '../ui/views/CommunityView.js';

export class CommunityController {
  /**
   * @param {Object} services
   * @param {PostService} services.postService
   * @param {CommentService} services.commentService
   * @param {AuthService} services.authService
   * @param {function(): Promise<void>} [services.onQueueUpdated] - Callback para atualizar painel de moderação
   */
  constructor({ postService, commentService, authService, onQueueUpdated = null }) {
    this.postService = postService;
    this.commentService = commentService;
    this.authService = authService;
    this.onQueueUpdated = onQueueUpdated;
    this.communityView = new CommunityView();
    this.posts = [];
  }

  /**
   * Inicializa o carregamento do feed e vinculo do formulário de novo relato.
   */
  async init() {
    this.communityView.bindNewPostForm(data => this.handleNewPostSubmit(data));
    await this.loadFeed();
  }

  /**
   * Carrega os relatos públicos aprovados e os renderiza no feed.
   */
  async loadFeed() {
    const currentUserId = this.authService.currentUser?.id || null;
    this.posts = await this.postService.fetchApprovedPosts(currentUserId);

    this.communityView.renderFeed(this.posts, {
      onLike: postId => this.handleLike(postId),
      onCommentSubmit: (postId, text, form) => this.handleCommentSubmit(postId, text, form),
      onShare: (postId, button) => this.handleShare(postId, button)
    });
  }

  /**
   * Processa a ação de curtir / descurtir um relato.
   * @param {string} postId
   */
  async handleLike(postId) {
    await this.authService.ensureAnonymousSession();
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    const targetPost = this.posts.find(p => p.id === postId);
    const isCurrentlyLiked = targetPost ? targetPost.isLiked : false;

    await this.postService.toggleLike(postId, currentUser.id, isCurrentlyLiked);
    await this.loadFeed();
  }

  /**
   * Processa o envio de um novo comentário com validação de dados pessoais.
   * @param {string} postId
   * @param {string} text
   * @param {HTMLFormElement} form
   */
  async handleCommentSubmit(postId, text, form) {
    if (!text) return;

    // Verificação de dados pessoais
    const flags = ModerationService.detectPIIFlags(text);
    if (flags.length) {
      alert(ModerationService.getWarningMessage(flags));
      return;
    }

    await this.authService.ensureAnonymousSession();
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      alert('Não foi possível conectar para enviar o comentário.');
      return;
    }

    const result = await this.commentService.submitComment({
      postId,
      body: text,
      userId: currentUser.id
    });

    if (result.success) {
      const input = form.querySelector('input[name="comment"]');
      if (input) input.value = '';

      const commentsBox = document.querySelector(`#comments-${CSS.escape(postId)}`);
      commentsBox?.classList.add('visible');

      alert('💙 Comentário enviado para moderação.');
      if (this.onQueueUpdated) {
        await this.onQueueUpdated();
      }
    } else {
      alert(result.error || 'Não foi possível enviar o comentário. Tente novamente.');
    }
  }

  /**
   * Copia o link direto para a seção da comunidade.
   * @param {string} postId
   * @param {HTMLButtonElement} button
   */
  async handleShare(postId, button) {
    try {
      const shareUrl = `${location.href.split('#')[0]}#comunidade`;
      await navigator.clipboard.writeText(shareUrl);
      this.communityView.showShareFeedback(button);
    } catch {
      this.communityView.showShareFeedback(button);
    }
  }

  /**
   * Processa o envio do formulário de novo relato.
   * @param {Object} data
   * @param {string} data.category
   * @param {string} data.title
   * @param {string} data.body
   * @param {HTMLFormElement} data.form
   */
  async handleNewPostSubmit({ category, title, body, form }) {
    // Validação de PII (telefone, e-mail, cpf/rg, endereço)
    const flags = ModerationService.detectPIIFlags(`${title} ${body}`);
    if (flags.length) {
      this.communityView.setFormMessage(ModerationService.getWarningMessage(flags), true);
      return;
    }

    await this.authService.ensureAnonymousSession();
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.communityView.setFormMessage('Não foi possível conectar agora. Tente novamente.', true);
      return;
    }

    const result = await this.postService.submitPost({
      category,
      title,
      body,
      userId: currentUser.id
    });

    if (result.success) {
      form.reset();
      if (result.isDemo) {
        this.communityView.setFormMessage(
          '💙 A demonstração recebeu sua mensagem. Para publicação real, falta conectar o banco do projeto.'
        );
      } else {
        this.communityView.setFormMessage(
          '💙 Recebemos sua mensagem. Ela ficará na fila de moderação e só aparecerá publicamente depois da aprovação.'
        );
      }

      if (this.onQueueUpdated) {
        await this.onQueueUpdated();
      }
    } else {
      this.communityView.setFormMessage(result.error || 'Não foi possível enviar agora.', true);
    }
  }
}

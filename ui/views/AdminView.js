/**
 * @fileoverview Admin View
 * Gerencia a interface da área de moderação, formulário de login de administradores,
 * renderização da fila de pendências e botões de ação (aprovar/recusar).
 */

import { BaseView } from './BaseView.js';

export class AdminView extends BaseView {
  constructor() {
    super();
    this.loginContainer = this.$('#admin-login');
    this.panelContainer = this.$('#admin-panel');
    this.loginForm = this.$('#admin-login-form');
    this.loginMessage = this.$('#admin-login-message');
    this.logoutButton = this.$('#admin-logout');
    this.sessionLabel = this.$('#admin-session-label');
    this.moderationList = this.$('#moderation-list');

    // Contadores do painel
    this.pendingCountBadge = this.$('#pending-count');
    this.publishedAdminBadge = this.$('#published-count-admin');
    this.commentPendingBadge = this.$('#comment-pending-count');
  }

  /**
   * Alterna a visibilidade entre o formulário de login e o painel de moderação.
   * @param {boolean} isAdmin
   */
  setAdminState(isAdmin) {
    if (this.loginContainer) {
      this.loginContainer.hidden = isAdmin;
    }
    if (this.panelContainer) {
      this.panelContainer.hidden = !isAdmin;
    }
    if (this.sessionLabel) {
      this.sessionLabel.textContent = isAdmin ? '🔐 Moderação conectada' : '';
    }
    if (this.loginMessage) {
      this.loginMessage.textContent = '';
    }
  }

  /**
   * Define mensagem de erro ou feedback no formulário de login de admin.
   * @param {string} message
   */
  setLoginMessage(message) {
    if (this.loginMessage) {
      this.loginMessage.textContent = message;
    }
  }

  /**
   * Vincula o evento de submissão do formulário de login de moderador.
   * @param {function(string, string): void} onLogin
   */
  bindLoginForm(onLogin) {
    if (!this.loginForm) return;

    this.loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const emailInput = this.loginForm.querySelector('[name="email"]');
      const passwordInput = this.loginForm.querySelector('[name="password"]');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (email && password && onLogin) {
        onLogin(email, password);
      }
    });
  }

  /**
   * Vincula o clique no botão de logout da moderação.
   * @param {function(): void} onLogout
   */
  bindLogout(onLogout) {
    if (!this.logoutButton) return;

    this.logoutButton.addEventListener('click', () => {
      if (onLogout) onLogout();
    });
  }

  /**
   * Renderiza os relatos e comentários que estão aguardando aprovação na moderação.
   * @param {Object} params
   * @param {Array<import('../../models/Post.js').Post>} params.pendingPosts
   * @param {Array<import('../../models/Comment.js').Comment>} params.pendingComments
   * @param {Map<string, string>} params.postTitlesMap
   * @param {function(string): Array<string>} params.getModerationFlags
   * @param {number} params.publishedCount
   * @param {Object} params.handlers
   * @param {function(string, string): void} params.handlers.onApprovePost
   * @param {function(string): void} params.handlers.onRejectPost
   * @param {function(string): void} params.handlers.onApproveComment
   * @param {function(string): void} params.handlers.onRejectComment
   */
  renderModerationQueue({
    pendingPosts = [],
    pendingComments = [],
    postTitlesMap = new Map(),
    getModerationFlags = () => [],
    publishedCount = 0,
    handlers = {}
  }) {
    this.updateCounters(pendingPosts.length, publishedCount, pendingComments.length);

    if (!this.moderationList) return;

    if (!pendingPosts.length && !pendingComments.length) {
      this.moderationList.innerHTML = '<div class="empty-state">Nenhum item aguardando revisão.</div>';
      return;
    }

    const postsHtml = pendingPosts
      .map(post => this.buildPostModerationCard(post, getModerationFlags))
      .join('');

    const commentsHtml = pendingComments
      .map(comment => this.buildCommentModerationCard(comment, postTitlesMap))
      .join('');

    this.moderationList.innerHTML = postsHtml + commentsHtml;
    this.bindModerationActions(handlers);
  }

  /**
   * Constrói o card de moderação para um relato pendente.
   * @param {import('../../models/Post.js').Post} post
   * @param {function(string): Array<string>} getModerationFlags
   * @returns {string}
   */
  buildPostModerationCard(post, getModerationFlags) {
    const flags = getModerationFlags(`${post.title} ${post.body}`);
    const flagTag = flags.length
      ? `<p class="moderation-flag">⚠️ ${this.escape(flags.join(' · '))} — revisar antes de publicar</p>`
      : '';

    const postId = this.escape(post.id);

    return `
      <article class="moderation-card">
        <small>🟡 AGUARDANDO REVISÃO · ${this.escape(post.category)}</small>
        <h3>${this.escape(post.title)}</h3>
        <p>${this.escape(post.body)}</p>
        ${flagTag}
        <label>
          Resposta do Atypical World (opcional)
          <textarea
            class="admin-reply-input"
            data-reply-for="${postId}"
            maxlength="500"
            placeholder="Escreva uma resposta acolhedora..."
          ></textarea>
        </label>
        <div class="mod-actions">
          <button class="btn approve" data-approve="${postId}">✓ Aprovar</button>
          <button class="btn reject" data-reject="${postId}">Recusar</button>
        </div>
      </article>
    `;
  }

  /**
   * Constrói o card de moderação para um comentário pendente.
   * @param {import('../../models/Comment.js').Comment} comment
   * @param {Map<string, string>} postTitlesMap
   * @returns {string}
   */
  buildCommentModerationCard(comment, postTitlesMap) {
    const parentTitle = postTitlesMap.get(comment.postId) || 'Relato da comunidade';
    const commentId = this.escape(comment.id);

    return `
      <article class="moderation-card comment-moderation">
        <small>💬 COMENTÁRIO · RELATO: ${this.escape(parentTitle)}</small>
        <p>${this.escape(comment.body)}</p>
        <div class="mod-actions">
          <button class="btn approve" data-comment-approve="${commentId}">✓ Publicar</button>
          <button class="btn reject" data-comment-reject="${commentId}">Recusar</button>
        </div>
      </article>
    `;
  }

  /**
   * Vincula ações dos botões de aprovação e recusa.
   * @param {Object} handlers
   */
  bindModerationActions({ onApprovePost, onRejectPost, onApproveComment, onRejectComment }) {
    if (!this.moderationList) return;

    // Aprovar relato
    this.$$('[data-approve]', this.moderationList).forEach(button => {
      button.onclick = () => {
        const postId = button.dataset.approve;
        const replyTextarea = this.$(`[data-reply-for="${CSS.escape(postId)}"]`, this.moderationList);
        const replyText = replyTextarea ? replyTextarea.value.trim() : '';

        if (postId && onApprovePost) {
          onApprovePost(postId, replyText);
        }
      };
    });

    // Recusar relato
    this.$$('[data-reject]', this.moderationList).forEach(button => {
      button.onclick = () => {
        const postId = button.dataset.reject;
        if (postId && onRejectPost) {
          onRejectPost(postId);
        }
      };
    });

    // Aprovar comentário
    this.$$('[data-comment-approve]', this.moderationList).forEach(button => {
      button.onclick = () => {
        const commentId = button.dataset.commentApprove;
        if (commentId && onApproveComment) {
          onApproveComment(commentId);
        }
      };
    });

    // Recusar comentário
    this.$$('[data-comment-reject]', this.moderationList).forEach(button => {
      button.onclick = () => {
        const commentId = button.dataset.commentReject;
        if (commentId && onRejectComment) {
          onRejectComment(commentId);
        }
      };
    });
  }

  /**
   * Atualiza as contagens numéricas de pendências e relatos publicados no painel.
   * @param {number} pendingCount
   * @param {number} publishedCount
   * @param {number} commentPendingCount
   */
  updateCounters(pendingCount = 0, publishedCount = 0, commentPendingCount = 0) {
    if (this.pendingCountBadge) {
      this.pendingCountBadge.textContent = String(pendingCount);
    }
    if (this.publishedAdminBadge) {
      this.publishedAdminBadge.textContent = String(publishedCount);
    }
    if (this.commentPendingBadge) {
      this.commentPendingBadge.textContent = String(commentPendingCount);
    }
  }
}

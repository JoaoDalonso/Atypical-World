/**
 * @fileoverview Community View
 * Renderiza o feed público da comunidade Escuta Ativa, cards de relatos,
 * gaveta de comentários, botões de curtir/compartilhar e o formulário de novo relato.
 */

import { BaseView } from './BaseView.js';

export class CommunityView extends BaseView {
  constructor() {
    super();
    this.feedElement = this.$('#feed');
    this.postForm = this.$('#form');
    this.formMessage = this.$('#message');
    this.publishedCountBadge = this.$('#published-count');
  }

  /**
   * Renderiza a lista de relatos aprovados no feed da comunidade.
   * @param {Array<import('../../models/Post.js').Post>} posts
   * @param {Object} handlers
   * @param {function(string): void} handlers.onLike
   * @param {function(string, string, HTMLFormElement): void} handlers.onCommentSubmit
   * @param {function(string, HTMLButtonElement): void} handlers.onShare
   */
  renderFeed(posts, handlers) {
    if (!this.feedElement) return;

    if (!posts.length) {
      this.feedElement.innerHTML = '<div class="empty-state">Ainda não há relatos publicados.</div>';
      this.updatePublishedCount(0);
      return;
    }

    const html = posts
      .map(post => this.buildPostTemplate(post))
      .join('');

    this.feedElement.innerHTML = html;
    this.bindPostInteractions(handlers);
    this.updatePublishedCount(posts.length);
  }

  /**
   * Constrói a estrutura HTML de um relato.
   * @param {import('../../models/Post.js').Post} post
   * @returns {string}
   */
  buildPostTemplate(post) {
    const categoryLabel = this.escape(post.getCategoryLabel());
    const title = this.escape(post.title);
    const body = this.escape(post.body);
    const postId = this.escape(post.id);
    const likedClass = post.isLiked ? 'active' : '';

    const commentsHtml = post.comments
      .map(
        comment => `
        <div class="comment">
          <b>${this.escape(comment.author)}</b>
          <p>${this.escape(comment.body)}</p>
        </div>`
      )
      .join('');

    const adminReplyHtml = post.adminReply
      ? `<aside class="official-reply">
          <b>Atypical World 💙</b>
          <p>${this.escape(post.adminReply)}</p>
        </aside>`
      : '';

    return `
      <article class="community-post">
        <div class="post-top">
          <small>💭 RELATO ANÔNIMO · ${categoryLabel}</small>
          <span>Publicado</span>
        </div>
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="post-actions">
          <button class="like ${likedClass}" data-like="${postId}" aria-label="Curtir relato">
            ♡ ${post.likes}
          </button>
          <button class="comment-toggle" data-comments="${postId}">
            💬 ${post.comments.length}
          </button>
          <button class="share-post" data-share="${postId}">
            ↗ Compartilhar
          </button>
        </div>
        <div class="comments" id="comments-${postId}">
          ${commentsHtml}
          <form class="comment-form" data-comment-form="${postId}">
            <input name="comment" maxlength="300" required placeholder="Escreva um comentário com respeito...">
            <button class="btn small" type="submit">Enviar</button>
          </form>
          ${adminReplyHtml}
        </div>
      </article>
    `;
  }

  /**
   * Vincula os eventos de curtir, abrir comentários, enviar comentário e compartilhar.
   * @param {Object} handlers
   */
  bindPostInteractions({ onLike, onCommentSubmit, onShare }) {
    // Curtidas
    this.$$('[data-like]', this.feedElement).forEach(button => {
      button.onclick = () => {
        const postId = button.dataset.like;
        if (postId && onLike) onLike(postId);
      };
    });

    // Abrir/fechar comentários
    this.$$('[data-comments]', this.feedElement).forEach(button => {
      button.onclick = () => {
        const postId = button.dataset.comments;
        const commentsContainer = this.$(`#comments-${CSS.escape(postId)}`);
        commentsContainer?.classList.toggle('visible');
      };
    });

    // Envio de comentários
    this.$$('.comment-form', this.feedElement).forEach(form => {
      form.onsubmit = event => {
        event.preventDefault();
        const postId = form.dataset.commentForm;
        const input = form.querySelector('input[name="comment"]');
        const text = input ? input.value.trim() : '';

        if (postId && text && onCommentSubmit) {
          onCommentSubmit(postId, text, form);
        }
      };
    });

    // Compartilhar link
    this.$$('[data-share]', this.feedElement).forEach(button => {
      button.onclick = () => {
        const postId = button.dataset.share;
        if (postId && onShare) onShare(postId, button);
      };
    });
  }

  /**
   * Vincula o envio do formulário de novo relato.
   * @param {function({ category: string, title: string, body: string, form: HTMLFormElement }): void} onSubmit
   */
  bindNewPostForm(onSubmit) {
    if (!this.postForm) return;

    this.postForm.addEventListener('submit', event => {
      event.preventDefault();

      const categorySelect = this.postForm.querySelector('[name="category"]');
      const titleInput = this.postForm.querySelector('[name="title"]');
      const bodyTextarea = this.postForm.querySelector('[name="body"]');

      const category = categorySelect ? categorySelect.value : '';
      const title = titleInput ? titleInput.value.trim() : '';
      const body = bodyTextarea ? bodyTextarea.value.trim() : '';

      onSubmit({
        category,
        title,
        body,
        form: this.postForm
      });
    });
  }

  /**
   * Atualiza a mensagem de status e feedback abaixo do formulário de relato.
   * @param {string} message
   * @param {boolean} [isError=false]
   */
  setFormMessage(message, isError = false) {
    if (!this.formMessage) return;
    this.formMessage.textContent = message;
    this.formMessage.style.color = isError ? '#d93838' : '';
  }

  /**
   * Atualiza o contador de relatos publicados visível no card da comunidade.
   * @param {number} count
   */
  updatePublishedCount(count) {
    if (this.publishedCountBadge) {
      this.publishedCountBadge.textContent = String(count);
    }
  }

  /**
   * Exibe feedback visual temporário no botão de compartilhamento.
   * @param {HTMLButtonElement} button
   */
  showShareFeedback(button) {
    if (!button) return;
    const originalText = button.textContent;
    button.textContent = '✓ Link copiado';
    setTimeout(() => {
      button.textContent = originalText;
    }, 1600);
  }
}

/**
 * @fileoverview Navigation View
 * Controla o menu responsivo mobile, destaque da seção ativa no scroll e botão de voltar ao topo.
 */

import { BaseView } from './BaseView.js';

export class NavigationView extends BaseView {
  constructor() {
    super();
    this.menuButton = this.$('.menu');
    this.navElement = this.$('.nav');
    this.topButton = this.$('#top');
    this.navLinks = this.$$('.nav a');
    this.sections = this.navLinks
      .map(link => this.$(link.getAttribute('href')))
      .filter(Boolean);
  }

  /**
   * Inicializa todos os comportamentos de navegação e acessibilidade.
   */
  init() {
    this.bindMenuToggle();
    this.bindLinkClicks();
    this.bindScrollToTop();
    this.bindKeyboardShortcuts();
    this.bindScrollSpy();
  }

  /**
   * Abre e fecha o menu mobile com acessibilidade (aria-expanded).
   */
  bindMenuToggle() {
    if (!this.menuButton || !this.navElement) return;

    this.menuButton.addEventListener('click', () => {
      const isOpen = this.navElement.classList.toggle('open');
      this.menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /**
   * Fecha o menu ao clicar em qualquer link de navegação interna.
   */
  bindLinkClicks() {
    if (!this.navElement) return;

    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.navElement.classList.remove('open');
        this.menuButton?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /**
   * Exibe o botão de voltar ao topo após rolar 500px e rola suavemente ao clicar.
   */
  bindScrollToTop() {
    if (!this.topButton) return;

    window.addEventListener(
      'scroll',
      () => {
        const shouldShow = window.scrollY > 500;
        this.topButton.classList.toggle('show', shouldShow);
      },
      { passive: true }
    );

    this.topButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Fecha o menu ao pressionar a tecla Escape.
   */
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.navElement?.classList.contains('open')) {
        this.navElement.classList.remove('open');
        this.menuButton?.setAttribute('aria-expanded', 'false');
        this.menuButton?.focus();
      }
    });
  }

  /**
   * Destaca o item de menu correspondente à seção atualmente visível na tela.
   */
  bindScrollSpy() {
    if (!this.navLinks.length || !this.sections.length) return;

    const updateActiveNav = () => {
      const scrollPosition = window.scrollY + 140;
      let currentSection = this.sections[0];

      this.sections.forEach(section => {
        if (section.offsetTop <= scrollPosition) {
          currentSection = section;
        }
      });

      this.navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('current', href === `#${currentSection.id}`);
      });
    };

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    window.addEventListener('load', updateActiveNav);
    updateActiveNav();
  }
}

/**
 * @fileoverview App Controller (Master Orchestrator)
 * Centraliza e orquestra a inicialização de todos os módulos MVC da aplicação.
 */

import { AuthService } from '../api/AuthService.js';
import { PostService } from '../api/PostService.js';
import { CommentService } from '../api/CommentService.js';
import { AnalyticsService } from '../api/AnalyticsService.js';
import { NavigationController } from './NavigationController.js';
import { SearchController } from './SearchController.js';
import { DirectoryController } from './DirectoryController.js';
import { CommunityController } from './CommunityController.js';
import { AdminController } from './AdminController.js';

export class AppController {
  constructor() {
    // 1. Serviços de API, Autenticação e Métricas
    this.authService = new AuthService();
    this.postService = new PostService();
    this.commentService = new CommentService();
    this.analyticsService = new AnalyticsService();

    // 2. Controladores de UI
    this.navigationController = new NavigationController();
    this.searchController = new SearchController();
    this.directoryController = new DirectoryController();

    // 3. Controladores da Comunidade e Moderação (com callbacks cruzados para sincronização)
    this.communityController = new CommunityController({
      postService: this.postService,
      commentService: this.commentService,
      authService: this.authService,
      onQueueUpdated: async () => {
        if (this.adminController) {
          await this.adminController.loadQueue();
        }
      }
    });

    this.adminController = new AdminController({
      postService: this.postService,
      commentService: this.commentService,
      authService: this.authService,
      onPublicFeedUpdated: async () => {
        if (this.communityController) {
          await this.communityController.loadFeed();
        }
      }
    });
  }

  /**
   * Inicializa todos os subsistemas da aplicação de forma ordenada.
   */
  async init() {
    try {
      // Inicializa a UI estática (Menu, Acordeões, Busca, Filtros de Serviços)
      this.navigationController.init();
      this.searchController.init();
      this.directoryController.init();

      // Inicializa sessão anônima para o visitante
      await this.authService.ensureAnonymousSession();

      // Inicializa o feed público e o painel de moderação
      await this.communityController.init();
      await this.adminController.init();

      // Registra métrica anônima de acesso ao site
      this.analyticsService.trackEvent('inicio', 'page_view');
    } catch (error) {
      console.error('[AppController] Erro na inicialização da aplicação:', error);
    }
  }
}

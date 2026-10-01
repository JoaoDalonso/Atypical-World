/**
 * @fileoverview Analytics Service
 * Registra acessos e eventos de forma anônima e consulta métricas consolidadas para a equipe de moderação.
 */

import { SupabaseClient } from './SupabaseClient.js';

export class AnalyticsService {
  /**
   * Registra um acesso ou clique de forma anônima sem coletar dados pessoais.
   * @param {string} [section='inicio'] - Seção visualizada (ex: 'inicio', 'tea', 'direitos', 'escuta')
   * @param {string} [eventType='page_view'] - Tipo de evento ('page_view', 'share_click', etc.)
   * @returns {Promise<void>}
   */
  async trackEvent(section = 'inicio', eventType = 'page_view') {
    const client = SupabaseClient.getInstance();
    if (!client) return;

    try {
      await client.rpc('track_site_event', {
        target_section: section,
        target_event: eventType
      });
    } catch (err) {
      // Falha silenciosa para não impactar a experiência de navegação do usuário
      console.debug('[AnalyticsService] Registro de métrica offline:', err);
    }
  }

  /**
   * Obtém métricas gerais consolidadas do site para o painel de moderação.
   * @returns {Promise<Object | null>}
   */
  async fetchDashboardMetrics() {
    const client = SupabaseClient.getInstance();
    if (!client) return null;

    try {
      const { data, error } = await client.rpc('get_admin_dashboard_metrics');
      if (error || !data || !data.length) {
        return null;
      }
      return data[0];
    } catch (err) {
      console.error('[AnalyticsService] Erro ao buscar métricas:', err);
      return null;
    }
  }
}

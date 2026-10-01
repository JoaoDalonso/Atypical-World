/**
 * @fileoverview Supabase Client Singleton
 * Gerencia a instância do cliente Supabase e verifica a disponibilidade de credenciais.
 */

export class SupabaseClient {
  /** @type {import('@supabase/supabase-js').SupabaseClient | null} */
  static #instance = null;

  /**
   * Obtém as credenciais públicas configuradas em window.ATYPICAL_SUPABASE.
   * @returns {{ url: string, publishableKey: string }}
   */
  static getConfig() {
    const globalConfig = (typeof window !== 'undefined' && window.ATYPICAL_SUPABASE) || {};
    return {
      url: (globalConfig.url || '').trim(),
      publishableKey: (globalConfig.publishableKey || '').trim()
    };
  }

  /**
   * Verifica se o SDK e as chaves estão prontos para comunicação real.
   * @returns {boolean}
   */
  static isReady() {
    const config = this.getConfig();
    const hasSDK = typeof window !== 'undefined' && Boolean(window.supabase);
    return Boolean(hasSDK && config.url && config.publishableKey);
  }

  /**
   * Retorna a instância única do cliente Supabase (Singleton).
   * @returns {import('@supabase/supabase-js').SupabaseClient | null}
   */
  static getInstance() {
    if (this.#instance) {
      return this.#instance;
    }

    if (!this.isReady()) {
      return null;
    }

    try {
      const { url, publishableKey } = this.getConfig();
      if (typeof window !== 'undefined' && window.supabase) {
        this.#instance = window.supabase.createClient(url, publishableKey);
        return this.#instance;
      }
    } catch (err) {
      console.error('[SupabaseClient] Erro ao inicializar cliente Supabase:', err);
    }

    return null;
  }
}

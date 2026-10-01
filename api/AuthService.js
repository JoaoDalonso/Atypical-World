/**
 * @fileoverview Authentication Service
 * Gerencia a sessão anônima dos visitantes da comunidade e o login com e-mail/senha da equipe de moderação.
 */

import { SupabaseClient } from './SupabaseClient.js';

export class AuthService {
  /** @type {Object | null} */
  #currentUser = null;

  /** @type {boolean} */
  #isAdmin = false;

  /**
   * Usuário ativo na sessão (anônimo ou autenticado).
   * @returns {Object | null}
   */
  get currentUser() {
    return this.#currentUser;
  }

  /**
   * Indica se o usuário atual tem perfil de administrador.
   * @returns {boolean}
   */
  get isAdmin() {
    return this.#isAdmin;
  }

  /**
   * Garante a existência de uma sessão anônima para permitir interação pública (curtidas/envios).
   * @returns {Promise<boolean>}
   */
  async ensureAnonymousSession() {
    const client = SupabaseClient.getInstance();
    if (!client) {
      if (!this.#currentUser) {
        this.#currentUser = { id: 'demo-visitor', is_anonymous: true };
      }
      return true;
    }

    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        console.error('[AuthService] Erro ao recuperar sessão:', sessionError);
      }

      if (session?.user) {
        this.#currentUser = session.user;
        return true;
      }

      const { data, error } = await client.auth.signInAnonymously();
      if (error) {
        console.error('[AuthService] Erro no login anônimo:', error);
        return false;
      }

      this.#currentUser = data.user;
      return true;
    } catch (err) {
      console.error('[AuthService] Exceção em ensureAnonymousSession:', err);
      return false;
    }
  }

  /**
   * Realiza login de administrador com e-mail e senha.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async signInAdmin(email, password) {
    const client = SupabaseClient.getInstance();
    if (!client) {
      return { success: false, error: 'Configure o banco de dados do Supabase primeiro.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error || !data.user) {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      this.#currentUser = data.user;
      const isRoleAdmin = await this.verifyAdminRole(data.user.id);
      this.#isAdmin = isRoleAdmin;

      if (!isRoleAdmin) {
        await client.auth.signOut();
        this.#isAdmin = false;
        return { success: false, error: 'Esta conta ainda não foi autorizada para a moderação.' };
      }

      return { success: true };
    } catch (err) {
      console.error('[AuthService] Exceção no login de admin:', err);
      return { success: false, error: 'Ocorreu um erro ao tentar autenticar. Tente novamente.' };
    }
  }

  /**
   * Verifica se o usuário possui registro de admin na tabela 'profiles' ou via RPC is_admin.
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async verifyAdminRole(userId) {
    const client = SupabaseClient.getInstance();
    if (!client || !userId) return false;

    try {
      // 1. Tenta verificar via RPC is_admin() (função com security definer)
      const { data: rpcResult, error: rpcError } = await client.rpc('is_admin');
      if (!rpcError && typeof rpcResult === 'boolean') {
        return rpcResult;
      }

      // 2. Fallback: consulta direta na tabela profiles
      const { data, error } = await client
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthService] Erro ao checar perfil de admin:', error);
        return false;
      }

      return Boolean(data);
    } catch (err) {
      console.error('[AuthService] Exceção ao checar perfil:', err);
      return false;
    }
  }

  /**
   * Valida a sessão ativa para determinar se o moderador já está autenticado.
   * @returns {Promise<boolean>}
   */
  async checkAdminStatus() {
    const client = SupabaseClient.getInstance();
    if (!client) {
      this.#isAdmin = false;
      return false;
    }

    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) {
        this.#isAdmin = false;
        return false;
      }

      this.#currentUser = session.user;
      this.#isAdmin = await this.verifyAdminRole(session.user.id);
      return this.#isAdmin;
    } catch (err) {
      console.error('[AuthService] Erro ao verificar status de admin:', err);
      this.#isAdmin = false;
      return false;
    }
  }

  /**
   * Encerra a sessão de administrador e retorna à sessão anônima.
   * @returns {Promise<void>}
   */
  async signOut() {
    const client = SupabaseClient.getInstance();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error('[AuthService] Erro no logout:', err);
      }
    }

    this.#currentUser = null;
    this.#isAdmin = false;
    await this.ensureAnonymousSession();
  }
}

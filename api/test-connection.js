/**
 * @fileoverview Script de Teste Automatizado de Conexão com o Supabase
 */

const SUPABASE_URL = 'https://sqnjsgdcflzlyefardbk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbmpzZ2RjZmx6bHllZmFyZGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODc3MjgsImV4cCI6MjEwNjQ2MzcyOH0.zAkgQRThuHHDcXRwdXsw5p7Dtk2j1iu5dtlmL1MhyjM';

async function testConnection() {
  console.log('\n================================================================');
  console.log('        ATYPICAL WORLD · TESTE DE CONEXÃO COM O SUPABASE');
  console.log('================================================================\n');
  console.log(` Projeto ID : sqnjsgdcflzlyefardbk`);
  console.log(` Região     : South America (São Paulo - sa-east-1)`);
  console.log(` Endpoint   : ${SUPABASE_URL}\n`);
  console.log(' Executando testes...\n');

  const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  let allPassed = true;

  // 1. Teste Tabela Posts
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id,title,status&limit=1`, { headers });
    if (res.status === 200) {
      console.log(' ✅ [OK] Tabela POSTS acessível e online (Status 200)');
    } else {
      allPassed = false;
      console.log(` ❌ [FALHA] Tabela POSTS retornou status: ${res.status}`);
    }
  } catch (err) {
    allPassed = false;
    console.log(` ❌ [ERRO] Conexão com POSTS: ${err.message}`);
  }

  // 2. Teste Tabela Comments
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id,status&limit=1`, { headers });
    if (res.status === 200) {
      console.log(' ✅ [OK] Tabela COMMENTS acessível e online (Status 200)');
    } else {
      allPassed = false;
      console.log(` ❌ [FALHA] Tabela COMMENTS retornou status: ${res.status}`);
    }
  } catch (err) {
    allPassed = false;
    console.log(` ❌ [ERRO] Conexão com COMMENTS: ${err.message}`);
  }

  // 3. Teste Função de Curtidas (RPC public_like_counts)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/public_like_counts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_ids: [] })
    });
    if (res.status === 200) {
      console.log(' ✅ [OK] Sistema de Curtidas (RPC public_like_counts) operando');
    } else {
      allPassed = false;
      console.log(` ❌ [FALHA] RPC public_like_counts retornou status: ${res.status}`);
    }
  } catch (err) {
    allPassed = false;
    console.log(` ❌ [ERRO] Conexão com Likes: ${err.message}`);
  }

  // 4. Teste RPC track_site_event
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/track_site_event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ target_section: 'teste_bat', target_event: 'page_view' })
    });
    if (res.status === 204 || res.status === 200) {
      console.log(' ✅ [OK] Função RPC de Métricas (track_site_event) operando');
    } else {
      console.log(` ⚠️ [ALERTA] RPC track_site_event retornou status: ${res.status}`);
    }
  } catch (err) {
    console.log(` ❌ [ERRO] RPC track_site_event: ${err.message}`);
  }

  // 5. Teste Anonymous Sign-in
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { is_anonymous: true } })
    });
    const data = await res.json();
    if (res.status === 200 || data.user) {
      console.log(' ✅ [OK] Login Anônimo ATIVADO no Supabase');
    } else if (data.error_code === 'anonymous_provider_disabled') {
      console.log('\n ⚠️ [PENDÊNCIA] Login Anônimo ainda está DESATIVADO no painel.');
      console.log('    -> Acesse Authentication > Providers > Anonymous e marque como ENABLED.');
    } else {
      console.log(` ℹ️ [INFO] Auth Status: ${data.msg || res.status}`);
    }
  } catch (err) {
    console.log(` ❌ [ERRO] Teste Auth: ${err.message}`);
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log(' 🎉 RESULTADO: Conexão com o Supabase estabelecida com sucesso!');
  } else {
    console.log(' ⚠️ RESULTADO: Verifique os itens com falha acima.');
  }
  console.log('================================================================\n');
}

testConnection();

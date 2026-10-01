# Atypical World · Escuta Ativa real

## O que já está preparado
- relatos anônimos com fila de moderação;
- comentários moderados;
- curtidas por visitante anônimo;
- login separado para a equipe;
- respostas oficiais da equipe;
- RLS no banco;
- nenhuma `service_role`/secret key no navegador.

## 1. Criar o projeto
Crie um projeto no Supabase e abra o SQL Editor.

## 2. Criar as tabelas
Cole e execute `api/supabase-schema.sql`.

## 3. Ativar login anônimo
No painel do Supabase, habilite **Anonymous Sign-Ins** em Authentication. A aplicação usa isso para permitir participação sem pedir nome ou e-mail ao visitante.

## 4. Criar o administrador
Em Authentication > Users, crie o e-mail e senha que serão usados pela equipe.
Depois copie o UUID desse usuário e execute no SQL Editor:

```sql
insert into public.profiles (user_id, role)
values ('COLE-O-UUID-AQUI', 'admin');
```

## 5. Configurar o site
Abra `api/supabase-config.js` e preencha:

```js
window.ATYPICAL_SUPABASE = {
  url: "https://SEU-PROJETO.supabase.co",
  publishableKey: "SUA-PUBLISHABLE-KEY"
};
```

Use somente a **Publishable Key**. Nunca coloque `service_role` ou uma secret key no arquivo público.

## 6. Testar
1. Abra o site.
2. Envie um relato.
3. Entre na área de moderação com a conta criada.
4. Aprove o relato e, se quiser, escreva uma resposta.
5. Abra uma janela anônima/outro navegador e confirme que o relato aparece.
6. Teste comentário e curtida.

## Observação de segurança
O site não deve coletar nome, telefone, endereço, CPF ou outras informações identificáveis nos relatos. A filtragem automática é apenas uma primeira barreira: a revisão humana continua necessária antes da publicação.

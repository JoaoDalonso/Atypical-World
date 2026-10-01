# Atypical World — Escuta Ativa

Esta versão adiciona uma Escuta Ativa em formato de comunidade:

- envio anônimo de relatos;
- fila de moderação;
- aprovação/recusa;
- relatos publicados;
- curtidas;
- comentários;
- resposta oficial do Atypical World;
- compartilhamento do link;
- painel de demonstração da moderação.

## Importante

O projeto continua sendo um protótipo estático. Os dados da Escuta Ativa são guardados no `localStorage` do navegador apenas para demonstrar o funcionamento.

Para colocar o site na internet e permitir que vários pais usem a comunidade ao mesmo tempo, é necessário adicionar:
1. banco de dados;
2. autenticação de administrador;
3. regras de segurança;
4. moderação no servidor;
5. proteção contra spam e abuso;
6. política de privacidade e tratamento de dados.

Nunca coloque senha de administrador dentro do JavaScript público.

## 🏛️ Arquitetura e Organização do Código (MVC & Clean Code)

O projeto é estruturado segundo o padrão **MVC (Model-View-Controller)** com separação clara de responsabilidades e Orientação a Objetos (OOP):

```text
Atypical-World/
├── api/                           # Camada de Comunicação com Backend & Moderação
│   ├── SupabaseClient.js          # Singleton de conexão com o Supabase
│   ├── AuthService.js             # Autenticação anônima de visitantes e login de administradores
│   ├── PostService.js             # Operações de relatos (busca, envio, likes e moderação)
│   ├── CommentService.js          # Operações de comentários (envio e moderação)
│   ├── ModerationService.js       # Regras de segurança e filtro anti-PII (dados pessoais)
│   ├── supabase-config.js         # Credenciais públicas do projeto
│   └── supabase-schema.sql        # Esquema SQL com RLS e funções RPC
│
├── models/                        # Entidades e Modelos de Domínio
│   ├── Post.js                    # Modelo de Relato com validações e formatações
│   ├── Comment.js                 # Modelo de Comentário
│   └── SearchTopic.js             # Modelo e catálogo de tópicos para busca rápida
│
├── ui/                            # Camada de Apresentação (Interface do Usuário)
│   ├── css/
│   │   └── style.css              # Estilos visuais e temas responsivos
│   ├── imagens/
│   │   └── logo.svg               # Identidade visual
│   └── views/
│       ├── BaseView.js            # Classe base com helpers de DOM e escape XSS
│       ├── NavigationView.js      # Menu mobile, scrollspy e botão voltar ao topo
│       ├── AccordionView.js       # Acordeões expansíveis (TEA e FAQ)
│       ├── DirectoryView.js       # Filtros de serviços locais por especialidade
│       ├── SearchView.js          # Campo e resultados de busca em tempo real
│       ├── CommunityView.js       # Feed público, relatos, comentários e likes
│       └── AdminView.js           # Painel de moderação e login de equipe
│
├── controllers/                   # Controladores (Regras de Negócio e Orquestração)
│   ├── NavigationController.js    # Controla navegação e acordeões
│   ├── SearchController.js        # Controla a lógica de busca
│   ├── DirectoryController.js     # Controla a filtragem de serviços locais
│   ├── CommunityController.js     # Controla o fluxo da comunidade Escuta Ativa
│   ├── AdminController.js         # Controla a fila e ações da moderação
│   └── AppController.js           # Orquestrador mestre da aplicação
│
├── utils/                         # Utilitários
│   ├── Sanitizer.js               # Sanitização de strings contra XSS e formatação
│   └── Storage.js                 # Adaptador de persistência local para modo demonstração
│
├── app.js                         # Ponto de entrada modular ES Modules
├── script.js                      # Ponte de compatibilidade
└── index.html                     # Estrutura HTML principal
```

## SEO e Google
A versão atual foi preparada com título, descrição, metadados sociais, dados estruturados, `robots.txt` e `sitemap.xml`.
Antes da publicação, substitua `https://atypicalworld.example/` pelo endereço real do site nos arquivos `index.html`, `robots.txt` e `sitemap.xml`.
Depois de publicar, o site pode ser acompanhado no Google Search Console e o sitemap pode ser enviado por lá. A indexação não é instantânea e pode levar alguns dias.

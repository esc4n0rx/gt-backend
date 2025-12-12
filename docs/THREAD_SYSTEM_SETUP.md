# Sistema de Threads com Templates - Gtracker

## Visão Geral

Sistema completo de gerenciamento de threads com templates especializados para diferentes tipos de conteúdo. Threads só podem ser criadas em categorias finais (leaf nodes) e possuem 5 templates diferentes: **Mídia**, **Jogos**, **Software**, **Torrent** e **Postagem**.

## Características Principais

- ✅ **5 Templates Especializados**: Cada tipo de conteúdo tem campos específicos
- ✅ **Permissões por Template**: Templates de upload requerem cargo uploader ou superior
- ✅ **Leaf Node Only**: Threads só podem ser criadas em categorias sem subcategorias
- ✅ **Slug Automático**: Geração automática de slug único por categoria
- ✅ **Sistema de Status**: active, locked, pinned, archived
- ✅ **Contadores Automáticos**: Views e replies atualizados via triggers SQL
- ✅ **Breadcrumbs**: Navegação contextual completa
- ✅ **Integração com Categorias**: Threads aparecem automaticamente ao buscar categoria leaf

## Instalação e Configuração

### 1. Executar Migração SQL

Execute a migração para criar as tabelas, funções e triggers:

```bash
psql -U seu_usuario -d gtracker_db -f sql/migrations/006_threads_system.sql
```

Ou via Supabase SQL Editor:
- Cole o conteúdo de `sql/migrations/006_threads_system.sql`
- Execute a query

### 2. Estrutura de Arquivos Criados

```
gtracker-backend/
├── sql/migrations/
│   └── 006_threads_system.sql           # Migração SQL
├── src/
│   ├── types/
│   │   └── thread.types.ts              # Interfaces TypeScript
│   ├── repositories/
│   │   └── thread-repository.ts         # Repository
│   ├── controllers/
│   │   └── thread-controller.ts         # Controller
│   ├── validators/
│   │   └── thread-validators.ts         # Validações Zod
│   └── routes/
│       └── thread-routes.ts             # Rotas
└── docs/
    ├── threads.json                     # Documentação das rotas
    └── THREAD_SYSTEM_SETUP.md          # Este arquivo
```

### 3. Verificar Instalação

```bash
# Verificar se tabelas foram criadas
psql -U seu_usuario -d gtracker_db -c "\dt thread*"

# Deve mostrar:
# - threads
# - thread_midia_content
# - thread_jogos_content
# - thread_software_content
# - thread_torrent_content
# - thread_postagem_content
```

## Templates de Conteúdo

### 1. Template: MIDIA (Filmes, Séries, Animes)

**Cargo mínimo**: Uploader

**Campos obrigatórios**:
- `nome_conteudo` - Nome do filme/série
- `genero` - Array de gêneros (mínimo 1)
- `sinopse` - Descrição (mínimo 10 caracteres)
- `tamanho` - Tamanho do arquivo
- `formato` - Array de formatos (ex: ["MKV", "HEVC"])
- `link_download` - URL de download
- `idiomas` - Array de idiomas (mínimo 1)

**Campos opcionais**:
- `poster_url` - URL da capa
- `trailer_url` - URL do trailer
- `elenco` - Array de atores
- `notas` - Observações adicionais
- `qualidade` - Qualidade do vídeo
- `ano` - Ano de lançamento
- `duracao` - Duração
- `classificacao` - Classificação etária
- `tmdb_id` - ID do TMDB para integração

**Exemplo**:
```json
{
  "categoryId": "uuid-categoria-4k-uhd",
  "template": "midia",
  "title": "Dune: Parte Dois (2024) 4K UHD BluRay",
  "content": {
    "nome_conteudo": "Dune: Parte Dois",
    "poster_url": "https://image.tmdb.org/t/p/original/xxx.jpg",
    "genero": ["Ficção Científica", "Aventura"],
    "trailer_url": "https://youtube.com/watch?v=xxx",
    "elenco": ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
    "sinopse": "Paul Atreides une forças com Chani e os Fremen...",
    "notas": "Remux original sem compressão",
    "tamanho": "85.4 GB",
    "formato": ["MKV", "HEVC", "HDR10"],
    "link_download": "https://exemplo.com/download",
    "idiomas": ["Inglês", "Português"],
    "qualidade": "4K UHD",
    "ano": 2024,
    "duracao": "2h 46min",
    "classificacao": "12",
    "tmdb_id": "693134"
  }
}
```

### 2. Template: JOGOS

**Cargo mínimo**: Uploader

**Campos obrigatórios**:
- `nome` - Nome do jogo
- `estilo` - Array de estilos/gêneros
- `sistema_operacional` - Array de SOs suportados
- `descricao` - Descrição do jogo
- `guia_instalacao` - Instruções de instalação
- `tamanho` - Tamanho do arquivo
- `formato` - Formato do arquivo
- `link_download` - URL de download

**Campos opcionais**:
- `poster_url` - Capa do jogo
- `ano` - Ano de lançamento
- `specs_minimas` - Requisitos mínimos
- `specs_recomendadas` - Requisitos recomendados
- `versao` - Versão do jogo
- `desenvolvedor` - Nome do desenvolvedor
- `publisher` - Nome da publisher

**Exemplo**:
```json
{
  "categoryId": "uuid-categoria-jogos-pc",
  "template": "jogos",
  "title": "Cyberpunk 2077 Ultimate Edition v2.1",
  "content": {
    "nome": "Cyberpunk 2077 Ultimate Edition",
    "estilo": ["RPG", "Ação", "Mundo Aberto"],
    "poster_url": "https://exemplo.com/poster.jpg",
    "ano": 2024,
    "sistema_operacional": ["Windows"],
    "descricao": "Jogo de RPG de ação em primeira pessoa...",
    "specs_minimas": "CPU: i5-3570K, GPU: GTX 780, RAM: 8GB",
    "specs_recomendadas": "CPU: i7-6700, GPU: RTX 2060, RAM: 16GB",
    "guia_instalacao": "1. Extrair arquivos\n2. Executar setup.exe\n3. Aplicar crack...",
    "tamanho": "120 GB",
    "formato": "ISO",
    "link_download": "https://exemplo.com/download",
    "versao": "2.1",
    "desenvolvedor": "CD Projekt Red",
    "publisher": "CD Projekt"
  }
}
```

### 3. Template: SOFTWARE

**Cargo mínimo**: Uploader

Similar ao template de Jogos, mas com campo `versao` obrigatório e campo `licenca` opcional.

### 4. Template: TORRENT

**Cargo mínimo**: Uploader

Similar ao template Mídia, mas com campos específicos de torrent:
- `magnet_link` - Link magnet (opcional se tiver torrent_file_url)
- `torrent_file_url` - URL do arquivo .torrent (opcional se tiver magnet_link)
- `seeders` - Número de seeders
- `leechers` - Número de leechers

**Nota**: Pelo menos um dos links (magnet ou torrent) é obrigatório.

### 5. Template: POSTAGEM

**Cargo mínimo**: Usuário (todos podem criar)

**Campos**:
- `conteudo` - Texto da postagem (mínimo 10 caracteres)
- `tags` - Array de tags (opcional)

**Exemplo**:
```json
{
  "categoryId": "uuid-categoria-duvidas",
  "template": "postagem",
  "title": "Dúvida sobre instalação de mods no GTA V",
  "content": {
    "conteudo": "Pessoal, estou com dificuldade para instalar mods no GTA V...",
    "tags": ["gta-v", "mods", "ajuda"]
  }
}
```

## Uso das Rotas

### Base URL
```
/api/v1/threads
```

### Rotas Públicas

#### 1. Listar Threads
```bash
GET /api/v1/threads
Query Params:
  - categoryId (UUID, opcional)
  - authorId (UUID, opcional)
  - template (string, opcional)
  - status (string, opcional, default: active)
  - isPinned (boolean, opcional)
  - limit (number, opcional, default: 50, max: 100)
  - offset (number, opcional, default: 0)
  - sortBy (recent|popular|replies|views, opcional, default: recent)

Exemplo:
GET /api/v1/threads?categoryId=uuid&limit=20&sortBy=popular
```

#### 2. Buscar Thread por ID
```bash
GET /api/v1/threads/:threadId

Exemplo:
GET /api/v1/threads/550e8400-e29b-41d4-a716-446655440000
```

#### 3. Buscar Thread por Slug
```bash
GET /api/v1/threads/category/:categoryId/slug/:slug

Exemplo:
GET /api/v1/threads/category/uuid/slug/dune-parte-dois-2024
```

### Rotas Autenticadas

#### 1. Criar Thread
```bash
POST /api/v1/threads
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "categoryId": "uuid",
  "template": "midia|jogos|software|torrent|postagem",
  "title": "string (5-200 caracteres)",
  "content": { ... }
}
```

#### 2. Atualizar Thread
```bash
PATCH /api/v1/threads/:threadId
Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "title": "string (opcional)",
  "content": { campos parciais, opcional },
  "status": "string (opcional, apenas moderador+)"
}

# Autor pode editar título e conteúdo
# Moderador+ pode editar tudo
```

#### 3. Deletar Thread
```bash
DELETE /api/v1/threads/:threadId
Authorization: Bearer {token}

# Autor pode deletar sua própria thread
# Moderador+ pode deletar qualquer thread
```

### Rotas Administrativas (Moderador+)

#### 1. Fixar/Desfixar Thread
```bash
PATCH /api/v1/threads/:threadId/toggle-pin
Authorization: Bearer {token}

# Alterna entre fixado/não fixado
```

#### 2. Bloquear/Desbloquear Thread
```bash
PATCH /api/v1/threads/:threadId/toggle-lock
Authorization: Bearer {token}

# Alterna entre bloqueado/desbloqueado
# Thread bloqueada não permite novas respostas
```

#### 3. Arquivar Thread
```bash
PATCH /api/v1/threads/:threadId/archive
Authorization: Bearer {token}

# Define status como 'archived'
```

## Integração com Categorias

Quando uma categoria **leaf node** (sem subcategorias) é buscada, as threads são incluídas automaticamente na resposta:

```bash
GET /api/v1/categories/:categoryId?limit=20&offset=0

# Se categoria não tiver subcategorias, response inclui:
{
  "success": true,
  "data": {
    "category": { ... },
    "subcategories": [],
    "threads": [ ... ],
    "pagination": {
      "total": 156,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Regras e Validações

### Criação de Threads

- ✅ **Categoria Leaf**: Thread só pode ser criada em categoria sem subcategorias
- ✅ **Categoria Ativa**: Categoria não pode estar bloqueada (is_locked = false)
- ✅ **Permissão de Cargo**: Usuário deve ter cargo suficiente para o template escolhido
- ✅ **Título Único**: Slug é gerado automaticamente e garantido único por categoria
- ✅ **Validação de Conteúdo**: Cada template tem validações específicas via Zod

### Permissões por Template

| Template | Cargos Permitidos |
|----------|-------------------|
| **midia** | uploader, suporte, moderador, admin, master |
| **jogos** | uploader, suporte, moderador, admin, master |
| **software** | uploader, suporte, moderador, admin, master |
| **torrent** | uploader, suporte, moderador, admin, master |
| **postagem** | usuario, vip, uploader, suporte, moderador, admin, master |

### Edição e Exclusão

- ✅ **Autor**: Pode editar/deletar apenas suas próprias threads
- ✅ **Moderador+**: Pode editar/deletar qualquer thread
- ✅ **Status**: Apenas moderador+ pode alterar status da thread
- ✅ **Pin/Lock**: Apenas moderador+ pode fixar/bloquear threads

## Funcionalidades Automáticas

### Contadores

Os contadores são atualizados **automaticamente via triggers SQL**:
- `view_count` - Incrementado automaticamente ao visualizar thread
- `reply_count` - Atualizado quando respostas são adicionadas (implementar futuramente)
- `last_reply_at` - Data da última resposta
- `last_reply_by` - ID do usuário da última resposta

### Slug Automático

- Gerado automaticamente a partir do título
- Remove acentos e caracteres especiais
- Garante unicidade por categoria
- Formato: `titulo-da-thread-123` (adiciona número se necessário)

### Validações SQL

Triggers SQL garantem integridade:
- Impede criar thread em categoria não-leaf
- Atualiza contadores nas categorias automaticamente
- Atualiza `updated_at` automaticamente
- CASCADE DELETE remove conteúdo ao deletar thread

## Estrutura do Banco de Dados

### Tabela Principal: `threads`

```sql
- id (UUID, PK)
- category_id (UUID, FK → categories)
- author_id (UUID, FK → profiles)
- template (enum: midia, jogos, software, torrent, postagem)
- title (VARCHAR 200)
- slug (VARCHAR 250, único por categoria)
- status (enum: active, locked, pinned, archived)
- view_count (INTEGER)
- reply_count (INTEGER)
- is_pinned (BOOLEAN)
- is_locked (BOOLEAN)
- last_reply_at (TIMESTAMP)
- last_reply_by (UUID)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabelas de Conteúdo

Cada template tem sua própria tabela:
- `thread_midia_content`
- `thread_jogos_content`
- `thread_software_content`
- `thread_torrent_content`
- `thread_postagem_content`

Relacionamento: **1:1** com `threads` via `thread_id` (PK, FK)

### Funções SQL Úteis

```sql
-- Verificar se categoria é leaf
SELECT is_leaf_category('uuid-categoria');

-- Obter breadcrumbs
SELECT * FROM get_category_breadcrumbs('uuid-categoria');

-- Expirar banimentos (cronjob)
SELECT expire_temporary_bans();
```

## Exemplos de Uso no Frontend

### Listar Threads de uma Categoria

```typescript
// Buscar categoria (threads vêm automaticamente se for leaf)
const response = await fetch('/api/v1/categories/slug/4k-uhd');
const { category, subcategories, threads, pagination } = await response.json();

if (threads) {
  // É leaf node - mostrar threads
  threads.forEach(thread => {
    console.log(`${thread.title} - ${thread.view_count} views`);
  });
}
```

### Criar Thread de Filme

```typescript
async function createMovieThread(data) {
  const response = await fetch('/api/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      categoryId: data.categoryId,
      template: 'midia',
      title: data.title,
      content: {
        nome_conteudo: data.nome,
        genero: data.generos,
        sinopse: data.sinopse,
        tamanho: data.tamanho,
        formato: data.formatos,
        link_download: data.linkDownload,
        idiomas: data.idiomas,
        ano: data.ano,
        qualidade: data.qualidade,
        tmdb_id: data.tmdbId
      }
    })
  });

  return response.json();
}
```

### Buscar e Exibir Thread

```typescript
async function getThread(threadId) {
  const response = await fetch(`/api/v1/threads/${threadId}`);
  const { thread } = await response.json();

  // Thread vem com autor, categoria e breadcrumbs
  console.log('Título:', thread.title);
  console.log('Autor:', thread.author.username);
  console.log('Categoria:', thread.category.name);
  console.log('Breadcrumbs:', thread.breadcrumbs);
  console.log('Conteúdo:', thread.content);
}
```

## Troubleshooting

### Erro: "Threads só podem ser criadas em categorias finais"
- A categoria escolhida tem subcategorias
- Solução: Escolha uma categoria que não tenha subcategorias (leaf node)

### Erro: "Seu cargo não tem permissão para criar threads do tipo X"
- Seu cargo não tem permissão para usar este template
- Solução: Use template "postagem" ou solicite promoção para uploader

### Erro: "Esta categoria está bloqueada para novos threads"
- A categoria está com `is_locked = true`
- Solução: Aguarde desbloqueio ou escolha outra categoria

### Thread não aparece na listagem
- Verifique se status é 'active'
- Threads arquivadas não aparecem por padrão
- Use filtro `status=archived` para ver threads arquivadas

## Boas Práticas

1. **Templates Corretos**
   - Use template adequado ao tipo de conteúdo
   - Preencha todos os campos obrigatórios
   - Forneça informações completas e precisas

2. **Títulos Descritivos**
   - Use títulos claros e informativos
   - Inclua informações importantes (qualidade, formato, etc.)
   - Evite ALL CAPS

3. **Categorização Correta**
   - Escolha a categoria mais específica possível
   - Sempre use categorias leaf (finais)
   - Respeite a organização hierárquica

4. **Links de Download**
   - Sempre forneça links válidos e funcionais
   - Considere múltiplas opções de download
   - Mantenha links atualizados

5. **Manutenção**
   - Atualize links quebrados
   - Responda comentários/dúvidas
   - Delete threads desatualizadas

## Próximos Passos

Após implementar threads, considere:

1. ⬜ Sistema de respostas/comentários (posts)
2. ⬜ Sistema de reações (likes, favoritos)
3. ⬜ Sistema de notificações
4. ⬜ Sistema de busca full-text
5. ⬜ Sistema de denúncias
6. ⬜ Sistema de tags automáticas
7. ⬜ Integração com TMDB automática
8. ⬜ Upload de imagens/anexos

## Suporte

Para mais informações, consulte:
- `docs/threads.json` - Documentação completa das rotas
- `sql/migrations/006_threads_system.sql` - Schema do banco
- `src/types/thread.types.ts` - Tipos TypeScript

---

**Desenvolvido para Gtracker Forum Backend**

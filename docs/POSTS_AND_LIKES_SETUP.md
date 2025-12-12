# Sistema de Posts (Comentários) e Likes - Gtracker

## Visão Geral

Sistema completo de comentários (posts/replies) e likes para threads e posts. Usuários podem comentar em threads, responder a comentários (respostas aninhadas) e curtir tanto threads quanto posts.

## Características Principais

- ✅ **Comentários em Threads**: Usuários podem comentar em qualquer thread
- ✅ **Respostas Aninhadas**: Comentários podem ter respostas (parent_post_id)
- ✅ **Likes em Threads**: Curtir threads
- ✅ **Likes em Posts**: Curtir comentários
- ✅ **Perfil Expandido**: Todos os dados do usuário são retornados (nome, avatar, total posts, likes, level, role, ranking, signature)
- ✅ **Contadores Automáticos**: Atualizados via triggers SQL
- ✅ **Edição de Posts**: Posts podem ser editados (marca como editado)
- ✅ **Proteções**: Thread bloqueada impede novos comentários

## Instalação

### 1. Executar Migração SQL

```bash
psql -U seu_usuario -d gtracker_db -f sql/migrations/007_posts_and_likes_system.sql
```

Ou via Supabase SQL Editor:
- Cole o conteúdo de `sql/migrations/007_posts_and_likes_system.sql`
- Execute a query

### 2. Estrutura de Arquivos Criados

```
gtracker-backend/
├── sql/migrations/
│   └── 007_posts_and_likes_system.sql    # Migração SQL
├── src/
│   ├── types/
│   │   ├── post.types.ts                 # Tipos de posts
│   │   └── like.types.ts                 # Tipos de likes
│   ├── repositories/
│   │   ├── post-repository.ts            # Repository de posts
│   │   └── like-repository.ts            # Repository de likes
│   ├── controllers/
│   │   ├── post-controller.ts            # Controller de posts
│   │   └── like-controller.ts            # Controller de likes
│   ├── validators/
│   │   ├── post-validators.ts            # Validações de posts
│   │   └── like-validators.ts            # Validações de likes
│   └── routes/
│       ├── post-routes.ts                # Rotas de posts
│       └── like-routes.ts                # Rotas de likes
└── docs/
    └── POSTS_AND_LIKES_SETUP.md         # Este arquivo
```

## Estrutura do Banco de Dados

### Tabela: `posts`
```sql
- id (UUID, PK)
- thread_id (UUID, FK → threads)
- author_id (UUID, FK → profiles)
- parent_post_id (UUID, FK → posts, nullable) -- Para respostas aninhadas
- content (TEXT, 1-10000 caracteres)
- is_edited (BOOLEAN)
- edited_at (TIMESTAMP, nullable)
- like_count (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabela: `thread_likes`
```sql
- id (UUID, PK)
- thread_id (UUID, FK → threads)
- user_id (UUID, FK → profiles)
- created_at (TIMESTAMP)
- UNIQUE(thread_id, user_id) -- Um usuário só pode curtir uma vez
```

### Tabela: `post_likes`
```sql
- id (UUID, PK)
- post_id (UUID, FK → posts)
- user_id (UUID, FK → profiles)
- created_at (TIMESTAMP)
- UNIQUE(post_id, user_id) -- Um usuário só pode curtir uma vez
```

## Perfil Expandido do Usuário

Sempre que um usuário (autor de thread ou post) for retornado, incluirá:

```typescript
{
  id: string,
  username: string,
  avatar_url: string | null,
  total_posts: number,        // Total de posts/comentários do usuário
  total_likes: number,         // Total de likes recebidos
  level: number,               // Nível do usuário
  role: string,                // Cargo (usuario, uploader, moderador, etc)
  ranking: number,             // Ranking do usuário
  signature: string | null     // Assinatura do usuário
}
```

## Rotas de Posts

### Base URL: `/api/v1/posts`

#### 1. **Criar Post (Comentário)**
```bash
POST /api/v1/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "threadId": "uuid-da-thread",
  "content": "Ótimo conteúdo! Muito obrigado por compartilhar.",
  "parentPostId": null  // Opcional: UUID do post pai para resposta aninhada
}

Response:
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "thread_id": "uuid",
      "author_id": "uuid",
      "parent_post_id": null,
      "content": "...",
      "is_edited": false,
      "edited_at": null,
      "like_count": 0,
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "author": {
        "id": "uuid",
        "username": "john_doe",
        "avatar_url": "https://...",
        "total_posts": 152,
        "total_likes": 487,
        "level": 5,
        "role": "uploader",
        "ranking": 23,
        "signature": "Sempre compartilhando conteúdo de qualidade"
      }
    },
    "message": "Post criado com sucesso"
  }
}
```

#### 2. **Listar Posts de uma Thread**
```bash
GET /api/v1/posts?threadId=uuid&limit=50&offset=0&sortBy=asc

Query Params:
- threadId (obrigatório): UUID da thread
- limit (opcional, default: 50): Posts por página
- offset (opcional, default: 0): Offset de paginação
- sortBy (opcional, default: asc): 'asc' ou 'desc'
- parentPostId (opcional): Filtrar por post pai (null = respostas diretas)

Response:
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "thread_id": "uuid",
        "content": "...",
        "like_count": 15,
        "user_has_liked": true,  // Se o usuário autenticado curtiu
        "author": { ... },  // Perfil expandido
        "is_edited": false,
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### 3. **Buscar Post por ID**
```bash
GET /api/v1/posts/:postId

Response:
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "content": "...",
      "like_count": 15,
      "user_has_liked": false,
      "author": { ... },  // Perfil expandido completo
      ...
    }
  }
}
```

#### 4. **Buscar Respostas de um Post**
```bash
GET /api/v1/posts/:postId/replies?limit=50&offset=0

Response: Mesma estrutura de listar posts
```

#### 5. **Atualizar Post**
```bash
PATCH /api/v1/posts/:postId
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Conteúdo editado..."
}

# Apenas autor ou moderador+ pode editar
# Post automaticamente marcado como is_edited=true
```

#### 6. **Deletar Post**
```bash
DELETE /api/v1/posts/:postId
Authorization: Bearer {token}

# Apenas autor ou moderador+ pode deletar
# Deleta em CASCADE todas as respostas ao post
```

## Rotas de Likes

### Base URL: `/api/v1/likes`

#### Likes em Threads

##### 1. **Curtir/Descurtir Thread (Toggle)**
```bash
POST /api/v1/likes/threads/:threadId
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "hasLiked": true,      // true se curtiu, false se descurtiu
    "likeCount": 342,      // Total de likes atualizado
    "message": "Thread curtida"
  }
}
```

##### 2. **Status de Like da Thread**
```bash
GET /api/v1/likes/threads/:threadId/status
# Público - não requer autenticação
# Se autenticado, retorna se o usuário curtiu

Response:
{
  "success": true,
  "data": {
    "hasLiked": false,     // Se usuário logado curtiu
    "likeCount": 342       // Total de likes
  }
}
```

##### 3. **Listar Quem Curtiu a Thread**
```bash
GET /api/v1/likes/threads/:threadId?limit=50&offset=0
# Público

Response:
{
  "success": true,
  "data": {
    "likes": [
      {
        "user_id": "uuid",
        "username": "john_doe",
        "avatar_url": "https://...",
        "role": "uploader",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "total": 342,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Likes em Posts

##### 1. **Curtir/Descurtir Post (Toggle)**
```bash
POST /api/v1/likes/posts/:postId
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "hasLiked": true,
    "likeCount": 45,
    "message": "Post curtido"
  }
}
```

##### 2. **Status de Like do Post**
```bash
GET /api/v1/likes/posts/:postId/status
```

##### 3. **Listar Quem Curtiu o Post**
```bash
GET /api/v1/likes/posts/:postId?limit=50&offset=0
```

## Funcionalidades Automáticas

### Contadores Atualizados Via Triggers

- **`post.like_count`**: Atualizado ao curtir/descurtir post
- **`thread.reply_count`**: Atualizado ao criar/deletar post
- **`thread.last_reply_at`**: Data do último comentário
- **`thread.last_reply_by`**: ID do autor do último comentário
- **`profiles.total_posts`**: Total de posts do usuário
- **`profiles.total_likes`**: Total de likes recebidos (threads + posts)
- **`categories.post_count`**: Total de posts na categoria

### Proteções SQL

- ❌ **Thread bloqueada**: Impede criação de novos posts via trigger
- ❌ **Like duplicado**: Constraint UNIQUE impede curtir duas vezes
- ✅ **CASCADE DELETE**: Deletar post remove automaticamente:
  - Respostas aninhadas ao post
  - Likes do post
- ✅ **Sincronização automática**: Contadores sempre consistentes

## Exemplos de Uso

### 1. Criar Comentário em Thread

```typescript
async function commentOnThread(threadId: string, content: string) {
  const response = await fetch('/api/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      threadId,
      content
    })
  });

  const { data } = await response.json();
  console.log('Post criado:', data.post);
  console.log('Autor:', data.post.author.username);
  console.log('Total de posts do autor:', data.post.author.total_posts);
}
```

### 2. Listar Comentários com Perfil Completo

```typescript
async function getThreadComments(threadId: string) {
  const response = await fetch(`/api/v1/posts?threadId=${threadId}&limit=20`);
  const { data } = await response.json();

  data.posts.forEach(post => {
    console.log(`${post.author.username} (Level ${post.author.level}):`);
    console.log(`  ${post.content}`);
    console.log(`  ${post.like_count} likes`);
    if (post.author.signature) {
      console.log(`  Assinatura: ${post.author.signature}`);
    }
  });
}
```

### 3. Curtir Thread

```typescript
async function likeThread(threadId: string) {
  const response = await fetch(`/api/v1/likes/threads/${threadId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { data } = await response.json();
  console.log(data.message); // "Thread curtida" ou "Like removido"
  console.log(`Total de likes: ${data.likeCount}`);
}
```

### 4. Responder a um Comentário (Aninhado)

```typescript
async function replyToComment(threadId: string, parentPostId: string, content: string) {
  const response = await fetch('/api/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      threadId,
      parentPostId,  // Resposta aninhada
      content
    })
  });

  return response.json();
}
```

## Regras e Validações

### Posts

- ✅ Conteúdo: 1-10000 caracteres
- ✅ Thread deve existir e não estar bloqueada
- ✅ Parent post (se fornecido) deve existir e pertencer à mesma thread
- ✅ Usuário autenticado pode comentar
- ✅ Apenas autor ou moderador+ pode editar/deletar
- ✅ Post editado é marcado automaticamente com `is_edited=true`

### Likes

- ✅ Usuário pode curtir cada thread/post apenas uma vez
- ✅ Toggle: curtir se não curtiu, descurtir se curtiu
- ✅ Contadores atualizados automaticamente
- ✅ Likes aparecem no perfil do autor (total_likes)

### Permissões

| Ação | Permissão |
|------|-----------|
| **Criar post** | Qualquer usuário autenticado |
| **Editar post** | Autor OU Moderador+ |
| **Deletar post** | Autor OU Moderador+ |
| **Curtir thread/post** | Qualquer usuário autenticado |
| **Ver posts** | Público (sem autenticação) |
| **Ver likes** | Público (sem autenticação) |

## Boas Práticas

1. **Respostas Aninhadas**
   - Use `parentPostId` apenas para responder diretamente a um comentário
   - Limite profundidade de aninhamento no frontend (recomendado: 2 níveis)

2. **Paginação**
   - Use limit/offset para posts longos
   - Ordene por data (asc = mais antigos primeiro)

3. **Likes**
   - Use toggle para simplificar UX (um clique para curtir/descurtir)
   - Mostre contador atualizado imediatamente após toggle

4. **Perfil do Usuário**
   - Exiba signature abaixo de cada post
   - Mostre level e role como badge/tag
   - Use avatar_url para foto do usuário

5. **Edição**
   - Marque posts editados visualmente no frontend
   - Considere mostrar "Editado em [data]"

## Troubleshooting

### Erro: "Não é possível postar em uma thread bloqueada"
- Thread está com `is_locked = true`
- Moderador+ deve desbloquear thread primeiro

### Erro: "Post pai não pertence a esta thread"
- O `parentPostId` fornecido é de outra thread
- Verifique que post pai está na mesma thread

### Like não funciona
- Usuário já curtiu (retorna false mas não erro)
- Verifique autenticação

### Contadores desatualizados
- Execute função de recálculo:
```sql
SELECT recalculate_post_stats();
```

## Estatísticas

Função SQL para recalcular estatísticas (se necessário):

```sql
-- Recalcular todos os contadores
SELECT recalculate_post_stats();

-- Esta função recalcula:
-- - reply_count nas threads
-- - like_count nos posts
-- - total_posts nos perfis
-- - total_likes nos perfis (soma de likes em posts + threads)
```

## Próximos Passos

Após implementar posts e likes, considere:

1. ⬜ Sistema de notificações (alguém respondeu seu post)
2. ⬜ Sistema de menções (@usuario)
3. ⬜ Sistema de citações (quote)
4. ⬜ Markdown nos posts
5. ⬜ Upload de imagens em posts
6. ⬜ Sistema de denúncias de posts
7. ⬜ Moderação em massa
8. ⬜ Badges/conquistas por quantidade de likes

---

**Desenvolvido para Gtracker Forum Backend**

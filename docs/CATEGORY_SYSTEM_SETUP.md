# Sistema de Categorias e Subcategorias - Gtracker

## Visão Geral

Sistema completo de gerenciamento hierárquico de categorias para organização do fórum Gtracker. Suporta até 3 níveis de profundidade com validações, bloqueios e contadores automáticos.

## Estrutura Hierárquica

```
Categoria Principal (Nível 0)
└── Subcategoria (Nível 1)
    └── Sub-subcategoria (Nível 2)
        └── [Threads criadas pelos usuários]
```

**Exemplos:**
```
Social > Notícias > Tecnologia > [Thread: "Nova IA da OpenAI"]
GTracker > Filmes > 4K UHD > [Thread: "Dune 2 Remux"]
Suporte > Suporte Técnico > Bugs no Fórum > [Thread: "Erro ao fazer login"]
```

## Instalação e Configuração

### 1. Executar Migração SQL

Execute a migração para criar as tabelas, funções e triggers:

```bash
psql -U seu_usuario -d gtracker_db -f sql/migrations/004_categories_system.sql
```

Ou via Supabase SQL Editor:
- Cole o conteúdo de `sql/migrations/004_categories_system.sql`
- Execute a query

### 2. Popular com Dados Iniciais (Seed)

O arquivo `docs/seed.json` contém uma estrutura completa de categorias para iniciar o fórum.

**Opção A: Via Script TypeScript**
```bash
npx ts-node scripts/seed-categories.ts
```

**Opção B: Manualmente via API**
```bash
# 1. Autentique como Admin/Master
# 2. Use POST /api/v1/categories para criar cada categoria
```

### 3. Verificar Instalação

```bash
# Listar árvore completa
curl http://localhost:3000/api/v1/categories/tree

# Contar categorias
psql -U seu_usuario -d gtracker_db -c "SELECT COUNT(*) FROM categories;"
```

## Estrutura de Arquivos Criados

```
gtracker-backend/
├── sql/migrations/
│   └── 004_categories_system.sql         # Migração SQL
├── src/
│   ├── types/
│   │   └── category.types.ts             # Interfaces TypeScript
│   ├── repositories/
│   │   └── category-repository.ts        # Repository
│   ├── controllers/
│   │   └── category-controller.ts        # Controller
│   ├── validators/
│   │   └── category-validators.ts        # Validações Zod
│   └── routes/
│       └── category-routes.ts            # Rotas
├── scripts/
│   └── seed-categories.ts                # Script de seed
└── docs/
    ├── seed.json                         # Dados iniciais
    ├── categories.json                   # Documentação das rotas
    └── CATEGORY_SYSTEM_SETUP.md         # Este arquivo
```

## Uso das Rotas

### Base URL
```
/api/v1/categories
```

### Rotas Públicas (Sem Autenticação)

#### 1. Obter Árvore Completa
```bash
GET /api/v1/categories/tree

Response:
{
  "success": true,
  "data": {
    "tree": [
      {
        "id": "uuid",
        "name": "Social",
        "slug": "social",
        "level": 0,
        "thread_count": 0,
        "children": [
          {
            "id": "uuid",
            "name": "Notícias",
            "slug": "noticias",
            "level": 1,
            "children": [...]
          }
        ]
      }
    ],
    "totalCategories": 120
  }
}
```

#### 2. Listar Categorias Raiz
```bash
GET /api/v1/categories/root
```

#### 3. Buscar por Slug
```bash
GET /api/v1/categories/slug/social
```

#### 4. Buscar por ID
```bash
GET /api/v1/categories/{categoryId}
```

### Rotas Administrativas (Requer Admin/Master)

#### 1. Criar Categoria
```bash
POST /api/v1/categories
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Tecnologia",
  "slug": "tecnologia",
  "description": "Discussões sobre tecnologia",
  "parentId": null,
  "displayOrder": 0,
  "isLocked": false,
  "icon": "💻"
}
```

#### 2. Criar Subcategoria
```bash
POST /api/v1/categories
Authorization: Bearer {token}

{
  "name": "Inteligência Artificial",
  "slug": "inteligencia-artificial",
  "description": "Tópicos sobre IA e ML",
  "parentId": "uuid-da-categoria-tecnologia",
  "displayOrder": 0
}
```

#### 3. Atualizar Categoria
```bash
PATCH /api/v1/categories/{categoryId}
Authorization: Bearer {token}

{
  "name": "Tech & Innovation",
  "description": "Tecnologia e inovação",
  "icon": "🚀"
}
```

#### 4. Deletar Categoria
```bash
DELETE /api/v1/categories/{categoryId}
Authorization: Bearer {token}

# ⚠️ Só funciona se:
# - Não tiver subcategorias
# - Não tiver threads
```

#### 5. Reordenar Categorias
```bash
PUT /api/v1/categories/reorder
Authorization: Bearer {token}

{
  "categories": [
    { "id": "uuid-1", "displayOrder": 0 },
    { "id": "uuid-2", "displayOrder": 1 },
    { "id": "uuid-3", "displayOrder": 2 }
  ]
}
```

#### 6. Bloquear/Desbloquear Categoria
```bash
PATCH /api/v1/categories/{categoryId}/toggle-lock
Authorization: Bearer {token}

# Alterna entre bloqueado/desbloqueado
# Bloqueado = não permite criar novos threads
```

## Regras e Validações

### Hierarquia
- ✅ Máximo 3 níveis: Categoria > Subcategoria > Sub-subcategoria
- ❌ Não pode criar nível 3 (sub-sub-subcategoria)
- ✅ Categoria pai deve existir
- ❌ Categoria não pode ser pai de si mesma

### Slugs
- ✅ Deve ser único em todo o sistema
- ✅ Apenas letras minúsculas, números e hífens
- ✅ Gerado automaticamente no seed
- ❌ Caracteres especiais não permitidos

### Exclusão
- ❌ Não pode deletar se tiver subcategorias
- ❌ Não pode deletar se tiver threads
- ✅ Deve deletar threads primeiro
- ✅ Deve deletar subcategorias primeiro (de baixo para cima)

### Bloqueio
- ✅ Categoria bloqueada impede criação de novos threads
- ✅ Threads existentes permanecem visíveis
- ✅ Pode ser revertido a qualquer momento

## Funcionalidades Automáticas

### Contadores
Os contadores são atualizados **automaticamente via triggers SQL**:
- `thread_count` - Total de threads na categoria
- `post_count` - Total de posts em todas as threads
- `last_thread_id` - ID da última thread criada
- `last_post_at` - Data do último post

### Nível da Categoria
O campo `level` é calculado **automaticamente** ao criar/atualizar:
- Categoria raiz: `level = 0`
- Subcategoria: `level = parent.level + 1`
- Validado via trigger SQL

### Proteções SQL
Triggers SQL protegem a integridade dos dados:
- Impede deletar categoria com threads
- Valida nível máximo (2)
- Atualiza contadores automaticamente
- Impede referências circulares

## Estrutura do seed.json

O arquivo `docs/seed.json` contém 6 categorias principais:

```json
{
  "categorias": [
    {
      "nome": "Social",
      "subcategorias": [
        {
          "nome": "Notícias",
          "subcategorias": [
            { "nome": "Mundo" },
            { "nome": "Tecnologia" }
          ]
        }
      ]
    }
  ]
}
```

**Categorias Incluídas:**
1. **Social** - Notícias, Novidades, Cargos Abertos, Apresentações
2. **GTracker** - Filmes, Séries, Jogos, Softwares
3. **Comunidade** - Filmes, Séries, Jogos, Criadores de Conteúdo
4. **Suporte** - Suporte Técnico, Tutoriais, Sugestões
5. **Entretenimento** - Músicas, Animes & Mangás, Livros & HQs
6. **Off-Topic** - Conversas Gerais, Tecnologia, Humor, Marketplace

## Funções SQL Úteis

### get_category_tree()
Retorna árvore completa de categorias
```sql
SELECT * FROM get_category_tree();
```

### get_subcategories(parent_id)
Retorna subcategorias diretas de uma categoria
```sql
SELECT * FROM get_subcategories('uuid-da-categoria');
```

### calculate_category_level(category_id)
Calcula o nível de uma categoria na hierarquia
```sql
SELECT calculate_category_level('uuid-da-categoria');
```

## Exemplos de Uso no Frontend

### Renderizar Menu de Navegação
```typescript
// Buscar árvore completa
const response = await fetch('/api/v1/categories/tree');
const { data } = await response.json();

// Renderizar recursivamente
function renderTree(categories) {
  return categories.map(cat => (
    <li key={cat.id}>
      <a href={`/forum/${cat.slug}`}>
        {cat.icon} {cat.name}
      </a>
      {cat.children.length > 0 && (
        <ul>{renderTree(cat.children)}</ul>
      )}
    </li>
  ));
}
```

### Exibir Categoria com Subcategorias
```typescript
// Buscar categoria específica
const response = await fetch('/api/v1/categories/slug/social');
const { category, subcategories } = await response.data;

// Renderizar
<CategoryPage category={category}>
  <SubcategoriesList items={subcategories} />
</CategoryPage>
```

### Painel Admin - Criar Categoria
```typescript
async function createCategory(data) {
  const response = await fetch('/api/v1/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: data.name,
      slug: generateSlug(data.name),
      description: data.description,
      parentId: data.parentId || null,
      icon: data.icon
    })
  });

  return response.json();
}
```

## Troubleshooting

### Erro: "Não é permitido criar subcategorias além do nível 2"
- Você está tentando criar uma sub-sub-subcategoria (nível 3)
- Solução: Crie a categoria em um nível superior

### Erro: "Slug já está em uso"
- O slug deve ser único em todo o sistema
- Solução: Use um slug diferente

### Erro: "Não é possível deletar categoria com X thread(s)"
- A categoria tem threads existentes
- Solução: Delete ou mova as threads primeiro

### Erro: "Categoria pai não encontrada"
- O parentId fornecido não existe
- Solução: Verifique o ID da categoria pai

### Script de seed não funciona
- Verifique se a migração SQL foi executada
- Verifique conexão com o banco de dados
- Verifique se o arquivo seed.json existe

## Boas Práticas

1. **Organização**
   - Mantenha hierarquia lógica (3 níveis no máximo)
   - Agrupe conteúdo relacionado
   - Use nomes descritivos e claros

2. **Slugs**
   - Use slugs curtos e memoráveis
   - Evite caracteres especiais
   - Mantenha consistência (tudo minúsculo)

3. **Ícones**
   - Use emojis para categorias principais
   - Facilita identificação visual
   - Opcional para subcategorias

4. **Manutenção**
   - Bloqueie categorias durante reorganização
   - Delete threads antes de deletar categorias
   - Mantenha backup antes de mudanças grandes

5. **Performance**
   - Use cache para árvore de categorias
   - Árvore muda raramente, ideal para cache
   - Invalide cache ao criar/editar categorias

## Segurança

- ✅ Rotas públicas: Leitura apenas
- ✅ Rotas administrativas: Requer Admin/Master
- ✅ Validação de inputs via Zod
- ✅ Proteção SQL contra exclusões indevidas
- ✅ Slugs sanitizados automaticamente

## Próximos Passos

1. ✅ Executar migração SQL
2. ✅ Popular com seed inicial
3. ⬜ Implementar sistema de threads
4. ⬜ Adicionar permissões por categoria
5. ⬜ Implementar moderação de categorias
6. ⬜ Criar painel admin no frontend
7. ⬜ Adicionar estatísticas por categoria
8. ⬜ Implementar breadcrumbs automáticos

## Suporte

Para mais informações, consulte:
- `docs/categories.json` - Documentação completa das rotas
- `sql/migrations/004_categories_system.sql` - Schema do banco
- `docs/seed.json` - Estrutura de categorias inicial

---

**Desenvolvido para Gtracker Forum Backend**

# Sistema de Hierarquia de Cargos - Gtracker

## Visão Geral

Sistema completo de gerenciamento de cargos hierárquicos com banimentos e promoções para o fórum Gtracker. Implementa controle granular de permissões baseado em hierarquia de cargos.

## Hierarquia de Cargos

```
6. Master      → Controla tudo
5. Admin       → Gerencia moderadores e abaixo
4. Moderador   → Administra suporte para baixo
3. Suporte     → Cargo de suporte/helper
2. Uploader    → Usuário com permissão de upload
1. Usuário/VIP → Cargo padrão
```

## Instalação e Configuração

### 1. Executar Migração SQL

Execute a migração para criar as tabelas e funções necessárias:

```bash
psql -U seu_usuario -d gtracker_db -f sql/migrations/003_role_hierarchy_system.sql
```

Ou usando o Supabase:
- Acesse o SQL Editor no dashboard do Supabase
- Cole o conteúdo de `sql/migrations/003_role_hierarchy_system.sql`
- Execute a query

### 2. Criar Primeiro Usuário Master (Opcional)

Se você quiser criar um usuário Master inicial, descomente as linhas finais do arquivo de migração ou execute:

```sql
-- Atualizar um usuário existente para Master
UPDATE profiles
SET role = 'master'
WHERE user_id = (SELECT id FROM users WHERE username = 'seu_username');
```

### 3. Configurar Cron Job (Recomendado)

Para expirar banimentos temporários automaticamente, configure um cron job:

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada 5 minutos)
*/5 * * * * psql -U seu_usuario -d gtracker_db -c "SELECT expire_temporary_bans();"
```

Ou use um agendador de tarefas no seu ambiente:

**Node.js com node-cron:**
```typescript
import cron from 'node-cron';
import { supabase } from './config/database';

// Executar a cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  const { data, error } = await supabase.rpc('expire_temporary_bans');
  if (error) {
    console.error('Erro ao expirar banimentos:', error);
  } else {
    console.log(`${data} banimentos expirados`);
  }
});
```

## Estrutura de Arquivos Criados

```
gtracker-backend/
├── sql/migrations/
│   └── 003_role_hierarchy_system.sql      # Migração SQL
├── src/
│   ├── controllers/
│   │   └── moderation-controller.ts       # Controller de moderação
│   ├── middlewares/
│   │   └── role-middleware.ts             # Middlewares de hierarquia
│   ├── repositories/
│   │   ├── ban-repository.ts              # Repository de banimentos
│   │   └── role-change-repository.ts      # Repository de mudanças de cargo
│   ├── routes/
│   │   └── moderation-routes.ts           # Rotas de moderação
│   └── validators/
│       └── moderation-validators.ts       # Validações de moderação
└── docs/
    ├── moderation.json                    # Documentação das rotas
    └── ROLE_SYSTEM_SETUP.md              # Este arquivo
```

## Uso das Rotas

### Base URL
```
/api/v1/moderation
```

### Autenticação
Todas as rotas requerem:
- Header: `Authorization: Bearer {token}`
- Cargo mínimo: **Moderador**

### Exemplos de Uso

#### 1. Banir Usuário (Temporário)
```bash
POST /api/v1/moderation/bans/{userId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "Spam repetido após advertência",
  "isPermanent": false,
  "expiresInDays": 7
}
```

#### 2. Banir Usuário (Permanente)
```bash
POST /api/v1/moderation/bans/{userId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "Violação grave das regras da comunidade",
  "isPermanent": true
}
```

#### 3. Desbanir Usuário
```bash
DELETE /api/v1/moderation/bans/{userId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "Apelo aceito após revisão"
}
```

#### 4. Promover Usuário
```bash
PATCH /api/v1/moderation/roles/{userId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "newRole": "moderador",
  "reason": "Contribuições consistentes e comportamento exemplar"
}
```

#### 5. Listar Usuários Banidos
```bash
GET /api/v1/moderation/bans?limit=50&offset=0
Authorization: Bearer {token}
```

#### 6. Ver Histórico de Banimentos
```bash
GET /api/v1/moderation/bans/history/{userId}
Authorization: Bearer {token}
```

#### 7. Ver Histórico de Mudanças de Cargo
```bash
GET /api/v1/moderation/roles/history/{userId}?limit=50
Authorization: Bearer {token}
```

#### 8. Estatísticas de Moderação
```bash
GET /api/v1/moderation/stats
Authorization: Bearer {token}
```

## Regras de Hierarquia

### Banimentos
- **Master**: Pode banir qualquer usuário
- **Admin**: Pode banir de Moderador para baixo
- **Moderador**: Pode banir de Suporte para baixo

### Mudanças de Cargo
- **Master**: Pode alterar qualquer cargo para qualquer cargo
- **Admin**: Pode gerenciar de Moderador para baixo
- **Moderador**: Pode gerenciar de Suporte para baixo

**Regras importantes:**
- Não pode promover alguém ao seu próprio cargo ou superior
- Não pode alterar cargo de alguém do mesmo cargo ou superior
- Não pode se auto-promover

### Exemplos de Ações Permitidas/Negadas

✅ **PERMITIDO:**
- Admin promove Usuário → Moderador
- Admin rebaixa Moderador → Usuário
- Moderador promove Usuário → Suporte
- Master faz qualquer mudança

❌ **NEGADO:**
- Admin tenta promover Usuário → Admin (não pode atribuir seu próprio cargo)
- Moderador tenta banir Admin (cargo superior)
- Admin tenta alterar cargo de outro Admin (mesmo cargo)
- Moderador tenta promover Usuário → Moderador (seu próprio cargo)

## Auditoria e Logs

Todas as ações de moderação são registradas com:
- ✅ Usuário que realizou a ação
- ✅ Usuário alvo da ação
- ✅ Motivo fornecido
- ✅ IP de origem
- ✅ User-Agent
- ✅ Timestamp

## Tabelas do Banco de Dados

### `bans`
Armazena todos os banimentos (ativos e históricos)
- Banimentos temporários têm `expires_at` definido
- Banimentos permanentes têm `expires_at = NULL`
- `is_active` indica se o banimento está ativo

### `unbans`
Registra todos os desbanimentos realizados
- Referencia o `ban_id` original
- Armazena quem desbaniu e o motivo

### `role_changes`
Histórico completo de mudanças de cargo
- Registra cargo anterior e novo
- Armazena quem fez a mudança e o motivo

## Funções SQL Úteis

### get_role_hierarchy(role)
Retorna o nível hierárquico numérico de um cargo
```sql
SELECT get_role_hierarchy('admin');  -- Retorna 5
```

### can_manage_user(manager_role, target_role)
Verifica se um cargo pode gerenciar outro
```sql
SELECT can_manage_user('admin', 'moderador');  -- Retorna true
SELECT can_manage_user('moderador', 'admin');  -- Retorna false
```

### expire_temporary_bans()
Expira banimentos temporários que já passaram da data
```sql
SELECT expire_temporary_bans();  -- Retorna número de banimentos expirados
```

## Sincronização Automática

O sistema possui um **trigger SQL** que sincroniza automaticamente o campo `is_banned` na tabela `profiles` quando:
- Um novo banimento é criado → `is_banned = true`
- Um banimento é desativado → `is_banned = false`

**Não é necessário atualizar manualmente!**

## Boas Práticas

1. **Motivos Claros**: Sempre forneça motivos detalhados (mínimo 10 caracteres)
2. **Banimentos Graduais**: Use temporários para infrações leves
3. **Revise Histórico**: Verifique banimentos anteriores antes de aplicar novos
4. **Documente Promoções**: Deixe claro por que alguém foi promovido
5. **Limite Masters**: Deve haver apenas um ou poucos Masters
6. **Controle Admins**: Mantenha número limitado de Admins
7. **Promoção Gradual**: usuario → uploader → suporte → moderador

## Troubleshooting

### Erro: "Você não tem permissão para banir este usuário"
- Verifique se você tem cargo suficiente na hierarquia
- Verifique se o usuário alvo tem cargo inferior ao seu

### Erro: "Usuário já está banido"
- O usuário já possui um banimento ativo
- Use a rota de desbanir primeiro se necessário

### Banimentos temporários não estão expirando
- Verifique se o cron job está configurado corretamente
- Execute manualmente: `SELECT expire_temporary_bans();`

### Erro: "O usuário já possui este cargo"
- Verifique o cargo atual do usuário antes de tentar alterar

## Testes Recomendados

1. Criar usuários de teste com diferentes cargos
2. Testar banimentos entre diferentes níveis hierárquicos
3. Testar mudanças de cargo respeitando hierarquia
4. Verificar se triggers de sincronização funcionam
5. Testar expiração de banimentos temporários
6. Verificar se histórico está sendo registrado corretamente

## Suporte

Para mais informações, consulte:
- `docs/moderation.json` - Documentação completa das rotas
- `sql/migrations/003_role_hierarchy_system.sql` - Schema do banco de dados

## Próximos Passos Sugeridos

1. ✅ Executar migração SQL
2. ✅ Criar usuário Master inicial
3. ✅ Configurar cron job para expiração de banimentos
4. ⬜ Implementar verificação de `is_banned` no auth-middleware
5. ⬜ Criar painel admin no frontend
6. ⬜ Adicionar notificações de banimento por email
7. ⬜ Implementar sistema de apelação de banimentos
8. ⬜ Criar dashboard de estatísticas de moderação

---

**Desenvolvido para Gtracker Forum Backend**

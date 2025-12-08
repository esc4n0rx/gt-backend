# Setup da Feature de Profile

## Resumo

Sistema completo de personalização de perfil para o Gtracker Forum Backend com:
- Upload de avatar, banner e assinatura via Cloudinary
- Alteração de nome e bio
- Alteração de email e senha com verificação via código enviado por email (Resend)

---

## 1. Dependências Instaladas

```bash
pnpm add cloudinary resend multer @types/multer
```

---

## 2. Configuração de Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Cloudinary (Upload de imagens)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (Envio de emails)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@gtracker.com
```

### Como obter as credenciais:

#### Cloudinary
1. Acesse https://cloudinary.com/
2. Crie uma conta gratuita
3. No dashboard, copie:
   - Cloud Name
   - API Key
   - API Secret

#### Resend
1. Acesse https://resend.com/
2. Crie uma conta
3. Gere uma API Key no dashboard
4. Configure o domínio para EMAIL_FROM (ou use o domínio de teste)

---

## 3. Migrations do Banco de Dados

Execute as migrations SQL no Supabase:

### 3.1. Migration 001 (já existe)
```sql
-- Cria tabelas users e profiles
-- Arquivo: sql/migrations/001_create_users_and_profiles.sql
```

### 3.2. Migration 002 (nova)
```sql
-- Cria tabela verification_codes para códigos de verificação
-- Arquivo: sql/migrations/002_create_verification_codes.sql
```

Execute no SQL Editor do Supabase:
```bash
# Copie e execute o conteúdo de 002_create_verification_codes.sql
```

---

## 4. Estrutura de Arquivos Criados

```
src/
├── config/
│   └── cloudinary.ts              # Configuração e funções do Cloudinary
├── controllers/
│   └── profile-controller.ts      # Controller de perfil
├── middlewares/
│   └── upload-middleware.ts       # Middleware Multer para uploads
├── repositories/
│   ├── profile-repository.ts      # Repository de perfil (atualizado)
│   ├── user-repository.ts         # Repository de user (atualizado)
│   └── verification-code-repository.ts  # Repository de códigos
├── routes/
│   ├── index.ts                   # Router principal (atualizado)
│   └── profile-routes.ts          # Rotas de perfil
├── services/
│   ├── email-service.ts           # Serviço de envio de emails
│   └── profile-service.ts         # Serviço de perfil
└── validators/
    └── profile-validators.ts      # Validações Zod

sql/
└── migrations/
    └── 002_create_verification_codes.sql

docs/
├── profile.json                   # Documentação completa da API
└── PROFILE_SETUP.md              # Este arquivo
```

---

## 5. Rotas Disponíveis

Todas as rotas requerem autenticação (Bearer Token).

### 5.1. Perfil Básico
- `GET /api/v1/profile` - Buscar perfil
- `PATCH /api/v1/profile` - Atualizar nome e/ou bio

### 5.2. Uploads de Imagem
- `POST /api/v1/profile/avatar` - Upload de avatar (máx 5MB)
- `POST /api/v1/profile/banner` - Upload de banner (máx 10MB)
- `POST /api/v1/profile/signature` - Upload de assinatura (máx 2MB)
- `DELETE /api/v1/profile/signature` - Remover assinatura

### 5.3. Alteração de Email
- `POST /api/v1/profile/email/request` - Solicitar alteração
- `POST /api/v1/profile/email/confirm` - Confirmar com código

### 5.4. Alteração de Senha
- `POST /api/v1/profile/password/request` - Solicitar alteração
- `POST /api/v1/profile/password/confirm` - Confirmar com código

---

## 6. Exemplos de Uso

### 6.1. Atualizar Nome e Bio
```bash
curl -X PATCH http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "bio": "Desenvolvedor full-stack"
  }'
```

### 6.2. Upload de Avatar
```bash
curl -X POST http://localhost:3000/api/v1/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

### 6.3. Alterar Email (Fluxo Completo)

**Passo 1: Solicitar alteração**
```bash
curl -X POST http://localhost:3000/api/v1/profile/email/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newEmail": "novoemail@example.com",
    "password": "minhasenha123"
  }'
```

**Passo 2: Verificar email e confirmar**
```bash
# Usuário recebe código de 6 dígitos no email
curl -X POST http://localhost:3000/api/v1/profile/email/confirm \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

### 6.4. Alterar Senha (Fluxo Completo)

**Passo 1: Solicitar alteração**
```bash
curl -X POST http://localhost:3000/api/v1/profile/password/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "senhaantiga123",
    "newPassword": "senhanova456"
  }'
```

**Passo 2: Verificar email e confirmar**
```bash
# Usuário recebe código de 6 dígitos no email
curl -X POST http://localhost:3000/api/v1/profile/password/confirm \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

---

## 7. Validações e Restrições

### Campos que o usuário PODE alterar:
- ✅ `name` (via PATCH /profile)
- ✅ `bio` (via PATCH /profile)
- ✅ `avatar_url` (via POST /profile/avatar)
- ✅ `banner_url` (via POST /profile/banner)
- ✅ `signature` (via POST /profile/signature)
- ✅ `email` (via fluxo de verificação)
- ✅ `password` (via fluxo de verificação)

### Campos que o usuário NÃO PODE alterar:
- ❌ `username` (permanente)
- ❌ `ranking` (controlado pelo sistema)
- ❌ `role` (apenas admin)
- ❌ `level` (controlado pelo sistema)
- ❌ `total_posts` (atualizado automaticamente)
- ❌ `total_likes` (atualizado automaticamente)
- ❌ `is_banned` (apenas admin)

### Limites de Upload:
- Avatar: 5MB, apenas imagens
- Banner: 10MB, apenas imagens
- Assinatura: 2MB, PNG/JPG/GIF apenas

### Códigos de Verificação:
- Formato: 6 dígitos numéricos
- Validade: 15 minutos
- Uso único: código é invalidado após uso
- Códigos pendentes anteriores são deletados ao solicitar novo

---

## 8. Segurança

### Autenticação
- Todas as rotas requerem JWT válido
- Token verificado contra blacklist
- Usuário banido não pode acessar

### Validação de Arquivos
- Tipo MIME verificado
- Tamanho máximo validado
- Apenas formatos permitidos aceitos

### Alteração de Credenciais
- Email: requer senha atual para confirmar identidade
- Senha: requer senha atual
- Ambos requerem confirmação via código enviado por email
- Códigos expiram em 15 minutos
- Hash bcrypt com 12 rounds para senhas

### Cloudinary
- Imagens antigas são deletadas ao fazer upload de novas
- Cada imagem é vinculada ao userId via metadata
- Otimização automática de qualidade e formato

---

## 9. Troubleshooting

### Erro: "CLOUDINARY_CLOUD_NAME é obrigatória"
- Verifique se as variáveis do Cloudinary estão no .env
- Execute `pnpm add cloudinary` novamente

### Erro: "RESEND_API_KEY é obrigatória"
- Verifique se a chave do Resend está no .env
- Teste a chave no dashboard do Resend

### Erro: "Falha ao enviar email de verificação"
- Verifique se o domínio está configurado no Resend
- Use o domínio de teste fornecido pelo Resend em desenvolvimento

### Erro: "Código inválido ou expirado"
- Código expira em 15 minutos
- Verifique se está usando o código correto
- Solicite um novo código

### Upload falha
- Verifique tamanho do arquivo
- Verifique formato do arquivo
- Verifique credenciais do Cloudinary

---

## 10. Próximos Passos

1. Execute as migrations SQL no Supabase
2. Configure as credenciais do Cloudinary e Resend no .env
3. Reinicie o servidor para carregar as novas variáveis
4. Teste as rotas usando os exemplos acima
5. Integre o frontend com as rotas documentadas

---

## 11. Referências

- Documentação completa da API: `docs/profile.json`
- Cloudinary Docs: https://cloudinary.com/documentation
- Resend Docs: https://resend.com/docs
- Multer Docs: https://github.com/expressjs/multer

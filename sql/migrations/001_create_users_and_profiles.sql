-- ============================================
-- MIGRATION: Criar tabelas de usuários e perfis
-- Gtracker Forum Backend
-- ============================================

-- Configurar timezone para São Paulo
SET timezone = 'America/Sao_Paulo';

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    invite_code_used VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    
    -- Constraints
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20),
    CONSTRAINT users_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Índices para busca otimizada (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TYPE user_role AS ENUM ('usuario', 'moderador', 'admin', 'vip');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT NOT NULL DEFAULT 'https://gtracker.com/assets/default-avatar.png',
    banner_url TEXT NOT NULL DEFAULT 'https://gtracker.com/assets/default-banner.png',
    bio TEXT NOT NULL DEFAULT '',
    signature TEXT NOT NULL DEFAULT '',
    total_posts INTEGER NOT NULL DEFAULT 0,
    total_likes INTEGER NOT NULL DEFAULT 0,
    ranking INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    role user_role NOT NULL DEFAULT 'usuario',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    
    -- Constraints
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
    CONSTRAINT profiles_total_posts_positive CHECK (total_posts >= 0),
    CONSTRAINT profiles_total_likes_positive CHECK (total_likes >= 0),
    CONSTRAINT profiles_ranking_positive CHECK (ranking >= 0),
    CONSTRAINT profiles_level_positive CHECK (level >= 0)
);

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles (is_banned) WHERE is_banned = TRUE;

-- ============================================
-- TABELA: token_blacklist (para logout)
-- ============================================
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    
    -- Índice para busca rápida do token
    CONSTRAINT token_blacklist_token_unique UNIQUE (token)
);

-- Índice para limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist (expires_at);

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para profiles
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO: Limpar tokens expirados (executar via cron)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE users IS 'Tabela principal de usuários do fórum Gtracker';
COMMENT ON TABLE profiles IS 'Perfis públicos dos usuários com estatísticas e configurações';
COMMENT ON TABLE token_blacklist IS 'Tokens JWT invalidados (logout)';

COMMENT ON COLUMN users.username IS 'Nome de usuário único para login (3-20 caracteres)';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha do usuário';
COMMENT ON COLUMN users.invite_code_used IS 'Código de convite utilizado no registro (opcional)';

COMMENT ON COLUMN profiles.role IS 'Cargo do usuário: usuario, moderador, admin, vip';
COMMENT ON COLUMN profiles.is_banned IS 'Indica se o usuário está banido do fórum';
COMMENT ON COLUMN profiles.total_posts IS 'Contador de posts criados pelo usuário';
COMMENT ON COLUMN profiles.total_likes IS 'Contador de curtidas recebidas pelo usuário';
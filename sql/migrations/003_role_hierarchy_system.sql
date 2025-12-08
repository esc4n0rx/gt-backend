-- ============================================
-- MIGRATION: Sistema de Hierarquia de Cargos
-- Gtracker Forum Backend
-- ============================================

-- Configurar timezone para São Paulo
SET timezone = 'America/Sao_Paulo';

-- ============================================
-- ATUALIZAR ENUM: user_role
-- Adicionar novos cargos: master, suporte, uploader
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'master';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'suporte';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'uploader';

-- ============================================
-- TABELA: role_changes
-- Registro de alterações de cargo (promoções/rebaixamentos)
-- ============================================
CREATE TABLE IF NOT EXISTS role_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_role user_role NOT NULL,
    new_role user_role NOT NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),

    -- Constraints
    CONSTRAINT role_changes_different_roles CHECK (old_role != new_role)
);

-- Índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_role_changes_target_user ON role_changes (target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_changed_by ON role_changes (changed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_created_at ON role_changes (created_at DESC);

-- ============================================
-- TABELA: bans
-- Registro de banimentos de usuários
-- ============================================
CREATE TABLE IF NOT EXISTS bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_permanent BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),

    -- Constraints
    CONSTRAINT bans_expiration_logic CHECK (
        (is_permanent = TRUE AND expires_at IS NULL) OR
        (is_permanent = FALSE AND expires_at IS NOT NULL)
    )
);

-- Índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_bans_target_user ON bans (target_user_id);
CREATE INDEX IF NOT EXISTS idx_bans_banned_by ON bans (banned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_bans_active ON bans (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans (expires_at) WHERE expires_at IS NOT NULL;

-- Trigger para atualizar updated_at na tabela bans
CREATE TRIGGER trigger_bans_updated_at
    BEFORE UPDATE ON bans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: unbans
-- Registro de desbanimentos de usuários
-- ============================================
CREATE TABLE IF NOT EXISTS unbans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ban_id UUID NOT NULL REFERENCES bans(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unbanned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);

-- Índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_unbans_ban_id ON unbans (ban_id);
CREATE INDEX IF NOT EXISTS idx_unbans_target_user ON unbans (target_user_id);
CREATE INDEX IF NOT EXISTS idx_unbans_unbanned_by ON unbans (unbanned_by_user_id);

-- ============================================
-- FUNÇÃO: Obter hierarquia numérica de cargo
-- ============================================
CREATE OR REPLACE FUNCTION get_role_hierarchy(role user_role)
RETURNS INTEGER AS $$
BEGIN
    CASE role
        WHEN 'master' THEN RETURN 6;
        WHEN 'admin' THEN RETURN 5;
        WHEN 'moderador' THEN RETURN 4;
        WHEN 'suporte' THEN RETURN 3;
        WHEN 'uploader' THEN RETURN 2;
        WHEN 'usuario' THEN RETURN 1;
        WHEN 'vip' THEN RETURN 1; -- Mesmo nível que usuário
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNÇÃO: Verificar se usuário pode gerenciar outro
-- ============================================
CREATE OR REPLACE FUNCTION can_manage_user(manager_role user_role, target_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_role_hierarchy(manager_role) > get_role_hierarchy(target_role);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNÇÃO: Expirar banimentos temporários
-- ============================================
CREATE OR REPLACE FUNCTION expire_temporary_bans()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
    expired_ban RECORD;
BEGIN
    -- Buscar banimentos expirados
    FOR expired_ban IN
        SELECT id, target_user_id
        FROM bans
        WHERE is_active = TRUE
          AND is_permanent = FALSE
          AND expires_at <= NOW()
    LOOP
        -- Desativar o banimento
        UPDATE bans
        SET is_active = FALSE
        WHERE id = expired_ban.id;

        -- Atualizar is_banned no perfil
        UPDATE profiles
        SET is_banned = FALSE
        WHERE user_id = expired_ban.target_user_id;
    END LOOP;

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Trigger para sincronizar is_banned
-- ============================================
CREATE OR REPLACE FUNCTION sync_ban_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
        -- Novo banimento ativo
        UPDATE profiles SET is_banned = TRUE WHERE user_id = NEW.target_user_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        -- Banimento desativado
        UPDATE profiles SET is_banned = FALSE WHERE user_id = NEW.target_user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar status de banimento
CREATE TRIGGER trigger_sync_ban_status
    AFTER INSERT OR UPDATE ON bans
    FOR EACH ROW
    EXECUTE FUNCTION sync_ban_status();

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE role_changes IS 'Histórico de alterações de cargo (promoções/rebaixamentos)';
COMMENT ON TABLE bans IS 'Registro de banimentos de usuários';
COMMENT ON TABLE unbans IS 'Registro de desbanimentos de usuários';

COMMENT ON COLUMN role_changes.target_user_id IS 'Usuário que teve o cargo alterado';
COMMENT ON COLUMN role_changes.changed_by_user_id IS 'Usuário que realizou a alteração';
COMMENT ON COLUMN role_changes.reason IS 'Motivo da alteração de cargo';
COMMENT ON COLUMN role_changes.ip_address IS 'IP de onde a ação foi realizada';

COMMENT ON COLUMN bans.target_user_id IS 'Usuário que foi banido';
COMMENT ON COLUMN bans.banned_by_user_id IS 'Usuário que aplicou o banimento';
COMMENT ON COLUMN bans.is_permanent IS 'Se o banimento é permanente ou temporário';
COMMENT ON COLUMN bans.expires_at IS 'Data de expiração (apenas para banimentos temporários)';
COMMENT ON COLUMN bans.is_active IS 'Se o banimento está ativo no momento';

COMMENT ON COLUMN unbans.ban_id IS 'Referência ao banimento que foi revertido';
COMMENT ON COLUMN unbans.unbanned_by_user_id IS 'Usuário que removeu o banimento';

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================
-- Você pode descomentar para criar um usuário master inicial
-- Lembre-se de mudar a senha após o primeiro login

-- INSERT INTO users (username, name, email, password_hash)
-- VALUES (
--     'master',
--     'Master Admin',
--     'master@gtracker.com',
--     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWEt3Y0rI/W' -- senha: master123
-- ) ON CONFLICT (username) DO NOTHING;

-- UPDATE profiles
-- SET role = 'master'
-- WHERE user_id = (SELECT id FROM users WHERE username = 'master');

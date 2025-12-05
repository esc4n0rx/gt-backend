-- ============================================
-- MIGRATION: Criar tabelas de invite codes e configurações
-- Gtracker Forum Backend
-- ============================================

-- ============================================
-- TABELA: invite_codes
-- ============================================
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(6) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    
    -- Constraints
    CONSTRAINT invite_codes_code_unique UNIQUE (code),
    CONSTRAINT invite_codes_code_length CHECK (LENGTH(code) = 6),
    CONSTRAINT invite_codes_code_format CHECK (code ~ '^[A-Z0-9]+$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_owner_id ON invite_codes (owner_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active ON invite_codes (is_active) WHERE is_active = TRUE;

-- ============================================
-- TABELA: system_settings
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    
    -- Constraints
    CONSTRAINT system_settings_key_unique UNIQUE (key)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings (key);

-- Trigger para updated_at
CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERIR CONFIGURAÇÃO PADRÃO
-- ============================================
INSERT INTO system_settings (key, value, description)
VALUES (
    'require_invite_code',
    'false',
    'Se true, exige código de convite para registro. Se false, registro é aberto.'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE invite_codes IS 'Códigos de convite para registro de novos usuários';
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';

COMMENT ON COLUMN invite_codes.code IS 'Código de 6 caracteres alfanuméricos (A-Z, 0-9)';
COMMENT ON COLUMN invite_codes.owner_id IS 'Usuário que gerou o código';
COMMENT ON COLUMN invite_codes.used_by_id IS 'Usuário que usou o código (null se não usado)';
COMMENT ON COLUMN invite_codes.is_active IS 'Se o código ainda pode ser usado';

COMMENT ON COLUMN system_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN system_settings.value IS 'Valor da configuração (string)';
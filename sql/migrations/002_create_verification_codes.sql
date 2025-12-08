-- ============================================
-- MIGRATION: Criar tabela de códigos de verificação
-- Gtracker Forum Backend
-- ============================================

-- Tabela para armazenar códigos de verificação (email e senha)
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email_change', 'password_change')),
    new_value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),

    -- Constraints
    CONSTRAINT verification_codes_code_unique UNIQUE (code)
);

-- Índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes (code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes (expires_at);

-- Função para limpar códigos expirados (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM verification_codes WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE verification_codes IS 'Códigos de verificação para alteração de email e senha';
COMMENT ON COLUMN verification_codes.type IS 'Tipo: email_change ou password_change';
COMMENT ON COLUMN verification_codes.new_value IS 'Novo email ou hash da nova senha';
COMMENT ON COLUMN verification_codes.is_used IS 'Indica se o código já foi usado';

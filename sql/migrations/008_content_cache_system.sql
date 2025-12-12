-- =====================================================
-- MIGRATION 008: Content Cache System
-- =====================================================
-- Sistema de cache para conteúdos buscados via APIs externas
-- (TMDB para filmes/séries, Steam para jogos)
-- Evita chamadas repetidas às APIs
-- =====================================================

-- =====================================================
-- 1. ENUM PARA TIPO DE CONTEÚDO
-- =====================================================

CREATE TYPE content_source AS ENUM ('tmdb', 'steam');

-- =====================================================
-- 2. TABELA DE CACHE
-- =====================================================

CREATE TABLE content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source content_source NOT NULL,
  external_id VARCHAR(50) NOT NULL,
  search_query VARCHAR(255) NOT NULL,
  content_data JSONB NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  -- Constraint: combinação única de source + external_id
  CONSTRAINT content_cache_unique UNIQUE(source, external_id)
);

-- Índices para performance
CREATE INDEX idx_content_cache_source ON content_cache(source);
CREATE INDEX idx_content_cache_external_id ON content_cache(external_id);
CREATE INDEX idx_content_cache_search_query ON content_cache(search_query);
CREATE INDEX idx_content_cache_expires_at ON content_cache(expires_at);
CREATE INDEX idx_content_cache_source_external_id ON content_cache(source, external_id);

COMMENT ON TABLE content_cache IS 'Cache de conteúdos buscados via APIs externas (TMDB, Steam)';
COMMENT ON COLUMN content_cache.source IS 'Origem do conteúdo: tmdb ou steam';
COMMENT ON COLUMN content_cache.external_id IS 'ID do conteúdo na API externa (TMDB ID ou Steam App ID)';
COMMENT ON COLUMN content_cache.search_query IS 'Query de busca original (para referência)';
COMMENT ON COLUMN content_cache.content_data IS 'Dados do conteúdo em formato JSON';
COMMENT ON COLUMN content_cache.hits IS 'Quantidade de vezes que este cache foi utilizado';
COMMENT ON COLUMN content_cache.expires_at IS 'Data de expiração do cache (padrão: 30 dias)';

-- =====================================================
-- 3. FUNÇÕES AUXILIARES
-- =====================================================

-- 3.1 Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_content_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Incrementar contador de hits ao consultar cache
CREATE OR REPLACE FUNCTION increment_cache_hits(cache_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_cache
  SET hits = hits + 1
  WHERE id = cache_id_param;
END;
$$ LANGUAGE plpgsql;

-- 3.3 Limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM content_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cache IS 'Remove entradas de cache expiradas. Execute via cron job diariamente.';

-- 3.4 Obter estatísticas do cache
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
  source content_source,
  total_entries BIGINT,
  total_hits BIGINT,
  avg_hits NUMERIC,
  oldest_entry TIMESTAMP,
  newest_entry TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.source,
    COUNT(*)::BIGINT as total_entries,
    SUM(cc.hits)::BIGINT as total_hits,
    AVG(cc.hits)::NUMERIC as avg_hits,
    MIN(cc.created_at) as oldest_entry,
    MAX(cc.created_at) as newest_entry
  FROM content_cache cc
  GROUP BY cc.source;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_cache_stats IS 'Retorna estatísticas de uso do cache por fonte';

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- 4.1 Atualizar updated_at ao modificar cache
CREATE TRIGGER update_content_cache_updated_at_trigger
  BEFORE UPDATE ON content_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_content_cache_updated_at();

-- =====================================================
-- 5. VIEWS ÚTEIS
-- =====================================================

-- 5.1 View: Cache mais acessado
CREATE OR REPLACE VIEW most_accessed_cache AS
SELECT
  id,
  source,
  external_id,
  search_query,
  hits,
  created_at
FROM content_cache
WHERE expires_at > NOW()
ORDER BY hits DESC
LIMIT 100;

COMMENT ON VIEW most_accessed_cache IS 'Top 100 conteúdos mais acessados do cache';

-- 5.2 View: Cache expirando em breve (próximos 7 dias)
CREATE OR REPLACE VIEW expiring_soon_cache AS
SELECT
  id,
  source,
  external_id,
  search_query,
  expires_at,
  (expires_at - NOW()) as time_until_expiry
FROM content_cache
WHERE expires_at > NOW()
  AND expires_at < (NOW() + INTERVAL '7 days')
ORDER BY expires_at ASC;

COMMENT ON VIEW expiring_soon_cache IS 'Cache que expira nos próximos 7 dias';

-- =====================================================
-- 6. ÍNDICE PARA BUSCA FULL-TEXT (OPCIONAL)
-- =====================================================

-- Índice GIN para busca de texto no search_query
CREATE INDEX idx_content_cache_search_query_gin ON content_cache USING gin(to_tsvector('portuguese', search_query));

-- =====================================================
-- 7. POLÍTICA DE RETENÇÃO
-- =====================================================

-- Configurar expiração padrão de 30 dias
COMMENT ON COLUMN content_cache.expires_at IS 'Expira em 30 dias por padrão. Pode ser ajustado conforme necessidade.';

-- =====================================================
-- 8. GRANTS (ajuste conforme necessário)
-- =====================================================

-- Conceder permissões para o usuário da aplicação
-- GRANT SELECT, INSERT, UPDATE, DELETE ON content_cache TO your_app_user;
-- GRANT EXECUTE ON FUNCTION increment_cache_hits TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_cache_stats TO your_app_user;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

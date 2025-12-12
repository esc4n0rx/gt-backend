-- =====================================================
-- MIGRATION 006: Thread System with Templates
-- =====================================================
-- Sistema de threads com templates especializados
-- Threads só podem ser criadas em categorias finais (leaf nodes)
-- Suporta 5 templates: midia, jogos, software, torrent, postagem
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

CREATE TYPE thread_template AS ENUM ('midia', 'jogos', 'software', 'torrent', 'postagem');
CREATE TYPE thread_status AS ENUM ('active', 'locked', 'pinned', 'archived');

-- =====================================================
-- 2. TABELA PRINCIPAL DE THREADS
-- =====================================================

CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  author_id UUID NOT NULL,
  template thread_template NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL,
  status thread_status NOT NULL DEFAULT 'active',
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  last_reply_at TIMESTAMP,
  last_reply_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT threads_title_length CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200),
  CONSTRAINT threads_slug_length CHECK (LENGTH(slug) >= 5 AND LENGTH(slug) <= 250),
  CONSTRAINT threads_view_count_positive CHECK (view_count >= 0),
  CONSTRAINT threads_reply_count_positive CHECK (reply_count >= 0)
);

-- Índices para performance
CREATE INDEX idx_threads_category_id ON threads(category_id);
CREATE INDEX idx_threads_author_id ON threads(author_id);
CREATE INDEX idx_threads_template ON threads(template);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX idx_threads_last_reply_at ON threads(last_reply_at DESC NULLS LAST);
CREATE INDEX idx_threads_is_pinned ON threads(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_threads_slug ON threads(slug);
CREATE UNIQUE INDEX idx_threads_unique_slug ON threads(category_id, slug);

-- =====================================================
-- 3. TABELAS DE CONTEÚDO POR TEMPLATE
-- =====================================================

-- 3.1 Template: MIDIA (Filmes, Séries, Animes)
CREATE TABLE thread_midia_content (
  thread_id UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
  nome_conteudo VARCHAR(200) NOT NULL,
  poster_url TEXT,
  genero TEXT[] NOT NULL DEFAULT '{}',
  trailer_url TEXT,
  elenco TEXT[] NOT NULL DEFAULT '{}',
  sinopse TEXT NOT NULL,
  notas TEXT,
  tamanho VARCHAR(50) NOT NULL,
  formato TEXT[] NOT NULL,
  link_download TEXT NOT NULL,
  idiomas TEXT[] NOT NULL DEFAULT '{}',
  qualidade VARCHAR(50),
  ano INTEGER,
  duracao VARCHAR(50),
  classificacao VARCHAR(20),
  tmdb_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT midia_ano_valid CHECK (ano IS NULL OR (ano >= 1800 AND ano <= 2100)),
  CONSTRAINT midia_nome_length CHECK (LENGTH(nome_conteudo) >= 1 AND LENGTH(nome_conteudo) <= 200),
  CONSTRAINT midia_sinopse_length CHECK (LENGTH(sinopse) >= 10)
);

CREATE INDEX idx_midia_thread_id ON thread_midia_content(thread_id);
CREATE INDEX idx_midia_tmdb_id ON thread_midia_content(tmdb_id) WHERE tmdb_id IS NOT NULL;

-- 3.2 Template: JOGOS
CREATE TABLE thread_jogos_content (
  thread_id UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  estilo TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  ano INTEGER,
  sistema_operacional TEXT[] NOT NULL,
  descricao TEXT NOT NULL,
  specs_minimas TEXT,
  specs_recomendadas TEXT,
  guia_instalacao TEXT NOT NULL,
  tamanho VARCHAR(50) NOT NULL,
  formato VARCHAR(50) NOT NULL,
  link_download TEXT NOT NULL,
  versao VARCHAR(50),
  desenvolvedor VARCHAR(200),
  publisher VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT jogos_ano_valid CHECK (ano IS NULL OR (ano >= 1970 AND ano <= 2100)),
  CONSTRAINT jogos_nome_length CHECK (LENGTH(nome) >= 1 AND LENGTH(nome) <= 200),
  CONSTRAINT jogos_descricao_length CHECK (LENGTH(descricao) >= 10)
);

CREATE INDEX idx_jogos_thread_id ON thread_jogos_content(thread_id);

-- 3.3 Template: SOFTWARE
CREATE TABLE thread_software_content (
  thread_id UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  categoria TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  ano INTEGER,
  sistema_operacional TEXT[] NOT NULL,
  descricao TEXT NOT NULL,
  requisitos TEXT,
  guia_instalacao TEXT NOT NULL,
  tamanho VARCHAR(50) NOT NULL,
  formato VARCHAR(50) NOT NULL,
  link_download TEXT NOT NULL,
  versao VARCHAR(50) NOT NULL,
  desenvolvedor VARCHAR(200),
  licenca VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT software_ano_valid CHECK (ano IS NULL OR (ano >= 1970 AND ano <= 2100)),
  CONSTRAINT software_nome_length CHECK (LENGTH(nome) >= 1 AND LENGTH(nome) <= 200),
  CONSTRAINT software_descricao_length CHECK (LENGTH(descricao) >= 10)
);

CREATE INDEX idx_software_thread_id ON thread_software_content(thread_id);

-- 3.4 Template: TORRENT
CREATE TABLE thread_torrent_content (
  thread_id UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
  nome_conteudo VARCHAR(200) NOT NULL,
  poster_url TEXT,
  genero TEXT[] NOT NULL DEFAULT '{}',
  trailer_url TEXT,
  elenco TEXT[] NOT NULL DEFAULT '{}',
  sinopse TEXT NOT NULL,
  notas TEXT,
  tamanho VARCHAR(50) NOT NULL,
  formato TEXT[] NOT NULL,
  magnet_link TEXT,
  torrent_file_url TEXT,
  idiomas TEXT[] NOT NULL DEFAULT '{}',
  qualidade VARCHAR(50),
  ano INTEGER,
  seeders INTEGER,
  leechers INTEGER,
  tmdb_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT torrent_ano_valid CHECK (ano IS NULL OR (ano >= 1800 AND ano <= 2100)),
  CONSTRAINT torrent_nome_length CHECK (LENGTH(nome_conteudo) >= 1 AND LENGTH(nome_conteudo) <= 200),
  CONSTRAINT torrent_sinopse_length CHECK (LENGTH(sinopse) >= 10),
  CONSTRAINT torrent_seeders_positive CHECK (seeders IS NULL OR seeders >= 0),
  CONSTRAINT torrent_leechers_positive CHECK (leechers IS NULL OR leechers >= 0),
  CONSTRAINT torrent_has_link CHECK (magnet_link IS NOT NULL OR torrent_file_url IS NOT NULL)
);

CREATE INDEX idx_torrent_thread_id ON thread_torrent_content(thread_id);
CREATE INDEX idx_torrent_tmdb_id ON thread_torrent_content(tmdb_id) WHERE tmdb_id IS NOT NULL;

-- 3.5 Template: POSTAGEM (Thread padrão)
CREATE TABLE thread_postagem_content (
  thread_id UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT postagem_conteudo_length CHECK (LENGTH(conteudo) >= 10)
);

CREATE INDEX idx_postagem_thread_id ON thread_postagem_content(thread_id);

-- =====================================================
-- 4. FUNÇÕES AUXILIARES
-- =====================================================

-- 4.1 Verificar se categoria é leaf node (não tem filhos)
CREATE OR REPLACE FUNCTION is_leaf_category(category_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_children BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM categories
    WHERE parent_id = category_id_param
  ) INTO has_children;

  RETURN NOT has_children;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Obter breadcrumbs de uma categoria
CREATE OR REPLACE FUNCTION get_category_breadcrumbs(category_id_param UUID)
RETURNS TABLE(id UUID, name VARCHAR, slug VARCHAR, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE breadcrumb AS (
    -- Categoria atual
    SELECT c.id, c.name, c.slug, c.level, c.parent_id
    FROM categories c
    WHERE c.id = category_id_param

    UNION ALL

    -- Pais recursivamente
    SELECT c.id, c.name, c.slug, c.level, c.parent_id
    FROM categories c
    INNER JOIN breadcrumb b ON c.id = b.parent_id
  )
  SELECT b.id, b.name, b.slug, b.level
  FROM breadcrumb b
  ORDER BY b.level ASC;
END;
$$ LANGUAGE plpgsql;

-- 4.3 Atualizar contadores de categoria
CREATE OR REPLACE FUNCTION update_category_thread_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador ao criar thread
    UPDATE categories
    SET
      thread_count = thread_count + 1,
      last_thread_id = NEW.id,
      last_post_at = NEW.created_at
    WHERE id = NEW.category_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador ao deletar thread
    UPDATE categories
    SET thread_count = thread_count - 1
    WHERE id = OLD.category_id;

    -- Atualizar last_thread_id se necessário
    UPDATE categories c
    SET
      last_thread_id = (
        SELECT t.id
        FROM threads t
        WHERE t.category_id = c.id
        ORDER BY t.created_at DESC
        LIMIT 1
      ),
      last_post_at = (
        SELECT t.created_at
        FROM threads t
        WHERE t.category_id = c.id
        ORDER BY t.created_at DESC
        LIMIT 1
      )
    WHERE c.id = OLD.category_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4.4 Validar que thread só pode ser criada em leaf category
CREATE OR REPLACE FUNCTION validate_thread_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_leaf_category(NEW.category_id) THEN
    RAISE EXCEPTION 'Threads só podem ser criadas em categorias finais (sem subcategorias)'
      USING HINT = 'Escolha uma categoria que não tenha subcategorias';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.5 Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- 5.1 Validar categoria antes de criar thread
CREATE TRIGGER validate_thread_category_trigger
  BEFORE INSERT ON threads
  FOR EACH ROW
  EXECUTE FUNCTION validate_thread_category();

-- 5.2 Atualizar contadores de categoria
CREATE TRIGGER update_category_counters_on_thread_insert
  AFTER INSERT ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_category_thread_counters();

CREATE TRIGGER update_category_counters_on_thread_delete
  AFTER DELETE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_category_thread_counters();

-- 5.3 Atualizar updated_at
CREATE TRIGGER update_thread_updated_at_trigger
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_updated_at();

-- =====================================================
-- 6. VIEWS ÚTEIS
-- =====================================================

-- 6.1 View: Threads com informações do autor
CREATE OR REPLACE VIEW threads_with_author AS
SELECT
  t.*,
  p.username,
  p.avatar_url,
  p.role
FROM threads t
LEFT JOIN profiles p ON t.author_id = p.user_id;

-- 6.2 View: Threads com categoria
CREATE OR REPLACE VIEW threads_with_category AS
SELECT
  t.*,
  c.name as category_name,
  c.slug as category_slug,
  c.level as category_level
FROM threads t
LEFT JOIN categories c ON t.category_id = c.id;

-- =====================================================
-- 7. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE threads IS 'Tabela principal de threads do fórum. Threads só podem ser criadas em categorias leaf (sem subcategorias).';
COMMENT ON COLUMN threads.template IS 'Template define qual tabela de conteúdo será usada: midia, jogos, software, torrent, postagem';
COMMENT ON COLUMN threads.status IS 'Status da thread: active, locked, pinned, archived';
COMMENT ON COLUMN threads.is_pinned IS 'Threads fixadas aparecem no topo da categoria';
COMMENT ON COLUMN threads.is_locked IS 'Threads bloqueadas não permitem novas respostas';

COMMENT ON TABLE thread_midia_content IS 'Conteúdo para threads de mídia (filmes, séries, animes)';
COMMENT ON TABLE thread_jogos_content IS 'Conteúdo para threads de jogos';
COMMENT ON TABLE thread_software_content IS 'Conteúdo para threads de software';
COMMENT ON TABLE thread_torrent_content IS 'Conteúdo para threads de torrents';
COMMENT ON TABLE thread_postagem_content IS 'Conteúdo para threads padrão/postagens';

COMMENT ON FUNCTION is_leaf_category IS 'Verifica se categoria não tem subcategorias (é um leaf node)';
COMMENT ON FUNCTION get_category_breadcrumbs IS 'Retorna o caminho completo de breadcrumbs da categoria';
COMMENT ON FUNCTION update_category_thread_counters IS 'Atualiza contadores de threads nas categorias automaticamente';
COMMENT ON FUNCTION validate_thread_category IS 'Valida que thread só pode ser criada em categoria leaf';

-- =====================================================
-- 8. GRANTS (ajuste conforme necessário)
-- =====================================================

-- Conceder permissões para o usuário da aplicação (ajuste o nome do usuário)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON threads TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON thread_midia_content TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON thread_jogos_content TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON thread_software_content TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON thread_torrent_content TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON thread_postagem_content TO your_app_user;
-- GRANT EXECUTE ON FUNCTION is_leaf_category TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_category_breadcrumbs TO your_app_user;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

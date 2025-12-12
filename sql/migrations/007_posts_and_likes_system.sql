-- =====================================================
-- MIGRATION 007: Posts (Replies) and Likes System
-- =====================================================
-- Sistema de comentários (posts) em threads e likes
-- Usuários podem comentar em threads e curtir threads/posts
-- =====================================================

-- =====================================================
-- 1. TABELA DE POSTS (COMENTÁRIOS/REPLIES)
-- =====================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT posts_content_length CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000),
  CONSTRAINT posts_like_count_positive CHECK (like_count >= 0)
);

-- Índices para performance
CREATE INDEX idx_posts_thread_id ON posts(thread_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_parent_post_id ON posts(parent_post_id) WHERE parent_post_id IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

COMMENT ON TABLE posts IS 'Comentários/respostas em threads. Suporta respostas aninhadas via parent_post_id.';
COMMENT ON COLUMN posts.parent_post_id IS 'ID do post pai para respostas aninhadas (NULL = resposta direta à thread)';
COMMENT ON COLUMN posts.is_edited IS 'Indica se o post foi editado após criação';

-- =====================================================
-- 2. TABELA DE LIKES EM THREADS
-- =====================================================

CREATE TABLE thread_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraint: usuário só pode curtir uma vez cada thread
  CONSTRAINT thread_likes_unique UNIQUE(thread_id, user_id)
);

-- Índices
CREATE INDEX idx_thread_likes_thread_id ON thread_likes(thread_id);
CREATE INDEX idx_thread_likes_user_id ON thread_likes(user_id);

COMMENT ON TABLE thread_likes IS 'Likes/curtidas em threads. Um usuário pode curtir cada thread apenas uma vez.';

-- =====================================================
-- 3. TABELA DE LIKES EM POSTS
-- =====================================================

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraint: usuário só pode curtir uma vez cada post
  CONSTRAINT post_likes_unique UNIQUE(post_id, user_id)
);

-- Índices
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

COMMENT ON TABLE post_likes IS 'Likes/curtidas em posts. Um usuário pode curtir cada post apenas uma vez.';

-- =====================================================
-- 4. FUNÇÕES AUXILIARES
-- =====================================================

-- 4.1 Atualizar contador de likes em posts
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador ao curtir
    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;

    -- Incrementar total_likes do autor do post
    UPDATE profiles
    SET total_likes = total_likes + 1
    WHERE user_id = (SELECT author_id FROM posts WHERE id = NEW.post_id);

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador ao descurtir
    UPDATE posts
    SET like_count = like_count - 1
    WHERE id = OLD.post_id;

    -- Decrementar total_likes do autor do post
    UPDATE profiles
    SET total_likes = total_likes - 1
    WHERE user_id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Atualizar total_likes do autor da thread
CREATE OR REPLACE FUNCTION update_thread_author_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar total_likes do autor da thread
    UPDATE profiles
    SET total_likes = total_likes + 1
    WHERE user_id = (SELECT author_id FROM threads WHERE id = NEW.thread_id);

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar total_likes do autor da thread
    UPDATE profiles
    SET total_likes = total_likes - 1
    WHERE user_id = (SELECT author_id FROM threads WHERE id = OLD.thread_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4.3 Atualizar contadores de posts na thread
CREATE OR REPLACE FUNCTION update_thread_post_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar reply_count na thread
    UPDATE threads
    SET
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.thread_id;

    -- Incrementar total_posts do autor
    UPDATE profiles
    SET total_posts = total_posts + 1
    WHERE user_id = NEW.author_id;

    -- Incrementar post_count da categoria
    UPDATE categories
    SET post_count = post_count + 1
    WHERE id = (SELECT category_id FROM threads WHERE id = NEW.thread_id);

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar reply_count na thread
    UPDATE threads
    SET reply_count = reply_count - 1
    WHERE id = OLD.thread_id;

    -- Decrementar total_posts do autor
    UPDATE profiles
    SET total_posts = total_posts - 1
    WHERE user_id = OLD.author_id;

    -- Decrementar post_count da categoria
    UPDATE categories
    SET post_count = post_count - 1
    WHERE id = (SELECT category_id FROM threads WHERE id = OLD.thread_id);

    -- Atualizar last_reply_at e last_reply_by
    UPDATE threads t
    SET
      last_reply_at = (
        SELECT p.created_at
        FROM posts p
        WHERE p.thread_id = t.id
        ORDER BY p.created_at DESC
        LIMIT 1
      ),
      last_reply_by = (
        SELECT p.author_id
        FROM posts p
        WHERE p.thread_id = t.id
        ORDER BY p.created_at DESC
        LIMIT 1
      )
    WHERE t.id = OLD.thread_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4.4 Atualizar updated_at em posts
CREATE OR REPLACE FUNCTION update_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.is_edited = true;
  NEW.edited_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.5 Verificar se thread está bloqueada antes de postar
CREATE OR REPLACE FUNCTION check_thread_locked_before_post()
RETURNS TRIGGER AS $$
DECLARE
  thread_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO thread_locked
  FROM threads
  WHERE id = NEW.thread_id;

  IF thread_locked THEN
    RAISE EXCEPTION 'Não é possível postar em uma thread bloqueada'
      USING HINT = 'Esta thread está bloqueada para novas respostas';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- 5.1 Atualizar contador de likes em posts
CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- 5.2 Atualizar total_likes do autor da thread
CREATE TRIGGER update_thread_author_likes_trigger
  AFTER INSERT OR DELETE ON thread_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_author_likes();

-- 5.3 Atualizar contadores de posts na thread
CREATE TRIGGER update_thread_post_counters_insert
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_post_counters();

CREATE TRIGGER update_thread_post_counters_delete
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_post_counters();

-- 5.4 Atualizar updated_at ao editar post
CREATE TRIGGER update_post_updated_at_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION update_post_updated_at();

-- 5.5 Verificar se thread está bloqueada
CREATE TRIGGER check_thread_locked_trigger
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_thread_locked_before_post();

-- =====================================================
-- 6. VIEWS ÚTEIS
-- =====================================================

-- 6.1 View: Posts com autor completo (JOIN users + profiles)
CREATE OR REPLACE VIEW posts_with_author AS
SELECT
  p.*,
  u.username,
  pr.avatar_url,
  pr.total_posts,
  pr.total_likes,
  pr.level,
  pr.role,
  pr.ranking,
  pr.signature
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.user_id
LEFT JOIN users u ON pr.user_id = u.id;

-- 6.2 View: Threads com autor completo (JOIN users + profiles)
CREATE OR REPLACE VIEW threads_with_full_author AS
SELECT
  t.*,
  u.username,
  pr.avatar_url,
  pr.total_posts,
  pr.total_likes,
  pr.level,
  pr.role,
  pr.ranking,
  pr.signature
FROM threads t
LEFT JOIN profiles pr ON t.author_id = pr.user_id
LEFT JOIN users u ON pr.user_id = u.id;

-- 6.3 View: Estatísticas de thread (posts + likes)
CREATE OR REPLACE VIEW thread_stats AS
SELECT
  t.id as thread_id,
  t.title,
  t.view_count,
  t.reply_count,
  COUNT(DISTINCT tl.user_id) as like_count,
  COUNT(DISTINCT p.id) as total_posts
FROM threads t
LEFT JOIN thread_likes tl ON t.id = tl.thread_id
LEFT JOIN posts p ON t.id = p.thread_id
GROUP BY t.id, t.title, t.view_count, t.reply_count;

-- =====================================================
-- 7. FUNÇÃO PARA BUSCAR POSTS DE UMA THREAD
-- =====================================================

CREATE OR REPLACE FUNCTION get_thread_posts(
  thread_id_param UUID,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0,
  sort_order VARCHAR DEFAULT 'asc'
)
RETURNS TABLE (
  id UUID,
  thread_id UUID,
  author_id UUID,
  parent_post_id UUID,
  content TEXT,
  is_edited BOOLEAN,
  edited_at TIMESTAMP,
  like_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  username VARCHAR,
  avatar_url TEXT,
  total_posts INTEGER,
  total_likes INTEGER,
  level INTEGER,
  role VARCHAR,
  ranking INTEGER,
  signature TEXT,
  user_has_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.thread_id,
    p.author_id,
    p.parent_post_id,
    p.content,
    p.is_edited,
    p.edited_at,
    p.like_count,
    p.created_at,
    p.updated_at,
    u.username,
    pr.avatar_url,
    pr.total_posts,
    pr.total_likes,
    pr.level,
    pr.role::VARCHAR,
    pr.ranking,
    pr.signature,
    false as user_has_liked
  FROM posts p
  LEFT JOIN profiles pr ON p.author_id = pr.user_id
  LEFT JOIN users u ON pr.user_id = u.id
  WHERE p.thread_id = thread_id_param
  ORDER BY
    CASE WHEN sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN sort_order = 'desc' THEN p.created_at END DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_thread_posts IS 'Busca posts de uma thread com informações completas do autor (username de users + dados de profiles) e paginação';

-- =====================================================
-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice composto para buscar posts de um usuário em ordem cronológica
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);

-- Índice para contar posts por thread
CREATE INDEX idx_posts_thread_count ON posts(thread_id) WHERE parent_post_id IS NULL;

-- =====================================================
-- 9. ESTATÍSTICAS INICIAIS
-- =====================================================

-- Função para recalcular estatísticas (caso necessário)
CREATE OR REPLACE FUNCTION recalculate_post_stats()
RETURNS void AS $$
BEGIN
  -- Recalcular reply_count nas threads
  UPDATE threads t
  SET reply_count = (
    SELECT COUNT(*)
    FROM posts p
    WHERE p.thread_id = t.id
  );

  -- Recalcular like_count nos posts
  UPDATE posts p
  SET like_count = (
    SELECT COUNT(*)
    FROM post_likes pl
    WHERE pl.post_id = p.id
  );

  -- Recalcular total_posts nos perfis
  UPDATE profiles pr
  SET total_posts = (
    SELECT COUNT(*)
    FROM posts p
    WHERE p.author_id = pr.user_id
  );

  -- Recalcular total_likes nos perfis (posts + threads)
  UPDATE profiles pr
  SET total_likes = (
    SELECT
      COALESCE((SELECT COUNT(*) FROM post_likes pl
                JOIN posts p ON pl.post_id = p.id
                WHERE p.author_id = pr.user_id), 0) +
      COALESCE((SELECT COUNT(*) FROM thread_likes tl
                JOIN threads t ON tl.thread_id = t.id
                WHERE t.author_id = pr.user_id), 0)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_post_stats IS 'Recalcula todos os contadores de posts e likes. Use apenas se necessário corrigir inconsistências.';

-- =====================================================
-- 10. GRANTS (ajuste conforme necessário)
-- =====================================================

-- Conceder permissões para o usuário da aplicação
-- GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO your_app_user;
-- GRANT SELECT, INSERT, DELETE ON thread_likes TO your_app_user;
-- GRANT SELECT, INSERT, DELETE ON post_likes TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_thread_posts TO your_app_user;
-- GRANT EXECUTE ON FUNCTION recalculate_post_stats TO your_app_user;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

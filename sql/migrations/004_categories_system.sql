-- ============================================
-- MIGRATION: Sistema de Categorias e Subcategorias
-- Gtracker Forum Backend
-- ============================================

-- Configurar timezone para São Paulo
SET timezone = 'America/Sao_Paulo';

-- ============================================
-- TABELA: categories
-- Sistema hierárquico de categorias (árvore)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    icon VARCHAR(50),
    level INTEGER NOT NULL DEFAULT 0,
    thread_count INTEGER NOT NULL DEFAULT 0,
    post_count INTEGER NOT NULL DEFAULT 0,
    last_thread_id UUID,
    last_post_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),

    -- Constraints
    CONSTRAINT categories_slug_unique UNIQUE (slug),
    CONSTRAINT categories_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100),
    CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT categories_level_check CHECK (level >= 0 AND level <= 2),
    CONSTRAINT categories_display_order_positive CHECK (display_order >= 0),
    CONSTRAINT categories_no_self_parent CHECK (id != parent_id)
);

-- Índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories (parent_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories (level);

-- ============================================
-- TABELA: threads (simplificada para FK)
-- Threads/tópicos criados pelos usuários
-- ============================================
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    reply_count INTEGER NOT NULL DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),

    -- Constraints
    CONSTRAINT threads_title_length CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200),
    CONSTRAINT threads_content_length CHECK (LENGTH(content) >= 10),
    CONSTRAINT threads_slug_unique UNIQUE (slug),
    CONSTRAINT threads_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Índices para threads
CREATE INDEX IF NOT EXISTS idx_threads_category_id ON threads (category_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads (user_id);
CREATE INDEX IF NOT EXISTS idx_threads_slug ON threads (slug);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads (is_pinned, created_at DESC);

-- ============================================
-- FUNÇÃO: Calcular nível da categoria na árvore
-- ============================================
CREATE OR REPLACE FUNCTION calculate_category_level(category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_level INTEGER := 0;
    current_parent UUID;
BEGIN
    SELECT parent_id INTO current_parent
    FROM categories
    WHERE id = category_id;

    WHILE current_parent IS NOT NULL LOOP
        current_level := current_level + 1;

        IF current_level > 2 THEN
            RAISE EXCEPTION 'Nível máximo de categorias excedido (máx: 2)';
        END IF;

        SELECT parent_id INTO current_parent
        FROM categories
        WHERE id = current_parent;
    END LOOP;

    RETURN current_level;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Validar profundidade antes de inserir/atualizar
-- ============================================
CREATE OR REPLACE FUNCTION validate_category_level()
RETURNS TRIGGER AS $$
DECLARE
    computed_level INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.level := 0;
    ELSE
        computed_level := calculate_category_level(NEW.id);

        IF computed_level > 2 THEN
            RAISE EXCEPTION 'Não é permitido criar subcategorias além do nível 2';
        END IF;

        NEW.level := computed_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar nível antes de inserir/atualizar
CREATE TRIGGER trigger_validate_category_level
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION validate_category_level();

-- ============================================
-- FUNÇÃO: Atualizar contadores de categoria
-- ============================================
CREATE OR REPLACE FUNCTION update_category_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Nova thread criada
        UPDATE categories
        SET
            thread_count = thread_count + 1,
            last_thread_id = NEW.id,
            last_post_at = NEW.created_at
        WHERE id = NEW.category_id;

    ELSIF TG_OP = 'DELETE' THEN
        -- Thread deletada
        UPDATE categories
        SET thread_count = thread_count - 1
        WHERE id = OLD.category_id;

        -- Atualizar last_thread_id
        UPDATE categories c
        SET last_thread_id = (
            SELECT id FROM threads
            WHERE category_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
        )
        WHERE id = OLD.category_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contadores
CREATE TRIGGER trigger_update_category_counters
    AFTER INSERT OR DELETE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_category_counters();

-- ============================================
-- FUNÇÃO: Prevenir exclusão de categoria com threads
-- ============================================
CREATE OR REPLACE FUNCTION prevent_delete_category_with_threads()
RETURNS TRIGGER AS $$
DECLARE
    thread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO thread_count
    FROM threads
    WHERE category_id = OLD.id;

    IF thread_count > 0 THEN
        RAISE EXCEPTION 'Não é possível deletar categoria com % thread(s) existente(s)', thread_count;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir exclusão de categoria com conteúdo
CREATE TRIGGER trigger_prevent_delete_category_with_threads
    BEFORE DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION prevent_delete_category_with_threads();

-- ============================================
-- FUNÇÃO: Obter árvore completa de categorias
-- ============================================
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    parent_id UUID,
    display_order INTEGER,
    is_locked BOOLEAN,
    icon VARCHAR,
    level INTEGER,
    thread_count INTEGER,
    post_count INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Categorias raiz (nível 0)
        SELECT
            c.id,
            c.name,
            c.slug,
            c.description,
            c.parent_id,
            c.display_order,
            c.is_locked,
            c.icon,
            c.level,
            c.thread_count,
            c.post_count,
            c.name::TEXT as path
        FROM categories c
        WHERE c.parent_id IS NULL

        UNION ALL

        -- Subcategorias recursivamente
        SELECT
            c.id,
            c.name,
            c.slug,
            c.description,
            c.parent_id,
            c.display_order,
            c.is_locked,
            c.icon,
            c.level,
            c.thread_count,
            c.post_count,
            ct.path || ' > ' || c.name as path
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM category_tree
    ORDER BY path, display_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Obter subcategorias de uma categoria
-- ============================================
CREATE OR REPLACE FUNCTION get_subcategories(p_parent_id UUID)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    display_order INTEGER,
    is_locked BOOLEAN,
    icon VARCHAR,
    level INTEGER,
    thread_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.display_order,
        c.is_locked,
        c.icon,
        c.level,
        c.thread_count
    FROM categories c
    WHERE c.parent_id = p_parent_id
    ORDER BY c.display_order ASC, c.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE categories IS 'Categorias e subcategorias do fórum (estrutura hierárquica)';
COMMENT ON TABLE threads IS 'Tópicos/threads criados pelos usuários nas categorias';

COMMENT ON COLUMN categories.parent_id IS 'ID da categoria pai (NULL para categorias raiz)';
COMMENT ON COLUMN categories.level IS 'Nível na hierarquia (0=raiz, 1=subcategoria, 2=sub-subcategoria)';
COMMENT ON COLUMN categories.display_order IS 'Ordem de exibição dentro do mesmo nível';
COMMENT ON COLUMN categories.is_locked IS 'Se TRUE, impede criação de novos threads';
COMMENT ON COLUMN categories.thread_count IS 'Contador de threads na categoria';
COMMENT ON COLUMN categories.last_thread_id IS 'Última thread criada na categoria';

COMMENT ON COLUMN threads.is_pinned IS 'Thread fixada no topo da categoria';
COMMENT ON COLUMN threads.is_locked IS 'Thread bloqueada para novas respostas';
COMMENT ON COLUMN threads.reply_count IS 'Número de respostas na thread';

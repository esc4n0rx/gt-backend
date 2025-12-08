-- ============================================
-- MIGRATION: Seed Inicial de Categorias
-- Gtracker Forum Backend
-- Popula estrutura inicial baseada em docs/seed.json
-- ============================================

-- Configurar timezone para São Paulo
SET timezone = 'America/Sao_Paulo';

-- ============================================
-- CATEGORIAS RAIZ (Nível 0)
-- ============================================

-- 1. SOCIAL
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, icon, level)
VALUES ('Social', 'social', 'Seção dedicada a Social', NULL, 0, FALSE, '👥', 0)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS social_id \gset

-- 2. GTRACKER
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, icon, level)
VALUES ('GTracker', 'gtracker', 'Seção dedicada a GTracker', NULL, 1, FALSE, '📦', 0)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS gtracker_id \gset

-- 3. COMUNIDADE
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, icon, level)
VALUES ('Comunidade', 'comunidade', 'Seção dedicada a Comunidade', NULL, 2, FALSE, '🌐', 0)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS comunidade_id \gset

-- 4. SUPORTE
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, icon, level)
VALUES ('Suporte', 'suporte', 'Seção dedicada a Suporte', NULL, 3, FALSE, '🆘', 0)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS suporte_id \gset

-- 5. ENTRETENIMENTO
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, icon, level)
VALUES ('Entretenimento', 'entretenimento', 'Seção dedicada a Entretenimento', NULL, 4, FALSE, '🎬', 0)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS entretenimento_id \gset

-- 6. OFF-TOPIC
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, icon, level)
VALUES ('Off-Topic', 'off-topic', 'Seção dedicada a Off-Topic', NULL, 5, FALSE, '💬', 0)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS offtopic_id \gset

-- ============================================
-- SUBCATEGORIAS - SOCIAL (Nível 1)
-- ============================================

-- Social > Notícias
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Notícias', 'noticias', 'Seção dedicada a Notícias', id, 0, FALSE, 1
FROM categories WHERE slug = 'social'
ON CONFLICT (slug) DO NOTHING;

-- Social > Novidades
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Novidades', 'novidades', 'Seção dedicada a Novidades', id, 1, FALSE, 1
FROM categories WHERE slug = 'social'
ON CONFLICT (slug) DO NOTHING;

-- Social > Cargos Abertos
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Cargos Abertos', 'cargos-abertos', 'Seção dedicada a Cargos Abertos', id, 2, FALSE, 1
FROM categories WHERE slug = 'social'
ON CONFLICT (slug) DO NOTHING;

-- Social > Apresentações
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Apresentações', 'apresentacoes', 'Seção dedicada a Apresentações', id, 3, FALSE, 1
FROM categories WHERE slug = 'social'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SOCIAL > NOTÍCIAS (Nível 2)
-- ============================================

-- Social > Notícias > Mundo
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Mundo', 'mundo', 'Seção dedicada a Mundo', id, 0, FALSE, 2
FROM categories WHERE slug = 'noticias'
ON CONFLICT (slug) DO NOTHING;

-- Social > Notícias > Tecnologia
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Tecnologia', 'tecnologia', 'Seção dedicada a Tecnologia', id, 1, FALSE, 2
FROM categories WHERE slug = 'noticias'
ON CONFLICT (slug) DO NOTHING;

-- Social > Notícias > Entretenimento
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Entretenimento', 'noticias-entretenimento', 'Seção dedicada a Entretenimento', id, 2, FALSE, 2
FROM categories WHERE slug = 'noticias'
ON CONFLICT (slug) DO NOTHING;

-- Social > Notícias > Games
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Games', 'games', 'Seção dedicada a Games', id, 3, FALSE, 2
FROM categories WHERE slug = 'noticias'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SOCIAL > NOVIDADES (Nível 2)
-- ============================================

-- Social > Novidades > Atualizações do Fórum
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Atualizações do Fórum', 'atualizacoes-do-forum', 'Seção dedicada a Atualizações do Fórum', id, 0, FALSE, 2
FROM categories WHERE slug = 'novidades'
ON CONFLICT (slug) DO NOTHING;

-- Social > Novidades > Novos Recursos
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Novos Recursos', 'novos-recursos', 'Seção dedicada a Novos Recursos', id, 1, FALSE, 2
FROM categories WHERE slug = 'novidades'
ON CONFLICT (slug) DO NOTHING;

-- Social > Novidades > Eventos da Comunidade
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Eventos da Comunidade', 'eventos-da-comunidade', 'Seção dedicada a Eventos da Comunidade', id, 2, FALSE, 2
FROM categories WHERE slug = 'novidades'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SOCIAL > CARGOS ABERTOS (Nível 2)
-- ============================================

-- Social > Cargos Abertos > Moderação
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Moderação', 'moderacao', 'Seção dedicada a Moderação', id, 0, FALSE, 2
FROM categories WHERE slug = 'cargos-abertos'
ON CONFLICT (slug) DO NOTHING;

-- Social > Cargos Abertos > Uploader
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Uploader', 'uploader', 'Seção dedicada a Uploader', id, 1, FALSE, 2
FROM categories WHERE slug = 'cargos-abertos'
ON CONFLICT (slug) DO NOTHING;

-- Social > Cargos Abertos > Desenvolvimento
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Desenvolvimento', 'desenvolvimento', 'Seção dedicada a Desenvolvimento', id, 2, FALSE, 2
FROM categories WHERE slug = 'cargos-abertos'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SOCIAL > APRESENTAÇÕES (Nível 2)
-- ============================================

-- Social > Apresentações > Novos Membros
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Novos Membros', 'novos-membros', 'Seção dedicada a Novos Membros', id, 0, FALSE, 2
FROM categories WHERE slug = 'apresentacoes'
ON CONFLICT (slug) DO NOTHING;

-- Social > Apresentações > Equipe Oficial
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Equipe Oficial', 'equipe-oficial', 'Seção dedicada a Equipe Oficial', id, 1, FALSE, 2
FROM categories WHERE slug = 'apresentacoes'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBCATEGORIAS - GTRACKER (Nível 1)
-- ============================================

-- GTracker > Filmes
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Filmes', 'filmes', 'Seção dedicada a Filmes', id, 0, FALSE, 1
FROM categories WHERE slug = 'gtracker'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Séries
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Séries', 'series', 'Seção dedicada a Séries', id, 1, FALSE, 1
FROM categories WHERE slug = 'gtracker'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Jogos
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Jogos', 'jogos', 'Seção dedicada a Jogos', id, 2, FALSE, 1
FROM categories WHERE slug = 'gtracker'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Softwares
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Softwares', 'softwares', 'Seção dedicada a Softwares', id, 3, FALSE, 1
FROM categories WHERE slug = 'gtracker'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - GTRACKER > FILMES (Nível 2)
-- ============================================

-- GTracker > Filmes > 4K UHD
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT '4K UHD', '4k-uhd', 'Seção dedicada a 4K UHD', id, 0, FALSE, 2
FROM categories WHERE slug = 'filmes'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Filmes > BluRay 1080p
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'BluRay 1080p', 'bluray-1080p', 'Seção dedicada a BluRay 1080p', id, 1, FALSE, 2
FROM categories WHERE slug = 'filmes'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Filmes > 720p / 1080p WEB
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT '720p / 1080p WEB', '720p-1080p-web', 'Seção dedicada a 720p / 1080p WEB', id, 2, FALSE, 2
FROM categories WHERE slug = 'filmes'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Filmes > Coleções
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Coleções', 'colecoes', 'Seção dedicada a Coleções', id, 3, FALSE, 2
FROM categories WHERE slug = 'filmes'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - GTRACKER > SÉRIES (Nível 2)
-- ============================================

-- GTracker > Séries > Completas
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Completas', 'series-completas', 'Seção dedicada a Completas', id, 0, FALSE, 2
FROM categories WHERE slug = 'series'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Séries > Episódios Semanais
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Episódios Semanais', 'episodios-semanais', 'Seção dedicada a Episódios Semanais', id, 1, FALSE, 2
FROM categories WHERE slug = 'series'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - GTRACKER > JOGOS (Nível 2)
-- ============================================

-- GTracker > Jogos > Computador
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Computador', 'computador', 'Seção dedicada a Computador', id, 0, FALSE, 2
FROM categories WHERE slug = 'jogos'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Jogos > Consoles
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Consoles', 'consoles', 'Seção dedicada a Consoles', id, 1, FALSE, 2
FROM categories WHERE slug = 'jogos'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - GTRACKER > SOFTWARES (Nível 2)
-- ============================================

-- GTracker > Softwares > Windows
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Windows', 'windows', 'Seção dedicada a Windows', id, 0, FALSE, 2
FROM categories WHERE slug = 'softwares'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Softwares > Mac Os
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Mac Os', 'mac-os', 'Seção dedicada a Mac Os', id, 1, FALSE, 2
FROM categories WHERE slug = 'softwares'
ON CONFLICT (slug) DO NOTHING;

-- GTracker > Softwares > Linux
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Linux', 'linux', 'Seção dedicada a Linux', id, 2, FALSE, 2
FROM categories WHERE slug = 'softwares'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBCATEGORIAS - COMUNIDADE (Nível 1)
-- ============================================

-- Comunidade > Filmes
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Filmes', 'comunidade-filmes', 'Seção dedicada a Filmes', id, 0, FALSE, 1
FROM categories WHERE slug = 'comunidade'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Séries
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Séries', 'comunidade-series', 'Seção dedicada a Séries', id, 1, FALSE, 1
FROM categories WHERE slug = 'comunidade'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Jogos
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Jogos', 'comunidade-jogos', 'Seção dedicada a Jogos', id, 2, FALSE, 1
FROM categories WHERE slug = 'comunidade'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Criadores de Conteúdo
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Criadores de Conteúdo', 'criadores-de-conteudo', 'Seção dedicada a Criadores de Conteúdo', id, 3, FALSE, 1
FROM categories WHERE slug = 'comunidade'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - COMUNIDADE > FILMES (Nível 2)
-- ============================================

-- Comunidade > Filmes > 4K UHD
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT '4K UHD', 'comunidade-4k-uhd', 'Seção dedicada a 4K UHD', id, 0, FALSE, 2
FROM categories WHERE slug = 'comunidade-filmes'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Filmes > BluRay / 1080p
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'BluRay / 1080p', 'bluray-1080p-comunidade', 'Seção dedicada a BluRay / 1080p', id, 1, FALSE, 2
FROM categories WHERE slug = 'comunidade-filmes'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - COMUNIDADE > SÉRIES (Nível 2)
-- ============================================

-- Comunidade > Séries > Completas
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Completas', 'comunidade-series-completas', 'Seção dedicada a Completas', id, 0, FALSE, 2
FROM categories WHERE slug = 'comunidade-series'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Séries > Episódios Semanais
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Episódios Semanais', 'comunidade-episodios-semanais', 'Seção dedicada a Episódios Semanais', id, 1, FALSE, 2
FROM categories WHERE slug = 'comunidade-series'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - COMUNIDADE > JOGOS (Nível 2)
-- ============================================

-- Comunidade > Jogos > PC
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'PC', 'pc', 'Seção dedicada a PC', id, 0, FALSE, 2
FROM categories WHERE slug = 'comunidade-jogos'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Jogos > Consoles
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Consoles', 'comunidade-consoles', 'Seção dedicada a Consoles', id, 1, FALSE, 2
FROM categories WHERE slug = 'comunidade-jogos'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Jogos > Mobile
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Mobile', 'mobile', 'Seção dedicada a Mobile', id, 2, FALSE, 2
FROM categories WHERE slug = 'comunidade-jogos'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Jogos > Indie
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Indie', 'indie', 'Seção dedicada a Indie', id, 3, FALSE, 2
FROM categories WHERE slug = 'comunidade-jogos'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - COMUNIDADE > CRIADORES (Nível 2)
-- ============================================

-- Comunidade > Criadores de Conteúdo > Mods
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Mods', 'mods', 'Seção dedicada a Mods', id, 0, FALSE, 2
FROM categories WHERE slug = 'criadores-de-conteudo'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Criadores de Conteúdo > Fansites
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Fansites', 'fansites', 'Seção dedicada a Fansites', id, 1, FALSE, 2
FROM categories WHERE slug = 'criadores-de-conteudo'
ON CONFLICT (slug) DO NOTHING;

-- Comunidade > Criadores de Conteúdo > Projetos da Comunidade
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Projetos da Comunidade', 'projetos-da-comunidade', 'Seção dedicada a Projetos da Comunidade', id, 2, FALSE, 2
FROM categories WHERE slug = 'criadores-de-conteudo'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBCATEGORIAS - SUPORTE (Nível 1)
-- ============================================

-- Suporte > Suporte Técnico
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Suporte Técnico', 'suporte-tecnico', 'Seção dedicada a Suporte Técnico', id, 0, FALSE, 1
FROM categories WHERE slug = 'suporte'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Tutoriais
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Tutoriais', 'tutoriais', 'Seção dedicada a Tutoriais', id, 1, FALSE, 1
FROM categories WHERE slug = 'suporte'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Sugestões
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Sugestões', 'sugestoes', 'Seção dedicada a Sugestões', id, 2, FALSE, 1
FROM categories WHERE slug = 'suporte'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SUPORTE > SUPORTE TÉCNICO (Nível 2)
-- ============================================

-- Suporte > Suporte Técnico > Problemas de Login
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Problemas de Login', 'problemas-de-login', 'Seção dedicada a Problemas de Login', id, 0, FALSE, 2
FROM categories WHERE slug = 'suporte-tecnico'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Suporte Técnico > Bugs no Fórum
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Bugs no Fórum', 'bugs-no-forum', 'Seção dedicada a Bugs no Fórum', id, 1, FALSE, 2
FROM categories WHERE slug = 'suporte-tecnico'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Suporte Técnico > Reportar Erros
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Reportar Erros', 'reportar-erros', 'Seção dedicada a Reportar Erros', id, 2, FALSE, 2
FROM categories WHERE slug = 'suporte-tecnico'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SUPORTE > TUTORIAIS (Nível 2)
-- ============================================

-- Suporte > Tutoriais > Como usar o Fórum
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Como usar o Fórum', 'como-usar-o-forum', 'Seção dedicada a Como usar o Fórum', id, 0, FALSE, 2
FROM categories WHERE slug = 'tutoriais'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Tutoriais > Uploads / Downloads
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Uploads / Downloads', 'uploads-downloads', 'Seção dedicada a Uploads / Downloads', id, 1, FALSE, 2
FROM categories WHERE slug = 'tutoriais'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Tutoriais > Regras de Postagem
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Regras de Postagem', 'regras-de-postagem', 'Seção dedicada a Regras de Postagem', id, 2, FALSE, 2
FROM categories WHERE slug = 'tutoriais'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - SUPORTE > SUGESTÕES (Nível 2)
-- ============================================

-- Suporte > Sugestões > Melhorias
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Melhorias', 'melhorias', 'Seção dedicada a Melhorias', id, 0, FALSE, 2
FROM categories WHERE slug = 'sugestoes'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Sugestões > Pedidos de Categorias
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Pedidos de Categorias', 'pedidos-de-categorias', 'Seção dedicada a Pedidos de Categorias', id, 1, FALSE, 2
FROM categories WHERE slug = 'sugestoes'
ON CONFLICT (slug) DO NOTHING;

-- Suporte > Sugestões > Votações da Comunidade
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Votações da Comunidade', 'votacoes-da-comunidade', 'Seção dedicada a Votações da Comunidade', id, 2, FALSE, 2
FROM categories WHERE slug = 'sugestoes'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBCATEGORIAS - ENTRETENIMENTO (Nível 1)
-- ============================================

-- Entretenimento > Músicas
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Músicas', 'musicas', 'Seção dedicada a Músicas', id, 0, FALSE, 1
FROM categories WHERE slug = 'entretenimento'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Animes & Mangás
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Animes & Mangás', 'animes-mangas', 'Seção dedicada a Animes & Mangás', id, 1, FALSE, 1
FROM categories WHERE slug = 'entretenimento'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Livros & HQs
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Livros & HQs', 'livros-hqs', 'Seção dedicada a Livros & HQs', id, 2, FALSE, 1
FROM categories WHERE slug = 'entretenimento'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - ENTRETENIMENTO > MÚSICAS (Nível 2)
-- ============================================

-- Entretenimento > Músicas > MP3
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'MP3', 'mp3', 'Seção dedicada a MP3', id, 0, FALSE, 2
FROM categories WHERE slug = 'musicas'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Músicas > FLAC
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'FLAC', 'flac', 'Seção dedicada a FLAC', id, 1, FALSE, 2
FROM categories WHERE slug = 'musicas'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Músicas > Shows / Concertos
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Shows / Concertos', 'shows-concertos', 'Seção dedicada a Shows / Concertos', id, 2, FALSE, 2
FROM categories WHERE slug = 'musicas'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - ENTRETENIMENTO > ANIMES (Nível 2)
-- ============================================

-- Entretenimento > Animes & Mangás > Episódios
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Episódios', 'episodios', 'Seção dedicada a Episódios', id, 0, FALSE, 2
FROM categories WHERE slug = 'animes-mangas'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Animes & Mangás > Filmes
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Filmes', 'animes-filmes', 'Seção dedicada a Filmes', id, 1, FALSE, 2
FROM categories WHERE slug = 'animes-mangas'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Animes & Mangás > Reviews
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Reviews', 'animes-reviews', 'Seção dedicada a Reviews', id, 2, FALSE, 2
FROM categories WHERE slug = 'animes-mangas'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - ENTRETENIMENTO > LIVROS (Nível 2)
-- ============================================

-- Entretenimento > Livros & HQs > Ebooks
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Ebooks', 'ebooks', 'Seção dedicada a Ebooks', id, 0, FALSE, 2
FROM categories WHERE slug = 'livros-hqs'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Livros & HQs > Comics
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Comics', 'comics', 'Seção dedicada a Comics', id, 1, FALSE, 2
FROM categories WHERE slug = 'livros-hqs'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimento > Livros & HQs > Reviews
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Reviews', 'livros-reviews', 'Seção dedicada a Reviews', id, 2, FALSE, 2
FROM categories WHERE slug = 'livros-hqs'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBCATEGORIAS - OFF-TOPIC (Nível 1)
-- ============================================

-- Off-Topic > Conversas Gerais
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Conversas Gerais', 'conversas-gerais', 'Seção dedicada a Conversas Gerais', id, 0, FALSE, 1
FROM categories WHERE slug = 'off-topic'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Tecnologia
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Tecnologia', 'offtopic-tecnologia', 'Seção dedicada a Tecnologia', id, 1, FALSE, 1
FROM categories WHERE slug = 'off-topic'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Humor
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Humor', 'humor', 'Seção dedicada a Humor', id, 2, FALSE, 1
FROM categories WHERE slug = 'off-topic'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Marketplace
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Marketplace', 'marketplace', 'Seção dedicada a Marketplace', id, 3, FALSE, 1
FROM categories WHERE slug = 'off-topic'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - OFF-TOPIC > CONVERSAS (Nível 2)
-- ============================================

-- Off-Topic > Conversas Gerais > Aleatório
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Aleatório', 'aleatorio', 'Seção dedicada a Aleatório', id, 0, FALSE, 2
FROM categories WHERE slug = 'conversas-gerais'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Conversas Gerais > Curiosidades
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Curiosidades', 'curiosidades', 'Seção dedicada a Curiosidades', id, 1, FALSE, 2
FROM categories WHERE slug = 'conversas-gerais'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - OFF-TOPIC > TECNOLOGIA (Nível 2)
-- ============================================

-- Off-Topic > Tecnologia > Hardware
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Hardware', 'hardware', 'Seção dedicada a Hardware', id, 0, FALSE, 2
FROM categories WHERE slug = 'offtopic-tecnologia'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Tecnologia > Software
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Software', 'software', 'Seção dedicada a Software', id, 1, FALSE, 2
FROM categories WHERE slug = 'offtopic-tecnologia'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Tecnologia > Mobile
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Mobile', 'offtopic-mobile', 'Seção dedicada a Mobile', id, 2, FALSE, 2
FROM categories WHERE slug = 'offtopic-tecnologia'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - OFF-TOPIC > HUMOR (Nível 2)
-- ============================================

-- Off-Topic > Humor > Memes
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Memes', 'memes', 'Seção dedicada a Memes', id, 0, FALSE, 2
FROM categories WHERE slug = 'humor'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Humor > Piadas
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Piadas', 'piadas', 'Seção dedicada a Piadas', id, 1, FALSE, 2
FROM categories WHERE slug = 'humor'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUB-SUBCATEGORIAS - OFF-TOPIC > MARKETPLACE (Nível 2)
-- ============================================

-- Off-Topic > Marketplace > Trocas
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Trocas', 'trocas', 'Seção dedicada a Trocas', id, 0, FALSE, 2
FROM categories WHERE slug = 'marketplace'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Marketplace > Vendas
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Vendas', 'vendas', 'Seção dedicada a Vendas', id, 1, FALSE, 2
FROM categories WHERE slug = 'marketplace'
ON CONFLICT (slug) DO NOTHING;

-- Off-Topic > Marketplace > Serviços
INSERT INTO categories (name, slug, description, parent_id, display_order, is_locked, level)
SELECT 'Serviços', 'servicos', 'Seção dedicada a Serviços', id, 2, FALSE, 2
FROM categories WHERE slug = 'marketplace'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- RESULTADO
-- ============================================

-- Exibir resumo
DO $$
DECLARE
    total_count INTEGER;
    root_count INTEGER;
    level1_count INTEGER;
    level2_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM categories;
    SELECT COUNT(*) INTO root_count FROM categories WHERE level = 0;
    SELECT COUNT(*) INTO level1_count FROM categories WHERE level = 1;
    SELECT COUNT(*) INTO level2_count FROM categories WHERE level = 2;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEED DE CATEGORIAS CONCLUÍDO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de categorias: %', total_count;
    RAISE NOTICE 'Categorias raiz (nível 0): %', root_count;
    RAISE NOTICE 'Subcategorias (nível 1): %', level1_count;
    RAISE NOTICE 'Sub-subcategorias (nível 2): %', level2_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Listar categorias raiz criadas
SELECT
    name AS "Categoria",
    slug AS "Slug",
    icon AS "Ícone",
    (SELECT COUNT(*) FROM categories c2 WHERE c2.parent_id = c1.id) AS "Subcategorias"
FROM categories c1
WHERE level = 0
ORDER BY display_order;

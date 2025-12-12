// Post (Reply/Comment) Types for Gtracker Forum

// Perfil expandido do usuário (usado em threads e posts)
export interface UserProfileExpanded {
  id: string;
  username: string;
  avatar_url: string | null;
  total_posts: number;
  total_likes: number;
  level: number;
  role: string;
  ranking: number;
  signature: string | null;
}

// Post/Reply/Comment
export interface Post {
  id: string;
  thread_id: string;
  author_id: string;
  parent_post_id: string | null;
  content: string;
  is_edited: boolean;
  edited_at: Date | null;
  like_count: number;
  created_at: Date;
  updated_at: Date;
}

// Post com informações do autor
export interface PostWithAuthor extends Post {
  author: UserProfileExpanded;
}

// Post com informações extras (se usuário curtiu)
export interface PostWithDetails extends PostWithAuthor {
  user_has_liked: boolean;
  replies?: PostWithAuthor[]; // Respostas aninhadas (opcional)
}

// DTOs para criação e atualização

export interface CreatePostDto {
  threadId: string;
  content: string;
  parentPostId?: string | null; // Para respostas aninhadas
}

export interface UpdatePostDto {
  content: string;
}

// DTOs para queries

export interface GetPostsQuery {
  threadId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'asc' | 'desc'; // Ordenação por data
  parentPostId?: string | null; // Filtrar por post pai
}

export interface PostsResponse {
  posts: PostWithDetails[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Estatísticas de posts
export interface PostStats {
  total_posts: number;
  total_replies: number;
  total_likes: number;
  most_liked_post: Post | null;
}

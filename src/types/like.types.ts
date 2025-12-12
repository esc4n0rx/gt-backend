// Like Types for Gtracker Forum

// Like em thread
export interface ThreadLike {
  id: string;
  thread_id: string;
  user_id: string;
  created_at: Date;
}

// Like em post
export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: Date;
}

// DTOs

export interface CreateThreadLikeDto {
  threadId: string;
  userId: string;
}

export interface CreatePostLikeDto {
  postId: string;
  userId: string;
}

// Resposta de verificação de like
export interface LikeStatusResponse {
  hasLiked: boolean;
  likeCount: number;
}

// Lista de usuários que curtiram
export interface LikeUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  created_at: Date;
}

export interface LikesListResponse {
  likes: LikeUser[];
  total: number;
}

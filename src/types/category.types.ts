// Tipos para o sistema de categorias

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  display_order: number;
  is_locked: boolean;
  icon: string | null;
  level: number;
  thread_count: number;
  post_count: number;
  last_thread_id: string | null;
  last_post_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  display_order: number;
  is_locked: boolean;
  icon: string | null;
  level: number;
  thread_count: number;
  post_count: number;
  children: CategoryTreeNode[];
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  isLocked?: boolean;
  icon?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isLocked?: boolean;
  icon?: string;
}

export interface ReorderCategoryDTO {
  categoryId: string;
  newOrder: number;
}

export interface Thread {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

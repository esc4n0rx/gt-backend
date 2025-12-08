import { supabase } from '../config/database';
import {
  Category,
  CategoryTreeNode,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '../types/category.types';

export class CategoryRepository {
  // Criar nova categoria
  async create(data: CreateCategoryDTO): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parent_id: data.parentId || null,
        display_order: data.displayOrder || 0,
        is_locked: data.isLocked || false,
        icon: data.icon || null,
      } as any)
      .select()
      .single();

    if (error || !category) {
      throw new Error(`Falha ao criar categoria: ${error?.message}`);
    }

    return this.mapToCategory(category);
  }

  // Buscar categoria por ID
  async findById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToCategory(data);
  }

  // Buscar categoria por slug
  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return this.mapToCategory(data);
  }

  // Listar todas as categorias raiz (nível 0)
  async findRootCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((cat) => this.mapToCategory(cat));
  }

  // Listar subcategorias de uma categoria pai
  async findByParentId(parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((cat) => this.mapToCategory(cat));
  }

  // Listar todas as categorias (flat)
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return data.map((cat) => this.mapToCategory(cat));
  }

  // Obter árvore completa de categorias usando função SQL
  async getTree(): Promise<CategoryTreeNode[]> {
    const { data, error } = await supabase.rpc('get_category_tree');

    if (error || !data) {
      console.error('Erro ao buscar árvore de categorias:', error);
      return [];
    }

    // Construir árvore a partir dos dados flat
    return this.buildTree(data);
  }

  // Atualizar categoria
  async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
    if (data.isLocked !== undefined) updateData.is_locked = data.isLocked;
    if (data.icon !== undefined) updateData.icon = data.icon;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !category) {
      throw new Error(`Falha ao atualizar categoria: ${error?.message}`);
    }

    return this.mapToCategory(category);
  }

  // Atualizar ordem de exibição
  async updateDisplayOrder(id: string, newOrder: number): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .update({ display_order: newOrder })
      .eq('id', id)
      .select()
      .single();

    if (error || !category) {
      throw new Error(`Falha ao atualizar ordem: ${error?.message}`);
    }

    return this.mapToCategory(category);
  }

  // Deletar categoria (falhará se houver threads)
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw new Error(`Falha ao deletar categoria: ${error.message}`);
    }
  }

  // Verificar se categoria tem threads
  async hasThreads(categoryId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('threads')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) return false;
    return (count || 0) > 0;
  }

  // Verificar se categoria tem subcategorias
  async hasSubcategories(categoryId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', categoryId);

    if (error) return false;
    return (count || 0) > 0;
  }

  // Contar total de categorias
  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  }

  // Verificar se slug já existe
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = supabase.from('categories').select('id').eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.single();
    return data !== null;
  }

  // Construir árvore hierárquica a partir de dados flat
  private buildTree(flatData: any[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Criar mapa de todos os nós
    flatData.forEach((item) => {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        parent_id: item.parent_id,
        display_order: item.display_order,
        is_locked: item.is_locked,
        icon: item.icon,
        level: item.level,
        thread_count: item.thread_count,
        post_count: item.post_count,
        children: [],
      });
    });

    // Construir hierarquia
    map.forEach((node) => {
      if (node.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(node.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // Ordenar recursivamente
    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.display_order - b.display_order);
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  }

  private mapToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      parent_id: row.parent_id,
      display_order: row.display_order,
      is_locked: row.is_locked,
      icon: row.icon,
      level: row.level,
      thread_count: row.thread_count,
      post_count: row.post_count,
      last_thread_id: row.last_thread_id,
      last_post_at: row.last_post_at ? new Date(row.last_post_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

export const categoryRepository = new CategoryRepository();

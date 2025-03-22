import type { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

// Type definitions
type QueryOptions = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  fields?: string;
  filters?: Record<string, any>;
};

type User = {
  id: string;
  email: string;
  name?: string;
  profile_image_url?: string;
  created_at: string;
};

type UserProfile = {
  bio?: string;
  website?: string;
  social_links?: Record<string, string>;
  backers?: Backer[];
} & User;

type Project = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'canceled';
  funding_goal: number;
  total_raised: number;
  category_id: string;
  publisher_id: string;
  start_date: string;
  end_date: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  publishers?: Publisher;
  categories?: Category;
  project_media?: ProjectMedia[];
  rewards?: Reward[];
  updates?: ProjectUpdate[];
};

type Category = {
  id: string;
  name: string;
  description?: string;
  display_order: number;
};

type Publisher = {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  projects?: Project[];
};

type Backer = {
  id: string;
  user_id: string;
  project_id: string;
  amount: number;
  created_at: string;
};

type ProjectMedia = {
  id: string;
  project_id: string;
  url: string;
  type: 'image' | 'video';
  display_order: number;
};

type Reward = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  amount: number;
  estimated_delivery: string;
  limit?: number;
  claimed: number;
};

type ProjectUpdate = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
};

type Comment = {
  id: string;
  project_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  created_at: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  users?: {
    id: string;
    name: string;
    profile_image_url?: string;
  };
};

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
};

type QueryError = {
  code?: string;
  details?: string;
} & Error;

// Error handling middleware
const withErrorHandling = <T, Args extends any[]>(
  queryFn: (...args: Args) => Promise<T>,
  errorMessage: string,
) => {
  return async (...args: Args): Promise<T> => {
    try {
      const result = await queryFn(...args);
      if (result === null) {
        throw new Error(`${errorMessage}: No data returned`);
      }
      return result;
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw new QueryError(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
};

// Performance tracking middleware
const withPerformanceTracking = <T, Args extends any[]>(
  queryFn: (...args: Args) => Promise<T>,
  queryName: string,
) => {
  return async (...args: Args): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await queryFn(...args);
      const endTime = performance.now();
      console.debug(`Query '${queryName}' took ${(endTime - startTime).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Query '${queryName}' failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Input validation middleware
const withValidation = <T, Args extends any[]>(
  queryFn: (...args: Args) => Promise<T>,
  validator: (args: Args) => boolean | string,
) => {
  return async (...args: Args): Promise<T> => {
    const validationResult = validator(args);
    if (validationResult !== true) {
      throw new Error(typeof validationResult === 'string' ? validationResult : 'Validation failed');
    }
    return queryFn(...args);
  };
};

// Helper for pagination
const applyPagination = (query: any, page?: number, pageSize?: number) => {
  if (page && pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return query.range(from, to);
  }
  return query;
};

// Helper for sorting
const applySorting = (query: any, sortBy?: string, sortDirection: 'asc' | 'desc' = 'desc') => {
  if (sortBy) {
    return query.order(sortBy, { ascending: sortDirection === 'asc' });
  }
  return query;
};

// Helper for filtering
const applyFilters = (query: any, filters?: Record<string, any>) => {
  if (!filters) {
    return query;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'string' && value.includes('%')) {
      // Handle like queries
      query = query.ilike(key, value);
    } else if (Array.isArray(value)) {
      // Handle in queries
      query = query.in(key, value);
    } else {
      // Handle equality
      query = query.eq(key, value);
    }
  });

  return query;
};

// Sanitize input to prevent SQL injection
const sanitizeInput = (input: string): string => {
  if (!input) {
    return '';
  }
  // Escape special characters used in SQL LIKE patterns
  return input.replace(/[\\%_]/g, '\\$&');
};

// Cache configuration
const CACHE_TTL = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
  LONG: 1000 * 60 * 60 * 24, // 24 hours
};

// ==================== USER QUERIES ====================

/**
 * Get the current authenticated user
 */
export const getUser = cache(
  withErrorHandling(
    async (supabase: SupabaseClient): Promise<User | null> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }
      return user;
    },
    'Failed to get authenticated user',
  ),
);

/**
 * Get a user's profile by user ID
 */
export const getUserProfile = cache(
  withPerformanceTracking(
    withErrorHandling(
      withValidation(
        async (supabase: SupabaseClient, userId: string): Promise<UserProfile | null> => {
          const { data, error } = await supabase
            .from('users')
            .select('id, name, email, profile_image_url, bio, website, social_links, created_at, backers(id, project_id, amount, created_at)')
            .eq('id', userId)
            .single();

          if (error) {
            throw error;
          }
          return data;
        },
        args => args[1] ? true : 'User ID is required',
      ),
      'Failed to get user profile',
    ),
    'getUserProfile',
  ),
);

/**
 * Get user notifications with pagination
 */
export const getUserNotifications = cache(
  withErrorHandling(
    async (
      supabase: SupabaseClient,
      userId: string,
      options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
    ): Promise<Notification[]> => {
      let query = supabase
        .from('notifications')
        .select('id, user_id, type, title, message, read, created_at, data')
        .eq('user_id', userId);

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      query = applyPagination(query, options.page, options.pageSize || 20)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get user notifications',
  ),
);

/**
 * Subscribe to user notifications
 */
export const subscribeToUserNotifications = (
  supabase: SupabaseClient,
  userId: string,
  callback: (payload: any) => void,
) => {
  return supabase
    .channel(`user-notifications-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, payload => callback(payload))
    .subscribe();
};

/**
 * Get user backings/contributions
 */
export const getUserBackings = cache(
  withErrorHandling(
    async (
      supabase: SupabaseClient,
      userId: string,
      options: QueryOptions = {},
    ): Promise<any[]> => {
      let query = supabase
        .from('contributions')
        .select(`
          id, amount, status, created_at,
          projects(id, title, status, end_date, total_raised, funding_goal),
          rewards(id, title, amount, estimated_delivery)
        `)
        .eq('backer_id', userId);

      query = applyPagination(query, options.page, options.pageSize);
      query = applySorting(query, options.sortBy || 'created_at', options.sortDirection || 'desc');

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get user backings',
  ),
);

// ==================== PROJECT QUERIES ====================

/**
 * Get featured projects
 */
export const getFeaturedProjects = cache(
  withPerformanceTracking(
    withErrorHandling(
      async (
        supabase: SupabaseClient,
        limit: number = 6,
      ): Promise<Project[]> => {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id, title, description, funding_goal, total_raised, start_date, end_date, created_at,
            publishers(id, name, logo_url),
            categories(id, name),
            project_media(id, url, type, display_order)
          `)
          .eq('featured', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }
        return data || [];
      },
      'Failed to get featured projects',
    ),
    'getFeaturedProjects',
  ),
);

/**
 * Get project details by ID
 */
export const getProjectDetails = cache(
  withPerformanceTracking(
    withErrorHandling(
      withValidation(
        async (supabase: SupabaseClient, projectId: string): Promise<Project | null> => {
          const { data, error } = await supabase
            .from('projects')
            .select(`
              id, title, description, status, funding_goal, total_raised, 
              category_id, publisher_id, start_date, end_date, featured,
              created_at, updated_at,
              publishers(id, name, description, logo_url, website),
              categories(id, name),
              project_media(id, url, type, display_order),
              rewards(id, title, description, amount, estimated_delivery, limit, claimed),
              updates(id, title, content, created_at)
            `)
            .eq('id', projectId)
            .single();

          if (error) {
            throw error;
          }
          return data;
        },
        args => args[1] ? true : 'Project ID is required',
      ),
      'Failed to get project details',
    ),
    'getProjectDetails',
  ),
);

/**
 * Get projects by category
 */
export const getProjectsByCategory = cache(
  withErrorHandling(
    async (
      supabase: SupabaseClient,
      categoryId: string,
      options: QueryOptions = {},
    ): Promise<Project[]> => {
      let query = supabase
        .from('projects')
        .select(`
          id, title, description, status, funding_goal, total_raised, 
          start_date, end_date, created_at,
          publishers(id, name, logo_url),
          categories(id, name),
          project_media(id, url, type, display_order)
        `)
        .eq('category_id', categoryId)
        .eq('status', 'active');

      query = applyPagination(query, options.page, options.pageSize);
      query = applySorting(query, options.sortBy || 'created_at', options.sortDirection || 'desc');

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get projects by category',
  ),
);

/**
 * Get project statistics
 */
export const getProjectStatistics = cache(
  withErrorHandling(
    async (supabase: SupabaseClient, projectId: string): Promise<any> => {
      const { data, error } = await supabase
        .from('project_statistics')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    'Failed to get project statistics',
  ),
);

/**
 * Get project funding status
 */
export const getProjectFundingStatus = cache(
  withErrorHandling(
    async (supabase: SupabaseClient, projectId: string): Promise<any> => {
      const { data, error } = await supabase
        .from('project_funding_status')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    'Failed to get project funding status',
  ),
);

/**
 * Subscribe to project updates
 */
export const subscribeToProjectUpdates = (
  supabase: SupabaseClient,
  projectId: string,
  callback: (payload: any) => void,
) => {
  return supabase
    .channel(`project-${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `id=eq.${projectId}`,
    }, payload => callback(payload))
    .subscribe();
};

/**
 * Enhanced project search with multiple options
 */
export const searchProjects = cache(
  withPerformanceTracking(
    withErrorHandling(
      withValidation(
        async (
          supabase: SupabaseClient,
          query: string,
          options: QueryOptions = {},
        ): Promise<Project[]> => {
          const sanitizedQuery = sanitizeInput(query);

          let dbQuery = supabase
            .from('projects')
            .select(`
              id, title, description, status, funding_goal, total_raised, created_at,
              publishers(id, name, logo_url),
              categories(id, name)
            `)
            .eq('status', 'active')
            .or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);

          dbQuery = applyPagination(dbQuery, options.page, options.pageSize);
          dbQuery = applySorting(dbQuery, options.sortBy || 'created_at', options.sortDirection || 'desc');
          dbQuery = applyFilters(dbQuery, options.filters);

          const { data, error } = await dbQuery;
          if (error) {
            throw error;
          }
          return data || [];
        },
        (args) => {
          const query = args[1];
          if (!query) {
            return 'Search query is required';
          }
          if (typeof query !== 'string') {
            return 'Search query must be a string';
          }
          if (query.trim().length < 2) {
            return 'Search query must be at least 2 characters';
          }
          return true;
        },
      ),
      'Failed to search projects',
    ),
    'searchProjects',
  ),
);

// ==================== CATEGORY QUERIES ====================

/**
 * Get all categories
 */
export const getCategories = cache(
  withErrorHandling(
    async (supabase: SupabaseClient): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, display_order')
        .order('display_order');

      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get categories',
  ),
);

// ==================== PUBLISHER QUERIES ====================

/**
 * Get publisher profile
 */
export const getPublisherProfile = cache(
  withErrorHandling(
    async (supabase: SupabaseClient, publisherId: string): Promise<Publisher | null> => {
      const { data, error } = await supabase
        .from('publishers')
        .select(`
          id, name, description, logo_url, website, created_at,
          projects(
            id, title, description, status, funding_goal, total_raised, 
            start_date, end_date, created_at
          )
        `)
        .eq('id', publisherId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    'Failed to get publisher profile',
  ),
);

// ==================== COMMENT QUERIES ====================

/**
 * Get project comments
 */
export const getProjectComments = cache(
  withErrorHandling(
    async (
      supabase: SupabaseClient,
      projectId: string,
      options: QueryOptions = {},
    ): Promise<Comment[]> => {
      let query = supabase
        .from('comments')
        .select(`
          id, project_id, user_id, parent_comment_id, content, created_at, moderation_status,
          users(id, name, profile_image_url)
        `)
        .eq('project_id', projectId)
        .is('parent_comment_id', null)
        .eq('moderation_status', 'approved');

      query = applyPagination(query, options.page, options.pageSize);
      query = applySorting(query, options.sortBy || 'created_at', options.sortDirection || 'desc');

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get project comments',
  ),
);

/**
 * Get comment replies
 */
export const getCommentReplies = cache(
  withErrorHandling(
    async (supabase: SupabaseClient, commentId: string): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, project_id, user_id, parent_comment_id, content, created_at, moderation_status,
          users(id, name, profile_image_url)
        `)
        .eq('parent_comment_id', commentId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get comment replies',
  ),
);

/**
 * Create or add a new comment
 */
export const createComment = async (
  supabase: SupabaseClient,
  {
    projectId,
    userId,
    content,
    parentCommentId = null,
  }: {
    projectId: string;
    userId: string;
    content: string;
    parentCommentId?: string | null;
  },
): Promise<Comment> => {
  try {
    // Validate input
    if (!content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        project_id: projectId,
        user_id: userId,
        parent_comment_id: parentCommentId,
        content: content.trim(),
        moderation_status: 'pending', // Assuming comments need approval
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw new Error(`Failed to post comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ==================== ADVANCED QUERIES ====================

/**
 * Get trending projects based on recent donations and page views
 */
export const getTrendingProjects = cache(
  withPerformanceTracking(
    withErrorHandling(
      async (
        supabase: SupabaseClient,
        options: { timeframe?: 'day' | 'week' | 'month'; limit?: number } = {},
      ): Promise<Project[]> => {
        const timeframe = options.timeframe || 'week';
        const limit = options.limit || 10;

        const timeframeMap = {
          day: '1 day',
          week: '7 days',
          month: '30 days',
        };

        const { data, error } = await supabase
          .rpc('get_trending_projects', {
            time_frame: timeframeMap[timeframe],
            result_limit: limit,
          });

        if (error) {
          throw error;
        }
        return data || [];
      },
      'Failed to get trending projects',
    ),
    'getTrendingProjects',
  ),
);

/**
 * Get recommended projects for a user based on their history
 */
export const getRecommendedProjects = cache(
  withErrorHandling(
    async (
      supabase: SupabaseClient,
      userId: string,
      limit: number = 5,
    ): Promise<Project[]> => {
      const { data, error } = await supabase
        .rpc('get_user_recommendations', {
          user_id: userId,
          rec_limit: limit,
        });

      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get recommended projects',
  ),
);

/**
 * Get projects about to end their funding period
 */
export const getEndingSoonProjects = cache(
  withErrorHandling(
    async (
      supabase: SupabaseClient,
      daysRemaining: number = 7,
      limit: number = 10,
    ): Promise<Project[]> => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + daysRemaining);

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, description, funding_goal, total_raised, start_date, end_date,
          publishers(id, name, logo_url),
          categories(id, name),
          project_media(id, url, type, display_order)
        `)
        .eq('status', 'active')
        .gte('end_date', today.toISOString())
        .lte('end_date', endDate.toISOString())
        .order('end_date', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }
      return data || [];
    },
    'Failed to get ending soon projects',
  ),
);

// Export a reusable queryBuilder for custom queries
export const createQueryBuilder = (supabase: SupabaseClient, table: string) => {
  let query = supabase.from(table).select();
  /// FIXME
  const builder = {
  };
  return {
    select: (fields: string) => {
      query = supabase.from(table).select(fields);
      return builder;
    },
    filter: (column: string, operator: string, value: any) => {
      if (operator === 'eq') {
        query = query.eq(column, value);
      } else if (operator === 'neq') {
        query = query.neq(column, value);
      } else if (operator === 'gt') {
        query = query.gt(column, value);
      } else if (operator === 'gte') {
        query = query.gte(column, value);
      } else if (operator === 'lt') {
        query = query.lt(column, value);
      } else if (operator === 'lte') {
        query = query.lte(column, value);
      } else if (operator === 'like') {
        query = query.like(column, value);
      } else if (operator === 'ilike') {
        query = query.ilike(column, value);
      } else if (operator === 'in') {
        query = query.in(column, value);
      } else if (operator === 'is') {
        query = query.is(column, value);
      }
      return builder;
    },
    sort: (column: string, ascending: boolean = false) => {
      query = query.order(column, { ascending });
      return builder;
    },
    paginate: (page: number, pageSize: number) => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      return builder;
    },
    limit: (limit: number) => {
      query = query.limit(limit);
      return builder;
    },
    single: () => {
      query = query.single();
      return builder;
    },
    execute: async <T>() => {
      try {
        const { data, error } = await query;
        if (error) {
          throw error;
        }
        return data as T;
      } catch (error) {
        console.error(`Query execution failed:`, error);
        throw error;
      }
    },
  };
};

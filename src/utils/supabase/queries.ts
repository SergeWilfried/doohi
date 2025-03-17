import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

// Users and authentication
export const getUser = cache(async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getUserProfile = cache(async (supabase: SupabaseClient, userId: string) => {
  const { data: userProfile } = await supabase
    .from('users')
    .select('*, backers(*)')
    .eq('id', userId)
    .single();
  return userProfile;
});

// Projects
export const getFeaturedProjects = cache(async (supabase: SupabaseClient) => {
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      publishers(*),
      categories(*),
      project_media(*)
    `)
    .eq('featured', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6);
  return projects;
});

export const getProjectDetails = cache(async (supabase: SupabaseClient, projectId: string) => {
  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      publishers(*),
      categories(*),
      project_media(*),
      rewards(*),
      updates(*)
    `)
    .eq('id', projectId)
    .single();
  return project;
});

export const getProjectsByCategory = cache(async (supabase: SupabaseClient, categoryId: string) => {
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      publishers(*),
      categories(*),
      project_media(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  return projects;
});

// Categories
export const getCategories = cache(async (supabase: SupabaseClient) => {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');
  return categories;
});

// Publishers
export const getPublisherProfile = cache(async (supabase: SupabaseClient, publisherId: string) => {
  const { data: publisher } = await supabase
    .from('publishers')
    .select(`
      *,
      projects(*)
    `)
    .eq('id', publisherId)
    .single();
  return publisher;
});

// Backers
export const getUserBackings = cache(async (supabase: SupabaseClient, userId: string) => {
  const { data: contributions } = await supabase
    .from('contributions')
    .select(`
      *,
      projects(*),
      rewards(*)
    `)
    .eq('backer_id', userId)
    .order('created_at', { ascending: false });
  return contributions;
});

// Project statistics
export const getProjectStatistics = cache(async (supabase: SupabaseClient, projectId: string) => {
  const { data: statistics } = await supabase
    .from('project_statistics')
    .select('*')
    .eq('id', projectId)
    .single();
  return statistics;
});

// Search
export const searchProjects = cache(async (supabase: SupabaseClient, query: string) => {
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      publishers(*),
      categories(*)
    `)
    .eq('status', 'active')
    .ilike('title', `%${query}%`)
    .order('created_at', { ascending: false });
  return projects;
});

// Notifications
export const getUserNotifications = cache(async (supabase: SupabaseClient, userId: string) => {
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return notifications;
});

// Comments
export const getProjectComments = cache(async (supabase: SupabaseClient, projectId: string) => {
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      users(id, name, profile_image_url)
    `)
    .eq('project_id', projectId)
    .is('parent_comment_id', null)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false });
  return comments;
});

// Project funding status
export const getProjectFundingStatus = cache(async (supabase: SupabaseClient, projectId: string) => {
  const { data: fundingStatus } = await supabase
    .from('project_funding_status')
    .select('*')
    .eq('id', projectId)
    .single();
  return fundingStatus;
});
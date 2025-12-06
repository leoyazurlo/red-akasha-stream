import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CreatorProfileType = 
  | "musico" 
  | "percusion" 
  | "agrupacion_musical" 
  | "dj" 
  | "vj" 
  | "danza" 
  | "arte_digital";

export interface ContentWithCreator {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  content_type: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  uploader_id: string;
  creator_name: string;
  creator_avatar: string | null;
  creator_profile_type: string;
}

export const useContentByCreatorProfile = (profileType?: CreatorProfileType) => {
  return useQuery({
    queryKey: ["content-by-creator", profileType],
    queryFn: async () => {
      let profileQuery = supabase
        .from('profile_details')
        .select('user_id, display_name, avatar_url, profile_type');

      if (profileType) {
        profileQuery = profileQuery.eq('profile_type', profileType);
      }

      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      const userIds = profiles.map(p => p.user_id);

      const { data: content, error: contentError } = await supabase
        .from('content_uploads')
        .select('*')
        .in('uploader_id', userIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;

      const contentWithCreator: ContentWithCreator[] = (content || []).map(item => {
        const creator = profiles.find(p => p.user_id === item.uploader_id);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          thumbnail_url: item.thumbnail_url,
          video_url: item.video_url,
          content_type: item.content_type,
          views_count: item.views_count || 0,
          likes_count: item.likes_count || 0,
          created_at: item.created_at,
          uploader_id: item.uploader_id,
          creator_name: creator?.display_name || 'Unknown',
          creator_avatar: creator?.avatar_url,
          creator_profile_type: creator?.profile_type || ''
        };
      });

      return contentWithCreator;
    },
  });
};

export const useContentCountsByProfile = () => {
  return useQuery({
    queryKey: ["content-counts-by-profile"],
    queryFn: async () => {
      // Get all profiles with their types
      const { data: profiles, error: profileError } = await supabase
        .from('profile_details')
        .select('user_id, profile_type');

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        return { total: 0, byType: {} as Record<string, number> };
      }

      // Get all approved content
      const { data: content, error: contentError } = await supabase
        .from('content_uploads')
        .select('uploader_id')
        .eq('status', 'approved');

      if (contentError) throw contentError;

      // Count content by profile type
      const counts: Record<string, number> = {};
      let total = 0;

      (content || []).forEach(item => {
        const profile = profiles.find(p => p.user_id === item.uploader_id);
        if (profile?.profile_type) {
          counts[profile.profile_type] = (counts[profile.profile_type] || 0) + 1;
          total++;
        }
      });

      return { total, byType: counts };
    },
  });
};

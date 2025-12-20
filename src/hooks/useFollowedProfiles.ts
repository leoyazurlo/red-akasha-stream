import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FollowedProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  profile_type: string;
}

export const useFollowedProfiles = (userId: string | null) => {
  const [followedProfiles, setFollowedProfiles] = useState<FollowedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setFollowedProfiles([]);
      return;
    }
    
    const fetchFollowedProfiles = async () => {
      setIsLoading(true);
      
      try {
        // Get all users this person follows
        const { data: follows, error: followsError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId);

        if (followsError) {
          console.error('Error fetching follows:', followsError);
          setFollowedProfiles([]);
          return;
        }

        if (!follows || follows.length === 0) {
          setFollowedProfiles([]);
          return;
        }

        const followingIds = follows.map(f => f.following_id);

        // Get profile details for these users from public_profiles view
        const { data: profiles, error: profilesError } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url, profile_type, user_id')
          .in('user_id', followingIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setFollowedProfiles([]);
          return;
        }

        setFollowedProfiles(profiles || []);
      } catch (error) {
        console.error('Error in useFollowedProfiles:', error);
        setFollowedProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowedProfiles();
  }, [userId]);

  return { followedProfiles, isLoading };
};

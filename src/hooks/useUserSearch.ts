import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const useUserSearch = (query: string) => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      
      // Buscar usuarios por username
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setUsers(data);
      }
      
      setIsLoading(false);
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [query]);

  return { users, isLoading };
};

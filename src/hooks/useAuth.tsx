import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export const useAuth = (requireAuth = false) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const adminCheckInProgress = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setAdminChecked(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (requireAuth && !session?.user) {
        setLoading(false);
        setAdminChecked(true);
        navigate('/auth');
      } else if (session?.user) {
        checkAdminRole(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
        setAdminChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [requireAuth, navigate]);

  const checkAdminRole = async (userId: string) => {
    // Prevent duplicate checks
    if (adminCheckInProgress.current) return;
    adminCheckInProgress.current = true;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    } finally {
      setAdminChecked(true);
      adminCheckInProgress.current = false;
    }
  };

  // Only return loading=false when admin check is also complete
  const isLoading = loading || (!!user && !adminChecked);

  return { user, session, loading: isLoading, isAdmin };
};

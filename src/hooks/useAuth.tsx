/**
 * @fileoverview Hook de autenticación para Red Akasha.
 * Maneja el estado de sesión, verificación de roles y redirecciones.
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { identify, AnalyticsEvents } from '@/lib/analytics';

/** Resultado del hook useAuth */
interface UseAuthResult {
  /** Usuario autenticado o null */
  user: User | null;
  /** Sesión activa o null */
  session: Session | null;
  /** Si está cargando la sesión/rol */
  loading: boolean;
  /** Si el usuario es administrador */
  isAdmin: boolean;
}

/**
 * Hook para manejar la autenticación de usuarios.
 * 
 * @param requireAuth - Si true, redirige a /auth si no hay sesión
 * @returns Estado de autenticación del usuario
 * 
 * @example
 * ```tsx
 * const { user, isAdmin, loading } = useAuth();
 * 
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPrompt />;
 * ```
 */
export const useAuth = (requireAuth = false): UseAuthResult => {
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
        
        // Track auth events
        if (event === 'SIGNED_IN' && session?.user) {
          identify(session.user.id);
          AnalyticsEvents.userLoggedIn();
        }
        if (event === 'USER_UPDATED' && session?.user) {
          identify(session.user.id);
        }

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

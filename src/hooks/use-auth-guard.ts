/**
 * @fileoverview Hook for role-based route protection.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "moderator" | "user";

interface AuthGuardResult {
  /** Null while loading */
  user: User | null;
  /** Still resolving auth / role */
  loading: boolean;
  /** User is authenticated */
  authenticated: boolean;
  /** User has one of the required roles */
  authorised: boolean;
}

/**
 * Checks authentication and role authorisation.
 *
 * @param allowedRoles – roles that grant access. Empty array = any authenticated user.
 */
export const useAuthGuard = (allowedRoles: AppRole[] = []): AuthGuardResult => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.user) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      if (allowedRoles.length === 0) {
        // Any authenticated user is fine
        setAuthorised(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (cancelled) return;

      const roles = (data ?? []).map((r) => r.role as AppRole);
      setAuthorised(allowedRoles.some((r) => roles.includes(r)));
      setLoading(false);
    };

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allowedRoles)]);

  return {
    user,
    loading,
    authenticated: !!user,
    authorised,
  };
};

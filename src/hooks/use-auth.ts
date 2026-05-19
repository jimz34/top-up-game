import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true, isAdmin: false });

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      return !!data;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (user) {
        (async () => {
          const isAdmin = await checkAdmin(user.id);
          setState({ user, session, loading: false, isAdmin });
        })();
      } else {
        setState({ user: null, session: null, loading: false, isAdmin: false });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      if (user) {
        checkAdmin(user.id).then((isAdmin) => {
          setState({ user, session: data.session, loading: false, isAdmin });
        });
      } else {
        setState({ user: null, session: null, loading: false, isAdmin: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

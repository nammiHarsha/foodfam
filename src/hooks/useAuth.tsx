import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  languages: string[] | null;
  created_at: string;
  updated_at: string;
}

type AppRole = "host" | "guest" | "admin" | "traveler" | "foodie";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  /** Initial auth/session hydration */
  authLoading: boolean;
  /** Backfill + fetch profile + roles */
  profileLoading: boolean;
  /** Backwards-compatible alias for authLoading */
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const loadedUserIdRef = useRef<string | null>(null);

  const fetchOrCreateProfile = async (userId: string, fullName?: string | null) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    if (data) {
      if (mountedRef.current) setProfile(data);
      return data;
    }

    // No profile yet (common right after signup) → create a minimal row.
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: fullName ?? null,
      })
      .select("*")
      .maybeSingle();

    if (createError) {
      // In case of a race (profile created elsewhere), try one last read.
      const { data: retry } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (mountedRef.current) setProfile(retry ?? null);
      return retry ?? null;
    }

    if (mountedRef.current) setProfile(created);
    return created;
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      if (mountedRef.current) setRoles([]);
      return [] as AppRole[];
    }

    const next = (data ?? []).map((r) => r.role as AppRole);
    if (mountedRef.current) setRoles(next);
    return next;
  };

  const loadUserData = async (sessionUser: User) => {
    setProfileLoading(true);
    try {
      await Promise.all([
        fetchOrCreateProfile(sessionUser.id, (sessionUser.user_metadata as any)?.full_name ?? null),
        fetchRoles(sessionUser.id),
      ]);

      if (mountedRef.current) {
        loadedUserIdRef.current = sessionUser.id;
      }
    } finally {
      if (mountedRef.current) setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      await Promise.all([
        fetchOrCreateProfile(user.id, (user.user_metadata as any)?.full_name ?? null),
        fetchRoles(user.id),
      ]);
    } finally {
      if (mountedRef.current) setProfileLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const applySession = (nextSession: Session | null) => {
      if (!mountedRef.current) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setRoles([]);
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);

      // Don't let the very first auth event prematurely unlock route guards.
      // We only clear authLoading after the explicit getSession() hydration finishes.
      if (!initializedRef.current) return;

      if (!nextSession?.user) {
        loadedUserIdRef.current = null;
        if (mountedRef.current) {
          setProfileLoading(false);
          setAuthLoading(false);
        }
        return;
      }

      const nextUserId = nextSession.user.id;
      if (loadedUserIdRef.current === nextUserId) return;

      // Block route guards until profile + roles are loaded for the signed-in user.
      if (mountedRef.current) setAuthLoading(true);

      // Defer Supabase calls to avoid auth deadlocks
      setTimeout(() => {
        if (!mountedRef.current) return;

        loadUserData(nextSession.user)
          .catch(() => {
            // ignore; authLoading is released in finally
          })
          .finally(() => {
            if (!mountedRef.current) return;
            loadedUserIdRef.current = nextUserId;
            setAuthLoading(false);
          });
      }, 0);
    });

    // THEN check for existing session (authoritative hydration)
    (async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        applySession(existingSession);

        if (existingSession?.user) {
          await loadUserData(existingSession.user);
          if (mountedRef.current) loadedUserIdRef.current = existingSession.user.id;
        } else {
          if (mountedRef.current) loadedUserIdRef.current = null;
        }
      } finally {
        if (mountedRef.current) {
          initializedRef.current = true;
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (!mountedRef.current) return;
    loadedUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        authLoading,
        profileLoading,
        loading: authLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

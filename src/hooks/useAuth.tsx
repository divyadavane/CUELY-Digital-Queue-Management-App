"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase";
import type { Admin, Business } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  admin: Admin | null;
  business: Business | null;
  loading: boolean;
  adminErrorMsg: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ data: any, error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);

  // Look up admin record and business for a user
  const fetchAdminData = useCallback(async (userId: string) => {
    const { data: adminData, error: aError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", userId)
      .single();

    if (aError) {
      setAdminErrorMsg(aError.message || JSON.stringify(aError));
    }

    if (adminData) {
      setAdmin(adminData as Admin);

      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", adminData.business_id)
        .single();

      if (businessData) {
        setBusiness(businessData as Business);
      }
    } else {
      setAdmin(null);
      setBusiness(null);
    }
  }, [supabase]);

  // Initialize: check existing session
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchAdminData(currentSession.user.id);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: import("@supabase/supabase-js").AuthChangeEvent, newSession: import("@supabase/supabase-js").Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchAdminData(newSession.user.id);
        } else {
          setAdmin(null);
          setBusiness(null);
        }

        if (event === "SIGNED_OUT") {
          setAdmin(null);
          setBusiness(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAdminData, supabase.auth]);

  // Email + password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, [supabase.auth]);

  // Google OAuth sign in
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, [supabase.auth]);

  // Sign out
  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });
    setLoading(false);
    return { data, error: error?.message || null };
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  const value = {
    user,
    session,
    admin,
    business,
    loading,
    adminErrorMsg,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import createContextHook from "@nkzw/create-context-hook";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, displayName?: string) => void;
  signIn: (email: string, password: string) => void;
  signOut: () => void;
  isSigningIn: boolean;
  isSigningUp: boolean;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  const sessionQuery = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      console.log("[Auth] Fetching session...");
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log("[Auth] Session fetch error:", error.message);
        return null;
      }
      console.log("[Auth] Session fetched:", data.session ? "active" : "none");
      return data.session;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (sessionQuery.data !== undefined) {
      setSession(sessionQuery.data);
      setInitializing(false);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("[Auth] State changed:", _event);
        setSession(newSession);
        setInitializing(false);
        queryClient.setQueryData(["auth-session"], newSession);
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signUpMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) => {
      console.log("[Auth] Signing up:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log("[Auth] Sign up success");
      if (data.session) {
        setSession(data.session);
      } else {
        Alert.alert(
          "Check Your Email",
          "We sent you a confirmation link. Please verify your email to sign in."
        );
      }
    },
    onError: (error: Error) => {
      console.log("[Auth] Sign up error:", error.message);
      Alert.alert("Sign Up Failed", error.message);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      console.log("[Auth] Signing in:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log("[Auth] Sign in success");
      setSession(data.session);
    },
    onError: (error: Error) => {
      console.log("[Auth] Sign in error:", error.message);
      Alert.alert("Sign In Failed", error.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log("[Auth] Signing out");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      console.log("[Auth] Sign out success");
      setSession(null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.log("[Auth] Sign out error:", error.message);
      Alert.alert("Sign Out Failed", error.message);
    },
  });

  const { mutate: doSignUp } = signUpMutation;
  const { mutate: doSignIn } = signInMutation;
  const { mutate: doSignOut } = signOutMutation;

  const signUp = useCallback(
    (email: string, password: string, displayName?: string) => {
      doSignUp({ email, password, displayName });
    },
    [doSignUp]
  );

  const signIn = useCallback(
    (email: string, password: string) => {
      doSignIn({ email, password });
    },
    [doSignIn]
  );

  const signOut = useCallback(() => {
    doSignOut();
  }, [doSignOut]);

  return {
    user: session?.user ?? null,
    session,
    isLoading: initializing || sessionQuery.isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
  };
});

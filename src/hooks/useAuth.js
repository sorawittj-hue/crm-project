import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { touchLastSeen } from '../services/apiUserProfiles';

/**
 * Custom hook for managing Supabase authentication state
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session: currentSession }, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user?.id) {
          touchLastSeen(currentSession.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        if (currentSession?.user?.id) {
          touchLastSeen(currentSession.user.id);
        }
      }
    );

    return () => { subscription?.unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || email.split('@')[0] } },
      });
      if (signUpError) throw signUpError;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserId = () => session?.user?.id ?? null;

  const signInAsGuest = async () => {
    return signIn('demo@novapipeline.com', 'demo123456');
  };

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signInAsGuest,
    signUp,
    signOut,
    getUserId,
  };
}

export default useAuth;


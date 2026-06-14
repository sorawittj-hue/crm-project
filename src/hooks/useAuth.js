import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { migrateLocalToSupabase } from '../lib/migration';
import { isLocalTrialActive } from '../lib/localDb';
import { touchLastSeen } from '../services/apiUserProfiles';

// Global shared auth state to avoid independent Supabase network calls & state sets across 34 hook instances
let globalUser = null;
let globalSession = null;
let globalLoading = true;
let globalError = null;
const listeners = new Set();

const updateGlobalState = (user, session, loading, error) => {
  globalUser = user;
  globalSession = session;
  globalLoading = loading;
  globalError = error;
  listeners.forEach((listener) => listener({ user, session, loading, error }));
};

// Initialize authentication state once globally on module load
if (typeof window !== 'undefined') {
  const initializeAuth = async () => {
    try {
      const { data: { session: currentSession }, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      updateGlobalState(
        currentSession?.user ?? null,
        currentSession,
        false,
        null
      );
      if (currentSession?.user?.id) {
        touchLastSeen(currentSession.user.id);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      updateGlobalState(null, null, false, err.message);
    }
  };

  initializeAuth();

  // Listen to auth changes globally
  supabase.auth.onAuthStateChange((event, currentSession) => {
    updateGlobalState(
      currentSession?.user ?? null,
      currentSession,
      false,
      null
    );
    if (currentSession?.user?.id) {
      touchLastSeen(currentSession.user.id);
    }
  });
}

export function useAuth() {
  // Synchronously initialize state from global variables so first paint is instant
  const [state, setState] = useState({
    user: globalUser,
    session: globalSession,
    loading: globalLoading,
    error: globalError,
  });

  useEffect(() => {
    const listener = (newState) => {
      setState(newState);
    };
    listeners.add(listener);

    // Sync state in case it changed between initialization and effect mount
    if (
      state.user !== globalUser ||
      state.session !== globalSession ||
      state.loading !== globalLoading ||
      state.error !== globalError
    ) {
      setState({
        user: globalUser,
        session: globalSession,
        loading: globalLoading,
        error: globalError,
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      updateGlobalState(globalUser, globalSession, true, null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      if (isLocalTrialActive() && data?.user?.id) {
        // Fire and forget migration
        migrateLocalToSupabase(data.user.id).catch(console.error);
      }
      
      return { data, error: null };
    } catch (err) {
      updateGlobalState(null, null, false, err.message);
      return { data: null, error: err };
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      updateGlobalState(globalUser, globalSession, true, null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || email.split('@')[0] } },
      });
      if (signUpError) throw signUpError;
      
      if (isLocalTrialActive() && data?.user?.id) {
        // Fire and forget migration
        migrateLocalToSupabase(data.user.id).catch(console.error);
      }

      return { data, error: null };
    } catch (err) {
      updateGlobalState(null, null, false, err.message);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      updateGlobalState(globalUser, globalSession, true, null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      updateGlobalState(null, null, false, null);
    } catch (err) {
      updateGlobalState(globalUser, globalSession, false, err.message);
    }
  };

  const getUserId = () => globalSession?.user?.id ?? null;

  const signInAsGuest = async () => {
    return signIn('demo@novapipeline.com', 'demo123456');
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signInAsGuest,
    signUp,
    signOut,
    getUserId,
  };
}

export default useAuth;

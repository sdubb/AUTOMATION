// Deprecated stub for Supabase (REPLACED by ActivePieces auth)
// Keep a minimal stub to avoid runtime errors if any legacy code imports it.

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: null } };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    // signIn/signUp/signOut are no-ops and throw to indicate usage error
    async signInWithPassword() {
      throw new Error('Supabase auth is deprecated. Use ActivePieces auth instead.');
    },
    async signUp() {
      throw new Error('Supabase auth is deprecated. Use ActivePieces auth instead.');
    },
    async signOut() {
      throw new Error('Supabase auth is deprecated. Use ActivePieces auth instead.');
    },
  },
};

export const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';

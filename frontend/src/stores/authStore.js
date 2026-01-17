import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Register
      register: async (email, password, passwordConfirm) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register({
            email,
            password,
            password_confirm: passwordConfirm,
          });

          const { user, tokens } = response.data;

          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error ||
                         error.response?.data?.email?.[0] ||
                         error.response?.data?.password?.[0] ||
                         'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });

          const { user, tokens } = response.data;

          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error ||
                         error.response?.data?.non_field_errors?.[0] ||
                         'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Wallet login
      walletLogin: async (walletAddress, signature, nonce) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.verifyWallet({
            wallet_address: walletAddress,
            signature,
            nonce,
          });

          const { user, tokens } = response.data;

          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true, isNewUser: response.data.is_new_user };
        } catch (error) {
          const message = error.response?.data?.error || 'Wallet verification failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Logout
      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await authAPI.logout({ refresh: refreshToken });
          }
        } catch (error) {
          // Ignore logout errors
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      // Fetch current user
      fetchUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const response = await authAPI.getProfile();
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false });
        }
      },

      // Initialize auth state
      initialize: async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
          await get().fetchUser();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
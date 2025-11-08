import { create } from "zustand";
import {
  signIn as signInService,
  signUp as signUpService,
  logout as logoutService,
  getCurrentUser as getCurrentUserService,
  updateUserProfile as updateUserProfileService,
} from "../services/auth";

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  business: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setBusiness: (business) => set({ business }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await signInService(email, password);

      if (result.success) {
        set({
          user: result.user,
          business: result.business,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const result = await signUpService(name, email, password);

      if (result.success) {
        set({
          user: result.user,
          business: result.business,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const result = await logoutService();

      if (result.success) {
        set({
          user: null,
          business: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearUser: () =>
    set({
      user: null,
      business: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  // Mevcut kullanıcı bilgilerini getir
  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const result = await getCurrentUserService();

      if (result.success) {
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: result.user };
      } else {
        set({ isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Kullanıcı profilini güncelle
  updateProfile: async (updateData) => {
    set({ isLoading: true });
    try {
      const result = await updateUserProfileService(updateData);

      if (result.success) {
        set({
          user: result.user,
          isLoading: false,
        });
        return { success: true, user: result.user };
      } else {
        set({ isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default useAuthStore;

import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      const response = await api.post('auth/login/', { username, password });
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      await useAuthStore.getState().fetchUser();
      return { success: true };
    } catch (error) {
      console.error('Login error', error);
      let message = 'Invalid username or password';
      if (error.response?.data) {
        message = error.response.data.detail || 
                  error.response.data.non_field_errors?.[0] || 
                  error.response.data.error || 
                  message;
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  },

  register: async (userData) => {
    try {
      await api.post('auth/register/', userData);
      return true;
    } catch (error) {
      console.error('Registration error', error);
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('auth/logout/');
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  toggleBreak: async (action) => {
    try {
      await api.post('auth/break/', { action });
      await useAuthStore.getState().fetchUser();
      return true;
    } catch (error) {
      console.error('Break toggle error', error);
      return false;
    }
  },

  pingServer: async () => {
    try {
      await api.post('auth/ping/');
    } catch (error) {
      console.error('Ping error', error);
    }
  },

  fetchUser: async () => {
    try {
      const response = await api.get('auth/me/');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;

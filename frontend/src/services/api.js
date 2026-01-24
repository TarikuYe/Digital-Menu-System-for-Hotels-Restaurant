import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const guestToken = localStorage.getItem('guestToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (guestToken) {
      config.headers.Authorization = `Guest ${guestToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Foods API
export const foodsAPI = {
  getAll: (params) => api.get('/foods', { params }),
  getById: (id, params) => api.get(`/foods/${id}`, { params }),
  create: (data) => api.post('/foods', data),
  update: (id, data) => api.put(`/foods/${id}`, data),
  delete: (id) => api.delete(`/foods/${id}`),
  getIngredients: () => api.get('/foods/ingredients'),
  createIngredient: (data) => api.post('/foods/ingredients', data),
  deleteIngredient: (id) => api.delete(`/foods/ingredients/${id}`),
};



// Menus API
export const menusAPI = {
  getAll: (params) => api.get('/menus', { params }),
  getById: (id) => api.get(`/menus/${id}`),
  create: (data) => api.post('/menus', data),
  update: (id, data) => api.put(`/menus/${id}`, data),
  delete: (id) => api.delete(`/menus/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status, assigned_to) => api.put(`/orders/${id}/status`, { status, assigned_to }),
  getPrepTimeAnalytics: () => api.get('/orders/analytics/prep-time'),
};

// Feedback API
export const feedbackAPI = {
  create: (data) => api.post('/feedback', data),
  getAll: (params) => api.get('/feedback', { params }),
  getById: (id) => api.get(`/feedback/${id}`),
  updateVisibility: (id, is_visible) => api.put(`/feedback/${id}/visibility`, { is_visible }),
};

// Guest API
export const guestAPI = {
  verifyToken: (token) => api.get(`/guest/verify/${token}`),
  startSession: (data) => api.post('/guest/session', data),
  getSessionStatus: () => api.get('/guest/status'),
};

// Tables API
export const tablesAPI = {
  getAll: () => api.get('/tables'),
  getById: (id) => api.get(`/tables/${id}`),
  updateStatus: (id, status) => api.put(`/tables/${id}/status`, { status }),
};

// Kitchen API
export const kitchenAPI = {
  getOrders: () => api.get('/kitchen/orders'),
  updateStatus: (id, status) => api.patch(`/kitchen/orders/${id}/status`, { status }),
};

// Manager API
export const managerAPI = {
  getStats: () => api.get('/manager/stats'),
  getActivity: () => api.get('/manager/activity'),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  setUserStatus: (id, is_active) => api.patch(`/admin/users/${id}/status`, { is_active }),
  resetPassword: (id, password) => api.patch(`/admin/users/${id}/reset-password`, { password }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// Localization API
export const localizationAPI = {
  getLanguages: () => api.get('/localization/languages'),
  createLanguage: (data) => api.post('/localization/languages', data),
  updateLanguage: (id, data) => api.put(`/localization/languages/${id}`, data),
  deleteLanguage: (id) => api.delete(`/localization/languages/${id}`),
  getTranslations: (languageId) => api.get('/localization/translations', { params: { language_id: languageId } }),
  upsertTranslation: (data) => api.post('/localization/translations', data),
};

// Payments API
export const paymentsAPI = {
  getPayments: (params) => api.get('/payments', { params }),
  getStats: () => api.get('/payments/stats'),
  updateStatus: (id, status) => api.patch(`/payments/${id}/status`, { status }),
  create: (data) => api.post('/payments', data),
};

// Analytics API
export const analyticsAPI = {
  getSales: () => api.get('/analytics/sales'),
  getBehavior: () => api.get('/analytics/behavior'),
};





export default api;


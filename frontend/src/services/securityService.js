/**
 * Security Service
 * ================
 * API calls for security features (2FA, API Keys, etc.)
 */

import api from './api';

const securityService = {
  // ============== Two-Factor Authentication ==============

  get2FASetup: async () => {
    try {
      const response = await api.get('/security/2fa/setup/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  enable2FA: async (code) => {
    try {
      const response = await api.post('/security/2fa/setup/', { code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  disable2FA: async (code, password) => {
    try {
      const response = await api.post('/security/2fa/disable/', { code, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  get2FAStatus: async () => {
    try {
      const response = await api.get('/security/2fa/status/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  regenerateBackupCodes: async (code) => {
    try {
      const response = await api.post('/security/2fa/backup-codes/', { code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============== API Keys ==============

  getAPIKeys: async () => {
    try {
      const response = await api.get('/security/api-keys/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAPIKey: async (data) => {
    try {
      const response = await api.post('/security/api-keys/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAPIKey: async (id, data) => {
    try {
      const response = await api.patch(`/security/api-keys/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAPIKey: async (id) => {
    try {
      const response = await api.delete(`/security/api-keys/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============== Audit Logs ==============

  getAuditLogs: async () => {
    try {
      const response = await api.get('/security/audit-logs/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============== IP Whitelist ==============

  getIPWhitelist: async () => {
    try {
      const response = await api.get('/security/ip-whitelist/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addIPToWhitelist: async (data) => {
    try {
      const response = await api.post('/security/ip-whitelist/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeIPFromWhitelist: async (id) => {
    try {
      const response = await api.delete(`/security/ip-whitelist/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============== Security Overview ==============

  getSecurityOverview: async () => {
    try {
      const response = await api.get('/security/overview/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default securityService;
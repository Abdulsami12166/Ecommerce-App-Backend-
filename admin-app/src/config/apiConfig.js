// Admin app uses the same config values as the main app.
// Duplicated here to avoid path-resolution issues between metro entrypoints.

export const API_CONFIG = {
  mode: 'local',
  localBaseUrl: 'http://localhost:5000/api/v1',
  publicBaseUrl: 'https://backend-admin-qe72.onrender.com',
};

export const getApiBaseUrl = () => {
  if (API_CONFIG.mode === 'public') return API_CONFIG.publicBaseUrl;
  return API_CONFIG.localBaseUrl;
};

export default API_CONFIG;


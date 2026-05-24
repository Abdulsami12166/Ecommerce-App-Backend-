export const API_CONFIG = {
  mode: 'local',

  localBaseUrl: 'http://192.168.31.18:5000/api/v1',

  publicBaseUrl: 'https://backend-admin-qe72.onrender.com',
};

export const getApiBaseUrl = () => {
  if (API_CONFIG.mode === 'public') {
    return API_CONFIG.publicBaseUrl;
  }

  return API_CONFIG.localBaseUrl;
};

export default API_CONFIG;
export const API_CONFIG = {
  // Use 'public' for the live Render ecommerce backend.
  // Switch to 'local' only when your ecommerce backend is running on your machine.
  mode: 'public',

  // Production ecommerce backend on Render.
  publicBaseUrl: 'https://ecommerce-app-backend-1kn0.onrender.com/api/v1',
  publicSocketUrl: 'https://ecommerce-app-backend-1kn0.onrender.com',
  publicTrackingSocketUrl: 'https://ecommerce-app-backend-1kn0.onrender.com',

  // Local ecommerce backend for Android emulator testing.
  localBaseUrl: 'http://10.0.2.2:5001/api/v1',
  localSocketUrl: 'http://10.0.2.2:5001',
  localTrackingSocketUrl: 'http://10.0.2.2:5000',
};

export const getApiBaseUrl = () => {
  if (API_CONFIG.mode === 'public') {
    return API_CONFIG.publicBaseUrl;
  }

  return API_CONFIG.localBaseUrl;
};

export const getSocketBaseUrl = () => {
  if (API_CONFIG.mode === 'public') {
    return API_CONFIG.publicTrackingSocketUrl;
  }

  return API_CONFIG.localTrackingSocketUrl;
};

export default API_CONFIG;

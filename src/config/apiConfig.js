export const API_CONFIG = {
  // Switch to 'public' after your backend is deployed online.
  mode: 'public',


  // Your current local backend for emulator/device testing on the same network.
  localBaseUrl: 'http://192.168.31.18:5000/api/v1',

  // Replace this with your deployed backend URL when you want the APK
  // to work on phones outside your Wi-Fi or LAN.
  publicBaseUrl: 'https://ecommerce-app-backend-1kn0.onrender.com/api/v1',
};

export const getApiBaseUrl = () => {
  if (API_CONFIG.mode === 'public') {
    return API_CONFIG.publicBaseUrl;
  }

  return API_CONFIG.localBaseUrl;
};

export default API_CONFIG;

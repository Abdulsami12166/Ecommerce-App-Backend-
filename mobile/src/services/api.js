import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ecommerce-app-backend-1kn0.onrender.com/api/v1',
  timeout: 15000,
});

export default api;

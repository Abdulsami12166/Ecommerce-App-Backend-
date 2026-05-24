import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/apiConfig';

const ADMIN_JWT_KEY = 'admin_jwt';

const baseUrl = getApiBaseUrl();

export const adminGet = async (endpoint: string) => {
  const token = await AsyncStorage.getItem(ADMIN_JWT_KEY);

  const url = `${baseUrl}${endpoint}`;

  console.log('[adminGet] request', {
    endpoint,
    url,
    hasToken: !!token,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    console.log('[adminGet] non-json response', { endpoint, textSample: text?.slice?.(0, 300) });
  }

  console.log('[adminGet] response', {
    endpoint,
    ok: response.ok,
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  }

  return data;
};


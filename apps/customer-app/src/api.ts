import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In production, this would be your actual remote server IP/domain
// For local Expo dev to Android Emulator: http://10.0.2.2:8000/api/v1
// For local Expo Web: http://localhost:8000/api/v1
const API_URL = Platform.OS === 'web' ? 'http://localhost:8000/api/v1' : 'http://10.0.2.2:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('customer_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token for API request', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('customer_access_token');
      await AsyncStorage.removeItem('customer_refresh_token');
      // A full app router redirect pattern will handle kicking the user back to login
    }
    return Promise.reject(error);
  }
);

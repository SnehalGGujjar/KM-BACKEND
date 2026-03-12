import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the local IP address of the machine running the Expo bundler
const getHostUri = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0]; // Extract just the IP part without the port
  }
  return '192.168.153.1'; // Fallback to current detected IP
};

const DEV_IP = getHostUri();

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000/api/v1' 
  : `http://${DEV_IP}:8000/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('partner_access_token');
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
      await AsyncStorage.removeItem('partner_access_token');
      await AsyncStorage.removeItem('partner_refresh_token');
    }
    return Promise.reject(error);
  }
);

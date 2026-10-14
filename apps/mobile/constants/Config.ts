import Constants from 'expo-constants';

const LOCAL_IP = '127.0.0.1'; // Or LAN IP for physical device testing

export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:4000/api/v1`,
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || `http://${LOCAL_IP}:4000`,
  STORAGE_KEYS: {
    AUTH_TOKEN: '@leed/auth_token',
    REFRESH_TOKEN: '@leed/refresh_token',
    USER_PROFILE: '@leed/user_profile',
    THEME_PREFERENCE: '@leed/theme_preference',
    REACT_QUERY_CACHE: '@leed/rq_cache',
  },
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
};

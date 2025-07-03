import axios from 'axios';
import { useImpersonation } from '../context/ImpersonationContext';
import { useMemo } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Custom hook to get an axios instance with impersonation header
export const useAxiosWithImpersonation = () => {
  const { impersonatedUserId } = useImpersonation();

  // Memoize the axios instance so it is not recreated on every render
  const instance = useMemo(() => {
    const axiosInstance = axios.create({ baseURL: API_BASE_URL });
    axiosInstance.interceptors.request.use((config) => {
      if (impersonatedUserId) {
        config.headers['x-impersonate-user-id'] = impersonatedUserId;
      }
      return config;
    });
    return axiosInstance;
  }, [impersonatedUserId]);

  return instance;
}; 
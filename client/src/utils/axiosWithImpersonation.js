import axios from 'axios';
import { useImpersonation } from '../context/ImpersonationContext';
import { useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create a single axios instance
const axiosInstance = axios.create({ baseURL: API_BASE_URL });

export const useAxiosWithImpersonation = () => {
  const { impersonatedUserId } = useImpersonation();

  useEffect(() => {
    // Add a request interceptor that always uses the latest impersonatedUserId and JWT token
    const interceptor = axiosInstance.interceptors.request.use((config) => {
      // Always set the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['x-auth-token'] = token;
      } else {
        delete config.headers['x-auth-token'];
      }
      // Set or remove impersonation header
      if (impersonatedUserId) {
        config.headers['x-impersonate-user-id'] = impersonatedUserId;
      } else {
        delete config.headers['x-impersonate-user-id'];
      }
      return config;
    });
    // Cleanup: remove the interceptor on unmount or when impersonatedUserId changes
    return () => {
      axiosInstance.interceptors.request.eject(interceptor);
    };
  }, [impersonatedUserId]);

  return axiosInstance;
}; 
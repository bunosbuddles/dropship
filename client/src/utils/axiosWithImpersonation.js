import axios from 'axios';
import { useImpersonation } from '../context/ImpersonationContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Custom hook to get an axios instance with impersonation header
export const useAxiosWithImpersonation = () => {
  const { impersonatedUserId } = useImpersonation();
  const instance = axios.create({ baseURL: API_BASE_URL });

  instance.interceptors.request.use((config) => {
    if (impersonatedUserId) {
      config.headers['x-impersonate-user-id'] = impersonatedUserId;
    }
    return config;
  });

  return instance;
}; 
import axios from 'axios';


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors should not perform asynchronous auth fetching (like NextAuth getSession) 
// to prevent N+1 network requests. Token injection is handled globally by 
// AxiosInterceptor in Providers.tsx for client components.
api.interceptors.request.use((config) => {
  return config;
});

export default api;

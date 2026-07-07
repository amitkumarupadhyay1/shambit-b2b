import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch (e) {
      console.error('Failed to get session token', e);
    }
  } else {
    // For server-side usage, we'd need a different way to inject the token if necessary,
    // usually by passing it directly or using next-auth's getServerSession.
  }
  return config;
});

export default api;

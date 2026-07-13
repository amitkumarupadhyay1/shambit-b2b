import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache session to avoid redundant network calls on every API request
let cachedSession: { accessToken?: string } | null = null;
let sessionFetchTime = 0;

// Interceptor to attach token
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const now = Date.now();
      // Cache the session for 60 seconds
      if (!cachedSession || now - sessionFetchTime > 60000) {
        cachedSession = await getSession();
        sessionFetchTime = now;
      }

      if (cachedSession?.accessToken) {
        config.headers.Authorization = `Bearer ${cachedSession.accessToken}`;
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

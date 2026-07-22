"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import api from "@/lib/api";

function AxiosInterceptor({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      } else {
        delete config.headers.Authorization;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Trigger logout if token expires or is invalid
          import('next-auth/react').then(({ signOut }) => {
            signOut({ callbackUrl: '/login' });
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [session]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AxiosInterceptor>
        <SWRConfig 
          value={{
            fetcher: (url: string) => api.get(url).then(res => res.data.results || res.data),
            revalidateOnFocus: false,
          }}
        >
          {children}
        </SWRConfig>
      </AxiosInterceptor>
    </SessionProvider>
  );
}

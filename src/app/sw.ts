/* eslint-disable @typescript-eslint/no-explicit-any */
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST || [])
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
      {
        url: "/offline-image.svg",
        matcher({ request }) {
          return request.destination === "image";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Listen to push events
self.addEventListener('push', (event: any) => {
  let payload: any = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() ?? 'You have a new notification.' };
  }

  const title = payload.title || 'ShamBit Travels';
  // Extract URL from payload.data.url or payload.url
  const targetUrl = payload.data?.url || payload.url || '/';

  const options = {
    body: payload.body || 'You have a new notification.',
    icon: payload.icon || '/logo-192.png',
    badge: payload.badge || '/maskable_icon_x96.png',
    tag: payload.tag || 'notification',
    data: { url: targetUrl, ...payload.data },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const targetPath = event.notification.data?.url || '/';
  const urlToOpen = new URL(targetPath, self.location.origin).href;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no exact match, focus any open app client and navigate it
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('focus' in client) {
          client.focus();
        }
        if ('navigate' in client) {
          return client.navigate(urlToOpen);
        }
      }

      // If not, open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

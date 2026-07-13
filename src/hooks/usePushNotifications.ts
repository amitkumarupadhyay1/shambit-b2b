import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

// Utility to convert VAPID base64 string to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Get current subscription
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Fetch VAPID public key from backend
      const response = await api.get('/notifications/push/vapid-public-key/');
      const publicVapidKey = response.data.public_key;

      const registration = await navigator.serviceWorker.ready;
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // Send to backend
      await api.post('/notifications/push/subscribe/', newSubscription);

      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }, [isSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      
      // Send to backend
      await api.post('/notifications/push/unsubscribe/', { endpoint: subscription.endpoint });

      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    subscribeToPush,
    unsubscribeFromPush,
  };
};

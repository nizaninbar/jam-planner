import { supabase } from './supabaseClient';

// Web Push plumbing: registers the service worker, subscribes this device, and stores the
// subscription in `push_subscriptions` so the `send-reminders` edge function can reach it.

export type PushStatus = 'unsupported' | 'denied' | 'off' | 'on';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function isSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function serviceWorkerUrl(): string {
  return `${import.meta.env.BASE_URL}sw.js`;
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker.register(serviceWorkerUrl()).catch(() => {
    // Notifications simply stay unavailable; the rest of the app is unaffected.
  });
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isSupported() || !VAPID_PUBLIC_KEY) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  const registration = await navigator.serviceWorker.getRegistration(serviceWorkerUrl());
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === 'granted' ? 'on' : 'off';
}

export async function enablePush(bandId: string): Promise<void> {
  if (!isSupported() || !VAPID_PUBLIC_KEY) {
    throw new Error('Notifications are not supported on this device');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const registration = await navigator.serviceWorker.register(serviceWorkerUrl());
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Failed to enable notifications: not signed in');
  }
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: subscription.endpoint,
      user_id: userData.user.id,
      band_id: bandId,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: 'endpoint' },
  );
  if (error) {
    throw new Error(`Failed to enable notifications: ${error.message}`);
  }
}

export async function disablePush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration(serviceWorkerUrl());
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) {
    return;
  }
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  if (error) {
    throw new Error(`Failed to disable notifications: ${error.message}`);
  }
  await subscription.unsubscribe();
}

/** Asks the edge function to push a test message to this user's devices; returns how many were reached. */
export async function sendTestPush(): Promise<number> {
  const { data, error } = await supabase.functions.invoke('send-reminders', { body: { test: true } });
  if (error) {
    throw new Error(`Failed to send test notification: ${error.message}`);
  }
  return (data as { sent: number }).sent;
}

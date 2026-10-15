import type { GroceryItem } from '../types/inventory';

const PREF_STORAGE_KEY = 'smart_fridge_notifications_enabled';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isNotificationPrefEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PREF_STORAGE_KEY) === 'true';
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(PREF_STORAGE_KEY, 'true');
    } else {
      localStorage.setItem(PREF_STORAGE_KEY, 'false');
    }
    return permission;
  } catch {
    return 'denied';
  }
}

export function setNotificationPref(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREF_STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * Dispatches browser notifications for groceries that are expired or expire today.
 * Deduplicates per item and per date during the active session using sessionStorage.
 */
export function checkAndNotifyGroceries(
  expiredItems: GroceryItem[] = [],
  expiringTodayItems: GroceryItem[] = []
): number {
  if (!isNotificationSupported()) return 0;
  if (Notification.permission !== 'granted' || !isNotificationPrefEnabled()) return 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  let notificationsSent = 0;

  // 1. Expired Items
  for (const item of expiredItems) {
    if (item.quantity == null || item.quantity <= 0) continue;
    const sessionKey = `sf_notif_${todayStr}_item_${item.id}_EXPIRED`;
    if (!sessionStorage.getItem(sessionKey)) {
      try {
        const notif = new Notification('Smart Fridge: Expired Grocery Alert', {
          body: `"${item.productName}" expired on ${item.expiryDate}. Please inspect or discard.`,
          tag: sessionKey,
        });
        notif.onclick = () => {
          window.focus();
        };
        sessionStorage.setItem(sessionKey, 'sent');
        notificationsSent++;
      } catch (e) {
        console.warn('Failed to dispatch notification:', e);
      }
    }
  }

  // 2. Expiring Today Items
  for (const item of expiringTodayItems) {
    if (item.quantity == null || item.quantity <= 0) continue;
    const sessionKey = `sf_notif_${todayStr}_item_${item.id}_EXPIRES_TODAY`;
    if (!sessionStorage.getItem(sessionKey)) {
      try {
        const notif = new Notification('Smart Fridge: Expires Today', {
          body: `"${item.productName}" expires today! Use it soon to prevent food waste.`,
          tag: sessionKey,
        });
        notif.onclick = () => {
          window.focus();
        };
        sessionStorage.setItem(sessionKey, 'sent');
        notificationsSent++;
      } catch (e) {
        console.warn('Failed to dispatch notification:', e);
      }
    }
  }

  return notificationsSent;
}

/**
 * Triggers a one-time test notification to verify browser permissions.
 */
export function triggerTestNotification(): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification('Smart Fridge: Notifications Active', {
      body: 'Browser alerts are working! You will receive freshness alerts when this tab is active.',
    });
    return true;
  } catch {
    return false;
  }
}

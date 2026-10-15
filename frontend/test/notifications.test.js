import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser globals for testing notifications utility
function setupMockBrowser({
  hasNotification = true,
  permission = 'default',
  storage = {},
  sessionData = {},
} = {}) {
  const localStorageMock = {
    store: { ...storage },
    getItem(key) {
      return this.store[key] ?? null;
    },
    setItem(key, val) {
      this.store[key] = String(val);
    },
    removeItem(key) {
      delete this.store[key];
    },
  };

  const sessionStorageMock = {
    store: { ...sessionData },
    getItem(key) {
      return this.store[key] ?? null;
    },
    setItem(key, val) {
      this.store[key] = String(val);
    },
    removeItem(key) {
      delete this.store[key];
    },
  };

  const dispatchedNotifications = [];

  class MockNotification {
    static permission = permission;
    static requestPermissionCount = 0;
    static async requestPermission() {
      MockNotification.requestPermissionCount++;
      return MockNotification.permission;
    }

    constructor(title, options) {
      this.title = title;
      this.options = options;
      dispatchedNotifications.push({ title, options });
    }
  }

  global.window = {};
  global.localStorage = localStorageMock;
  global.sessionStorage = sessionStorageMock;

  if (hasNotification) {
    global.Notification = MockNotification;
    global.window.Notification = MockNotification;
  } else {
    delete global.Notification;
    delete global.window.Notification;
  }

  return {
    dispatchedNotifications,
    MockNotification,
    localStorageMock,
    sessionStorageMock,
  };
}

test('Notifications: unsupported browser handles checks gracefully', async () => {
  setupMockBrowser({ hasNotification: false });

  // Dynamically import notifications utility
  const {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    checkAndNotifyGroceries,
  } = await import('../src/utils/notifications.ts');

  assert.equal(isNotificationSupported(), false);
  assert.equal(getNotificationPermission(), 'unsupported');
  const reqRes = await requestNotificationPermission();
  assert.equal(reqRes, 'unsupported');

  const sent = checkAndNotifyGroceries([{ id: 1, productName: 'Milk', quantity: 1 }]);
  assert.equal(sent, 0);
});

test('Notifications: permission denied is handled gracefully without dispatching', async () => {
  setupMockBrowser({ hasNotification: true, permission: 'denied' });

  const {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    checkAndNotifyGroceries,
  } = await import('../src/utils/notifications.ts');

  assert.equal(isNotificationSupported(), true);
  assert.equal(getNotificationPermission(), 'denied');

  const permResult = await requestNotificationPermission();
  assert.equal(permResult, 'denied');
  assert.equal(global.localStorage.getItem('smart_fridge_notifications_enabled'), 'false');

  const sent = checkAndNotifyGroceries([
    { id: 1, productName: 'Curd', quantity: 1, expiryDate: '2026-10-12' },
  ]);
  assert.equal(sent, 0);
});

test('Notifications: granted permission dispatches and deduplicates per session', async () => {
  const { dispatchedNotifications } = setupMockBrowser({
    hasNotification: true,
    permission: 'granted',
    storage: { smart_fridge_notifications_enabled: 'true' },
  });

  const {
    isNotificationSupported,
    getNotificationPermission,
    checkAndNotifyGroceries,
  } = await import('../src/utils/notifications.ts');

  assert.equal(isNotificationSupported(), true);
  assert.equal(getNotificationPermission(), 'granted');

  const expiredItem = {
    id: 101,
    productName: 'Organic Whole Milk',
    quantity: 2,
    expiryDate: '2026-10-12',
  };
  const expiringTodayItem = {
    id: 102,
    productName: 'Avocado',
    quantity: 1,
    expiryDate: '2026-10-13',
  };
  const finishedItem = {
    id: 103,
    productName: 'Empty Bread Box',
    quantity: 0,
    expiryDate: '2026-10-12',
  };

  // First check: should dispatch for items 101 and 102, skipping 103 (quantity 0)
  const sentFirst = checkAndNotifyGroceries(
    [expiredItem, finishedItem],
    [expiringTodayItem]
  );
  assert.equal(sentFirst, 2);
  assert.equal(dispatchedNotifications.length, 2);
  assert.match(dispatchedNotifications[0].title, /Expired Grocery Alert/);
  assert.match(dispatchedNotifications[1].title, /Expires Today/);

  // Second check in same session: deduplication must prevent re-dispatching
  const sentSecond = checkAndNotifyGroceries(
    [expiredItem],
    [expiringTodayItem]
  );
  assert.equal(sentSecond, 0);
  assert.equal(dispatchedNotifications.length, 2);
});

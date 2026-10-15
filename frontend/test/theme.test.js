import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage and window environment for headless testing
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new LocalStorageMock();
globalThis.window = {
  localStorage: globalThis.localStorage,
  matchMedia: (query) => ({
    matches: false, // Default to light OS theme in test environment
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
};
globalThis.document = {
  documentElement: {
    classList: {
      classes: new Set(),
      add(cls) {
        this.classes.add(cls);
      },
      remove(cls) {
        this.classes.delete(cls);
      },
      contains(cls) {
        return this.classes.has(cls);
      },
    },
    style: {},
  },
};

// Import module under test
import {
  getInitialTheme,
  getSystemTheme,
  applyThemeClass,
} from '../src/utils/theme.ts';

test('Theme System: getInitialTheme defaults to "system" when storage is empty', () => {
  globalThis.localStorage.clear();
  const theme = getInitialTheme();
  assert.equal(theme, 'system');
});

test('Theme System: getInitialTheme recovers saved preference from localStorage', () => {
  globalThis.localStorage.setItem('smart-list-theme', 'dark');
  assert.equal(getInitialTheme(), 'dark');

  globalThis.localStorage.setItem('smart-list-theme', 'light');
  assert.equal(getInitialTheme(), 'light');

  globalThis.localStorage.setItem('smart-list-theme', 'invalid-value');
  assert.equal(getInitialTheme(), 'system');
});

test('Theme System: applyThemeClass applies .dark and colorScheme correctly', () => {
  // Test dark mode
  const resolvedDark = applyThemeClass('dark');
  assert.equal(resolvedDark, 'dark');
  assert.equal(globalThis.document.documentElement.classList.contains('dark'), true);
  assert.equal(globalThis.document.documentElement.style.colorScheme, 'dark');

  // Test light mode
  const resolvedLight = applyThemeClass('light');
  assert.equal(resolvedLight, 'light');
  assert.equal(globalThis.document.documentElement.classList.contains('dark'), false);
  assert.equal(globalThis.document.documentElement.style.colorScheme, 'light');
});

test('Theme System: system preference respects matchMedia result', () => {
  // Test system with dark match
  globalThis.window.matchMedia = (query) => ({
    matches: query.includes('dark'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  const resolved = applyThemeClass('system');
  assert.equal(resolved, 'dark');
  assert.equal(globalThis.document.documentElement.classList.contains('dark'), true);
});

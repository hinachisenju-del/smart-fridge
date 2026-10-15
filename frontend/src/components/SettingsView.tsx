import {
  Bell,
  BellOff,
  Database,
  Info,
  Palette,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { HealthStatus } from '../types/inventory';
import { ThemeToggle } from './ThemeToggle';

interface SettingsViewProps {
  health: HealthStatus | null;
  backendError: string | null;
  onRefreshHealth: () => void;
  notificationSupported: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  notificationsEnabled: boolean;
  onToggleNotifications: () => Promise<void>;
  onSendTestNotification: () => void;
}

export function SettingsView({
  health,
  backendError,
  onRefreshHealth,
  notificationSupported,
  notificationPermission,
  notificationsEnabled,
  onToggleNotifications,
  onSendTestNotification,
}: SettingsViewProps) {
  return (
    <div data-testid="settings-page" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">
            Settings &amp; Preferences
          </h1>
          <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
            Manage alerts, visual experiences, and view application telemetry.
          </p>
        </div>

        <button
          type="button"
          data-testid="settings-refresh-btn"
          onClick={onRefreshHealth}
          className="h-[40px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-text-secondary" />
          <span>Check Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Notifications Preferences Card */}
        <div className="rounded-[10px] border border-border-default bg-surface-primary p-5 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
            <div className="p-2 rounded-[6px] bg-surface-secondary text-success-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Browser Notifications</h2>
              <p className="text-[12px] text-text-secondary">
                Freshness reminders when groceries approach expiration.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-[13px] text-text-secondary">
            <div className="flex items-center justify-between">
              <span>Browser Support:</span>
              <span className="font-semibold text-text-primary">
                {notificationSupported ? 'Supported' : 'Unavailable'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Permission Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                  notificationPermission === 'granted'
                    ? 'bg-surface-secondary text-success-primary'
                    : notificationPermission === 'denied'
                    ? 'bg-danger-subtle text-danger-primary'
                    : 'bg-warning-subtle text-warning-primary'
                }`}
              >
                {notificationPermission}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Notification Alerts:</span>
              <span className="font-semibold text-text-primary">
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!notificationSupported}
              onClick={onToggleNotifications}
              className={`h-[36px] px-3.5 rounded-[6px] text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                notificationsEnabled && notificationPermission === 'granted'
                  ? 'border border-red-200 bg-danger-subtle hover:bg-red-100 text-danger-primary'
                  : 'bg-brand-primary hover:bg-brand-hover text-brand-text shadow-xs'
              }`}
            >
              {notificationsEnabled && notificationPermission === 'granted' ? (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Disable Notifications</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>

            {notificationSupported && notificationsEnabled && notificationPermission === 'granted' && (
              <button
                type="button"
                onClick={onSendTestNotification}
                className="h-[36px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[13px] font-medium text-text-primary transition-colors cursor-pointer"
              >
                Send Test Alert
              </button>
            )}
          </div>
        </div>

        {/* 2. Appearance & Theme Selection Card */}
        <div className="rounded-[10px] border border-border-default dark:border-[#334155] bg-surface-primary dark:bg-[#1E293B] p-5 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-border-subtle dark:border-[#334155] pb-3">
            <div className="p-2 rounded-[6px] bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#A5B4FC]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary dark:text-[#F8FAFC]">Appearance &amp; Theme</h2>
              <p className="text-[12px] text-text-secondary dark:text-[#94A3B8]">
                Select your preferred color scheme across all Smart List screens.
              </p>
            </div>
          </div>

          <p className="text-[13px] text-text-secondary dark:text-[#94A3B8] leading-relaxed">
            Choose between vibrant light mode, deeply contrast-optimized dark mode, or follow your operating system preferences automatically.
          </p>

          <div className="pt-2">
            <ThemeToggle variant="segmented" />
          </div>
        </div>

        {/* 3. Telemetry & Database Status Card */}
        <div className="rounded-[10px] border border-border-default bg-surface-primary p-5 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
            <div className="p-2 rounded-[6px] bg-surface-secondary text-success-primary">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Backend &amp; Storage</h2>
              <p className="text-[12px] text-text-secondary">
                Persistence and service telemetry.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Backend Health:</span>
              <span className="font-semibold flex items-center gap-1.5 text-success-primary">
                <ShieldCheck className="w-4 h-4" />
                <span>{health?.status === 'UP' && !backendError ? 'Healthy (UP)' : 'Unreachable'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Active Storage:</span>
              <span className="font-semibold text-text-primary">
                {health?.database ?? 'Development Mode'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Spring Profiles:</span>
              <span className="font-semibold text-text-primary">
                {health?.activeProfiles?.join(', ') || 'default'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. About Smart List Card */}
        <div className="rounded-[10px] border border-border-default bg-surface-primary p-5 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
            <div className="p-2 rounded-[6px] bg-surface-secondary text-success-primary">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">About Smart List</h2>
              <p className="text-[12px] text-text-secondary">
                Product information and guarantees.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-[13px] text-text-secondary leading-relaxed">
            <p>
              <strong className="text-text-primary font-semibold">Smart List v1.0.0</strong> — Professional grocery SaaS.
            </p>
            <p>
              Designed for fast, reliable purchase tracking, budget management, and household stock monitoring.
            </p>
            <p className="text-success-primary font-semibold pt-1">
              ₹0 Budget guarantee: Built exclusively using open-source tools with zero paid APIs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

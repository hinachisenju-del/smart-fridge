import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact', className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
      { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
      { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
      { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
    ];

    return (
      <div
        role="group"
        aria-label="Theme selection"
        className={`inline-flex rounded-[8px] p-1 bg-surface-secondary border border-border-default ${className}`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-testid={`theme-option-${opt.value}`}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
              theme === opt.value
                ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Compact toggle for sidebar or mobile header
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getLabel = () => {
    if (theme === 'system') return 'Theme: System';
    return theme === 'dark' ? 'Theme: Dark' : 'Theme: Light';
  };

  const getIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />;
    return resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      onClick={cycleTheme}
      title={`Current: ${getLabel()}. Click to change theme.`}
      aria-label={`Toggle theme (currently ${theme})`}
      className={`h-[36px] px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer ${className}`}
    >
      <span className="text-text-primary">{getIcon()}</span>
      <span className="capitalize">{theme}</span>
    </button>
  );
};

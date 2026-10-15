/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'var(--surface-primary)',
          page: 'var(--surface-page)',
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
          inverse: 'var(--surface-inverse)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
          link: 'var(--text-link)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          default: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)',
        },
        brand: {
          DEFAULT: 'var(--brand-primary)',
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
          text: 'var(--brand-text)',
          subtle: 'var(--brand-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          primary: 'var(--accent-primary)',
          subtle: 'var(--accent-subtle)',
          text: 'var(--accent-text)',
        },
        success: {
          DEFAULT: 'var(--success-primary)',
          primary: 'var(--success-primary)',
          subtle: 'var(--success-subtle)',
          text: 'var(--success-text)',
          border: 'var(--success-border)',
        },
        warning: {
          DEFAULT: 'var(--warning-primary)',
          primary: 'var(--warning-primary)',
          subtle: 'var(--warning-subtle)',
          text: 'var(--warning-text)',
          border: 'var(--warning-border)',
        },
        danger: {
          DEFAULT: 'var(--danger-primary)',
          primary: 'var(--danger-primary)',
          subtle: 'var(--danger-subtle)',
          text: 'var(--danger-text)',
          border: 'var(--danger-border)',
        },
        info: {
          DEFAULT: 'var(--info-primary)',
          primary: 'var(--info-primary)',
          subtle: 'var(--info-subtle)',
          text: 'var(--info-text)',
          border: 'var(--info-border)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        pill: '999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        popover: 'var(--shadow-popover)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        sidebar: '232px',
        control: '40px',
        input: '42px',
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
};

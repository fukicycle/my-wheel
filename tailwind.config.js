/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        sunken: 'var(--sunken)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        rule: 'var(--rule)',
        'side-l': 'var(--left)',
        'side-l-soft': 'var(--left-soft)',
        'side-r': 'var(--right)',
        'side-r-soft': 'var(--right-soft)',
        bad: 'var(--bad)',
        'bad-soft': 'var(--bad-soft)',
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
        good: 'var(--good)',
      },
    },
  },
  plugins: [],
};

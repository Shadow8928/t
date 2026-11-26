/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        border: "var(--border)",
        danger: "var(--danger)",
        warning: "var(--warning)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "sans-serif"],
        display: ["IBM Plex Sans", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
      },
    },
  },
};

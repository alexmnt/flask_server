module.exports = {
  content: ["./frontend/templates/**/*.html", "./frontend/src/**/*.{ts,js}"],
  darkMode: ["attribute", "data-theme"],
  theme: {
    extend: {
      colors: {
        primary: "var(--md-sys-color-primary)",
        secondary: "var(--md-sys-color-secondary)",
        tertiary: "var(--md-sys-color-tertiary)",
        surface: "var(--md-sys-color-surface)",
        text: "var(--md-sys-color-on-surface)",
      },
      borderRadius: {
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      fontFamily: {
        sans: [
          "var(--md-ref-typeface-plain)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
        brand: [
          "var(--md-ref-typeface-brand)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};

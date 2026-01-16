module.exports = {
  content: ["./frontend/templates/**/*.html", "./frontend/src/**/*.{ts,js}"] ,
  darkMode: ["attribute", "data-theme"],
  theme: {
    extend: {
      colors: {
        primary: "var(--md-sys-color-primary)",
        secondary: "var(--md-sys-color-secondary)",
        surface: "var(--md-sys-color-surface)",
        text: "var(--md-sys-color-on-surface)",
      },
      borderRadius: {
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};

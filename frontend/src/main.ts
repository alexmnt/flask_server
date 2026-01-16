import "@material/web/all.js";
import { styles as typescaleStyles } from "@material/web/typography/md-typescale-styles.js";
import "htmx.org";
import "./styles.css";
import "./app";

declare global {
  interface Window {
    toggleTheme?: () => void;
  }
}

const themeKey = "md3-theme";
const root = document.documentElement;
const saved = localStorage.getItem(themeKey);

if (saved) {
  root.dataset.theme = saved;
}

window.toggleTheme = () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem(themeKey, next);
};

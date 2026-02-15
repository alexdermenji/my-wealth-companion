import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { keycloakify } from "keycloakify/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    keycloakify({
      accountThemeImplementation: "none",
      themeName: "financeflow",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

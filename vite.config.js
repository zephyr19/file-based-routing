import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const _dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('vite').UserConfig}
 */
export default {
  plugins: [react()],
  build: { minify: false },
  resolve: {
    alias: {
      "@": path.resolve(_dirname, "src"),
      "@utils": path.resolve(_dirname, "utils"),
    },
  },
};

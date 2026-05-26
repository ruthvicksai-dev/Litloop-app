import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex", "convex-test"] } },
    include: ["convex/tests/**/*.test.ts", "__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./")
    }
  }
});

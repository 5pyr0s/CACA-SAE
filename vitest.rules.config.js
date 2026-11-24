import { defineConfig } from "vitest/config";

// Security-rules tests talk to the Firestore emulator, so they run separately:
//   npm run test:rules
export default defineConfig({
  test: { include: ["tests/rules/**/*.test.js"], environment: "node", fileParallelism: false },
});

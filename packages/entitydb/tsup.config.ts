import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  noExternal: ["nanoid"],
  sourcemap: true,
  splitting: false,
  dts: true,
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  noExternal: [],
  sourcemap: true,
  splitting: false,
  dts: true,
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  noExternal: ["nanoid"],
  splitting: false,
  dts: true,
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "source/index.ts",
    "source/react/index.tsx",
    "source/modules/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: true,
  outDir: "distribution",
  external: ["react", "react-dom"],
});

import { defineConfig } from "tsdown";

export default defineConfig({
<<<<<<< Updated upstream
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
=======
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@protoburn\/.*/],
>>>>>>> Stashed changes
});

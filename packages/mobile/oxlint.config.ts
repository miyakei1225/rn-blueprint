import { defineConfig } from "oxlint";
import native from "oxlint-config-universe/native";

export default defineConfig({
  extends: [native],
  ignorePatterns: ["dist/*", "src/generated/*"],
});

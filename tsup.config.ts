import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["bin/talentclaw.ts"],
  format: ["esm"],
  outDir: "dist",
  target: "node22",
  platform: "node",
  clean: true,
  noExternal: [/.*/],
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import{createRequire as __cjsRequire}from'module';var require=__cjsRequire(import.meta.url);",
    ].join("\n"),
  },
})

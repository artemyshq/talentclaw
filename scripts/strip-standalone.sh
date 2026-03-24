#!/bin/sh
# Remove dev-only files from .next/standalone/ before packaging.
# Used by both build:desktop and prepublishOnly npm scripts.
set -e
rm -rf \
  .next/standalone/.claude \
  .next/standalone/.claude-plugin \
  .next/standalone/.gstack \
  .next/standalone/.vercel \
  .next/standalone/AGENTS.md \
  .next/standalone/CLAUDE.md \
  .next/standalone/DESIGN.md \
  .next/standalone/TODOS.md \
  .next/standalone/README.md \
  .next/standalone/LICENSE \
  .next/standalone/prototype-pipeline.html \
  .next/standalone/plugin \
  .next/standalone/persona \
  .next/standalone/skills \
  .next/standalone/desktop \
  .next/standalone/bin \
  .next/standalone/scripts \
  .next/standalone/assets

# Remove source maps — debug artifacts that inflate the package
find .next/standalone -name '*.map' -delete 2>/dev/null || true

#!/usr/bin/env bash

npm run format
npm run build
# Remove old unscoped package if it exists to avoid conflicts
npm uninstall -g aw || true
npm install -g . --force

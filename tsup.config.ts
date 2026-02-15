import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  // Bundle @icogenie/shared since it's a workspace dependency not published to npm
  noExternal: ['@icogenie/shared'],
});

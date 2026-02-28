import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/sdk/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['hono', 'zod'],
});

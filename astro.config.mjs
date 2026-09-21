// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import glsl from 'vite-plugin-glsl';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [glsl()],
  },
  devToolbar: {
    enabled: false,
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import glsl from 'vite-plugin-glsl';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  vite: {
    plugins: [glsl()],
  },
  devToolbar: {
    enabled: false,
  },
});

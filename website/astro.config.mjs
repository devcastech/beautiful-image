// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      title: 'beautiful-image',
      description: 'Compress and optimize images with minimal quality loss. Powered by Rust/WASM.',
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap' } },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/devcastech/beautiful-image' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/beautiful-image' },
      ],
      expressiveCode: {
        themes: [
          //'vitesse-dark',
          'material-theme-darker',
        ],
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Browser', slug: 'getting-started/browser' },
            { label: 'Node.js', slug: 'getting-started/node' },
          ],
        },
        {
          label: 'API Reference',
          items: [{ label: 'Methods', slug: 'api' }],
        },
        {
          label: 'Guides',
          items: [{ label: 'Lambda + S3', slug: 'guides/lambda-s3' }],
        },
      ],
      customCss: ['./src/styles/global.css'],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

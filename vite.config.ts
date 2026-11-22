import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {privacyPolicy} from './src/privacyPolicy';

function escapeHtml(text: string) {
  const entities: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};
  return text.replace(/[&<>]/g, (character) => entities[character]);
}

function renderPrivacyPolicy() {
  const sections = privacyPolicy.sections.map(({title, content}) =>
    `<section><h2>${escapeHtml(title)}</h2><p>${escapeHtml(content)}</p></section>`,
  );

  return [
    `<h1>${escapeHtml(privacyPolicy.title)}</h1>`,
    `<p class="subtitle">${escapeHtml(privacyPolicy.subtitle)}</p>`,
    `<p>${escapeHtml(privacyPolicy.text)}</p>`,
    ...sections,
  ].join('\n');
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'atlas-privacy-page',
        transformIndexHtml(html, context) {
          if (path.basename(context.filename) === 'privacidade.html') {
            return html.replace('<!-- ATLAS_PRIVACY_POLICY -->', renderPrivacyPolicy());
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          home: path.resolve(__dirname, 'index.html'),
          contact: path.resolve(__dirname, 'contato.html'),
          privacy: path.resolve(__dirname, 'privacidade.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {privacyPolicy} from './src/privacyPolicy';
import {termsOfService} from './src/termsOfService';

const legalDocuments = new Map([
  ['privacidade.html', privacyPolicy],
  ['termos-de-servico.html', termsOfService],
]);

function escapeHtml(text: string) {
  const entities: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};
  return text.replace(/[&<>]/g, (character) => entities[character]);
}

function renderLegalDocument(document: typeof privacyPolicy) {
  const sections = document.sections.map(({title, content}) =>
    `<section><h2>${escapeHtml(title)}</h2><p>${escapeHtml(content)}</p></section>`,
  );

  return [
    `<h1>${escapeHtml(document.title)}</h1>`,
    `<p class="subtitle">${escapeHtml(document.subtitle)}</p>`,
    `<p>${escapeHtml(document.text)}</p>`,
    ...sections,
  ].join('\n');
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'atlas-legal-pages',
        transformIndexHtml(html, context) {
          const document = legalDocuments.get(path.basename(context.filename));
          if (document) {
            return html.replace('<!-- ATLAS_LEGAL_DOCUMENT -->', renderLegalDocument(document));
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
          terms: path.resolve(__dirname, 'termos-de-servico.html'),
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

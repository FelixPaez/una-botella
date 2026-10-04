/// <reference types="vitest/config" />
import { existsSync } from 'node:fs';
import cascadeLayers from '@csstools/postcss-cascade-layers';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { config } from './src/config.ts';

// GitHub Actions define GITHUB_REPOSITORY="usuario/repo". De ahí salen la ruta
// base de Pages y la URL pública, así que renombrar el repo no rompe nada.
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isUserSite = Boolean(repo?.toLowerCase().endsWith('.github.io'));
const base = repo && !isUserSite ? `/${repo}/` : '/';
const siteUrl =
  config.meta.siteUrl ?? (owner && repo ? `https://${owner.toLowerCase()}.github.io${base}` : undefined);

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Title, description y Open Graph salen de config.ts: un único origen. */
function metaTags(): Plugin {
  const meta = (name: string, content: string): HtmlTagDescriptor => ({
    tag: 'meta',
    attrs: { name, content: escapeHtml(content) },
    injectTo: 'head',
  });
  const og = (property: string, content: string): HtmlTagDescriptor => ({
    tag: 'meta',
    attrs: { property, content: escapeHtml(content) },
    injectTo: 'head',
  });
  return {
    name: 'botella:meta',
    transformIndexHtml() {
      const { title, description } = config.meta;
      const tags: HtmlTagDescriptor[] = [
        { tag: 'title', children: escapeHtml(title), injectTo: 'head' },
        meta('description', description),
        og('og:type', 'website'),
        og('og:locale', 'es_ES'),
        og('og:title', title),
        og('og:description', description),
        meta('twitter:card', 'summary_large_image'),
      ];
      if (siteUrl) tags.push(og('og:url', siteUrl));
      // La vista previa de WhatsApp: solo se anuncia si la imagen existe.
      if (siteUrl && existsSync('public/og-image.jpg')) {
        tags.push(
          og('og:image', `${siteUrl}og-image.jpg`),
          og('og:image:type', 'image/jpeg'),
          og('og:image:width', '1200'),
          og('og:image:height', '630'),
          og('og:image:alt', 'Una botella con un mensaje flotando en el mar al atardecer'),
        );
      }
      return tags;
    },
  };
}

/** Precarga las fuentes del primer pintado (los nombres llevan hash en el build). */
function preloadFonts(names: string[]): Plugin {
  return {
    name: 'botella:preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        return Object.values(ctx.bundle)
          .filter((file) => file.fileName.endsWith('.woff2') && names.some((n) => file.fileName.includes(n)))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: base + file.fileName, crossorigin: true },
            injectTo: 'head-prepend' as const,
          }));
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), metaTags(), preloadFonts(['fraunces-roman', 'dm-sans'])],
  css: {
    // Tailwind 4 agrupa el CSS en @layer, que los navegadores anteriores a 2022
    // ignoran por completo. Este paso de compilación traduce las capas a
    // especificidad normal: mismo resultado, sin coste en el navegador.
    postcss: { plugins: [cascadeLayers()] },
  },
  build: {
    // Muchos móviles en Cuba no actualizan el navegador: compilamos para 2021 en adelante.
    target: ['es2020', 'chrome88', 'safari15', 'firefox90'],
    cssTarget: ['chrome88', 'safari15', 'firefox90'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});

// astro.config.mjs
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import wikiLinkPlugin from 'remark-wiki-link';
import mdx from '@astrojs/mdx';

// Plugin tự động gắn tiền tố /vi/concepts/ hoặc /en/concepts/ theo ngôn ngữ của file
function remarkWikiLinkI18n() {
  return (tree, file) => {
    const filePath = file.history?.[0] || file.path || '';
    // Kiểm tra file hiện tại là tiếng Anh hay tiếng Việt
    const isEn = filePath.endsWith('en.md') || filePath.includes('/en/') || filePath.includes('\\en\\');
    const lang = isEn ? 'en' : 'vi';

    function walk(node) {
      // Khi gặp node wikiLink do remark-wiki-link tạo ra
      if (node.type === 'wikiLink' && node.data?.hProperties) {
        // Gắn chính xác ngôn ngữ và concept slug
        node.data.hProperties.href = `/${lang}/concepts/${node.data.permalink}`;
      }
      if (node.children) {
        node.children.forEach(walk);
      }
    }
    walk(tree);
  };
}

export default defineConfig({
  redirects: {
    '/': '/vi',
  },
  integrations: [mdx()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkMath,
        [
          wikiLinkPlugin,
          {
            pageResolver: (name) => [name.trim().toLowerCase()],
            hrefTemplate: (permalink) => permalink,
          },
        ],
        // 3. Tự động chèn /vi/concepts/... hoặc /en/concepts/...
        remarkWikiLinkI18n,
      ],
      rehypePlugins: [
        [
          rehypeKatex,
          {
            throwOnError: false,
          },
        ],
      ],
    }),
  },
});

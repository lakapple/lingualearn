import { getEnglishPhonetic, getVietnamesePhonetic } from './phonetic-generator.js';

/**
 * Lấy phonetic có sẵn từ MDX hoặc tự động sinh nếu bị trống
 */
export async function resolvePhonetic(title, lang, existingPhonetic) {
  // 1. Nếu tác giả đã tự điền trong CMS, giữ nguyên
  if (existingPhonetic && existingPhonetic.trim() !== '') {
    return existingPhonetic;
  }

  // 2. Nếu trống, tự động sinh theo ngôn ngữ
  if (lang === 'vi') {
    return getVietnamesePhonetic(title);
  } else if (lang === 'en') {
    return await getEnglishPhonetic(title);
  }

  return '';
}

export function parseBilingualId(id) {
  // Chuẩn hóa dấu gạch chéo
  const cleanId = id.replace(/\\/g, '/');
  const parts = cleanId.split('/').filter(Boolean);
  const last = parts.pop() || '';

  let lang = 'vi';

  if (last.includes('.')) {
    // Trường hợp: "index.vi" hoặc "index.en"
    const sub = last.split('.');
    lang = sub.pop(); // 'vi' hoặc 'en'
    const base = sub.join('.');
    if (base !== 'index') {
      parts.push(base);
    }
  } else {
    // Trường hợp file cũ: ".../vi" hoặc ".../en"
    lang = last;
  }

  return {
    lang,
    slug: parts.join('/'),
  };
}

export function getPairBySlug(entries, slug) {
  const parsed = entries.map((e) => ({ ...e, ...parseBilingualId(e.id) }));
  return {
    vi: parsed.find((e) => e.lang === 'vi' && e.slug === slug) ?? null,
    en: parsed.find((e) => e.lang === 'en' && e.slug === slug) ?? null,
  };
}

export function byLang(entries, lang) {
  return entries
    .map((entry) => {
      const parsed = parseBilingualId(entry.id);
      return { ...entry, lang: parsed.lang, slug: parsed.slug };
    })
    .filter((entry) => entry.lang === lang && !entry.data.draft);
}

export function buildHeadingTree(headings) {
  const tree = [];
  let currentH2 = null;

  for (const heading of headings) {
    if (heading.depth === 2) {
      currentH2 = { ...heading, children: [] };
      tree.push(currentH2);
    } else if (heading.depth >= 3 && currentH2) {
      currentH2.children.push(heading);
    }
  }

  return tree;
}

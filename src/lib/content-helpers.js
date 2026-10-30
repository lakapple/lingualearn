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

/**
 * Lấy thứ tự hiển thị của bài học một cách chuẩn xác:
 * 1. Nếu có order > 0 thì dùng order
 * 2. Nếu order = 0 hoặc thiếu, tự động phân tích số bài từ tiêu đề (ví dụ "Bài 12: ..." -> 12)
 * 3. Nếu tiêu đề không có, phân tích từ slug (ví dụ "lop-10/bài-12-..." -> 12)
 */
export function getLessonOrder(lesson) {
  if (lesson.data?.order && Number(lesson.data.order) > 0) {
    return Number(lesson.data.order);
  }

  const titleMatch = (lesson.data?.title || '').match(/(?:Bài|Lesson)\s*(\d+)/i);
  if (titleMatch) {
    return parseInt(titleMatch[1], 10);
  }

  const slugMatch = (lesson.slug || '').match(/b[aà]i-(\d+)/i);
  if (slugMatch) {
    return parseInt(slugMatch[1], 10);
  }

  return 999;
}


import { getCollection } from 'astro:content';
import { byLang, getPairBySlug } from '../../lib/content-helpers.js';
import { LANGS } from '../../lib/i18n.js';
import { getEnglishPhonetic, getVietnamesePhonetic } from '../../lib/phonetic-generator.js';

// Bắt buộc phải có getStaticPaths khi đặt file trong thư mục [lang]
export function getStaticPaths() {
  return LANGS.map((lang) => ({
    params: { lang },
  }));
}

export async function GET() {
  const allConcepts = await getCollection('concepts');
  // Lấy danh sách slug sạch (ví dụ: 'diem', 'duong-thang')
  const viSlugs = byLang(allConcepts, 'vi').map((entry) => entry.slug);

  const glossary: Record<string, unknown> = {};

  for (const slug of viSlugs) {
    const pair = getPairBySlug(allConcepts, slug);

    // 1. Xử lý Phonetic Tiếng Việt (ưu tiên CMS, nếu trống tự sinh IPA)
    const viTitle = pair.vi?.data.title ?? '';
    const viPhonetic = pair.vi?.data.phonetic?.trim()
      ? pair.vi.data.phonetic
      : (viTitle ? getVietnamesePhonetic(viTitle) : null);

    // 2. Xử lý Phonetic Tiếng Anh (ưu tiên CMS, nếu trống tự gọi API tra IPA)
    const enTitle = pair.en?.data.title ?? '';
    const enPhonetic = pair.en?.data.phonetic?.trim()
      ? pair.en.data.phonetic
      : (enTitle ? await getEnglishPhonetic(enTitle) : null);

    glossary[slug] = {
      vi: pair.vi
        ? {
            title: viTitle,
            phonetic: viPhonetic,
            summary: pair.vi.data.summary ?? null,
          }
        : null,
      en: pair.en
        ? {
            title: enTitle,
            phonetic: enPhonetic,
            summary: pair.en.data.summary ?? null,
          }
        : null,
    };
  }

  return new Response(JSON.stringify(glossary, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

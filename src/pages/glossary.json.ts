import { getCollection } from 'astro:content';
import { byLang, getPairBySlug } from '../lib/content-helpers.js';

export async function GET() {
  const allConcepts = await getCollection('concepts');
  const viSlugs = byLang(allConcepts, 'vi').map((entry) => entry.slug);

  const glossary: Record<string, unknown> = {};

  for (const slug of viSlugs) {
    const pair = getPairBySlug(allConcepts, slug);
    glossary[slug] = {
      vi: pair.vi
        ? {
            title: pair.vi.data.title,
            phonetic: pair.vi.data.phonetic ?? null,
            summary: pair.vi.data.summary ?? null,
          }
        : null,
      en: pair.en
        ? {
            title: pair.en.data.title,
            phonetic: pair.en.data.phonetic ?? null,
            summary: pair.en.data.summary ?? null,
          }
        : null,
    };
  }

  return new Response(JSON.stringify(glossary), {
    headers: { 'Content-Type': 'application/json' },
  });
}

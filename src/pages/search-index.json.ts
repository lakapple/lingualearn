import { getCollection } from 'astro:content';
import { byLang, getLessonOrder } from '../lib/content-helpers.js';
import { LANGS } from '../lib/i18n.js';

export async function GET() {
  const allLessons = await getCollection('lessons');
  const allConcepts = await getCollection('concepts');

  const items = [];

  for (const lang of LANGS) {
    const langLessons = byLang(allLessons, lang);
    for (const lesson of langLessons) {
      let grade = lesson.data.grade;
      if (!grade) {
        if (lesson.slug.startsWith('lop-10')) grade = 10;
        else if (lesson.slug.startsWith('lop-11')) grade = 11;
        else if (lesson.slug.startsWith('lop-12')) grade = 12;
      }

      items.push({
        id: `lesson-${lang}-${lesson.slug}`,
        type: 'lesson',
        lang,
        title: lesson.data.title,
        description: lesson.data.description || '',
        tags: lesson.data.tags || [],
        grade: grade || null,
        url: `/${lang}/lessons/${lesson.slug}`,
        order: getLessonOrder(lesson),
      });
    }

    const langConcepts = byLang(allConcepts, lang);
    for (const concept of langConcepts) {
      items.push({
        id: `concept-${lang}-${concept.slug}`,
        type: 'concept',
        lang,
        title: concept.data.title,
        description: concept.data.description || concept.data.summary || '',
        tags: concept.data.tags || [],
        phonetic: concept.data.phonetic || '',
        summary: concept.data.summary || '',
        url: `/${lang}/concepts/${concept.slug}`,
      });
    }
  }

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

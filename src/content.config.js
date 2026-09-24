import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const bilingualSchema = z.object({
  title: z.string(),
  description: z.string(),
  phonetic: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

const lessons = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/subject/math/lessons',
    // Giữ nguyên đường dẫn tương đối của file (chỉ bỏ đuôi .md / .mdx)
    generateId: ({ entry }) => entry.replace(/\.(mdx?|markdown)$/i, ''),
  }),
  schema: bilingualSchema.extend({
    grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
    order: z.number().int().default(0),
  }),
});

const concepts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/concepts',
    // Giữ nguyên đường dẫn tương đối của file (chỉ bỏ đuôi .md / .mdx)
    generateId: ({ entry }) => entry.replace(/\.(mdx?|markdown)$/i, ''),
  }),
  schema: bilingualSchema,
});

export const collections = { lessons, concepts };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Metadata cơ bản cho nội dung bài viết
const baseSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

// 1. Schema cho Concepts (Wiki Thuật ngữ)
const concepts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/concepts',
    // Giữ nguyên ID gốc để không làm mất dấu chấm của index.vi / index.en
    generateId: ({ entry }) => entry.replace(/\.(mdx?|markdown)$/i, ''),
  }),
  schema: baseSchema.extend({
    phonetic: z.string().optional(),
    summary: z.string().optional(),
  }),
});

// 2. Schema cho Lessons (Bài học SGK)
const lessons = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/subject/math/lessons',
    // Giữ nguyên ID gốc
    generateId: ({ entry }) => entry.replace(/\.(mdx?|markdown)$/i, ''),
  }),
  schema: baseSchema.extend({
    grade: z.coerce
      .number()
      .pipe(z.union([z.literal(10), z.literal(11), z.literal(12)]))
      .optional(),
    order: z.coerce.number().int().default(0),
  }),
});

export const collections = { lessons, concepts };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Frontmatter dùng chung cho nội dung song ngữ (mỗi bài = 1 thư mục chứa vi.md + en.md)
const bilingualSchema = z.object({
  title: z.string(),
  description: z.string(),
  phonetic: z.string().optional(),   // ví dụ: "/điəm/" hoặc "point"
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

const lessons = defineCollection({
  // Trỏ thẳng vào thư mục lessons, pattern đệ quy bắt mọi lop-XX/slug/{vi,en}.md
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/subject/math/lessons',
  }),
  schema: bilingualSchema.extend({
    grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
    order: z.number().int().default(0), // để sắp xếp bài trong 1 khối lớp sau này
  }),
});

const concepts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/concepts',
  }),
  schema: bilingualSchema,
});

export const collections = { lessons, concepts };

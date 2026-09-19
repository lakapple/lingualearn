export function parseBilingualId(id) {
  const parts = id.split('/');
  const lang = parts.pop();
  return { lang, slug: parts.join('/') };
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
    .map((entry) => ({ ...entry, ...parseBilingualId(entry.id) }))
    .filter((entry) => entry.lang === lang && !entry.data.draft);
}

/**
 * Dựng cây phân cấp từ mảng headings phẳng do render() trả về.
 * Chỉ xử lý depth 2 (H2) làm gốc, depth 3 (H3) làm con.
 * Bỏ qua H1 (thường trùng tiêu đề bài viết) và depth > 3 (gộp vào H3 cha gần nhất).
 */
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
    // depth === 1 bị bỏ qua có chủ đích
  }

  return tree;
}

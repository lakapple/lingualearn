/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu) để tìm kiếm không dấu
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Escape chuỗi HTML để hiển thị an toàn
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Highlight các từ khóa tìm kiếm trong chuỗi văn bản
 */
export function highlightMatch(text, queryTokens) {
  if (!text) return '';
  if (!queryTokens || queryTokens.length === 0) return escapeHtml(text);

  const validTokens = queryTokens
    .map((t) => removeVietnameseTones(t).trim())
    .filter((t) => t.length > 0);

  if (validTokens.length === 0) return escapeHtml(text);

  const textNormalized = removeVietnameseTones(text);
  const matches = [];

  for (const token of validTokens) {
    let startIdx = 0;
    while ((startIdx = textNormalized.indexOf(token, startIdx)) !== -1) {
      matches.push({ start: startIdx, end: startIdx + token.length });
      startIdx += token.length;
    }
  }

  if (matches.length === 0) return escapeHtml(text);

  matches.sort((a, b) => a.start - b.start);
  const merged = [];
  let cur = { ...matches[0] };
  for (let i = 1; i < matches.length; i++) {
    const next = matches[i];
    if (next.start <= cur.end) {
      cur.end = Math.max(cur.end, next.end);
    } else {
      merged.push(cur);
      cur = { ...next };
    }
  }
  merged.push(cur);

  let result = '';
  let lastIdx = 0;
  for (const range of merged) {
    result += escapeHtml(text.slice(lastIdx, range.start));
    result += `<mark class="search-highlight">${escapeHtml(text.slice(range.start, range.end))}</mark>`;
    lastIdx = range.end;
  }
  result += escapeHtml(text.slice(lastIdx));

  return result;
}

/**
 * Tìm kiếm và chấm điểm các mục
 */
export function searchItems(items, query, options = {}) {
  const { lang, filterType = 'all', filterGrade = 'all' } = options;
  const rawQuery = (query || '').trim();
  if (!rawQuery) return [];

  const queryNorm = removeVietnameseTones(rawQuery);
  const queryTokens = queryNorm.split(/\s+/).filter(Boolean);
  const rawLower = rawQuery.toLowerCase();

  const results = [];

  for (const item of items) {
    if (lang && item.lang !== lang) continue;
    if (filterType !== 'all' && item.type !== filterType) continue;
    if (filterGrade !== 'all') {
      if (item.type === 'lesson' && String(item.grade) !== String(filterGrade)) {
        continue;
      }
      if (item.type !== 'lesson') {
        continue;
      }
    }

    const titleNorm = removeVietnameseTones(item.title);
    const descNorm = removeVietnameseTones(item.description);
    const tagsNorm = (item.tags || []).map((t) => removeVietnameseTones(t));
    const rawTitle = (item.title || '').toLowerCase();

    let score = 0;

    // 1. Khớp chính xác tiêu đề
    if (rawTitle === rawLower || titleNorm === queryNorm) {
      score += 1000;
    } else if (rawTitle.startsWith(rawLower) || titleNorm.startsWith(queryNorm)) {
      score += 500;
    } else if (rawTitle.includes(rawLower) || titleNorm.includes(queryNorm)) {
      score += 300;
    }

    // 2. Khớp thẻ tag
    if (tagsNorm.some((t) => t === queryNorm || t.includes(queryNorm))) {
      score += 200;
    }

    // 3. Khớp từng token
    let allTokensFound = true;
    let titleTokensCount = 0;

    for (const token of queryTokens) {
      const inTitle = titleNorm.includes(token);
      const inDesc = descNorm.includes(token);
      const inTags = tagsNorm.some((t) => t.includes(token));

      if (inTitle) {
        score += 80;
        titleTokensCount++;
      }
      if (inTags) {
        score += 50;
      }
      if (inDesc) {
        score += 20;
      }

      if (!inTitle && !inDesc && !inTags) {
        allTokensFound = false;
        break;
      }
    }

    if (!allTokensFound) continue;

    if (queryTokens.length > 1 && titleTokensCount === queryTokens.length) {
      score += 150;
    }

    results.push({
      item,
      score,
      queryTokens,
    });
  }

  // Sắp xếp điểm cao lên trước
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.grade !== b.item.grade) {
      return (a.item.grade || 0) - (b.item.grade || 0);
    }
    return (a.item.order || 0) - (b.item.order || 0);
  });

  return results;
}

export const LANGS = ['vi', 'en'];
export const DEFAULT_LANG = 'vi';

/** Lấy lang từ pathname, ví dụ "/vi/lessons/..." -> "vi". Mặc định "vi" nếu không khớp. */
export function getLangFromUrl(url) {
  const [, maybeLang] = url.pathname.split('/');
  return LANGS.includes(maybeLang) ? maybeLang : DEFAULT_LANG;
}

/** Đổi lang trong 1 pathname, giữ nguyên phần còn lại. */
export function switchLangInPath(pathname, targetLang) {
  const segments = pathname.split('/').filter(Boolean);
  if (LANGS.includes(segments[0])) {
    segments[0] = targetLang;
  } else {
    segments.unshift(targetLang);
  }
  return '/' + segments.join('/');
}

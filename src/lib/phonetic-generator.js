// Cache tạm thời trong quá trình build để không gọi lặp lại API
const ipaCache = new Map();

/**
 * 1. Lấy phiên âm IPA tiếng Anh qua Free Dictionary API
 */
export async function getEnglishPhonetic(text) {
  const cleanWord = text.trim().toLowerCase().replace(/[^a-z\s-]/g, '');
  if (!cleanWord) return '';

  if (ipaCache.has(cleanWord)) {
    return ipaCache.get(cleanWord);
  }

  // Nếu là từ ghép/cụm từ, tách từng từ để tra
  const words = cleanWord.split(/\s+/);
  const ipaResults = [];

  for (const w of words) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${w}`);
      if (res.ok) {
        const data = await res.json();
        // Lấy trường phonetic trực tiếp hoặc trong mảng phonetics
        const ipa = data[0]?.phonetic || data[0]?.phonetics?.find(p => p.text)?.text || '';
        ipaResults.push(ipa.replace(/\//g, ''));
      } else {
        ipaResults.push(w); // fallback giữ nguyên từ nếu không có trong từ điển
      }
    } catch {
      ipaResults.push(w);
    }
  }

  const result = ipaResults.filter(Boolean).length > 0 ? `/${ipaResults.join(' ')}/` : '';
  ipaCache.set(cleanWord, result);
  return result;
}

/**
 * 2. Bộ quy tắc chuyển tiếng Việt sang IPA (Chuẩn ngữ âm học Tiếng Việt)
 */
const TONES = {
  'á': ['a', '35'], 'à': ['a', '21'], 'ả': ['a', '313'], 'ã': ['a', '35'], 'ạ': ['a', '21ʔ'],
  'é': ['e', '35'], 'è': ['e', '21'], 'ẻ': ['e', '313'], 'ẽ': ['e', '35'], 'ẹ': ['e', '21ʔ'],
  'í': ['i', '35'], 'ì': ['i', '21'], 'ỉ': ['i', '313'], 'ĩ': ['i', '35'], 'ị': ['i', '21ʔ'],
  'ó': ['o', '35'], 'ò': ['o', '21'], 'ỏ': ['o', '313'], 'õ': ['o', '35'], 'ọ': ['o', '21ʔ'],
  'ú': ['u', '35'], 'ù': ['u', '21'], 'ủ': ['u', '313'], 'ũ': ['u', '35'], 'ụ': ['u', '21ʔ'],
  'ý': ['i', '35'], 'ỳ': ['i', '21'], 'ỷ': ['i', '313'], 'ỹ': ['i', '35'], 'ỵ': ['i', '21ʔ'],
  'ắ': ['ă', '35'], 'ằ': ['ă', '21'], 'ẳ': ['ă', '313'], 'ẵ': ['ă', '35'], 'ặ': ['ă', '21ʔ'],
  'ấ': ['â', '35'], 'ầ': ['â', '21'], 'ẩ': ['â', '313'], 'ẫ': ['â', '35'], 'ậ': ['â', '21ʔ'],
  'ế': ['ê', '35'], 'ề': ['ê', '21'], 'ể': ['ê', '313'], 'ễ': ['ê', '35'], 'ệ': ['ê', '21ʔ'],
  'ố': ['ô', '35'], 'ồ': ['ô', '21'], 'ổ': ['ô', '313'], 'ỗ': ['ô', '35'], 'ộ': ['ô', '21ʔ'],
  'ứ': ['ư', '35'], 'ừ': ['ư', '21'], 'ử': ['ư', '313'], 'ữ': ['ư', '35'], 'ự': ['ư', '21ʔ'],
};

const ONSETS = {
  'th': 'tʰ', 'ph': 'f', 'kh': 'x', 'ch': 'c', 'nh': 'ɲ', 'ng': 'ŋ', 'ngh': 'ŋ',
  'gh': 'ɣ', 'g': 'ɣ', 'gi': 'z', 'qu': 'kw', 'tr': 'ʈ', 'đ': 'ɗ', 'b': 'ɓ',
  'd': 'z', 'r': 'z', 's': 's', 'x': 's', 't': 't', 'c': 'k', 'k': 'k', 'm': 'm',
  'n': 'n', 'l': 'l', 'v': 'v', 'h': 'h', 'p': 'p'
};

export function getVietnameseWordIPA(word) {
  let w = word.toLowerCase().trim();
  let tone = '33'; // ngang

  // Tách thanh điệu
  for (const [char, [base, t]] of Object.entries(TONES)) {
    if (w.includes(char)) {
      w = w.replace(char, base);
      tone = t;
      break;
    }
  }

  // Tách âm đầu
  let onset = '';
  for (const k of ['ngh', 'ng', 'th', 'ph', 'kh', 'ch', 'nh', 'gh', 'gi', 'qu', 'tr', 'đ']) {
    if (w.startsWith(k)) {
      onset = ONSETS[k] || k;
      w = w.slice(k.length);
      break;
    }
  }
  if (!onset && w.length > 0 && ONSETS[w[0]]) {
    onset = ONSETS[w[0]];
    w = w.slice(1);
  }

  // Phần vần cơ bản
  let rime = w
    .replace(/iê|yê|ia/g, 'iə')
    .replace(/uô|ua/g, 'uə')
    .replace(/ươ|ưa/g, 'ɨə')
    .replace(/ơ/g, 'əː')
    .replace(/â/g, 'ə')
    .replace(/ă/g, 'a')
    .replace(/ư/g, 'ɨ')
    .replace(/ê/g, 'e')
    .replace(/e/g, 'ɛ')
    .replace(/ô/g, 'o')
    .replace(/o/g, 'ɔ');

  return `${onset}${rime}${tone === '33' ? '' : tone}`;
}

export function getVietnamesePhonetic(text) {
  const words = text.trim().split(/\s+/);
  const ipa = words.map(getVietnameseWordIPA).join(' ');
  return `/${ipa}/`;
}

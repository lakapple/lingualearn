export function stripParenthetical(text) {
  return text
    .replace(/\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function pickVoice(langCode) {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(langCode.split('-')[0].toLowerCase())) ??
    null
  );
}

/**
 * Phát âm 1 chuỗi text. Trả về qua callback thay vì Promise vì
 * SpeechSynthesisUtterance dùng event-based API, không có Promise gốc.
 */
export function speakText(text, langCode, { onStart, onEnd, onUnsupported } = {}) {
  if (!('speechSynthesis' in window)) {
    onUnsupported?.('no-speech-api');
    return;
  }
  const voice = pickVoice(langCode);
  if (!voice) {
    onUnsupported?.('no-voice');
    return;
  }
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = voice;
  utter.lang = langCode;
  onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  speechSynthesis.speak(utter);
}

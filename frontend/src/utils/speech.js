// Thin wrapper over the browser's native Web Speech API
// (SpeechSynthesis) - no external API, no API key, works entirely
// offline once the page has loaded. Not supported in every browser
// (notably some older Android WebViews), so every caller must check
// isSpeechSupported() before offering a read-aloud control at all.

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

// Strips the most common Markdown syntax so the AI tutor's formatted
// replies (headings, bullets, bold, code) are read as plain prose
// instead of literal asterisks and hashes.
export const stripMarkdown = (text) =>
  text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#*_>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const speak = (text) => {
  if (!isSpeechSupported() || !text) return;
  window.speechSynthesis.cancel(); // only one utterance at a time
  const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
};

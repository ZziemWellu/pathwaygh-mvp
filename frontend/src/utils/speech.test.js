import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isSpeechSupported, stripMarkdown, speak, stopSpeaking } from './speech';

describe('stripMarkdown', () => {
  it('removes bold/italic/heading/list markers', () => {
    expect(stripMarkdown('# Heading\n**bold** and *italic* and - a list item')).toBe(
      'Heading bold and italic and a list item'
    );
  });

  it('unwraps inline code and code fences', () => {
    expect(stripMarkdown('Use `const x = 1` to declare it')).toBe('Use const x = 1 to declare it');
    expect(stripMarkdown('before\n```js\nconst x = 1\n```\nafter')).toBe('before after');
  });

  it('unwraps markdown links to just their label', () => {
    expect(stripMarkdown('See [the docs](https://example.com) for more')).toBe('See the docs for more');
  });

  it('collapses excess whitespace', () => {
    expect(stripMarkdown('a\n\n\nb   c')).toBe('a b c');
  });
});

describe('isSpeechSupported', () => {
  const originalSpeechSynthesis = window.speechSynthesis;
  const originalUtterance = window.SpeechSynthesisUtterance;

  afterEach(() => {
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalUtterance;
  });

  it('returns false when the browser has no speechSynthesis', () => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
    expect(isSpeechSupported()).toBe(false);
  });

  it('returns true when both APIs are present', () => {
    window.speechSynthesis = {};
    window.SpeechSynthesisUtterance = function () {};
    expect(isSpeechSupported()).toBe(true);
  });
});

describe('speak / stopSpeaking', () => {
  let cancel;
  let speakFn;

  beforeEach(() => {
    cancel = vi.fn();
    speakFn = vi.fn();
    window.speechSynthesis = { cancel, speak: speakFn, speaking: false };
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
  });

  it('cancels any in-flight utterance before speaking a new one', () => {
    speak('Hello **world**');
    expect(cancel).toHaveBeenCalled();
    expect(speakFn).toHaveBeenCalled();
    expect(speakFn.mock.calls[0][0].text).toBe('Hello world');
  });

  it('does nothing when given empty text', () => {
    speak('');
    expect(speakFn).not.toHaveBeenCalled();
  });

  it('stopSpeaking cancels the current utterance', () => {
    stopSpeaking();
    expect(cancel).toHaveBeenCalled();
  });
});

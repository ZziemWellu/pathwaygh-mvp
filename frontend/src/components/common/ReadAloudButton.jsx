import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSpeechSupported, speak, stopSpeaking } from '../../utils/speech';

// A small, self-contained read-aloud toggle for a block of text - used
// wherever a student might benefit from hearing content instead of only
// reading it (the AI tutor's replies, lesson text). Renders nothing if
// the browser doesn't support the Web Speech API, rather than showing a
// control that would silently do nothing when pressed.
const ReadAloudButton = ({ text, size = 14 }) => {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!isSpeechSupported()) return undefined;
    // speechSynthesis has no per-utterance "onend" hook from outside the
    // utterance itself, so poll .speaking to know when to reset the icon -
    // cheap and simple for a control that's only visible a few seconds.
    const interval = setInterval(() => {
      setSpeaking(window.speechSynthesis.speaking);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!isSpeechSupported()) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speak(text);
      setSpeaking(true);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
      title={speaking ? 'Stop reading aloud' : 'Read aloud'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        color: 'var(--gray-500, #666)',
      }}
    >
      {speaking ? <VolumeX size={size} /> : <Volume2 size={size} />}
    </button>
  );
};

export default ReadAloudButton;

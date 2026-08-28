import { useEffect, useState } from 'react';

interface UseTypewriterOptions {
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
}

export interface TypewriterState {
  text: string;
  index: number;
}

// Types out each word character-by-character, pauses, backspaces it, then moves to the next word.
// Returns both the currently typed substring and the word's index, so callers can sync other UI
// (e.g. an icon) to change exactly when the word transitions.
export function useTypewriter(words: string[], options: UseTypewriterOptions = {}): TypewriterState {
  const { typingSpeedMs = 80, deletingSpeedMs = 40, pauseMs = 1200 } = options;
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    if (words.length === 0) return;
    const currentWord = words[wordIndex % words.length];
    const delay = phase === 'pausing' ? pauseMs : phase === 'deleting' ? deletingSpeedMs : typingSpeedMs;

    const timer = setTimeout(() => {
      if (phase === 'typing') {
        if (charCount < currentWord.length) {
          setCharCount((c) => c + 1);
        } else {
          setPhase('pausing');
        }
      } else if (phase === 'pausing') {
        setPhase('deleting');
      } else {
        if (charCount > 0) {
          setCharCount((c) => c - 1);
        } else {
          setWordIndex((i) => (i + 1) % words.length);
          setPhase('typing');
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [charCount, phase, wordIndex, words, typingSpeedMs, deletingSpeedMs, pauseMs]);

  if (words.length === 0) return { text: '', index: 0 };
  const index = wordIndex % words.length;
  return { text: words[index].slice(0, charCount), index };
}

'use client';

import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  /** ms per character */
  speed?: number;
  /** Delay before starting (ms) */
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  speed = 28,
  delay = 600,
  className,
  onComplete,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    let index = 0;
    let startTimeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        index++;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(interval);
          setDone(true);
          onComplete?.();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className} aria-label={text} aria-live="polite">
      {displayed}
      {!done && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1.1em',
            background: 'currentColor',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            animation: 'blink 0.8s step-end infinite',
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import styles from './Toast.module.css';
import { ToastContext } from './toastContext.ts';

const DURATION = 4000;

/** One small message at a time, announced politely to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const current = useRef<string | null>(null);

  const show = useCallback((text: string) => {
    // Showing the same message again just restarts its timer.
    if (current.current !== text) setKey((k) => k + 1);
    current.current = text;
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      current.current = null;
      setMessage(null);
    }, DURATION);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {message && (
          <p key={key} className={styles.toast}>
            {message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './AICreateModal.module.css';
import { generateCelebration } from '@/lib/services/aiCelebrationApi';

interface AICreateModalProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function AICreateModal({ onClose, onSuccess }: AICreateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track state for generating variants
  const [variantIndex, setVariantIndex] = useState(1);
  const [previousMessages, setPreviousMessages] = useState<string[]>([]);
  const [lastGeneratedData, setLastGeneratedData] = useState<any | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto focus the input when modal opens
    inputRef.current?.focus();
  }, []);

  const handleGenerate = async (isRetry: boolean = false) => {
    if (!prompt.trim() && !isRetry) return;
    
    setLoading(true);
    setError(null);

    const currentVariant = isRetry ? variantIndex + 1 : 1;
    
    try {
      const data = await generateCelebration(prompt, currentVariant, previousMessages);
      
      setLastGeneratedData(data);
      if (data.custom_message) {
        setPreviousMessages(prev => [...prev, data.custom_message]);
      }
      setVariantIndex(currentVariant);
      
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>✨ AI Celebration Magic</h2>
            <p className={styles.subtitle}>Describe the occasion, and let AI do the rest.</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Crafting the perfect celebration...</p>
            </div>
          ) : (
            <>
              {error && <div className={styles.error}>{error}</div>}
              <textarea
                ref={inputRef}
                className={styles.textarea}
                placeholder="e.g., Create a celebration for my brother Rahul's 12th birthday. He loves vanilla cake and the color blue."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </>
          )}
        </div>

        <div className={styles.footer}>
          {!loading && (
            <>
              {lastGeneratedData ? (
                <>
                  <button className="btn btn--ghost" onClick={() => handleGenerate(true)}>
                    Generate Another Version 🔄
                  </button>
                  <button className="btn btn--primary" onClick={() => onSuccess(lastGeneratedData)}>
                    Use This Version
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn--ghost" onClick={onClose}>
                    Cancel
                  </button>
                  <button 
                    className="btn btn--primary" 
                    onClick={() => handleGenerate(false)}
                    disabled={!prompt.trim()}
                  >
                    Generate ✨
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

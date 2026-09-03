'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './HomeAIChatbox.module.css';
import { generateCelebration, checkHealth } from '@/lib/services/aiCelebrationApi';

export function HomeAIChatbox() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'waking' | 'retrying' | 'awake' | 'sleeping'>('waking');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 12; // 12 retries * 10s = 2 minutes (Render cold start)

    async function pollHealth() {
      const isUp = await checkHealth();
      if (!mounted) return;

      if (isUp) {
        setAgentStatus('awake');
      } else {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setAgentStatus('retrying');
          setTimeout(pollHealth, 10000); // Check every 10 seconds
        } else {
          setAgentStatus('sleeping');
        }
      }
    }

    pollHealth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = await generateCelebration(prompt);
      
      // Save to local storage so the create wizard can pick it up
      localStorage.setItem('ai_draft_celebration', JSON.stringify({ data, prompt }));
      
      // Navigate to create page with draft flag
      router.push('/create?draft=true');
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (agentStatus === 'waking') {
    return (
      <div className={styles.chatboxContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} style={{ width: 24, height: 24 }} />
          <p className={styles.loadingText}>Waking up Agent Durgaa...</p>
        </div>
      </div>
    );
  }

  if (agentStatus === 'retrying') {
    return (
      <div className={styles.chatboxContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} style={{ width: 24, height: 24 }} />
          <p className={styles.loadingText}>
            ☕ Agent Durgaa is waking up from her nap and brewing some coffee! She will be right with you... 
          </p>
          <Link href="/create" className={styles.manualLink} style={{ marginTop: '1rem' }}>
            Create Celebration Manually ✨
          </Link>
        </div>
      </div>
    );
  }

  if (agentStatus === 'sleeping') {
    return (
      <div className={styles.chatboxContainer}>
        <div className={styles.sleepingState}>
          <div className={styles.sleepingEmoji}>😴</div>
          <p className={styles.sleepingText}>Agent Durgaa is resting!</p>
          <p className={styles.sleepingSubtext}>
            She has been creating too many celebrations today and needs a quick nap. 
            Don't worry, you can still easily create yours manually!
          </p>
          <Link href="/create" className={styles.manualLink}>
            Create Celebration Manually ✨
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatboxContainer}>
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Agent Durgaa is crafting the perfect celebration...</p>
        </div>
      ) : (
        <div className={styles.inputWrapper}>
          <label className={styles.label}>
            Tell our agent <strong>Durgaa</strong> what you want to celebrate:
          </label>
          <textarea
            className={styles.textarea}
            placeholder="e.g., Create a celebration for my brother Rahul's 12th birthday. He loves vanilla cake."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          
          <div className={styles.controls}>
            <Link href="/create" className={styles.manualLink}>
              Create manually instead
            </Link>
            <button 
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={!prompt.trim()}
            >
              Auto-Generate ✨
            </button>
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
        </div>
      )}
    </div>
  );
}

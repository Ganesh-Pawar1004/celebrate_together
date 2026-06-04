'use client';

import { useRef, useState, useCallback } from 'react';
import { fadeIn, fadeOut } from '@/lib/music';
import styles from './MusicPlayer.module.css';

interface MusicPlayerProps {
  trackUrl: string;
  loop?: boolean;
}

export default function MusicPlayer({ trackUrl, loop = true }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);  // true after first user tap
  const [volume, setVolume] = useState(65);
  const [loadError, setLoadError] = useState(false);

  const initAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(trackUrl);
    audio.loop = loop;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.onerror = () => setLoadError(true);
    audioRef.current = audio;
    return audio;
  }, [trackUrl, loop]);

  const handlePlay = useCallback(() => {
    const audio = initAudio();
    audio.play()
      .then(() => {
        fadeIn(audio, volume / 100, 2000);
        setPlaying(true);
        setStarted(true);
      })
      .catch((err) => {
        console.warn('Audio play failed:', err);
      });
  }, [initAudio, volume]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeOut(audio, 600);
    setPlaying(false);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current && playing) audioRef.current.volume = v / 100;
  }, [playing]);

  if (!trackUrl || loadError) return null;

  // ── Before first tap: show big prominent CTA ──
  if (!started) {
    return (
      <button
        type="button"
        className={styles.tapToPlay}
        onClick={handlePlay}
        aria-label="Play background music"
      >
        <span className={styles.tapIcon} aria-hidden="true">🎵</span>
        <span className={styles.tapText}>Play Music</span>
      </button>
    );
  }

  // ── After first tap: compact floating player ──
  return (
    <div className={styles.player} role="region" aria-label="Music player">
      <button
        type="button"
        className={`${styles.playBtn} ${playing ? styles.playing : ''}`}
        onClick={playing ? handlePause : handlePlay}
        aria-label={playing ? 'Pause music' : 'Resume music'}
      >
        <span aria-hidden="true">{playing ? '⏸' : '▶️'}</span>
      </button>

      <span className={`${styles.note} ${playing ? styles.noteAnimating : ''}`} aria-hidden="true">
        🎵
      </span>

      <label className={styles.volumeLabel} htmlFor="music-volume">
        <span className="sr-only">Volume</span>
        <input
          id="music-volume"
          type="range"
          className={styles.volumeSlider}
          min={0}
          max={100}
          value={volume}
          onChange={handleVolume}
          aria-label="Music volume"
        />
      </label>
    </div>
  );
}

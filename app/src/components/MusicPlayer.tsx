'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { fadeIn, fadeOut } from '@/lib/music';
import { Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import styles from './MusicPlayer.module.css';

interface MusicPlayerProps {
  trackUrl: string;
  loop?: boolean;
  forcePlay?: boolean;
}

export default function MusicPlayer({ trackUrl, loop = true, forcePlay = false }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);  // true after first user tap
  const [volume, setVolume] = useState(35);
  const [muted, setMuted] = useState(false);
  const preMuteVolumeRef = useRef(35);
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
    const targetVolume = muted ? 0 : volume / 100;
    audio.play()
      .then(() => {
        fadeIn(audio, targetVolume, 2000);
        setPlaying(true);
        setStarted(true);
      })
      .catch((err) => {
        console.warn('Audio play failed:', err);
      });
  }, [initAudio, volume, muted]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeOut(audio, 600);
    setPlaying(false);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (v > 0) {
      setMuted(false);
    } else {
      setMuted(true);
    }
    const audio = audioRef.current;
    if (audio && playing) {
      audio.volume = v / 100;
    }
  }, [playing]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (muted) {
      // Unmute
      const prevVolume = preMuteVolumeRef.current || 35;
      audio.volume = prevVolume / 100;
      setVolume(prevVolume);
      setMuted(false);
    } else {
      // Mute
      preMuteVolumeRef.current = volume > 0 ? volume : 35;
      audio.volume = 0;
      setVolume(0);
      setMuted(true);
    }
  }, [muted, volume]);

  // Handle gesture autoplay via forcePlay prop
  useEffect(() => {
    if (forcePlay && !started && !playing) {
      const timer = setTimeout(() => {
        handlePlay();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [forcePlay, started, playing, handlePlay]);

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
        <span className={styles.tapIcon} aria-hidden="true">
          <Music size={18} style={{ color: '#ffffff' }} />
        </span>
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
        {playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />}
      </button>

      <button
        type="button"
        className={styles.muteBtn}
        onClick={toggleMute}
        aria-label={muted ? 'Unmute music' : 'Mute music'}
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

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

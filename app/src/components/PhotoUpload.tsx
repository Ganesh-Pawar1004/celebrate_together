'use client';

import { useRef, useState, useCallback } from 'react';
import styles from './PhotoUpload.module.css';

interface PhotoUploadProps {
  value: string | null;          // base64 string or URL
  onChange: (value: string | null) => void;
  maxSizeKB?: number;            // default 800 KB
}

export default function PhotoUpload({ value, onChange, maxSizeKB = 800 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback(async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF, WebP).');
      return;
    }

    if (file.size > maxSizeKB * 1024) {
      setError(`Image is too large. Please choose one under ${maxSizeKB} KB.`);
      return;
    }

    // Resize to max 1200px wide using a canvas before base64 encoding
    const bitmap = await createImageBitmap(file);
    const maxW = 1200;
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const base64 = canvas.toDataURL('image/jpeg', 0.82);
    onChange(base64);
  }, [onChange, maxSizeKB]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={styles.wrapper}>
      {value ? (
        /* Preview */
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Your uploaded photo" className={styles.previewImg} />
          <div className={styles.previewOverlay}>
            <button
              type="button"
              className={`btn btn--ghost btn--sm ${styles.changeBtn}`}
              onClick={() => inputRef.current?.click()}
            >
              🔄 Change
            </button>
            <button
              type="button"
              className={`btn btn--ghost btn--sm ${styles.removeBtn}`}
              onClick={handleRemove}
              aria-label="Remove photo"
            >
              🗑 Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-label="Upload a photo"
        >
          <span className={styles.dropIcon} aria-hidden="true">📸</span>
          <span className={styles.dropMain}>
            {dragging ? 'Drop it here!' : 'Add a photo'}
          </span>
          <span className={styles.dropSub}>
            Drag & drop or click to browse · JPG, PNG, WebP · Max {maxSizeKB} KB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Choose photo file"
        tabIndex={-1}
      />

      {error && (
        <p className={styles.errorMsg} role="alert">{error}</p>
      )}
    </div>
  );
}

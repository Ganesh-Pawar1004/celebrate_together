# CelebrateTogether — Improvement Roadmap

---

## 🎵 Music — Full Plan

### Current State
Preset labels exist in the wizard but no audio actually plays.

### What to Build (Prioritised)

| Priority | Feature | Approach |
|---|---|---|
| ✅ Now | Royalty-free preset tracks | Host MP3s on a public CDN (Pixabay / Free Music Archive) |
| ✅ Now | Auto-play on reveal | HTML5 `<audio>` with fade-in via Web Audio API |
| 🔜 Soon | Per-occasion smart defaults | Birthday → upbeat, Anniversary → romantic, Baby shower → lullaby |
| 🔜 Soon | Volume fade-in animation | Ramp from 0→80% over 3 seconds on reveal |
| 💡 Later | YouTube link embed | Creator pastes a YouTube URL, plays in background |
| 💡 Later | Custom audio upload | Creator uploads MP3 (<5MB) stored in Supabase Storage |

### Royalty-Free Track Sources (Free, no attribution required)
- **Pixabay Music** — `pixabay.com/music` — CC0 license
- **Free Music Archive** — `freemusicarchive.org` — various CC licenses
- **ccMixter** — `ccmixter.org` — CC-licensed remixes
- **Zapsplat** — `zapsplat.com` — free tier with attribution

### Implementation Strategy
```
1. Download 5-6 short looping tracks (30-60 sec) per mood category
2. Host them in /public/music/ folder (no CDN dependency)
3. HTML5 <audio loop autoplay muted> — unmute on user gesture
4. Web Audio API GainNode: ramp volume 0 → 0.7 over 3 seconds on reveal
5. "Now Playing" subtle indicator with pause/volume control
```

---

## 📸 Photos — Full Plan

### Current State
`photo_url` field exists in the schema but upload UI is not built yet.

### What to Build (Prioritised)

| Priority | Feature | Approach |
|---|---|---|
| ✅ Now | Single photo upload | File input → base64 → localStorage (demo mode) |
| ✅ Now | Photo preview on reveal card | `<img>` with `object-fit: cover`, rounded corners |
| 🔜 Soon | Supabase Storage upload | `supabase.storage.from('photos').upload()` |
| 🔜 Soon | Photo crop/resize | Browser-side canvas crop before upload |
| 💡 Later | Photo slideshow (2-5 photos) | Auto-advancing carousel on reveal |
| 💡 Later | Short video message (<30s) | `<video autoplay>` on reveal, Supabase storage |
| 💡 Later | Themed background images | Unsplash API — pull a relevant image if no photo uploaded |
| 💡 Later | GIF support | GIPHY search integration |

### For Demo Mode (No Supabase)
Convert the uploaded photo to **base64** and store it inline in the localStorage event object. This works fine for photos under ~500KB.

### For Production (Supabase)
```typescript
const { data } = await supabase.storage
  .from('celebration-photos')
  .upload(`${slug}/${file.name}`, file, { upsert: true });
const url = supabase.storage.from('celebration-photos').getPublicUrl(data.path);
```

---

## 🌟 Other High-Impact Improvements

### 1. Email Delivery (Resend)
- Creator enters recipient's email → Resend sends a beautiful HTML email
- Email teaser: "You have a surprise! Don't open until [date] 🎁"
- No spoilers in the email — just the mystery link
- **Cost**: Resend free tier = 3,000 emails/month

### 2. Countdown Reveal Enhancement
- **Fireworks animation** using canvas at T=0 (not just confetti)
- **Sound effect** (bell chime / fanfare) on reveal
- **Typed text effect**: message appears word-by-word for dramatic impact
- **Full-screen photo** behind message with blur overlay

### 3. Sharing Improvements
- **QR Code**: generate a QR code for the celebration link (use `qrcode` npm package)
- **Instagram Stories card**: generate a shareable 9:16 card image
- **SMS share**: `sms:?body=You have a surprise...`

### 4. Security & Privacy
- **Password protect a celebration**: recipient must enter a word/name to unlock
- **One-time view mode**: link expires after first open
- **Creator notification**: email/push when recipient opens the surprise

### 5. Creator Dashboard Improvements
- Show reaction emoji(s) received from recipient
- "Re-send link" button copies fresh share message
- Celebration analytics: view count, open time, reaction

### 6. Accessibility & Mobile
- Haptic feedback on mobile (Vibration API) at reveal
- Full offline support via Service Worker (PWA)
- `prefers-reduced-motion` — disable heavy animations for accessibility

### 7. Supabase Setup (When Ready)
```
1. Create project at app.supabase.com
2. Run supabase-schema.sql in the SQL Editor
3. Add URL + anon key to .env.local
4. Restart the dev server
5. All localStorage data automatically stays on the device
   (new events will go to the DB from that point)
```

---

## Implementation Order (What I'll Build Next)

1. **🎵 Music playback** — royalty-free tracks, fade-in on reveal ← **doing now**
2. **📸 Photo upload** — base64 in demo mode, full reveal display ← **doing now**
3. **✍️ Typed message effect** — words appear one-by-one on reveal
4. **🔊 Sound effect** on countdown reaching zero
5. **📧 Email sharing** via Resend
6. **🔲 QR Code** generation for the share screen

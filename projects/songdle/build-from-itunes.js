#!/usr/bin/env node
/**
 * Build songs.json from songlist.txt using the iTunes Search API.
 * No credentials needed — iTunes previews are free 30-second clips.
 *
 * Run: node build-from-itunes.js
 */

const path = require('path');
const fs = require('fs');

const NOISE_WORDS = ['live', 'remix', 'version', 'edit', 'remaster', 'remastered', 'acoustic', 'sped up', 'slowed', 'karaoke', 'cover', 'instrumental', 'tribute'];

function cleanScore(trackName) {
  const lower = trackName.toLowerCase();
  for (const w of NOISE_WORDS) {
    if (lower.includes(w)) return -1;
  }
  return 0;
}

async function searchTrack(query) {
  const url =
    'https://itunes.apple.com/search?' +
    new URLSearchParams({ term: query, media: 'music', entity: 'song', limit: 10, country: 'US' });
  const res = await fetch(url);
  if (!res.ok) throw new Error('iTunes search failed: ' + res.status);
  const data = await res.json();
  const results = (data.results || []).filter((r) => r.previewUrl);
  if (results.length === 0) return null;
  // Prefer results that don't have "(Live)", "(Remix)", etc. in the title
  const sorted = results.slice().sort((a, b) => cleanScore(b.trackName) - cleanScore(a.trackName));
  const r = sorted[0];
  return {
    id: String(r.trackId),
    name: r.trackName,
    artist: r.artistName,
    preview_url: r.previewUrl,
  };
}

async function main() {
  const listPath = path.join(__dirname, 'songlist.txt');
  if (!fs.existsSync(listPath)) {
    console.error('songlist.txt not found');
    process.exit(1);
  }
  const lines = fs
    .readFileSync(listPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  console.log('Fetching', lines.length, 'tracks from iTunes...\n');
  const tracks = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const t = await searchTrack(lines[i]);
      if (t) {
        tracks.push(t);
        console.log('  ✓', t.artist, '–', t.name);
      } else {
        console.log('  ✗ No preview found:', lines[i]);
      }
    } catch (err) {
      console.error('  ✗ Error for "' + lines[i] + '":', err.message);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  const outPath = path.join(__dirname, 'songs.json');
  fs.writeFileSync(outPath, JSON.stringify(tracks, null, 2), 'utf8');
  console.log('\nWrote', tracks.length, 'tracks to songs.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

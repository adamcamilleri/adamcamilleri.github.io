#!/usr/bin/env node
/**
 * Build songs.json from songlist.txt using Spotify Search API (Client Credentials).
 * No OAuth/redirect needed - Search works with app-only auth.
 *
 * Run: node build-from-search.js
 * Requires: .env with SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
 */

const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').replace(/\r\n/g, '\n').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq > 0) process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  });
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env');
  process.exit(1);
}

async function getToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64') },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function searchTrack(token, query) {
  const url = 'https://api.spotify.com/v1/search?' + new URLSearchParams({ q: query, type: 'track', limit: 5, market: 'US' });
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('Search failed: ' + res.status + ' ' + (await res.text()));
  const data = await res.json();
  const items = data.tracks?.items || [];
  const t = items.find((x) => x.preview_url) || items[0];
  if (!t) return null;
  if (!t.preview_url) return null;
  return {
    id: t.id,
    name: t.name,
    artist: (t.artists || []).map((a) => a.name).join(', '),
    preview_url: t.preview_url,
  };
}

async function main() {
  const listPath = path.join(__dirname, 'songlist.txt');
  if (!fs.existsSync(listPath)) {
    console.error('Create songlist.txt with one "Artist - Song" per line');
    process.exit(1);
  }
  const lines = fs.readFileSync(listPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  console.log('Fetching', lines.length, 'tracks via Search API...');
  const token = await getToken();
  const tracks = [];
  for (let i = 0; i < lines.length; i++) {
    const t = await searchTrack(token, lines[i]);
    if (t) {
      tracks.push(t);
      console.log('  ✓', t.artist, '-', t.name);
    } else {
      console.log('  ✗ No preview:', lines[i]);
    }
    await new Promise((r) => setTimeout(r, 200)); // rate limit
  }
  const outPath = path.join(__dirname, 'songs.json');
  fs.writeFileSync(outPath, JSON.stringify(tracks, null, 2), 'utf8');
  console.log('\nWrote', tracks.length, 'tracks to songs.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

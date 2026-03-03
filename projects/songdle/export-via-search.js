#!/usr/bin/env node
/**
 * Export songs.json via OAuth + Search (no playlist fetch).
 * User token + Search returns preview_url more reliably than Client Credentials.
 *
 * Run: node export-via-search.js
 * 1. Open URL, log in with Spotify
 * 2. Script fetches each track from songlist.txt via Search, writes songs.json
 */

const http = require('http');
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
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
  process.exit(1);
}

async function exchangeCodeForToken(code) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function searchTrack(token, query) {
  const searchUrl = 'https://api.spotify.com/v1/search?' + new URLSearchParams({ q: query, type: 'track', limit: 3, market: 'US' });
  const res = await fetch(searchUrl, { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('Search failed: ' + res.status);
  const data = await res.json();
  const items = data.tracks?.items || [];
  for (const item of items) {
    const trackRes = await fetch('https://api.spotify.com/v1/tracks/' + item.id + '?market=US', { headers: { Authorization: 'Bearer ' + token } });
    if (!trackRes.ok) continue;
    const t = await trackRes.json();
    if (t.preview_url) {
      return { id: t.id, name: t.name, artist: (t.artists || []).map((a) => a.name).join(', '), preview_url: t.preview_url };
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

async function main() {
  const listPath = path.join(__dirname, 'songlist.txt');
  if (!fs.existsSync(listPath)) {
    console.error('Create songlist.txt with one "Artist - Song" per line');
    process.exit(1);
  }
  const lines = fs.readFileSync(listPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

  console.log('\n1. Open this URL in your browser:');
  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'user-read-email',
  });
  console.log(authUrl);
  console.log('\n2. Log in with Spotify. After redirect, script will Search for each track and build songs.json.\n');

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url || '', 'http://localhost');
    if (u.pathname !== '/callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const code = u.searchParams.get('code');
    if (!code) {
      res.writeHead(400);
      res.end('No code in URL');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Building songs.json... You can close this tab.</h1>');
    server.close();

    try {
      const token = await exchangeCodeForToken(code);
      console.log('Fetching', lines.length, 'tracks via Search (user token)...');
      const tracks = [];
      for (let i = 0; i < lines.length; i++) {
        const t = await searchTrack(token, lines[i]);
        if (t) {
          tracks.push(t);
          console.log('  ✓', t.artist, '-', t.name);
        } else {
          console.log('  ✗ No preview:', lines[i]);
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      const outPath = path.join(__dirname, 'songs.json');
      fs.writeFileSync(outPath, JSON.stringify(tracks, null, 2), 'utf8');
      console.log('\nWrote', tracks.length, 'tracks to songs.json');
    } catch (err) {
      console.error('Error:', err.message);
    }
    process.exit(0);
  });

  server.listen(8888, () => {
    console.log('Waiting for redirect on http://127.0.0.1:8888/callback ...\n');
  });
}

main().catch(console.error);

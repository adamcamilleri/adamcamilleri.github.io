#!/usr/bin/env node
/**
 * One-time script: export your Spotify playlist to songs.json
 * Run: node export-playlist.js
 * Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (and optionally SPOTIFY_PLAYLIST_ID) in env,
 * or create a .env file in this folder with those variables.
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// Load .env from this directory if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8').replace(/\r\n/g, '\n');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || '3gfy2hotH293aRlrb9Sbtm';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in env or .env file');
  process.exit(1);
}

const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = 'playlist-read-private playlist-read-collaborative user-read-email user-read-private';

function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

async function exchangeCodeForToken(code) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function fetchPlaylistTracks(token) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100&market=US`;
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const txt = await res.text();
    if (!res.ok) {
      console.error('Spotify response:', res.status, txt);
      throw new Error('Playlist fetch failed: ' + txt);
    }
    const data = JSON.parse(txt);
    for (const item of data.items || []) {
      const t = item.track;
      if (!t || t.type !== 'track' || !t.preview_url) continue;
      tracks.push({
        id: t.id,
        name: t.name,
        artist: (t.artists || []).map((a) => a.name).join(', '),
        preview_url: t.preview_url,
      });
    }
    url = data.next || null;
  }
  return tracks;
}

async function main() {
  const authUrl = getAuthUrl();
  console.log('\n1. Open this URL in your browser:');
  console.log(authUrl);
  console.log('\n2. Log in with Spotify and approve. You\'ll be redirected to 127.0.0.1.');
  console.log('   The script will capture the redirect and export your playlist.\n');

  const server = http.createServer(async (req, res) => {
    const { pathname, query } = url.parse(req.url, true);
    if (pathname !== '/callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const code = query.code;
    if (!code) {
      res.writeHead(400);
      res.end('No code in URL. Make sure you pasted the full redirect URL.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Success! You can close this tab.</h1>');
    server.close();

    try {
      const token = await exchangeCodeForToken(code);
      const tracks = await fetchPlaylistTracks(token);
      const fs = require('fs');
      const path = require('path');
      const outPath = path.join(__dirname, 'songs.json');
      fs.writeFileSync(outPath, JSON.stringify(tracks, null, 2), 'utf8');
      console.log(`\nExported ${tracks.length} tracks to songs.json`);
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

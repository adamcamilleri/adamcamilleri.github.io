/**
 * Removes still-broken entries and adds them with empty iTunes fields.
 * The Spotify enrich script will populate spotifyId, and since we'll update
 * the filter to accept preview_url || spotifyId, they'll be playable.
 */

const fs   = require('fs');
const path = require('path');
const SONGS_PATH = path.join(__dirname, 'songs.json');

// These keep matching wrong iTunes results — nuke and re-add without iTunes data
const BAD_NAMES = [
  { artist: 'Daniel Caesar',      name: 'Japanese Denim' },
  { artist: 'Lil Yachty',         name: '1 Night' },
  { artist: 'The Offspring',      name: "Why Don't You Get a Job?" },
  { artist: 'Tyler, The Creator', name: 'See You Again' },
  { artist: 'Tyler, The Creator', name: 'EARFQUAKE' },
  { artist: 'Tyler, The Creator', name: 'NEW MAGIC WAND' },
  { artist: 'Tyler, The Creator', name: 'ARE WE STILL FRIENDS?' },
];

// The correct entries (empty iTunes, spotifyId to be filled by enrich script)
const CLEAN_ADD = [
  { id: '', artist: 'Daniel Caesar',      name: 'Japanese Denim',         genre: 'other',    preview_url: '' },
  { id: '', artist: 'Lil Yachty',         name: '1 Night',                genre: 'hip-hop',  preview_url: '' },
  { id: '', artist: 'The Offspring',      name: "Why Don't You Get a Job?", genre: 'rock',   preview_url: '' },
  { id: '', artist: 'Tyler, The Creator', name: 'See You Again',           genre: 'hip-hop', preview_url: '' },
  { id: '', artist: 'Tyler, The Creator', name: 'EARFQUAKE',               genre: 'hip-hop', preview_url: '' },
  { id: '', artist: 'Tyler, The Creator', name: 'NEW MAGIC WAND',          genre: 'hip-hop', preview_url: '' },
  { id: '', artist: 'Tyler, The Creator', name: 'ARE WE STILL FRIENDS?',   genre: 'hip-hop', preview_url: '' },
];

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

let songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
console.log(`Loaded ${songs.length} songs.`);

// Remove all occurrences of bad entries (there may be duplicates from retries)
songs = songs.filter(s =>
  !BAD_NAMES.some(b => b.artist === s.artist && b.name === s.name)
);
console.log(`After removing bad entries: ${songs.length}`);

// Add clean versions (dedup check)
for (const entry of CLEAN_ADD) {
  const exists = songs.some(s => s.artist === entry.artist && s.name === entry.name);
  if (!exists) {
    songs.push(entry);
    console.log(`  + Added: ${entry.artist} – ${entry.name} (Spotify-only)`);
  }
}

fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
console.log(`\nTotal songs: ${songs.length}`);

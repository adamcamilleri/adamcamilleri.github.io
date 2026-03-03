/**
 * Removes bad iTunes matches and re-adds them with corrected lookup or
 * empty preview_url (Spotify will handle audio via the enrich script).
 */

const fs   = require('fs');
const path = require('path');
const SONGS_PATH = path.join(__dirname, 'songs.json');
const DELAY_MS   = 800;

// These were matched to wrong songs in retry-songs.js
const BAD = [
  { artist: 'Daniel Caesar', name: 'Japanese Denim' },  // matched Hold Me Down
  { artist: 'Lil Yachty',   name: '1 Night' },          // matched Broccoli
  { artist: 'The Offspring', name: "Why Don't You Get a Job?" }, // matched lullaby
  { artist: 'Tyler, The Creator', name: 'See You Again' },       // matched Miley Cyrus
  { artist: 'Tyler, The Creator', name: 'EARFQUAKE' },           // matched remix
  { artist: 'Tyler, The Creator', name: 'NEW MAGIC WAND' },      // matched lullaby
  { artist: 'Tyler, The Creator', name: 'ARE WE STILL FRIENDS?' }, // matched lullaby
];

// Re-add with precise iTunes searches (or no preview_url → Spotify fallback)
const REQUEUE = [
  { artist: 'Daniel Caesar', name: 'Japanese Denim', genre: 'other',
    searchQ: 'Japanese Denim Daniel Caesar Freudian' },
  { artist: 'Lil Yachty', name: '1 Night', genre: 'hip-hop',
    searchQ: '1 Night Lil Yachty 2018' },
  { artist: 'The Offspring', name: "Why Don't You Get a Job?", genre: 'rock',
    searchQ: "Why Don't You Get a Job The Offspring Americana" },
  { artist: 'Tyler, The Creator', name: 'See You Again', genre: 'hip-hop',
    searchQ: 'See You Again Tyler Creator Flower Boy' },
  { artist: 'Tyler, The Creator', name: 'EARFQUAKE', genre: 'hip-hop',
    searchQ: 'EARFQUAKE Tyler Creator IGOR' },
  { artist: 'Tyler, The Creator', name: 'NEW MAGIC WAND', genre: 'hip-hop',
    searchQ: 'NEW MAGIC WAND Tyler Creator IGOR' },
  { artist: 'Tyler, The Creator', name: 'ARE WE STILL FRIENDS?', genre: 'hip-hop',
    searchQ: 'ARE WE STILL FRIENDS Tyler Creator IGOR' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function searchITunes(q) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=10&country=us`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const items = (data.results || []).filter(i => i.kind === 'song');
    return items[0] || null;
  } catch (err) {
    process.stdout.write(`[${err.message}] `);
    return null;
  }
}

async function main() {
  let songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  console.log(`Loaded ${songs.length} songs.\n`);

  // Remove bad entries
  const before = songs.length;
  songs = songs.filter(s =>
    !BAD.some(b => b.artist === s.artist && b.name === s.name)
  );
  console.log(`Removed ${before - songs.length} bad matches. Now: ${songs.length}\n`);
  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));

  // Re-add with better searches
  let added = 0;
  for (const s of REQUEUE) {
    process.stdout.write(`  + ${s.artist} – ${s.name} ... `);
    const item = await searchITunes(s.searchQ);

    let entry;
    if (item) {
      const flag = item.previewUrl ? '' : ' ⚠ no iTunes preview';
      console.log(`✓  "${item.artistName} – ${item.trackName}"${flag}`);
      entry = { id: String(item.trackId), name: s.name, artist: s.artist,
                genre: s.genre, preview_url: item.previewUrl || '' };
    } else {
      // No iTunes match — add with empty preview_url; Spotify enrich will cover it
      console.log('no iTunes match — will rely on Spotify');
      entry = { id: '', name: s.name, artist: s.artist, genre: s.genre, preview_url: '' };
    }

    songs.push(entry);
    added++;
    fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\n✅  Done! Re-added ${added} entries. Total: ${songs.length}`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });

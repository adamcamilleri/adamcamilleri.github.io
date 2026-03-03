/**
 * Retries songs that failed in add-songs.js (rate limits + bad matches).
 * Run: node projects/songdle/retry-songs.js
 */

const fs   = require('fs');
const path = require('path');

const SONGS_PATH = path.join(__dirname, 'songs.json');
const DELAY_MS   = 800; // slower to avoid rate limits

const RETRY_SONGS = [
  // Bad matches from first run — better search terms
  { artist: 'Daniel Caesar', name: 'Japanese Denim', genre: 'other',
    searchArtist: 'Daniel Caesar', searchName: 'Japanese Denim Daniel Caesar' },
  { artist: 'J. Cole',       name: 'No Role Modelz', genre: 'hip-hop',
    searchArtist: 'J Cole',        searchName: 'No Role Modelz J Cole' },
  { artist: 'Lil Yachty',   name: '1 Night',         genre: 'hip-hop',
    searchArtist: 'Lil Yachty',    searchName: '1 Night Lil Yachty' },

  // Rate-limited in first run
  { artist: 'LINKIN PARK',  name: 'Faint',              genre: 'rock' },
  { artist: 'Migos',        name: 'Slide',               genre: 'hip-hop',
    searchArtist: 'Calvin Harris Frank Ocean Migos', searchName: 'Slide' },
  { artist: 'Prince & The Revolution', name: 'Raspberry Beret', genre: 'other',
    searchArtist: 'Prince Raspberry Beret' },
  { artist: 'Rihanna', name: 'We Found Love',    genre: 'other',
    searchArtist: 'Calvin Harris Rihanna We Found Love' },
  { artist: 'Rihanna', name: 'Love On The Brain', genre: 'other' },
  { artist: 'Sum 41',  name: 'Fat Lip',           genre: 'rock' },
  { artist: 'Taylor Swift', name: 'Lover',        genre: 'other' },
  { artist: 'Taylor Swift', name: 'Anti-Hero',    genre: 'other' },
  { artist: 'The Offspring', name: "Why Don't You Get a Job?", genre: 'rock',
    searchName: "Why Don't You Get a Job The Offspring" },
  { artist: 'The Weeknd', name: 'The Hills',       genre: 'other' },
  { artist: 'Third Eye Blind', name: 'Motorcycle Drive By', genre: 'rock' },
  { artist: 'Travis Scott', name: 'goosebumps',           genre: 'hip-hop' },
  { artist: 'Travis Scott', name: 'HIGHEST IN THE ROOM',  genre: 'hip-hop' },
  { artist: 'Tyler, The Creator', name: 'See You Again',        genre: 'hip-hop',
    searchArtist: 'Tyler The Creator Kali Uchis See You Again' },
  { artist: 'Tyler, The Creator', name: 'EARFQUAKE',             genre: 'hip-hop',
    searchArtist: 'Tyler The Creator EARFQUAKE' },
  { artist: 'Tyler, The Creator', name: 'After The Storm',       genre: 'hip-hop',
    searchArtist: 'Tyler The Creator After The Storm' },
  { artist: 'Tyler, The Creator', name: 'NEW MAGIC WAND',        genre: 'hip-hop',
    searchArtist: 'Tyler The Creator NEW MAGIC WAND' },
  { artist: 'Tyler, The Creator', name: 'ARE WE STILL FRIENDS?', genre: 'hip-hop',
    searchArtist: 'Tyler The Creator ARE WE STILL FRIENDS',
    searchName:   'ARE WE STILL FRIENDS' },
  { artist: 'USHER', name: "DJ Got Us Fallin' In Love", genre: 'other',
    searchArtist: 'USHER DJ Got Us Fallin In Love' },
  { artist: 'USHER', name: 'Without You', genre: 'other',
    searchArtist: 'David Guetta USHER Without You' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function alreadyExists(songs, artist, name) {
  const na = norm(artist), nn = norm(name);
  return songs.some(s => norm(s.artist) === na && norm(s.name) === nn);
}

async function searchITunes(searchArtist, searchName) {
  const q = encodeURIComponent(`${searchArtist} ${searchName}`);
  const url = `https://itunes.apple.com/search?term=${q}&entity=song&limit=10&country=us`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const items = (data.results || []).filter(i => i.kind === 'song');
    if (items.length === 0) return null;
    const sn = norm(searchName);
    for (const item of items) {
      if (norm(item.trackName || '').includes(sn) || sn.includes(norm(item.trackName || ''))) {
        return { id: String(item.trackId), preview_url: item.previewUrl || '',
                 matchedName: item.trackName, matchedArtist: item.artistName };
      }
    }
    return { id: String(items[0].trackId), preview_url: items[0].previewUrl || '',
             matchedName: items[0].trackName, matchedArtist: items[0].artistName };
  } catch (err) {
    process.stdout.write(`[${err.message}] `);
    return null;
  }
}

async function main() {
  let songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  console.log(`Loaded ${songs.length} songs. Retrying ${RETRY_SONGS.length} entries...\n`);

  let added = 0, skipped = 0, failed = 0;

  for (const s of RETRY_SONGS) {
    if (alreadyExists(songs, s.artist, s.name)) {
      console.log(`  ─ Skip (exists): ${s.artist} – ${s.name}`);
      skipped++;
      continue;
    }

    const sa = s.searchArtist || s.artist;
    const sn = s.searchName   || s.name;
    process.stdout.write(`  + ${s.artist} – ${s.name} ... `);

    const result = await searchITunes(sa, sn);

    if (!result) {
      console.log('NOT FOUND');
      failed++;
    } else {
      const flag = result.preview_url ? '' : ' ⚠ no iTunes preview';
      console.log(`✓  "${result.matchedArtist} – ${result.matchedName}"${flag}`);
      songs.push({
        id:          result.id,
        name:        s.name,
        artist:      s.artist,
        genre:       s.genre,
        preview_url: result.preview_url,
      });
      added++;
    }

    fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\n✅  Done! Added: ${added}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
  console.log(`   Total songs: ${songs.length}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

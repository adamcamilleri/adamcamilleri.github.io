/**
 * Fetches top songs from iTunes for each artist in the list below.
 * Saves results to songs-draft.json for review before committing to songs.json.
 *
 * Usage:  node projects/songdle/build-from-artists.js
 * Review: open projects/songdle/songs-draft.json
 * Apply:  copy projects/songdle/songs-draft.json to projects/songdle/songs.json
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Artist list with genre assignments ───────────────────────────────────────
const ARTISTS = [
  // Hip-Hop / R&B
  { name: 'Drake',            genre: 'hip-hop' },
  { name: 'Kendrick Lamar',   genre: 'hip-hop' },
  { name: 'Kanye West',       genre: 'hip-hop' },
  { name: 'Travis Scott',     genre: 'hip-hop' },
  { name: '21 Savage',        genre: 'hip-hop' },
  { name: 'J. Cole',          genre: 'hip-hop' },
  { name: 'Tyler the Creator',genre: 'hip-hop' },
  { name: 'Migos',            genre: 'hip-hop' },
  { name: 'Lil Yachty',       genre: 'hip-hop' },
  { name: 'Post Malone',      genre: 'hip-hop' },
  { name: 'The Weeknd',       genre: 'hip-hop' },
  { name: 'Daniel Caesar',    genre: 'hip-hop' },
  { name: 'Usher',            genre: 'hip-hop' },

  // Rock
  { name: 'Ozzy Osbourne',    genre: 'rock' },
  { name: 'Queen',            genre: 'rock' },
  { name: 'Offspring',        genre: 'rock' },
  { name: 'Avenged Sevenfold',genre: 'rock' },
  { name: 'Linkin Park',      genre: 'rock' },
  { name: 'Third Eye Blind',  genre: 'rock' },
  { name: 'Weezer',           genre: 'rock' },
  { name: 'Sum 41',           genre: 'rock' },
  { name: 'Lit',              genre: 'rock' },
  { name: 'Prince',           genre: 'rock' },

  // Pop / Other
  { name: 'Taylor Swift',     genre: 'other' },
  { name: 'Coldplay',         genre: 'other' },
  { name: 'Adele',            genre: 'other' },
  { name: 'Lady Gaga',        genre: 'other' },
  { name: 'Rihanna',          genre: 'other' },
  { name: 'Katy Perry',       genre: 'other' },
  { name: 'Bruno Mars',       genre: 'other' },
  { name: 'Ed Sheeran',       genre: 'other' },
  { name: 'Frank Sinatra',    genre: 'other' },
  { name: 'Jason Mraz',       genre: 'other' },
  { name: 'Sam Smith',        genre: 'other' },
  { name: 'John Legend',      genre: 'other' },
  { name: 'One Direction',    genre: 'other' },
  { name: 'Billie Eilish',    genre: 'other' },
  { name: 'fun.',             genre: 'other' },
];

const LIMIT_PER_ARTIST = 20;  // fetch 20, take top 5 with previews
const SONGS_PER_ARTIST = 5;  // only keep the 5 most popular per artist
const DELAY_MS = 3000;        // 3 seconds between requests to avoid rate limiting
const OUT_PATH = path.join(__dirname, 'songs-draft.json');

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Songdle-Builder/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

function normalizeName(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const all  = [];
  const seen = new Set(); // track by trackId to avoid duplicates

  for (let i = 0; i < ARTISTS.length; i++) {
    const artist = ARTISTS[i];
    const query  = encodeURIComponent(artist.name);
    const url    = `https://itunes.apple.com/search?term=${query}&entity=song&attribute=artistTerm&limit=${LIMIT_PER_ARTIST}&country=us`;

    process.stdout.write(`[${i + 1}/${ARTISTS.length}] ${artist.name} ... `);

    try {
      const data  = await fetchJson(url);
      const songs = (data.results || []).filter(s => {
        if (!s.previewUrl || !s.trackName || !s.artistName) return false;
        if (seen.has(s.trackId)) return false;
        // Loose artist match — skip songs that are clearly by a different artist
        const queryNorm  = normalizeName(artist.name);
        const resultNorm = normalizeName(s.artistName);
        if (!resultNorm.includes(queryNorm) && !queryNorm.includes(resultNorm)) return false;
        seen.add(s.trackId);
        return true;
      }).slice(0, SONGS_PER_ARTIST).map(s => ({
        id:          String(s.trackId),
        name:        s.trackName,
        artist:      s.artistName,
        genre:       artist.genre,
        preview_url: s.previewUrl,
      }));

      console.log(`${songs.length} songs`);
      all.push(...songs);
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
    }

    if (i < ARTISTS.length - 1) await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), 'utf8');

  console.log('\n─────────────────────────────────────────');
  console.log(`Done! ${all.length} songs saved to songs-draft.json`);
  console.log('');
  console.log('Review the file, then to apply run:');
  console.log('  copy "projects\\songdle\\songs-draft.json" "projects\\songdle\\songs.json"');
  console.log('─────────────────────────────────────────');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

/**
 * Batch-adds new songs to songs.json by looking up iTunes Search API.
 * Skips songs already present (fuzzy-matched). Removes exact duplicates.
 * Run: node projects/songdle/add-songs.js
 */

const fs   = require('fs');
const path = require('path');

const SONGS_PATH = path.join(__dirname, 'songs.json');
const DELAY_MS   = 400;

// ── New songs to add ──────────────────────────────────────────────────────────
// searchArtist / searchName override the iTunes query when the stored artist
// differs from the primary iTunes artist (e.g. feature tracks).
const NEW_SONGS = [
  // Avenged Sevenfold
  { artist: 'Avenged Sevenfold', name: 'Nightmare',               genre: 'rock' },
  { artist: 'Avenged Sevenfold', name: 'A Little Piece of Heaven', genre: 'rock' },

  // Billie Eilish
  { artist: 'Billie Eilish', name: 'bad guy',               genre: 'other' },
  { artist: 'Billie Eilish', name: "when the party's over", genre: 'other' },

  // Bruno Mars
  { artist: 'Bruno Mars', name: 'Just the Way You Are',  genre: 'other' },
  { artist: 'Bruno Mars', name: 'Locked Out of Heaven',  genre: 'other' },
  { artist: 'Bruno Mars', name: 'When I Was Your Man',   genre: 'other' },
  { artist: 'Bruno Mars', name: "That's What I Like",    genre: 'other' },

  // Coldplay
  { artist: 'Coldplay', name: 'Something Just Like This', genre: 'rock',
    searchArtist: 'The Chainsmokers Coldplay' },

  // Daniel Caesar
  { artist: 'Daniel Caesar', name: 'Japanese Denim', genre: 'other' },
  { artist: 'Daniel Caesar', name: 'Always',          genre: 'other' },

  // Drake
  { artist: 'Drake', name: "God's Plan",          genre: 'hip-hop' },
  { artist: 'Drake', name: 'Passionfruit',         genre: 'hip-hop' },
  { artist: 'Drake', name: 'Work (feat. Rihanna)', genre: 'hip-hop',
    searchArtist: 'Drake Rihanna', searchName: 'Work' },

  // Ed Sheeran
  { artist: 'Ed Sheeran', name: "I Don't Care", genre: 'other',
    searchArtist: 'Ed Sheeran Justin Bieber' },

  // Frank Sinatra
  { artist: 'Frank Sinatra', name: "Let It Snow! Let It Snow! Let It Snow!", genre: 'other',
    searchName: 'Let It Snow' },
  { artist: 'Frank Sinatra', name: "Somethin' Stupid", genre: 'other' },

  // fun.
  { artist: 'Fun.', name: 'Some Nights',          genre: 'rock' },
  { artist: 'Fun.', name: "C'mon",                genre: 'rock' },
  { artist: 'Fun.', name: 'Why Am I the One',     genre: 'rock' },

  // J. Cole
  { artist: 'J. Cole', name: 'No Role Modelz', genre: 'hip-hop' },
  { artist: 'J. Cole', name: 'MIDDLE CHILD',   genre: 'hip-hop' },
  { artist: 'J. Cole', name: 'Work Out',        genre: 'hip-hop' },
  { artist: 'J. Cole', name: 'Power Trip',      genre: 'hip-hop',
    searchArtist: 'J Cole Miguel' },

  // Jason Mraz
  { artist: 'Jason Mraz', name: '93 Million Miles', genre: 'other' },

  // John Legend
  { artist: 'John Legend', name: 'Beauty and the Beast', genre: 'other',
    searchArtist: 'John Legend Ariana Grande' },

  // Kanye West
  { artist: 'Jay-Z & Kanye West', name: "Ni**as In Paris",  genre: 'hip-hop',
    searchArtist: 'Jay-Z Kanye West', searchName: 'Niggas In Paris' },
  { artist: 'Kanye West',         name: 'Stronger',          genre: 'hip-hop' },
  { artist: 'Kanye West',         name: 'Flashing Lights',   genre: 'hip-hop' },

  // Katy Perry
  { artist: 'Katy Perry', name: 'Firework',             genre: 'other' },
  { artist: 'Katy Perry', name: 'The One That Got Away', genre: 'other' },

  // Kendrick Lamar
  { artist: 'Kendrick Lamar', name: 'HUMBLE.',     genre: 'hip-hop',
    searchName: 'HUMBLE' },
  { artist: 'Kendrick Lamar', name: 'All The Stars', genre: 'hip-hop',
    searchArtist: 'Kendrick Lamar SZA' },
  { artist: 'Kendrick Lamar', name: 'Money Trees',  genre: 'hip-hop' },

  // Lady Gaga
  { artist: 'Lady Gaga', name: 'Poker Face',  genre: 'other' },
  { artist: 'Lady Gaga', name: 'Bad Romance', genre: 'other' },

  // Lil Yachty
  { artist: 'Lil Yachty', name: 'One Night', genre: 'hip-hop' },
  { artist: 'Lil Yachty', name: 'iSpy',      genre: 'hip-hop',
    searchArtist: 'Kyle Lil Yachty', searchName: 'iSpy' },
  { artist: 'Lil Yachty', name: 'Broccoli',  genre: 'hip-hop',
    searchArtist: 'DRAM Lil Yachty', searchName: 'Broccoli' },

  // Linkin Park
  { artist: 'LINKIN PARK', name: 'Faint', genre: 'rock' },

  // Migos
  { artist: 'Migos', name: 'Slide', genre: 'hip-hop',
    searchArtist: 'Calvin Harris Frank Ocean Migos', searchName: 'Slide' },

  // 21 Savage
  { artist: '21 Savage', name: 'a lot',        genre: 'hip-hop',
    searchArtist: 'J Cole 21 Savage', searchName: 'a lot' },
  { artist: '21 Savage', name: "Creepin'",     genre: 'hip-hop',
    searchArtist: 'Metro Boomin The Weeknd 21 Savage', searchName: "Creepin'" },
  { artist: '21 Savage', name: 'Jimmy Cooks',  genre: 'hip-hop',
    searchArtist: 'Drake 21 Savage', searchName: 'Jimmy Cooks' },

  // One Direction
  { artist: 'One Direction', name: 'Drag Me Down', genre: 'other' },
  { artist: 'One Direction', name: 'Perfect',       genre: 'other' },

  // Ozzy Osbourne
  { artist: 'Ozzy Osbourne', name: 'Take What You Want', genre: 'rock',
    searchArtist: 'Ozzy Osbourne Post Malone Travis Scott' },
  { artist: 'Ozzy Osbourne', name: 'Bark at the Moon',   genre: 'rock' },

  // Post Malone
  { artist: 'Post Malone', name: 'rockstar',      genre: 'hip-hop',
    searchArtist: 'Post Malone 21 Savage' },
  { artist: 'Post Malone', name: 'Congratulations', genre: 'hip-hop' },
  { artist: 'Post Malone', name: 'Better Now',      genre: 'hip-hop' },

  // Prince
  { artist: 'Prince & The Revolution', name: 'Raspberry Beret', genre: 'other',
    searchArtist: 'Prince' },
  { artist: 'Prince & The Revolution', name: "Let's Go Crazy",  genre: 'other',
    searchArtist: 'Prince' },

  // Queen
  { artist: 'Queen', name: 'Under Pressure', genre: 'rock' },

  // Rihanna
  { artist: 'Rihanna', name: 'We Found Love',             genre: 'other',
    searchArtist: 'Calvin Harris Rihanna' },
  { artist: 'Rihanna', name: 'This Is What You Came For', genre: 'other',
    searchArtist: 'Calvin Harris Rihanna' },
  { artist: 'Rihanna', name: 'Love The Way You Lie',      genre: 'other',
    searchArtist: 'Eminem Rihanna' },
  { artist: 'Rihanna', name: 'Love On The Brain',         genre: 'other' },

  // Sam Smith
  { artist: 'Sam Smith', name: 'Dancing With A Stranger', genre: 'other',
    searchArtist: 'Sam Smith Normani' },

  // Sum 41
  { artist: 'Sum 41', name: 'Fat Lip',      genre: 'rock' },
  { artist: 'Sum 41', name: 'Still Waiting', genre: 'rock' },
  { artist: 'Sum 41', name: 'The Hell Song', genre: 'rock' },

  // Taylor Swift
  { artist: 'Taylor Swift', name: 'Lover',                       genre: 'other' },
  { artist: 'Taylor Swift', name: 'Anti-Hero',                   genre: 'other' },
  { artist: 'Taylor Swift', name: "I Don't Wanna Live Forever", genre: 'other',
    searchArtist: 'Taylor Swift ZAYN' },

  // The Offspring
  { artist: 'The Offspring', name: "You're Gonna Go Far, Kid", genre: 'rock',
    searchName: "You're Gonna Go Far Kid" },
  { artist: 'The Offspring', name: "Why Don't You Get a Job?", genre: 'rock',
    searchName: "Why Don't You Get a Job" },

  // The Weeknd
  { artist: 'The Weeknd', name: 'Starboy',        genre: 'other' },
  { artist: 'The Weeknd', name: 'The Hills',      genre: 'other' },
  { artist: 'The Weeknd', name: 'Save Your Tears', genre: 'other' },

  // Third Eye Blind
  { artist: 'Third Eye Blind', name: 'Motorcycle Drive By', genre: 'rock' },

  // Travis Scott
  { artist: 'Travis Scott', name: 'goosebumps',        genre: 'hip-hop' },
  { artist: 'Travis Scott', name: 'HIGHEST IN THE ROOM', genre: 'hip-hop' },

  // Tyler, The Creator
  { artist: 'Tyler, The Creator', name: 'See You Again',        genre: 'hip-hop',
    searchArtist: 'Tyler The Creator Kali Uchis' },
  { artist: 'Tyler, The Creator', name: 'EARFQUAKE',             genre: 'hip-hop',
    searchArtist: 'Tyler The Creator' },
  { artist: 'Tyler, The Creator', name: 'After The Storm',       genre: 'hip-hop',
    searchArtist: 'Tyler The Creator Kali Uchis' },
  { artist: 'Tyler, The Creator', name: 'NEW MAGIC WAND',        genre: 'hip-hop',
    searchArtist: 'Tyler The Creator' },
  { artist: 'Tyler, The Creator', name: 'ARE WE STILL FRIENDS?', genre: 'hip-hop',
    searchArtist: 'Tyler The Creator', searchName: 'ARE WE STILL FRIENDS' },

  // USHER
  { artist: 'USHER', name: "DJ Got Us Fallin' In Love", genre: 'other',
    searchArtist: 'Pitbull USHER', searchName: "DJ Got Us Fallin In Love" },
  { artist: 'USHER', name: 'Without You', genre: 'other',
    searchArtist: 'David Guetta USHER', searchName: 'Without You' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function looslyMatches(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // word-level overlap (≥2 words match)
  const wa = na.split(' ').filter(w => w.length > 3);
  const wb = nb.split(' ').filter(w => w.length > 3);
  const shared = wa.filter(w => wb.includes(w));
  return shared.length >= 2;
}

function alreadyExists(songs, artist, name) {
  return songs.some(s =>
    looslyMatches(s.artist, artist) && looslyMatches(s.name, name)
  );
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
    // Prefer exact name match
    for (const item of items) {
      if (norm(item.trackName || '').includes(sn) || sn.includes(norm(item.trackName || ''))) {
        return {
          id: String(item.trackId),
          preview_url: item.previewUrl || '',
          matchedName: item.trackName,
          matchedArtist: item.artistName,
        };
      }
    }
    // Fallback: first result
    return {
      id: String(items[0].trackId),
      preview_url: items[0].previewUrl || '',
      matchedName: items[0].trackName,
      matchedArtist: items[0].artistName,
    };
  } catch (err) {
    process.stdout.write(`[iTunes error: ${err.message}] `);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  let songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  console.log(`Loaded ${songs.length} songs.\n`);

  // Step 1: Remove exact/near duplicates
  const seen = new Set();
  const deduped = [];
  for (const song of songs) {
    const key = norm(song.artist) + '||' + norm(song.name);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(song);
    } else {
      console.log(`  ✂ Removed duplicate: ${song.artist} – ${song.name}`);
    }
  }
  songs = deduped;
  console.log(`After dedup: ${songs.length} songs.\n`);

  // Step 2: Add new songs
  let added = 0, skipped = 0, noPreview = 0, notFound = 0;

  for (const s of NEW_SONGS) {
    if (alreadyExists(songs, s.artist, s.name)) {
      console.log(`  ─ Skip (exists): ${s.artist} – ${s.name}`);
      skipped++;
      continue;
    }

    const sa = s.searchArtist || s.artist;
    const sn = s.searchName  || s.name;
    process.stdout.write(`  + ${s.artist} – ${s.name} ... `);

    const result = await searchITunes(sa, sn);

    if (!result) {
      console.log('NOT FOUND');
      notFound++;
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
      if (!result.preview_url) noPreview++;
      added++;
    }

    fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\n✅  Done!`);
  console.log(`   Added: ${added}  |  Skipped (already had): ${skipped}  |  No iTunes preview: ${noPreview}  |  Not found: ${notFound}`);
  console.log(`   Total songs: ${songs.length}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

/**
 * enrich-youtube.js
 * Matches each song in songs.json to a YouTube video ID.
 * startOffset is always 0 — we want songs to start from the very beginning.
 *
 * Usage:
 *   node enrich-youtube.js          — process all songs missing youtubeId
 *   node enrich-youtube.js --dry    — print matches without writing to songs.json
 *   node enrich-youtube.js --limit 90  — process at most N songs (quota management)
 *
 * Outputs:
 *   songs.json         — updated with youtubeId + startOffset for accepted songs
 *   youtube-review.txt — flagged songs that need manual review
 *
 * Quota note: each song costs ~101 units (100 for search + 1 for video details).
 * The free YouTube Data API quota is 10,000 units/day → ~99 songs max per run.
 * Use --limit 90 to stay safely under quota.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SONGS_PATH = path.join(__dirname, 'songs.json');
const REVIEW_PATH = path.join(__dirname, 'youtube-review.txt');
const DRY_RUN = process.argv.includes('--dry');

// Parse --limit N argument (default: process all)
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

// Keywords that suggest wrong version — use word-boundary style checks to avoid
// false positives like "Don Toliver" (contains "live") or "visualizer" etc.
// These are checked as whole words / standalone tokens.
const BAD_KEYWORDS = ['cover', 'remix', 'karaoke', 'reaction', 'tribute', 'instrumental', 'acoustic', 'mashup', 'nightcore'];
// "live" checked separately with word boundary to avoid "Toliver", "live." in URLs, etc.
const LIVE_RE = /\blive\b/i;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

/** Parse ISO 8601 duration string (e.g. PT3M45S) to seconds */
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

/** Strip featured-artist notation so "(feat. X)" / "(ft. X)" / "(with X)" don't break matching */
function stripFeat(s) {
  return s.toLowerCase()
    .replace(/\s*[\(\[](feat\.?|ft\.?|with|&)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s+(feat\.?|ft\.?)\s+.*/i, '')
    .trim();
}

/** Score 0–1 how well a YouTube title matches the expected song + artist */
function titleMatchScore(videoTitle, songName, artist) {
  const t = videoTitle.toLowerCase();
  // Match against both the raw name and the feat-stripped name
  const name    = songName.toLowerCase();
  const nameCore = stripFeat(songName);
  const art     = artist.toLowerCase();
  // For multi-artist songs (e.g. "Drake" from "Drake & Rihanna"), check first artist
  const artCore = art.split(/[,&]/)[0].trim();
  let score = 0;
  if (t.includes(nameCore) || t.includes(name)) score += 0.5;
  if (t.includes(art) || t.includes(artCore)) score += 0.3;
  if (t.includes('official audio') || t.includes('audio only') || t.includes('lyrics')) score += 0.2;
  return Math.min(score, 1);
}

/** Search YouTube for a song, return top 3 results */
async function searchYouTube(name, artist) {
  const query = encodeURIComponent(`${name} ${artist} official audio`);
  // No videoCategoryId filter — some music isn't categorised as Music by YouTube
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJson(url);
  if (data.error) {
    const reason = data.error.errors && data.error.errors[0] && data.error.errors[0].reason;
    if (reason === 'quotaExceeded' || data.error.code === 403) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw new Error(`YouTube API error: ${data.error.message}`);
  }
  return data.items || [];
}

/** Fetch duration + channel info for a video ID */
async function getVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJson(url);
  return (data.items && data.items[0]) ? data.items[0] : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY missing from .env');
    process.exit(1);
  }

  const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  const pending = songs.filter(s => !s.youtubeId);
  const reviewLines = [];

  const batchSize = Math.min(pending.length, LIMIT);
  console.log(`Songs to process: ${batchSize} of ${pending.length} pending (${songs.length - pending.length} already done)`);
  if (LIMIT < pending.length) console.log(`Limit: ${LIMIT} per run — re-run tomorrow for remaining songs`);
  if (DRY_RUN) console.log('--- DRY RUN — no files will be written ---');
  console.log('');

  let accepted = 0;
  let flagged = 0;
  let i = 0;

  for (const song of pending.slice(0, batchSize)) {
    i++;
    process.stdout.write(`[${i}/${batchSize}] "${song.name}" - ${song.artist} ... `);

    try {
      // Search YouTube
      const results = await searchYouTube(song.name, song.artist);
      if (!results.length) {
        console.log('NO RESULTS');
        reviewLines.push(`NO RESULTS: "${song.name}" - ${song.artist}\n`);
        flagged++;
        continue;
      }

      const top = results[0];
      const videoId = top.id.videoId;
      const videoTitle = top.snippet.title;
      const channelTitle = top.snippet.channelTitle;

      // Get video duration
      const details = await getVideoDetails(videoId);
      const videoDuration = details ? parseDuration(details.contentDetails.duration) : null;

      // Evaluate flags
      const flags = [];
      const titleLower = videoTitle.toLowerCase();

      // Check bad keywords as whole words (avoids "Don Toliver" matching "live")
      BAD_KEYWORDS.forEach(kw => {
        const re = new RegExp('\\b' + kw + '\\b', 'i');
        if (re.test(titleLower)) flags.push(`title contains "${kw}"`);
      });
      if (LIVE_RE.test(titleLower)) flags.push('title contains "live"');

      const score = titleMatchScore(videoTitle, song.name, song.artist);
      if (score < 0.3) flags.push(`low title match (score: ${score.toFixed(2)})`);

      // Duration: only flag if mismatch >30% AND video is shorter (likely a clip/preview)
      if (videoDuration && videoDuration < 60) {
        flags.push(`very short video (${videoDuration}s) — likely a clip`);
      }

      if (flags.length > 0) {
        console.log('FLAGGED');
        reviewLines.push(`⚠  FLAGGED: "${song.name}" - ${song.artist}`);
        reviewLines.push(`   Video  : "${videoTitle}" by ${channelTitle}`);
        reviewLines.push(`   URL    : https://youtube.com/watch?v=${videoId}`);
        flags.forEach(f => reviewLines.push(`   ! ${f}`));
        reviewLines.push('');
        flagged++;
        continue;
      }

      // Accepted — start 2 seconds in to skip typical YouTube leading silence
      if (!DRY_RUN) {
        song.youtubeId = videoId;
        song.startOffset = 2;
        // Save progress after each accepted song so we can resume if interrupted
        fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
      }

      console.log(`✓  "${videoTitle}" by ${channelTitle}`);
      accepted++;

    } catch (e) {
      if (e.message === 'QUOTA_EXCEEDED') {
        console.log('\nYouTube API quota exceeded for today. Re-run tomorrow.');
        console.log(`Progress: ${accepted} accepted, ${flagged} flagged before quota hit.\n`);
        break;
      }
      console.log(`ERROR: ${e.message}`);
      reviewLines.push(`ERROR: "${song.name}" - ${song.artist}: ${e.message}\n`);
      flagged++;
    }

    // Respect YouTube API rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  // Write review file
  if (reviewLines.length > 0 && !DRY_RUN) {
    fs.writeFileSync(REVIEW_PATH, reviewLines.join('\n'));
  }

  console.log(`\n── Summary ──────────────────────────`);
  console.log(`Accepted : ${accepted}`);
  console.log(`Flagged  : ${flagged}`);
  if (flagged > 0 && !DRY_RUN) console.log(`Review   : ${REVIEW_PATH}`);
  if (pending.length > batchSize) {
    console.log(`Remaining: ${pending.length - batchSize} songs — run again tomorrow`);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

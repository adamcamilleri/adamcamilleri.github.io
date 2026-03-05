/**
 * enrich-youtube.js
 * Matches each song in songs.json to a YouTube video ID and scans for startOffset.
 *
 * Usage:
 *   node enrich-youtube.js          — process all songs missing youtubeId
 *   node enrich-youtube.js --dry    — print matches without writing to songs.json
 *
 * Outputs:
 *   songs.json         — updated with youtubeId + startOffset for accepted songs
 *   youtube-review.txt — flagged songs that need manual review
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SONGS_PATH = path.join(__dirname, 'songs.json');
const REVIEW_PATH = path.join(__dirname, 'youtube-review.txt');
const TEMP_DIR = path.join(__dirname, 'temp-audio');
const DRY_RUN = process.argv.includes('--dry');

// Parse --limit N argument (default: process all)
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

// Full paths to tools (winget installs don't update bash PATH until shell restart)
const WINGET_BASE = '/c/Users/adamc/AppData/Local/Microsoft/WinGet/Packages';
const YTDLP_PATH  = `${WINGET_BASE}/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe`;
const DENO_PATH   = `${WINGET_BASE}/DenoLand.Deno_Microsoft.Winget.Source_8wekyb3d8bbwe/deno.exe`;
const FFMPEG_DIR  = `${WINGET_BASE}/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-N-123074-g4e32fb4c2a-win64-gpl/bin`;
const FFMPEG_PATH = `${FFMPEG_DIR}/ffmpeg.exe`;

// Keywords that suggest wrong version (cover, live, etc.)
const BAD_KEYWORDS = ['cover', 'live', 'remix', 'karaoke', 'reaction', 'tribute', 'instrumental', 'acoustic', 'mashup', 'nightcore'];

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

/** Score 0–1 how well a YouTube title matches the expected song + artist */
function titleMatchScore(videoTitle, songName, artist) {
  const t = videoTitle.toLowerCase();
  const name = songName.toLowerCase();
  const art = artist.toLowerCase();
  let score = 0;
  if (t.includes(name)) score += 0.5;
  if (t.includes(art)) score += 0.3;
  if (t.includes('official audio') || t.includes('audio only') || t.includes('lyrics')) score += 0.2;
  return Math.min(score, 1);
}

/** Get expected duration (seconds) for a song from iTunes API — no auth required */
async function getItunesDuration(itunesId) {
  try {
    const data = await fetchJson(`https://itunes.apple.com/lookup?id=${itunesId}`);
    if (data.results && data.results[0] && data.results[0].trackTimeMillis) {
      return Math.round(data.results[0].trackTimeMillis / 1000);
    }
  } catch (e) { /* ignore */ }
  return null;
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

/** Download first 35 seconds of a YouTube video as MP3 to outputPath */
function downloadAudioClip(videoId, outputPath) {
  const result = spawnSync(YTDLP_PATH, [
    `https://www.youtube.com/watch?v=${videoId}`,
    '--js-runtimes', `deno:${DENO_PATH}`,
    '--ffmpeg-location', FFMPEG_DIR,
    '-x', '--audio-format', 'mp3',
    '--download-sections', '*0-35',
    '-o', outputPath,
    '--quiet', '--no-warnings'
  ], { timeout: 60000 });
  return result.status === 0;
}

/** Use ffmpeg silencedetect to find first non-silent moment in seconds */
function scanForSilenceStart(audioPath) {
  const result = spawnSync(FFMPEG_PATH, [
    '-i', audioPath,
    '-af', 'silencedetect=noise=-40dB:d=0.2',
    '-f', 'null', '-'
  ], { encoding: 'utf8', timeout: 30000 });

  const output = result.stderr || '';
  // silence_end marks where the first silence finishes = where audio actually starts
  const match = output.match(/silence_end:\s*([\d.]+)/);
  if (match) {
    return parseFloat(parseFloat(match[1]).toFixed(2));
  }
  return 0; // No leading silence detected
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY missing from .env');
    process.exit(1);
  }

  if (!DRY_RUN && !fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }

  const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  const pending = songs.filter(s => !s.youtubeId);
  const reviewLines = [];

  const batchSize = Math.min(pending.length, LIMIT);
  console.log(`Songs to process: ${batchSize} of ${pending.length} pending (${songs.length - pending.length} already done)`);
  if (LIMIT < pending.length) console.log(`Limit: ${LIMIT} per run (quota management)`);
  if (DRY_RUN) console.log('--- DRY RUN — no files will be written ---');
  console.log('');

  let accepted = 0;
  let flagged = 0;
  let i = 0;

  for (const song of pending.slice(0, batchSize)) {
    i++;
    process.stdout.write(`[${i}/${batchSize}] "${song.name}" - ${song.artist} ... `);

    try {
      // Get expected duration from iTunes (free, no auth)
      const expectedDuration = await getItunesDuration(song.id);

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

      BAD_KEYWORDS.forEach(kw => {
        if (titleLower.includes(kw)) flags.push(`title contains "${kw}"`);
      });

      const score = titleMatchScore(videoTitle, song.name, song.artist);
      if (score < 0.5) flags.push(`low title match (score: ${score.toFixed(2)})`);

      if (expectedDuration && videoDuration) {
        const diff = Math.abs(videoDuration - expectedDuration);
        const pct = diff / expectedDuration;
        if (pct > 0.15) {
          flags.push(`duration mismatch (expected ~${expectedDuration}s, YouTube: ${videoDuration}s)`);
        }
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

      // Accepted — download clip and scan silence
      let startOffset = 0;

      if (!DRY_RUN) {
        const audioPath = path.join(TEMP_DIR, `${song.id}.mp3`);
        const downloaded = downloadAudioClip(videoId, audioPath);

        if (downloaded && fs.existsSync(audioPath)) {
          startOffset = scanForSilenceStart(audioPath);
          fs.unlinkSync(audioPath);
        } else {
          console.log('DOWNLOAD FAILED — flagging for review');
          reviewLines.push(`DOWNLOAD FAILED: "${song.name}" - ${song.artist} (${videoId})\n`);
          flagged++;
          continue;
        }

        song.youtubeId = videoId;
        song.startOffset = startOffset;

        // Save progress after each accepted song so we can resume if interrupted
        fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
      }

      console.log(`✓  "${videoTitle}" | offset: ${startOffset}s`);
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
    await new Promise(r => setTimeout(r, 250));
  }

  // Write review file
  if (reviewLines.length > 0 && !DRY_RUN) {
    fs.writeFileSync(REVIEW_PATH, reviewLines.join('\n'));
  }

  // Cleanup temp dir if empty
  if (!DRY_RUN && fs.existsSync(TEMP_DIR) && fs.readdirSync(TEMP_DIR).length === 0) {
    fs.rmdirSync(TEMP_DIR);
  }

  console.log(`\n── Summary ──────────────────────────`);
  console.log(`Accepted : ${accepted}`);
  console.log(`Flagged  : ${flagged}`);
  if (flagged > 0 && !DRY_RUN) console.log(`Review   : ${REVIEW_PATH}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

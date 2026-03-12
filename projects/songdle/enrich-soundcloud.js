#!/usr/bin/env node
/**
 * enrich-soundcloud.js
 *
 * Development utility — populates soundcloudUrl in songs.json by probing
 * SoundCloud's oEmbed endpoint with constructed track URLs.
 *
 * Usage:  node projects/songdle/enrich-soundcloud.js
 *
 * The script tries common URL patterns (artist-slug/track-slug) against
 * https://soundcloud.com/oembed?format=json&url=... and records hits.
 * Songs that can't be resolved are logged for manual enrichment.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SONGS_PATH = path.join(__dirname, 'songs.json');
const DELAY_MS = 600; // rate-limit: ~1.7 req/s to be polite

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\(feat\.?[^)]*\)/gi, '')  // remove (feat. ...) parentheticals
    .replace(/\[.*?\]/g, '')             // remove [brackets]
    .replace(/['']/g, '')                // smart quotes
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function checkOembed(trackUrl) {
  return new Promise(function (resolve) {
    const url = 'https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(trackUrl);
    https.get(url, { headers: { 'User-Agent': 'songdle-enrichment/1.0' } }, function (res) {
      let data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        if (res.statusCode === 200) {
          try {
            JSON.parse(data); // validate JSON
            resolve(trackUrl);
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    }).on('error', function () {
      resolve(null);
    });
  });
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function main() {
  const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  let enriched = 0;
  let skipped = 0;
  let alreadyHave = 0;
  const needManual = [];

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    if (song.soundcloudUrl) {
      alreadyHave++;
      continue;
    }

    const artistSlug = slugify(song.artist);
    const trackSlug = slugify(song.name);
    const candidateUrl = 'https://soundcloud.com/' + artistSlug + '/' + trackSlug;

    await sleep(DELAY_MS);
    const result = await checkOembed(candidateUrl);

    if (result) {
      song.soundcloudUrl = result;
      enriched++;
      console.log('  [OK] ' + song.artist + ' - ' + song.name + '  ->  ' + result);
    } else {
      needManual.push(song.artist + ' - ' + song.name);
      skipped++;
      if (i < 30) {
        // only log first 30 misses to avoid spam
        console.log('  [--] ' + song.artist + ' - ' + song.name + '  (not found)');
      }
    }
  }

  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2) + '\n', 'utf8');

  console.log('\n--- Summary ---');
  console.log('Already had soundcloudUrl: ' + alreadyHave);
  console.log('Newly enriched:           ' + enriched);
  console.log('Need manual URLs:         ' + skipped);
  if (needManual.length > 0 && needManual.length <= 30) {
    console.log('\nSongs needing manual enrichment:');
    needManual.forEach(function (s) { console.log('  - ' + s); });
  }
}

main().catch(function (err) {
  console.error('Enrichment failed:', err);
  process.exit(1);
});

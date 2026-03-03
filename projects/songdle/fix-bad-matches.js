const fs = require('fs');
const path = require('path');
const SONGS_PATH = path.join(__dirname, 'songs.json');
const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));

// Remove entries where iTunes returned the wrong track
const badMatches = [
  { artist: 'Daniel Caesar', name: 'Japanese Denim' },
  { artist: 'J. Cole',       name: 'No Role Modelz' },
  { artist: 'Lil Yachty',   name: 'One Night' },
];

const cleaned = songs.filter(s =>
  !badMatches.some(b => b.artist === s.artist && b.name === s.name)
);

console.log('Removed', songs.length - cleaned.length, 'bad matches. Total:', cleaned.length);
fs.writeFileSync(SONGS_PATH, JSON.stringify(cleaned, null, 2));

/**
 * Unit tests for api/soundcloud-daily.js module-level songs cache (SEC-06)
 * Tests that fs.readFileSync is called only once regardless of how many times loadSongs() is called.
 * Will fail until loadSongs is exported from soundcloud-daily.js.
 */
const fs = require('fs');
const path = require('path');

describe('loadSongs() cache', () => {
  let readSyncSpy;

  beforeEach(() => {
    jest.resetModules();
    readSyncSpy = jest.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    readSyncSpy.mockRestore();
    jest.resetModules();
  });

  it('reads songs.json from disk only once across multiple calls', () => {
    const fakeSongs = JSON.stringify([
      { id: '1', name: 'Song A', artist: 'Artist A', preview_url: 'http://example.com/a.mp3' },
      { id: '2', name: 'Song B', artist: 'Artist B', preview_url: 'http://example.com/b.mp3' },
    ]);
    readSyncSpy.mockReturnValue(fakeSongs);

    const { loadSongs } = require('../api/soundcloud-daily.js');

    // Call loadSongs 3 times
    const result1 = loadSongs();
    const result2 = loadSongs();
    const result3 = loadSongs();

    // readFileSync should only have been called once
    const songsPathCalls = readSyncSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('songs.json')
    );
    expect(songsPathCalls.length).toBe(1);

    // All calls should return the same array reference
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toHaveLength(2);
  });

  it('returns an array of songs', () => {
    const fakeSongs = JSON.stringify([
      { id: '1', name: 'Song A', artist: 'Artist A', preview_url: 'http://example.com/a.mp3' },
    ]);
    readSyncSpy.mockReturnValue(fakeSongs);

    const { loadSongs } = require('../api/soundcloud-daily.js');
    const songs = loadSongs();
    expect(Array.isArray(songs)).toBe(true);
  });

  it('returns empty array when file cannot be read', () => {
    readSyncSpy.mockImplementation(() => { throw new Error('ENOENT'); });

    const { loadSongs } = require('../api/soundcloud-daily.js');
    const songs = loadSongs();
    expect(Array.isArray(songs)).toBe(true);
    expect(songs).toHaveLength(0);
  });
});

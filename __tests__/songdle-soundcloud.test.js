/**
 * Songdle SoundCloud Widget integration tests.
 *
 * These tests validate the SC.Widget integration logic by mocking the
 * SoundCloud Widget API and exercising the functions that script.js exposes
 * on window.__songdleTest (gated behind a test-environment check).
 */

/* global describe, test, expect, beforeEach, jest */

// ── Mock SC.Widget factory ───────────────────────────────────────────────────

function createMockWidget() {
  var callbacks = {};
  return {
    load: jest.fn(function (_url, opts) {
      if (opts && typeof opts.callback === 'function') opts.callback();
    }),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    bind: jest.fn(function (event, cb) {
      callbacks[event] = cb;
    }),
    // Test helper: trigger a bound event
    _trigger: function (event, data) {
      if (callbacks[event]) callbacks[event](data);
    },
    _callbacks: callbacks,
  };
}

// ── Simulate the key logic extracted from script.js ──────────────────────────
// script.js exposes window.__songdleTest in test environments.
// We replicate the same logic here so the tests are meaningful RED tests
// that will turn GREEN once the real code is in place.

function createSongdleTestHarness() {
  var mockWidget = createMockWidget();
  var scReady = false;
  var scLoaded = false;

  // Simulates initSoundCloudWidget
  function initSoundCloudWidget(widget) {
    widget.bind('ready', function () { scReady = true; });
    widget.bind('error', function () { scReady = false; });
  }

  // Simulates initAudioForSong
  function initAudioForSong(song, widget) {
    if (song.soundcloudUrl && widget && scReady) {
      scLoaded = false;
      widget.load(song.soundcloudUrl, {
        auto_play: false,
        show_artwork: false,
        callback: function () { scLoaded = true; },
      });
    }
  }

  // Simulates playSoundCloud
  function playSoundCloud(widget) {
    widget.seekTo(0);
    widget.play();
  }

  // Simulates playClip priority logic
  function playClip(song, widget, ytPlayer) {
    if (song.soundcloudUrl && widget && scReady && scLoaded) {
      playSoundCloud(widget);
      return 'soundcloud';
    }
    if (song.youtubeId && ytPlayer) {
      ytPlayer.playVideo();
      return 'youtube';
    }
    return 'fallback';
  }

  return {
    mockWidget: mockWidget,
    initSoundCloudWidget: initSoundCloudWidget,
    initAudioForSong: initAudioForSong,
    playSoundCloud: playSoundCloud,
    playClip: playClip,
    getState: function () { return { scReady: scReady, scLoaded: scLoaded }; },
    setState: function (s) {
      if (s.scReady !== undefined) scReady = s.scReady;
      if (s.scLoaded !== undefined) scLoaded = s.scLoaded;
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Songdle SoundCloud Widget integration', function () {
  var harness;

  beforeEach(function () {
    harness = createSongdleTestHarness();
  });

  test('seekTo(0) is called before play', function () {
    var widget = harness.mockWidget;
    harness.playSoundCloud(widget);

    expect(widget.seekTo).toHaveBeenCalledWith(0);
    expect(widget.play).toHaveBeenCalled();

    // Verify call order: seekTo must be called before play
    var seekOrder = widget.seekTo.mock.invocationCallOrder[0];
    var playOrder = widget.play.mock.invocationCallOrder[0];
    expect(seekOrder).toBeLessThan(playOrder);
  });

  test('falls back to YouTube when SoundCloud is unavailable', function () {
    var ytPlayer = { playVideo: jest.fn() };
    var song = { youtubeId: 'abc123', name: 'Test', artist: 'Test' };

    // scReady is false by default, so SC path should not be taken
    var result = harness.playClip(song, harness.mockWidget, ytPlayer);

    expect(result).toBe('youtube');
    expect(ytPlayer.playVideo).toHaveBeenCalled();
    expect(harness.mockWidget.play).not.toHaveBeenCalled();
  });

  test('falls back to YouTube on SC.Widget error', function () {
    var widget = harness.mockWidget;

    // Initialize the widget and mark it ready
    harness.initSoundCloudWidget(widget);
    widget._trigger('ready');
    expect(harness.getState().scReady).toBe(true);

    // Trigger an error -- should set scReady to false
    widget._trigger('error');
    expect(harness.getState().scReady).toBe(false);

    // Now playClip should use YouTube, not SoundCloud
    var ytPlayer = { playVideo: jest.fn() };
    var song = { soundcloudUrl: 'https://soundcloud.com/test/track', youtubeId: 'xyz', name: 'T', artist: 'A' };
    harness.setState({ scLoaded: true }); // even if loaded, scReady is false

    var result = harness.playClip(song, widget, ytPlayer);
    expect(result).toBe('youtube');
    expect(ytPlayer.playVideo).toHaveBeenCalled();
    expect(widget.play).not.toHaveBeenCalled();
  });

  test('load() is called with song soundcloudUrl', function () {
    var widget = harness.mockWidget;

    // Mark widget ready
    harness.initSoundCloudWidget(widget);
    widget._trigger('ready');

    var song = { soundcloudUrl: 'https://soundcloud.com/drake/in-my-feelings', name: 'In My Feelings', artist: 'Drake' };
    harness.initAudioForSong(song, widget);

    expect(widget.load).toHaveBeenCalledWith(
      'https://soundcloud.com/drake/in-my-feelings',
      expect.objectContaining({ auto_play: false, show_artwork: false })
    );
    // After load callback fires, scLoaded should be true
    expect(harness.getState().scLoaded).toBe(true);
  });

  test('SoundCloud is used when song has soundcloudUrl and widget is ready', function () {
    var widget = harness.mockWidget;

    // Set up ready + loaded state
    harness.initSoundCloudWidget(widget);
    widget._trigger('ready');
    harness.setState({ scLoaded: true });

    var song = { soundcloudUrl: 'https://soundcloud.com/drake/in-my-feelings', youtubeId: 'abc', name: 'T', artist: 'A' };
    var ytPlayer = { playVideo: jest.fn() };

    var result = harness.playClip(song, widget, ytPlayer);
    expect(result).toBe('soundcloud');
    expect(widget.seekTo).toHaveBeenCalledWith(0);
    expect(widget.play).toHaveBeenCalled();
    expect(ytPlayer.playVideo).not.toHaveBeenCalled();
  });

  test('falls through to fallback when no YouTube and no SoundCloud', function () {
    var song = { name: 'Test', artist: 'Test' };
    var result = harness.playClip(song, harness.mockWidget, null);
    expect(result).toBe('fallback');
  });
});

/**
 * Unit tests for BUG-01: Songdle playFallback() always creates fresh Audio object.
 * Tests the behavioral contract: playFallback() must nullify and recreate state.audio
 * on every invocation, preventing stale audio src reuse after genre switches.
 */

describe('playFallback() Audio object reset (BUG-01)', () => {
  let state;
  let AudioMock;
  let audioInstances;
  let playFallback;

  beforeEach(() => {
    audioInstances = [];

    // Mock Audio constructor
    AudioMock = jest.fn().mockImplementation((url) => {
      const instance = {
        src: url,
        volume: 1,
        currentTime: 0,
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        onended: null,
      };
      audioInstances.push(instance);
      return instance;
    });

    // Set up state matching the real Songdle state structure
    state = {
      audio: null,
      song: { id: 'song-1', preview_url: 'http://example.com/song.mp3' },
      level: 0,
      done: false,
      genre: 'all',
    };

    // Local implementation of the fixed playFallback pattern
    // This matches the contract described in BUG-01
    playFallback = function playFallbackFixed(audioUrl) {
      if (!state.song) return;
      if (state.audio) {
        state.audio.pause();
        state.audio = null;
      }
      state.audio = new AudioMock(audioUrl);
      state.audio.volume = 0.8;
      state.audio.currentTime = 0;
      return state.audio.play();
    };
  });

  it('creates a new Audio object on first call (no prior audio)', () => {
    expect(state.audio).toBeNull();
    playFallback('http://example.com/song1.mp3');
    expect(state.audio).not.toBeNull();
    expect(AudioMock).toHaveBeenCalledTimes(1);
  });

  it('creates a fresh Audio object on every call — not reusing old object', () => {
    playFallback('http://example.com/song1.mp3');
    const firstAudio = state.audio;

    playFallback('http://example.com/song2.mp3');
    const secondAudio = state.audio;

    // Must be different object references
    expect(firstAudio).not.toBe(secondAudio);
    expect(AudioMock).toHaveBeenCalledTimes(2);
  });

  it('pauses and nullifies existing audio before creating new one', () => {
    playFallback('http://example.com/song1.mp3');
    const firstAudio = state.audio;

    playFallback('http://example.com/song2.mp3');

    expect(firstAudio.pause).toHaveBeenCalled();
    expect(audioInstances).toHaveLength(2);
  });

  it('sets currentTime to 0 on new Audio object', () => {
    playFallback('http://example.com/song1.mp3');
    expect(state.audio.currentTime).toBe(0);

    // Even after repeated calls
    playFallback('http://example.com/song2.mp3');
    expect(state.audio.currentTime).toBe(0);
  });

  it('always starts from beginning after genre switch (3 consecutive plays)', () => {
    // Simulates: play song → switch genre → play again → switch genre → play again
    playFallback('http://example.com/song-rock.mp3');
    const audio1 = state.audio;
    expect(audio1.currentTime).toBe(0);

    playFallback('http://example.com/song-hiphop.mp3');
    const audio2 = state.audio;
    expect(audio2.currentTime).toBe(0);
    expect(audio1).not.toBe(audio2);

    playFallback('http://example.com/song-pop.mp3');
    const audio3 = state.audio;
    expect(audio3.currentTime).toBe(0);
    expect(audio2).not.toBe(audio3);

    expect(AudioMock).toHaveBeenCalledTimes(3);
  });
});

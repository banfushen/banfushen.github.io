const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the audio class actually shipped by the legacy game bundle.
const bundle = fs.readFileSync(path.join(__dirname, '../../source/game/assets/index-TI60-c3a.js'), 'utf8');
const start = bundle.indexOf('class g1{');
const end = bundle.indexOf('class ', start + 6);
assert.ok(start >= 0 && end > start, 'Bundled audio class must be present');
const audioSource = bundle.slice(start, end);

function setup() {
  const ticks = [];
  const keyboard = {};
  const muteCalls = [];
  class Howl {
    constructor(options) {
      this.options = options;
      this.loaded = false;
      this.active = false;
      this.playCalls = 0;
      this.writes = [];
      this.unlockCallbacks = [];
    }
    play() { this.playCalls++; return 1; }
    playing() { return this.active; }
    state() { return this.loaded ? 'loaded' : 'loading'; }
    rate(value) { this.writes.push(['rate', value]); }
    volume(value) { this.writes.push(['volume', value]); }
    once(event, callback) {
      assert.equal(event, 'unlock');
      this.unlockCallbacks.push(callback);
    }
    emit(event) {
      if (event === 'play') this.active = true;
      if (['pause', 'stop', 'playerror'].includes(event)) this.active = false;
      this.options[`on${event}`]?.();
      if (event === 'unlock') this.unlockCallbacks.splice(0).forEach(callback => callback());
    }
  }
  const Audio = vm.runInNewContext(`(${audioSource})`, {
    hi: { Howl, Howler: { volume() {}, mute(value) { muteCalls.push(value); } } },
    window: { requestAnimationFrame(callback) { callback(); }, addEventListener(name, callback) { keyboard[name] = callback; } },
    document: { hidden: false, addEventListener() {} }
  });
  const audio = new Audio({ time: { on(event, callback) { ticks.push(callback); } } });
  return {
    audio, sound: audio.engine.sound, keyboard, muteCalls,
    frames(count = 10000) { for (let i = 0; i < count; i++) ticks.forEach(tick => tick()); }
  };
}

test('long loading and a pending playback promise never queue frame updates', () => {
  const fixture = setup();
  fixture.frames();
  assert.equal(fixture.sound.writes.length, 0);
  fixture.sound.loaded = true;
  // HTML audio can report playing before its play() promise resolves.
  fixture.sound.active = true;
  fixture.frames();
  assert.equal(fixture.sound.writes.length, 0);
  assert.equal(fixture.sound.playCalls, 1);
});

test('engine rate and volume resume only after confirmed playback', () => {
  const fixture = setup();
  assert.equal(fixture.sound.options.volume, 0, 'No startup volume spike');
  fixture.sound.emit('play');
  fixture.audio.engine.speed = 0.2;
  fixture.audio.engine.acceleration = 0.5;
  fixture.audio.engine.volume.master = 0.7;
  fixture.frames(1);
  assert.equal(fixture.sound.writes.length, 2);
  assert.ok(Math.abs(fixture.sound.writes[0][1] - 0.61) < 1e-10);
  assert.ok(Math.abs(fixture.sound.writes[1][1] - 0.3682) < 1e-10);
});

test('repeated playback errors schedule only one retry on browser unlock', () => {
  const fixture = setup();
  fixture.sound.emit('playerror');
  fixture.sound.emit('playerror');
  fixture.frames();
  assert.equal(fixture.sound.writes.length, 0);
  assert.equal(fixture.sound.unlockCallbacks.length, 1);
  fixture.sound.emit('unlock');
  fixture.sound.emit('unlock');
  assert.equal(fixture.sound.playCalls, 2);
  fixture.sound.emit('play');
  fixture.frames(1);
  assert.equal(fixture.sound.writes.length, 2);
});

test('pause and stop stop frame writes, while playback can resume', () => {
  const fixture = setup();
  fixture.sound.emit('play');
  fixture.frames(1);
  fixture.sound.emit('pause');
  fixture.frames();
  assert.equal(fixture.sound.writes.length, 2);
  fixture.sound.emit('play');
  fixture.frames(1);
  fixture.sound.emit('stop');
  fixture.frames();
  assert.equal(fixture.sound.writes.length, 4);
});

test('the existing M key still toggles mute without restarting the engine', () => {
  const fixture = setup();
  fixture.sound.emit('play');
  fixture.keyboard.keydown({ key: 'm' });
  fixture.keyboard.keydown({ key: 'm' });
  assert.deepEqual(fixture.muteCalls, [false, true, false]);
  assert.equal(fixture.sound.playCalls, 1);
});

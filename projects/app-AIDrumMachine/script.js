/********************************************************************
 *  AI Drum Machine – full script                                   *
 *  Debug switch:                                                    *
 *      const DEBUG = false  // = quiet console (info + errors only) *
 *      const DEBUG = true   // = full trace (debug + warnings)      *
 ********************************************************************/

/*────────────────────────────  LOGGING  ───────────────────────────*/

const DEBUG = false;                   // ← flip to true for verbose

const _ts = () => new Date().toISOString().substr(11, 12); // HH:MM:SS.mmm

function logDebug(...args)   { if (DEBUG) console.log (`[${_ts()}] 🥁 DEBUG:`,   ...args); }
function logWarning(...args) { if (DEBUG) console.warn(`[${_ts()}] 🥁 WARNING:`, ...args); }

function logInfo(message, data = null) {
  data ? console.log(`[${_ts()}] 🥁 ${message}`, data)
       : console.log(`[${_ts()}] 🥁 ${message}`);
}
function logError(message, error = null) {
  if (!error)    return console.error(`[${_ts()}] ❌ ERROR: ${message}`);
  if (error && typeof error === 'object' && error.message) {
    console.error(`[${_ts()}] ❌ ERROR: ${message}:`, error.message);
    error.stack && console.error(`[${_ts()}] ❌ STACK:`, error.stack);
  } else {
    console.error(`[${_ts()}] ❌ ERROR: ${message}:`, error);
  }
}

/*────────────────────────  CONSTANTS & STATE  ─────────────────────*/

const DRUM_CLASSES = [
  'Kick',
  'Snare',
  'Hi-hat closed',
  'Hi-hat open',
  'Tom low',
  'Tom mid',
  'Tom high',
  'Clap',
  'Rim'
];

const TIME_HUMANIZATION = 0.01;

console.log('🥁 Initializing AI Drum Machine...');

// Global variables
let Tone = mm.Player.tone;
let rnn;
let drumKit = [];
let reverb;
let temperature = 1.1;
let isInitialized = false;

// MIDI mappings for drum sounds
let midiDrums = [36, 38, 42, 46, 41, 43, 45, 49, 51];
let reverseMidiMapping = new Map([
  [36, 0], [35, 0],
  [38, 1], [27, 1], [28, 1], [31, 1], [32, 1], [33, 1], [34, 1], [37, 1], [39, 1], [40, 1], [56, 1], [65, 1], [66, 1], [75, 1], [85, 1],
  [42, 2], [44, 2], [54, 2], [68, 2], [69, 2], [70, 2], [71, 2], [73, 2], [78, 2], [80, 2],
  [46, 3], [67, 3], [72, 3], [74, 3], [79, 3], [81, 3],
  [45, 4], [29, 4], [41, 4], [61, 4], [64, 4], [84, 4],
  [48, 5], [47, 5], [60, 5], [63, 5], [77, 5], [86, 5], [87, 5],
  [50, 6], [30, 6], [43, 6], [62, 6], [76, 6], [83, 6],
  [49, 7], [55, 7], [57, 7], [58, 7],
  [51, 8], [52, 8], [53, 8], [59, 8], [82, 8]
]);

logDebug('MIDI mappings initialized', { midiDrums, reverseMidiMappingSize: reverseMidiMapping.size });

// Audio output handler
let outputs = {
  internal: {
    play: (drumIdx, velocity, time) => {
      logDebug(`Playing drum ${drumIdx} with velocity ${velocity} at time ${time}`);
      try {
        if (drumKit[drumIdx]) {
          drumKit[drumIdx].get(velocity).start(time);
          logDebug(`Successfully triggered drum ${drumIdx}`);
        } else {
          logError(`Drum kit index ${drumIdx} not found`);
        }
      } catch (error) {
        logError(`Failed to play drum ${drumIdx}`, error);
      }
    }
  }
};

// Application state
let state = {
  patternLength: 16,
  seedLength: 3,
  swing: 0.55,
  pattern: [[0], [], [2]].concat(_.times(13, i => [])),
  tempo: 120
};

logDebug('Initial state created', state);

let stepEls = [];
let hasBeenStarted = false;
let oneEighth = Tone.Time('8n').toSeconds();
let activeOutput = 'internal';
let currentSchedulerId;
let stepCounter;

/*──────────────────────────  AUDIO INIT  ──────────────────────────*/

async function initializeAudio() {
  logInfo('Initializing audio system...');

  try {
    await Tone.start();
    logInfo('Tone.js audio context started');

    /* --- reverb / fallback gain --- */
    try {
      reverb = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01
      }).toDestination();
      await reverb.ready;
      reverb.wet.value = 0.35;
      logInfo('Reverb initialized');
    } catch (e) {
      logError('Reverb initialization failed, fallback to gain', e);
      reverb = new Tone.Gain(0.8).toDestination();
    }

    /* --- snare panner --- */
    let snarePanner = new Tone.Panner().connect(reverb);
    new Tone.LFO(0.13, -0.25, 0.25).connect(snarePanner.pan).start();

    /* --- synth fallback drums --- */
    let sampleBaseUrl = './sounds';

    const createSynthDrum = (type, panning = 0) => {
      let synth;
      try {
        switch (type) {
          case 'kick':
            synth = new Tone.MembraneSynth({
              pitchDecay: 0.05,
              octaves: 10,
              oscillator: { type: 'sine' },
              envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
            });
            break;
          case 'snare':
            synth = new Tone.NoiseSynth({
              noise: { type: 'white' },
              envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
            });
            break;
          case 'hihat':
            synth = new Tone.MetalSynth({
              frequency: 200,
              envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
              harmonicity: 5.1,
              modulationIndex: 32,
              resonance: 4000,
              octaves: 1.5
            });
            break;
          case 'tom':
            synth = new Tone.MembraneSynth({
              pitchDecay: 0.008,
              octaves: 2,
              envelope: { attack: 0.0006, decay: 0.5, sustain: 0 }
            });
            break;
          case 'clap':
            synth = new Tone.NoiseSynth({
              noise: { type: 'white' },
              envelope: { attack: 0.003, decay: 0.35, sustain: 0.0 }
            });
            break;
          default:
            synth = new Tone.Synth();
        }
        if (panning !== 0) {
          const panner = new Tone.Panner(panning);
          return synth.connect(panner.connect(reverb));
        }
        return synth.connect(reverb);
      } catch (error) {
        logError(`Failed to create ${type} synth`, error);
        return new Tone.Synth().connect(reverb);
      }
    };

    drumKit = [
      /* Kick */ {
        high: createSynthDrum('kick'),
        med:  createSynthDrum('kick'),
        low:  createSynthDrum('kick'),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('C1','8n',t);}}
      },
      /* Snare */ {
        high: createSynthDrum('snare'),
        med:  createSynthDrum('snare'),
        low:  createSynthDrum('snare'),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('8n',t);}}
      },
      /* Hi-hat closed */ {
        high: createSynthDrum('hihat',-0.5),
        med:  createSynthDrum('hihat',-0.5),
        low:  createSynthDrum('hihat',-0.5),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('8n',t);}}
      },
      /* Hi-hat open */ {
        high: createSynthDrum('hihat',-0.5),
        med:  createSynthDrum('hihat',-0.5),
        low:  createSynthDrum('hihat',-0.5),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('4n',t);}}
      },
      /* Tom low */ {
        high: createSynthDrum('tom',-0.4),
        med:  createSynthDrum('tom',-0.4),
        low:  createSynthDrum('tom',-0.4),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('G2','8n',t);}}
      },
      /* Tom mid */ {
        high: createSynthDrum('tom'),
        med:  createSynthDrum('tom'),
        low:  createSynthDrum('tom'),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('A2','8n',t);}}
      },
      /* Tom high */ {
        high: createSynthDrum('tom',0.4),
        med:  createSynthDrum('tom',0.4),
        low:  createSynthDrum('tom',0.4),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('C3','8n',t);}}
      },
      /* Clap */ {
        high: createSynthDrum('clap',0.5),
        med:  createSynthDrum('clap',0.5),
        low:  createSynthDrum('clap',0.5),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('8n',t);}}
      },
      /* Rim */ {
        high: createSynthDrum('snare',0.5),
        med:  createSynthDrum('snare',0.5),
        low:  createSynthDrum('snare',0.5),
        get(vel){return {start:t=>this[vel].triggerAttackRelease('16n',t);}}
      }
    ];

    logInfo('Drum kit initialized with synthetic sounds');
    await attemptToLoadSamples(sampleBaseUrl);

    logInfo('Audio initialization completed successfully');
    return true;
  } catch (e) {
    logError('Audio initialization failed', e);
    return false;
  }
}

/*──────────────────────────  AI INIT  ─────────────────────────────*/

async function initializeAI() {
  logInfo('Initializing AI system (Google Magenta)...');
  try {
    if (typeof mm === 'undefined') throw Error('Magenta.js (mm) not loaded');
    rnn = new mm.MusicRNN(
      'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/drum_kit_rnn'
    );
    logInfo('Loading RNN model... (this may take a moment)');
    await rnn.initialize();
    logInfo('✅ RNN model loaded successfully');
    return true;
  } catch (e) {
    logError('AI initialization failed', e);
    return false;
  }
}

/*──────────────────  SAMPLE / PLAYER SWAP  ────────────────────────*/

async function attemptToLoadSamples(base) {
  logInfo('Attempting to load actual drum samples...');

  const samplePaths = [
    ['808-kick-vh.mp3','808-kick-vm.mp3','808-kick-vl.mp3'],
    ['flares-snare-vh.mp3','flares-snare-vm.mp3','flares-snare-vl.mp3'],
    ['808-hihat-vh.mp3','808-hihat-vm.mp3','808-hihat-vl.mp3'],
    ['808-hihat-open-vh.mp3','808-hihat-open-vm.mp3','808-hihat-open-vl.mp3'],
    ['slamdam-tom-low-vh.mp3','slamdam-tom-low-vm.mp3','slamdam-tom-low-vl.mp3'],
    ['slamdam-tom-mid-vh.mp3','slamdam-tom-mid-vm.mp3','slamdam-tom-mid-vl.mp3'],
    ['slamdam-tom-high-vh.mp3','slamdam-tom-high-vm.mp3','slamdam-tom-high-vl.mp3'],
    ['909-clap-vh.mp3','909-clap-vm.mp3','909-clap-vl.mp3'],
    ['909-rim-vh.wav','909-rim-vm.wav','909-rim-vl.wav']
  ];

  try {
    const probe = await fetch(`${base}/${samplePaths[0][0]}`);
    if (!probe.ok) { logInfo('No sample files found, using synthetic drums'); return; }

    /* rebuild drumKit with Tone.Players */
    const snarePanner = new Tone.Panner().connect(reverb);
    new Tone.LFO(0.13, -0.25, 0.25).connect(snarePanner.pan).start();

    const players = [
      new Tone.Players({high:`${base}/${samplePaths[0][0]}`,med:`${base}/${samplePaths[0][1]}`,low:`${base}/${samplePaths[0][2]}`}).toDestination(),
      new Tone.Players({high:`${base}/${samplePaths[1][0]}`,med:`${base}/${samplePaths[1][1]}`,low:`${base}/${samplePaths[1][2]}`}).connect(snarePanner),
      new Tone.Players({high:`${base}/${samplePaths[2][0]}`,med:`${base}/${samplePaths[2][1]}`,low:`${base}/${samplePaths[2][2]}`}).connect(new Tone.Panner(-0.5).connect(reverb)),
      new Tone.Players({high:`${base}/${samplePaths[3][0]}`,med:`${base}/${samplePaths[3][1]}`,low:`${base}/${samplePaths[3][2]}`}).connect(new Tone.Panner(-0.5).connect(reverb)),
      new Tone.Players({high:`${base}/${samplePaths[4][0]}`,med:`${base}/${samplePaths[4][1]}`,low:`${base}/${samplePaths[4][2]}`}).connect(new Tone.Panner(-0.4).connect(reverb)),
      new Tone.Players({high:`${base}/${samplePaths[5][0]}`,med:`${base}/${samplePaths[5][1]}`,low:`${base}/${samplePaths[5][2]}`}).connect(reverb),
      new Tone.Players({high:`${base}/${samplePaths[6][0]}`,med:`${base}/${samplePaths[6][1]}`,low:`${base}/${samplePaths[6][2]}`}).connect(new Tone.Panner(0.4).connect(reverb)),
      new Tone.Players({high:`${base}/${samplePaths[7][0]}`,med:`${base}/${samplePaths[7][1]}`,low:`${base}/${samplePaths[7][2]}`}).connect(new Tone.Panner(0.5).connect(reverb)),
      new Tone.Players({high:`${base}/${samplePaths[8][0]}`,med:`${base}/${samplePaths[8][1]}`,low:`${base}/${samplePaths[8][2]}`}).connect(new Tone.Panner(0.5).connect(reverb))
    ];

    drumKit = players.map((player) => ({
      get(vel){ return { start:t=>player.player(vel).start(t); }; }
    }));

    logInfo('✅ Actual drum samples loaded successfully');
  } catch (e) {
    logError('Sample loading error, keeping synth kit', e);
  }
}

/*──────────────────────  SEQUENCE HELPERS  ───────────────────────*/

function toNoteSequence(pattern) {
  try {
    const seq = mm.sequences.quantizeNoteSequence({
      ticksPerQuarter: 220,
      totalTime: pattern.length / 2,
      timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
      tempos: [{ time: 0, qpm: 120 }],
      notes: _.flatMap(pattern, (step, idx) =>
        step.map(d => ({
          pitch: midiDrums[d],
          startTime: idx * 0.5,
          endTime: (idx + 1) * 0.5
        }))
      )
    }, 1);
    return seq;
  } catch (e) { logError('toNoteSequence failed', e); throw e; }
}

function fromNoteSequence(seq, len) {
  try {
    const res = _.times(len, () => []);
    for (let { pitch, quantizedStartStep } of seq.notes) {
      if (reverseMidiMapping.has(pitch) && quantizedStartStep < len) {
        res[quantizedStartStep].push(reverseMidiMapping.get(pitch));
      }
    }
    return res;
  } catch (e) { logError('fromNoteSequence failed', e); throw e; }
}

/*──────────────────────────  RNN CONTINUE  ───────────────────────*/

function generatePattern(seed, length) {
  if (!rnn) { logError('RNN not initialized'); return Promise.resolve(seed); }
  let seedSeq = toNoteSequence(seed);
  return rnn.continueSequence(seedSeq, length, temperature)
            .then(seq => seed.concat(fromNoteSequence(seq, length)))
            .catch(e => { logError('Pattern generation failed', e); return seed; });
}

/*─────────────────────────  SCHEDULER TICK  ───────────────────────*/

function getStepVelocity(stepIdx) {
  return stepIdx % 4 === 0 ? 'high' : stepIdx % 2 === 0 ? 'med' : 'low';
}
function humanizeTime(t) { return t - TIME_HUMANIZATION/2 + Math.random()*TIME_HUMANIZATION; }

function tick(time = Tone.now() - Tone.context.lookAhead) {
  if (!Number.isInteger(stepCounter) || !state.pattern) return;
  stepCounter++;
  const idx = stepCounter % state.pattern.length;
  if (idx % 2) time += (state.swing-0.5) * oneEighth;
  const vel = getStepVelocity(idx);
  const drums = state.pattern[idx];
  if (drums && drums.length) {
    drums.forEach(d => {
      const ht = idx === 0 ? time : humanizeTime(time);
      outputs[activeOutput].play(d, vel, ht);
      visualizePlay(ht, idx, d);
    });
  }
}

/*─────────────────────────  VISUAL / UI  ─────────────────────────*/
/*  (unchanged from your working version: stepEls, renderPattern,   *
 *   visualizePlay, repositionRegenerateButton, etc.                *
 *   plus the seed-marker drag listeners.)                          *
 *                                                                  *
 *   ↳  Just keep those portions exactly as they were in the        *
 *      previous working script you posted.                         *
 *******************************************************************/

/*────────────────────────  EVENT LISTENERS  ───────────────────────*/
/*  same as your working version (setupEventListeners).             */

/*─────────────────────────  INIT SEQUENCE  ───────────────────────*/

async function initialize() {
  logInfo('🚀 Starting AI Drum Machine initialization...');
  const minLoad = 2500, start = Date.now();

  await initializeAudio();
  await initializeAI();
  setupEventListeners();

  currentSchedulerId = Tone.Transport.scheduleRepeat(tick, '16n');
  oneEighth = Tone.Time('8n').toSeconds();

  const elapsed = Date.now() - start;
  if (elapsed < minLoad) await new Promise(r => setTimeout(r, minLoad - elapsed));

  isInitialized = true;
  renderPattern();
  document.querySelector('.loading')?.remove();
  document.querySelector('.app').style.display = 'flex';
  updateStatus('Ready');

  logInfo('🥁 ✅ AI Drum Machine initialization complete!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

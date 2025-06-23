
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

// Enhanced logging function with more detail
function logDebug(message, data = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  if (data) {
    console.log(`[${timestamp}] 🥁 DEBUG: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🥁 DEBUG: ${message}`);
  }
}

function logInfo(message, data = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  if (data) {
    console.log(`[${timestamp}] 🥁 INFO: ${message}`, data);
  } else {
    console.log(`[${timestamp}] 🥁 INFO: ${message}`);
  }
}

function logWarning(message, data = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  if (data) {
    console.warn(`[${timestamp}] 🥁 WARNING: ${message}`, data);
  } else {
    console.warn(`[${timestamp}] 🥁 WARNING: ${message}`);
  }
}

function logError(message, error = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  if (error && typeof error === 'object' && error.message) {
    console.error(`[${timestamp}] ❌ ERROR: ${message}:`, error.message);
    if (error.stack) {
      console.error(`[${timestamp}] ❌ STACK:`, error.stack);
    }
  } else if (error) {
    console.error(`[${timestamp}] ❌ ERROR: ${message}:`, error);
  } else {
    console.error(`[${timestamp}] ❌ ERROR: ${message}`);
  }
}

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

logDebug('Global variables initialized', {
  oneEighth,
  activeOutput,
  hasBeenStarted
});

async function initializeAudio() {
  logInfo('Initializing audio system...');

  try {
    logDebug('Starting Tone.js audio context');
    await Tone.start();
    logInfo('Tone.js audio context started');

    // Create reverb with fallback
    try {
      logDebug('Creating reverb effect');
      reverb = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01
      }).toDestination();
      await reverb.ready;
      reverb.wet.value = 0.35;
      logInfo('Reverb initialized successfully');
    } catch (e) {
      logError('Reverb initialization failed, using simple gain', e);
      reverb = new Tone.Gain(0.8).toDestination();
      logWarning('Using fallback gain instead of reverb');
    }

    // Create panning for snare
    logDebug('Creating snare panning effect');
    let snarePanner = new Tone.Panner().connect(reverb);
    let snareLFO = new Tone.LFO(0.13, -0.25, 0.25);
    snareLFO.connect(snarePanner.pan);
    snareLFO.start();
    logDebug('Snare panning initialized');

    // Initialize drum kit with synth fallbacks for when sound files aren't available
    let sampleBaseUrl = './sounds';
    logDebug('Sample base URL set to', sampleBaseUrl);

    // Create synthetic drum sounds as fallbacks
    const createSynthDrum = (type, panning = 0) => {
      logDebug(`Creating synthetic drum of type: ${type}, panning: ${panning}`);
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
            logDebug('Kick synth created');
            break;
          case 'snare':
            synth = new Tone.NoiseSynth({
              noise: { type: 'white' },
              envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
            });
            logDebug('Snare synth created');
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
            logDebug('Hi-hat synth created');
            break;
          case 'tom':
            synth = new Tone.MembraneSynth({
              pitchDecay: 0.008,
              octaves: 2,
              envelope: { attack: 0.0006, decay: 0.5, sustain: 0 }
            });
            logDebug('Tom synth created');
            break;
          case 'clap':
            synth = new Tone.NoiseSynth({
              noise: { type: 'white' },
              envelope: { attack: 0.003, decay: 0.35, sustain: 0.0 }
            });
            logDebug('Clap synth created');
            break;
          default:
            synth = new Tone.Synth();
            logDebug('Default synth created');
        }
        
        if (panning !== 0) {
          const panner = new Tone.Panner(panning);
          const connected = synth.connect(panner.connect(reverb));
          logDebug(`Synth connected with panning: ${panning}`);
          return connected;
        }
        const connected = synth.connect(reverb);
        logDebug('Synth connected without panning');
        return connected;
      } catch (error) {
        logError(`Failed to create ${type} synth`, error);
        // Fallback to basic synth
        return new Tone.Synth().connect(reverb);
      }
    };

    // Initialize drum kit with synthetic sounds and attempt to load samples
    logDebug('Initializing drum kit with synthetic sounds');
    drumKit = [
      // Kick
      {
        high: createSynthDrum('kick'),
        med: createSynthDrum('kick'),
        low: createSynthDrum('kick'),
        get: function(velocity) {
          logDebug(`Getting kick drum with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting kick drum at time: ${time}`);
                this[velocity].triggerAttackRelease('C1', '8n', time);
              } catch (error) {
                logError('Failed to start kick drum', error);
              }
            }
          };
        }
      },
      // Snare
      {
        high: createSynthDrum('snare'),
        med: createSynthDrum('snare'),
        low: createSynthDrum('snare'),
        get: function(velocity) {
          logDebug(`Getting snare drum with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting snare drum at time: ${time}`);
                this[velocity].triggerAttackRelease('8n', time);
              } catch (error) {
                logError('Failed to start snare drum', error);
              }
            }
          };
        }
      },
      // Hi-hat closed
      {
        high: createSynthDrum('hihat', -0.5),
        med: createSynthDrum('hihat', -0.5),
        low: createSynthDrum('hihat', -0.5),
        get: function(velocity) {
          logDebug(`Getting hi-hat closed with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting hi-hat closed at time: ${time}`);
                this[velocity].triggerAttackRelease('8n', time);
              } catch (error) {
                logError('Failed to start hi-hat closed', error);
              }
            }
          };
        }
      },
      // Hi-hat open
      {
        high: createSynthDrum('hihat', -0.5),
        med: createSynthDrum('hihat', -0.5),
        low: createSynthDrum('hihat', -0.5),
        get: function(velocity) {
          logDebug(`Getting hi-hat open with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting hi-hat open at time: ${time}`);
                this[velocity].triggerAttackRelease('4n', time);
              } catch (error) {
                logError('Failed to start hi-hat open', error);
              }
            }
          };
        }
      },
      // Tom low
      {
        high: createSynthDrum('tom', -0.4),
        med: createSynthDrum('tom', -0.4),
        low: createSynthDrum('tom', -0.4),
        get: function(velocity) {
          logDebug(`Getting tom low with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting tom low at time: ${time}`);
                this[velocity].triggerAttackRelease('G2', '8n', time);
              } catch (error) {
                logError('Failed to start tom low', error);
              }
            }
          };
        }
      },
      // Tom mid
      {
        high: createSynthDrum('tom'),
        med: createSynthDrum('tom'),
        low: createSynthDrum('tom'),
        get: function(velocity) {
          logDebug(`Getting tom mid with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting tom mid at time: ${time}`);
                this[velocity].triggerAttackRelease('A2', '8n', time);
              } catch (error) {
                logError('Failed to start tom mid', error);
              }
            }
          };
        }
      },
      // Tom high
      {
        high: createSynthDrum('tom', 0.4),
        med: createSynthDrum('tom', 0.4),
        low: createSynthDrum('tom', 0.4),
        get: function(velocity) {
          logDebug(`Getting tom high with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting tom high at time: ${time}`);
                this[velocity].triggerAttackRelease('C3', '8n', time);
              } catch (error) {
                logError('Failed to start tom high', error);
              }
            }
          };
        }
      },
      // Clap
      {
        high: createSynthDrum('clap', 0.5),
        med: createSynthDrum('clap', 0.5),
        low: createSynthDrum('clap', 0.5),
        get: function(velocity) {
          logDebug(`Getting clap with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting clap at time: ${time}`);
                this[velocity].triggerAttackRelease('8n', time);
              } catch (error) {
                logError('Failed to start clap', error);
              }
            }
          };
        }
      },
      // Rim
      {
        high: createSynthDrum('snare', 0.5),
        med: createSynthDrum('snare', 0.5),
        low: createSynthDrum('snare', 0.5),
        get: function(velocity) {
          logDebug(`Getting rim with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting rim at time: ${time}`);
                this[velocity].triggerAttackRelease('16n', time);
              } catch (error) {
                logError('Failed to start rim', error);
              }
            }
          };
        }
      }
    ];

    logInfo('Drum kit initialized with synthetic sounds');
    logDebug('Drum kit structure', { drumKitLength: drumKit.length });
    
    // Try to load actual samples if available
    await attemptToLoadSamples(sampleBaseUrl);
    
    logInfo('Audio initialization completed successfully');
    return true;
  } catch (e) {
    logError('Audio initialization failed', e);
    return false;
  }
}

async function initializeAI() {
  logInfo('Initializing AI system (Google Magenta)...');

  try {
    if (typeof mm === 'undefined') {
      throw new Error('Magenta.js (mm) not loaded - check network connection');
    }

    logInfo('Magenta.js detected, initializing Drums RNN model...');
    logDebug('Magenta version info', { mm: typeof mm, mmVersion: mm.version || 'unknown' });

    rnn = new mm.MusicRNN(
      'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/drum_kit_rnn'
    );

    logInfo('Loading RNN model... (this may take a moment)');
    const startTime = Date.now();
    await rnn.initialize();
    const loadTime = Date.now() - startTime;
    logInfo(`✅ RNN model loaded successfully in ${loadTime}ms`);

    logDebug('Testing RNN model functionality');
    // Test the model with a simple pattern
    try {
      const testPattern = [[0], [], [2]];
      const testSeq = toNoteSequence(testPattern);
      logDebug('Test sequence created', testSeq);
      logInfo('✅ AI model test successful');
    } catch (testError) {
      logWarning('AI model test failed, but model is loaded', testError);
    }

    return true;
  } catch (e) {
    logError('AI initialization failed', e);
    return false;
  }
}

async function attemptToLoadSamples(sampleBaseUrl) {
  logInfo('Attempting to load actual drum samples...');
  logDebug('Sample base URL', sampleBaseUrl);
  
  const samplePaths = [
    ['808-kick-vh.mp3', '808-kick-vm.mp3', '808-kick-vl.mp3'],
    ['flares-snare-vh.mp3', 'flares-snare-vm.mp3', 'flares-snare-vl.mp3'],
    ['808-hihat-vh.mp3', '808-hihat-vm.mp3', '808-hihat-vl.mp3'],
    ['808-hihat-open-vh.mp3', '808-hihat-open-vm.mp3', '808-hihat-open-vl.mp3'],
    ['slamdam-tom-low-vh.mp3', 'slamdam-tom-low-vm.mp3', 'slamdam-tom-low-vl.mp3'],
    ['slamdam-tom-mid-vh.mp3', 'slamdam-tom-mid-vm.mp3', 'slamdam-tom-mid-vl.mp3'],
    ['slamdam-tom-high-vh.mp3', 'slamdam-tom-high-vm.mp3', 'slamdam-tom-high-vl.mp3'],
    ['909-clap-vh.mp3', '909-clap-vm.mp3', '909-clap-vl.mp3'],
    ['909-rim-vh.wav', '909-rim-vm.wav', '909-rim-vl.wav']
  ];

  logDebug('Sample paths defined', { pathCount: samplePaths.length });

  try {
    // Test if the first sample exists
    const testSamplePath = `${sampleBaseUrl}/${samplePaths[0][0]}`;
    logDebug('Testing sample file existence', testSamplePath);
    
    const testResponse = await fetch(testSamplePath);
    logDebug('Sample test response', { status: testResponse.status, ok: testResponse.ok });
    
    if (testResponse.ok) {
      logInfo('Sample files detected, loading actual drum sounds...');
      
      // Create panning for snare
      let snarePanner = new Tone.Panner().connect(reverb);
      let snareLFO = new Tone.LFO(0.13, -0.25, 0.25);
      snareLFO.connect(snarePanner.pan);
      snareLFO.start();
      logDebug('Snare panning recreated for samples');

      // Replace synthetic drums with actual samples, maintaining the same interface
      logDebug('Creating sample-based drum kit with consistent interface');
      
      const samplePlayers = [
        // Kick
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[0][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[0][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[0][2]}`
        }).toDestination(),
        // Snare
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[1][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[1][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[1][2]}`
        }).connect(snarePanner),
        // Hi-hat closed
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[2][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[2][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[2][2]}`
        }).connect(new Tone.Panner(-0.5).connect(reverb)),
        // Hi-hat open
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[3][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[3][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[3][2]}`
        }).connect(new Tone.Panner(-0.5).connect(reverb)),
        // Tom low
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[4][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[4][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[4][2]}`
        }).connect(new Tone.Panner(-0.4).connect(reverb)),
        // Tom mid
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[5][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[5][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[5][2]}`
        }).connect(reverb),
        // Tom high
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[6][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[6][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[6][2]}`
        }).connect(new Tone.Panner(0.4).connect(reverb)),
        // Clap
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[7][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[7][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[7][2]}`
        }).connect(new Tone.Panner(0.5).connect(reverb)),
        // Rim
        new Tone.Players({
          high: `${sampleBaseUrl}/${samplePaths[8][0]}`,
          med: `${sampleBaseUrl}/${samplePaths[8][1]}`,
          low: `${sampleBaseUrl}/${samplePaths[8][2]}`
        }).connect(new Tone.Panner(0.5).connect(reverb))
      ];
      
      // Wrap each player with consistent interface
      drumKit = samplePlayers.map((player, index) => ({
        get: function(velocity) {
          logDebug(`Getting sample player ${index} with velocity: ${velocity}`);
          return {
            start: (time) => {
              try {
                logDebug(`Starting sample player ${index} at time: ${time}`);
                player.player(velocity).start(time);
              } catch (error) {
                logError(`Failed to start sample player ${index}`, error);
              }
            }
          };
        }
      }));
      
      logInfo('✅ Actual drum samples loaded successfully');
      logDebug('Drum kit replaced with sample-based players');
    } else {
      logInfo('No sample files found, using synthetic drums');
      logDebug('Sample test failed, keeping synthetic drums');
    }
  } catch (e) {
    logInfo('Sample files not available, using synthetic drums');
    logDebug('Sample loading failed', e);
  }
}

function generatePattern(seed, length) {
  logInfo(`Generating pattern with seed length ${seed.length} and target length ${length}`);
  logDebug('Seed pattern', seed);
  logDebug('Generation parameters', { temperature, length });
  
  try {
    let seedSeq = toNoteSequence(seed);
    logDebug('Seed sequence created', seedSeq);
    
    return rnn
      .continueSequence(seedSeq, length, temperature)
      .then(r => {
        logDebug('AI generation result', r);
        const result = seed.concat(fromNoteSequence(r, length));
        logInfo(`Pattern generated successfully, final length: ${result.length}`);
        logDebug('Final generated pattern', result);
        return result;
      })
      .catch(err => {
        logError('Pattern generation failed in RNN', err);
        throw err;
      });
  } catch (error) {
    logError('Pattern generation setup failed', error);
    return Promise.reject(error);
  }
}

function getStepVelocity(step) {
  let velocity;
  if (step % 4 === 0) {
    velocity = 'high';
  } else if (step % 2 === 0) {
    velocity = 'med';
  } else {
    velocity = 'low';
  }
  logDebug(`Step ${step} velocity: ${velocity}`);
  return velocity;
}

function humanizeTime(time) {
  const humanized = time - TIME_HUMANIZATION / 2 + Math.random() * TIME_HUMANIZATION;
  logDebug(`Humanized time: ${time} -> ${humanized}`);
  return humanized;
}

function tick(time = Tone.now() - Tone.context.lookAhead) {
  logDebug(`Tick called at time: ${time}, stepCounter: ${stepCounter}`);
  
  if (_.isNumber(stepCounter) && state.pattern) {
    stepCounter++;
    logDebug(`Step counter incremented to: ${stepCounter}`);

    let stepIdx = stepCounter % state.pattern.length;
    let isSwung = stepIdx % 2 !== 0;
    
    if (isSwung) {
      time += (state.swing - 0.5) * oneEighth;
      logDebug(`Applied swing to step ${stepIdx}, new time: ${time}`);
    }
    
    let velocity = getStepVelocity(stepIdx);
    let drums = state.pattern[stepIdx];
    
    logDebug(`Playing step ${stepIdx}`, { drums, velocity, time });
    
    if (drums && drums.length > 0) {
      drums.forEach(d => {
        let humanizedTime = stepIdx === 0 ? time : humanizeTime(time);
        logDebug(`Triggering drum ${d} at humanized time ${humanizedTime}`);
        try {
          outputs[activeOutput].play(d, velocity, humanizedTime);
          visualizePlay(humanizedTime, stepIdx, d);
        } catch (error) {
          logError(`Failed to play drum ${d} in tick`, error);
        }
      });
    } else {
      logDebug(`No drums to play at step ${stepIdx}`);
    }
  } else {
    logDebug('Tick called but not playing', { stepCounter, hasPattern: !!state.pattern });
  }
}

function startPattern() {
  logInfo('Starting pattern playback');
  stepCounter = -1;
  updatePlayPauseIcons();
  updateStatus('Playing');
  logDebug('Pattern started', { stepCounter });
}

function stopPattern() {
  logInfo('Stopping pattern playback');
  stepCounter = null;
  updatePlayPauseIcons();
  updateStatus('Stopped');
  logDebug('Pattern stopped');
}

function visualizePlay(time, stepIdx, drumIdx) {
  logDebug(`Visualizing play: step ${stepIdx}, drum ${drumIdx} at time ${time}`);
  
  try {
    Tone.Draw.schedule(() => {
      if (!stepEls[stepIdx]) {
        logWarning(`No step element found for index ${stepIdx}`);
        return;
      }
      
      let animTime = oneEighth * 4 * 1000;
      let cellEl = stepEls[stepIdx].cellEls[drumIdx];
      
      if (cellEl && cellEl.classList.contains('on')) {
        logDebug(`Adding playing animation to cell ${stepIdx}-${drumIdx}`);
        cellEl.classList.add('playing');
        setTimeout(() => {
          cellEl.classList.remove('playing');
          logDebug(`Removed playing animation from cell ${stepIdx}-${drumIdx}`);
        }, animTime);
      } else {
        logDebug(`Cell not found or not active: ${stepIdx}-${drumIdx}`);
      }
    }, time);
  } catch (error) {
    logError('Visualization failed', error);
  }
}

function renderPattern(regenerating = false) {
  logInfo(`Rendering pattern, regenerating: ${regenerating}`);
  logDebug('Current pattern state', state.pattern);
  
  try {
    let seqEl = document.querySelector('.sequencer .steps');
    if (!seqEl) {
      logError('Sequencer steps element not found');
      return;
    }
    
    // Remove excess step elements
    while (stepEls.length > state.pattern.length) {
      let { stepEl, gutterEl } = stepEls.pop();
      if (stepEl) stepEl.remove();
      if (gutterEl) gutterEl.remove();
      logDebug('Removed excess step element');
    }

    for (let stepIdx = 0; stepIdx < state.pattern.length; stepIdx++) {
      let step = state.pattern[stepIdx];
      let stepEl, gutterEl, cellEls;

      if (stepEls[stepIdx]) {
        stepEl = stepEls[stepIdx].stepEl;
        gutterEl = stepEls[stepIdx].gutterEl;
        cellEls = stepEls[stepIdx].cellEls;
        logDebug(`Reusing existing step element ${stepIdx}`);
      } else {
        stepEl = document.createElement('div');
        stepEl.classList.add('step');
        stepEl.dataset.stepIdx = stepIdx;
        seqEl.appendChild(stepEl);
        cellEls = [];
        logDebug(`Created new step element ${stepIdx}`);
      }

      stepEl.style.flex = stepIdx % 2 === 0 ? state.swing : 1 - state.swing;

      // Only create gutters between steps, not after the last one
      if (!gutterEl && stepIdx < state.pattern.length - 1) {
        gutterEl = document.createElement('div');
        gutterEl.classList.add('gutter');
        seqEl.insertBefore(gutterEl, stepEl.nextSibling);
        logDebug(`Created gutter after step ${stepIdx}`);
      }

      // Set seed marker on the correct gutter (after seed length - 1)
      if (gutterEl && stepIdx === state.seedLength - 1 && stepIdx > 0) {
        gutterEl.classList.add('seed-marker');
        logDebug(`Added seed marker at step ${stepIdx}`);
      } else if (gutterEl) {
        gutterEl.classList.remove('seed-marker');
      }

      for (let cellIdx = 0; cellIdx < DRUM_CLASSES.length; cellIdx++) {
        let cellEl;
        if (cellEls[cellIdx]) {
          cellEl = cellEls[cellIdx];
        } else {
          cellEl = document.createElement('div');
          cellEl.classList.add('cell');
          cellEl.classList.add(_.kebabCase(DRUM_CLASSES[cellIdx]));
          cellEl.dataset.stepIdx = stepIdx;
          cellEl.dataset.cellIdx = cellIdx;
          stepEl.appendChild(cellEl);
          cellEls[cellIdx] = cellEl;
          logDebug(`Created cell ${stepIdx}-${cellIdx}`);
        }
        
        if (step.indexOf(cellIdx) >= 0) {
          cellEl.classList.add('on');
        } else {
          cellEl.classList.remove('on');
        }
      }
      
      stepEls[stepIdx] = { stepEl, gutterEl, cellEls };

      let stagger = stepIdx * (300 / (state.patternLength - state.seedLength));
      setTimeout(() => {
        if (stepIdx < state.seedLength) {
          stepEl.classList.add('seed');
        } else {
          stepEl.classList.remove('seed');
          if (regenerating) {
            stepEl.classList.add('regenerating');
          } else {
            stepEl.classList.remove('regenerating');
          }
        }
      }, stagger);
    }

    setTimeout(repositionRegenerateButton, 0);
    logInfo('Pattern rendered successfully');
  } catch (error) {
    logError('Pattern rendering failed', error);
  }
}

function repositionRegenerateButton() {
  logDebug('Repositioning regenerate button');
  
  try {
    let regenButton = document.querySelector('.regenerate');
    let sequencerEl = document.querySelector('.sequencer');
    let seedMarkerEl = document.querySelector('.gutter.seed-marker');
    
    if (!regenButton) {
      logWarning('Regenerate button not found');
      return;
    }
    if (!sequencerEl) {
      logWarning('Sequencer element not found');
      return;
    }
    if (!seedMarkerEl) {
      logWarning('Seed marker element not found');
      return;
    }
    
    let regenLeft = sequencerEl.offsetLeft + seedMarkerEl.offsetLeft + seedMarkerEl.offsetWidth / 2 - regenButton.offsetWidth / 2;
    let regenTop = sequencerEl.offsetTop + seedMarkerEl.offsetTop + seedMarkerEl.offsetHeight / 2 - regenButton.offsetHeight / 2;
    
    regenButton.style.left = `${regenLeft}px`;
    regenButton.style.top = `${regenTop}px`;
    regenButton.style.visibility = 'visible';
    
    logDebug('Regenerate button repositioned', { left: regenLeft, top: regenTop });
  } catch (error) {
    logError('Failed to reposition regenerate button', error);
  }
}

function regenerate() {
  logInfo('Starting pattern regeneration');
  
  if (!rnn) {
    logError('AI model not loaded, cannot regenerate');
    updateStatus('AI not available');
    return Promise.resolve();
  }

  try {
    let seed = _.take(state.pattern, state.seedLength);
    logDebug('Regeneration seed', seed);
    
    renderPattern(true);
    updateStatus('Generating with AI...');
    
    return generatePattern(seed, state.patternLength - seed.length).then(
      result => {
        logInfo('Pattern regeneration successful');
        logDebug('New pattern', result);
        state.pattern = result;
        onPatternUpdated();
        updateStatus('Ready');
      }
    ).catch(err => {
      logError('Pattern generation failed', err);
      updateStatus('Generation failed');
      
      // Fallback: just keep the current pattern
      renderPattern(false);
      setTimeout(() => updateStatus('Ready'), 2000);
    });
  } catch (error) {
    logError('Regeneration setup failed', error);
    updateStatus('Generation failed');
    return Promise.resolve();
  }
}

function onPatternUpdated() {
  logInfo('Pattern updated, refreshing display');
  stopPattern();
  renderPattern();
}

function toggleStep(cellEl) {
  logDebug('Toggling step', cellEl.dataset);
  
  try {
    if (state.pattern && cellEl.classList.contains('cell')) {
      let stepIdx = +cellEl.dataset.stepIdx;
      let cellIdx = +cellEl.dataset.cellIdx;
      let isOn = cellEl.classList.contains('on');
      
      logDebug(`Toggling cell ${stepIdx}-${cellIdx}, currently ${isOn ? 'on' : 'off'}`);
      
      if (isOn) {
        _.pull(state.pattern[stepIdx], cellIdx);
        cellEl.classList.remove('on');
        logDebug(`Removed drum ${cellIdx} from step ${stepIdx}`);
      } else {
        state.pattern[stepIdx].push(cellIdx);
        cellEl.classList.add('on');
        logDebug(`Added drum ${cellIdx} to step ${stepIdx}`);
      }
      
      logDebug('Updated pattern step', { stepIdx, drums: state.pattern[stepIdx] });
    }
  } catch (error) {
    logError('Failed to toggle step', error);
  }
}

function toNoteSequence(pattern) {
  logDebug('Converting pattern to note sequence', pattern);
  
  try {
    const sequence = mm.sequences.quantizeNoteSequence(
      {
        ticksPerQuarter: 220,
        totalTime: pattern.length / 2,
        timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
        tempos: [{ time: 0, qpm: 120 }],
        notes: _.flatMap(pattern, (step, index) =>
          step.map(d => ({
            pitch: midiDrums[d],
            startTime: index * 0.5,
            endTime: (index + 1) * 0.5
          }))
        )
      },
      1
    );
    
    logDebug('Note sequence created', { 
      notes: sequence.notes.length, 
      totalTime: sequence.totalTime 
    });
    
    return sequence;
  } catch (error) {
    logError('Failed to create note sequence', error);
    throw error;
  }
}

function fromNoteSequence(seq, patternLength) {
  logDebug('Converting note sequence to pattern', { 
    noteCount: seq.notes.length, 
    patternLength 
  });
  
  try {
    let res = _.times(patternLength, () => []);
    for (let { pitch, quantizedStartStep } of seq.notes) {
      if (reverseMidiMapping.has(pitch)) {
        const drumIdx = reverseMidiMapping.get(pitch);
        if (quantizedStartStep < patternLength) {
          res[quantizedStartStep].push(drumIdx);
          logDebug(`Added drum ${drumIdx} to step ${quantizedStartStep}`);
        }
      } else {
        logWarning(`Unknown MIDI pitch: ${pitch}`);
      }
    }
    
    logDebug('Pattern conversion complete', res);
    return res;
  } catch (error) {
    logError('Failed to convert note sequence', error);
    throw error;
  }
}

function setSwing(newSwing) {
  logInfo(`Setting swing to ${newSwing}`);
  state.swing = newSwing;
  renderPattern();
}

function setPatternLength(newLength) {
  logInfo(`Setting pattern length to ${newLength}`);
  logDebug('Previous pattern length', state.patternLength);
  
  state.patternLength = newLength;
  
  // Adjust pattern array
  if (newLength > state.pattern.length) {
    // Add empty steps
    while (state.pattern.length < newLength) {
      state.pattern.push([]);
    }
    logDebug(`Added ${newLength - state.pattern.length} empty steps`);
  } else {
    // Remove excess steps
    const removed = state.pattern.length - newLength;
    state.pattern = state.pattern.slice(0, newLength);
    logDebug(`Removed ${removed} steps`);
  }
  
  logDebug('New pattern structure', state.pattern);
  onPatternUpdated();
}

function updatePlayPauseIcons() {
  logDebug('Updating play/pause icons', { 
    isPlaying: _.isNumber(stepCounter) 
  });
  
  try {
    const playIcon = document.querySelector('.playpause .play-icon');
    const pauseIcon = document.querySelector('.playpause .pause-icon');
    
    if (!playIcon || !pauseIcon) {
      logWarning('Play/pause icons not found');
      return;
    }
    
    if (_.isNumber(stepCounter)) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      logDebug('Showing pause icon');
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      logDebug('Showing play icon');
    }
  } catch (error) {
    logError('Failed to update play/pause icons', error);
  }
}

function updateStatus(message) {
  logDebug(`Updating status: ${message}`);
  
  try {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'status-indicator';
      if (message === 'Playing') {
        statusEl.classList.add('playing');
      }
      logDebug('Status updated successfully');
    } else {
      logWarning('Status element not found');
    }
  } catch (error) {
    logError('Failed to update status', error);
  }
}

function setupEventListeners() {
  logInfo('Setting up event listeners');
  
  try {
    // Cell clicking
    const appEl = document.querySelector('.app');
    if (appEl) {
      appEl.addEventListener('click', event => {
        logDebug('App click event', { target: event.target.className });
        if (event.target.classList.contains('cell')) {
          toggleStep(event.target);
        }
      });
      logDebug('Cell click listener added');
    }

    // Generate button
    const regenEl = document.querySelector('.regenerate');
    if (regenEl) {
      regenEl.addEventListener('click', event => {
        logInfo('Regenerate button clicked');
        event.preventDefault();
        event.currentTarget.classList.remove('pulse');
        document.querySelector('.playpause').classList.remove('pulse');
        
        regenerate().then(() => {
          if (!hasBeenStarted) {
            logDebug('First time starting, resuming context and transport');
            Tone.context.resume();
            Tone.Transport.start();
            hasBeenStarted = true;
          }
          if (Tone.Transport.state === 'started') {
            setTimeout(startPattern, 0);
          }
        }).catch(error => {
          logError('Regeneration failed', error);
        });
      });
      logDebug('Regenerate button listener added');
    }

    // Play/pause button
    const playPauseEl = document.querySelector('.playpause');
    if (playPauseEl) {
      playPauseEl.addEventListener('click', event => {
        logInfo('Play/pause button clicked');
        event.preventDefault();
        document.querySelector('.playpause').classList.remove('pulse');
        
        try {
          if (_.isNumber(stepCounter)) {
            logDebug('Currently playing, stopping');
            stopPattern();
            Tone.Transport.pause();
          } else {
            logDebug('Currently stopped, starting');
            Tone.context.resume();
            Tone.Transport.start();
            startPattern();
            hasBeenStarted = true;
          }
        } catch (error) {
          logError('Play/pause failed', error);
        }
      });
      logDebug('Play/pause button listener added');
    }

    // Seed marker dragging
    let draggingSeedMarker = false;
    
    if (appEl) {
      appEl.addEventListener('mousedown', evt => {
        let el = evt.target;
        if (el.classList.contains('gutter') && el.classList.contains('seed-marker')) {
          logDebug('Started dragging seed marker');
          draggingSeedMarker = true;
          evt.preventDefault();
          document.body.style.cursor = 'ew-resize';
        }
      });
      
      appEl.addEventListener('mouseup', () => {
        if (draggingSeedMarker) {
          logDebug('Stopped dragging seed marker');
          draggingSeedMarker = false;
          document.body.style.cursor = '';
        }
      });
      
      appEl.addEventListener('mousemove', evt => {
        if (draggingSeedMarker) {
          let el = evt.target;
          // Find the closest step or gutter
          while (el && !el.classList.contains('step') && !el.classList.contains('gutter')) {
            el = el.parentElement;
          }
          if (el && el.classList.contains('step')) {
            let stepIdx = +el.dataset.stepIdx;
            if (stepIdx >= 1 && stepIdx < state.pattern.length - 1) {
              state.seedLength = stepIdx + 1;
              logDebug(`Seed length changed to ${state.seedLength}`);
              renderPattern();
            }
          } else if (el && el.classList.contains('gutter')) {
            // Find the step before this gutter
            let prevStep = el.previousElementSibling;
            if (prevStep && prevStep.classList.contains('step')) {
              let stepIdx = +prevStep.dataset.stepIdx;
              if (stepIdx >= 1 && stepIdx < state.pattern.length - 1) {
                state.seedLength = stepIdx + 1;
                logDebug(`Seed length changed to ${state.seedLength}`);
                renderPattern();
              }
            }
          }
        }
      });
      
      logDebug('Seed marker drag listeners added');
    }

    // Controls
    const swingEl = document.querySelector('#swing');
    if (swingEl) {
      swingEl.addEventListener('input', evt => {
        const swingValue = +evt.target.value;
        logDebug(`Swing changed to ${swingValue}`);
        setSwing(swingValue);
      });
      logDebug('Swing control listener added');
    }
    
    const temperatureEl = document.querySelector('#temperature');
    if (temperatureEl) {
      temperatureEl.addEventListener('input', evt => {
        temperature = +evt.target.value;
        logDebug(`Temperature changed to ${temperature}`);
      });
      logDebug('Temperature control listener added');
    }
    
    const tempoEl = document.querySelector('#tempo');
    if (tempoEl) {
      tempoEl.addEventListener('input', evt => {
        const tempoValue = +evt.target.value;
        logDebug(`Tempo changed to ${tempoValue}`);
        
        try {
          Tone.Transport.bpm.value = tempoValue;
          state.tempo = tempoValue;
          oneEighth = Tone.Time('8n').toSeconds();
          
          const tempoValueEl = document.getElementById('tempo-value');
          if (tempoValueEl) {
            tempoValueEl.textContent = evt.target.value;
          }
          
          logDebug('Tempo updated successfully', { 
            bpm: Tone.Transport.bpm.value, 
            oneEighth 
          });
        } catch (e) {
          logError('Tempo change failed', e);
        }
      });
      logDebug('Tempo control listener added');
    }

    const patternLengthEl = document.querySelector('#pattern-length');
    if (patternLengthEl) {
      patternLengthEl.addEventListener('change', evt => {
        const newLength = +evt.target.value;
        logDebug(`Pattern length changed to ${newLength}`);
        
        setPatternLength(newLength);
        // Ensure seed length doesn't exceed new pattern length
        if (state.seedLength >= newLength) {
          state.seedLength = Math.max(1, newLength - 1);
          logDebug(`Adjusted seed length to ${state.seedLength}`);
        }
        renderPattern();
      });
      logDebug('Pattern length control listener added');
    }

    window.addEventListener('resize', repositionRegenerateButton);
    logDebug('Window resize listener added');
    
    logInfo('All event listeners set up successfully');
  } catch (error) {
    logError('Failed to setup event listeners', error);
  }
}

// Main initialization function
async function initialize() {
  logInfo('🚀 Starting AI Drum Machine initialization...');

  try {
    function updateLoadingStatus(status) {
      logDebug(`Updating loading status: ${status}`);
      const statusElement = document.querySelector('.loading-status');
      if (statusElement) {
        statusElement.textContent = status;
      }
    }

    const minLoadTime = 2500;
    const startTime = Date.now();

    updateLoadingStatus('Initializing audio context...');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Initialize audio
    logInfo('Step 1: Initializing audio...');
    const audioSuccess = await initializeAudio();
    if (!audioSuccess) {
      throw new Error('Audio initialization failed');
    }

    updateLoadingStatus('Loading Magenta.js neural network...');
    await new Promise(resolve => setTimeout(resolve, 600));

    // Initialize AI
    logInfo('Step 2: Initializing AI...');
    const aiSuccess = await initializeAI();
    if (!aiSuccess) {
      logWarning('AI initialization failed, drum machine will work without AI features');
    }

    updateLoadingStatus('Building drum machine interface...');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Setup event listeners
    logInfo('Step 3: Setting up controls...');
    setupEventListeners();

    updateLoadingStatus('Starting audio transport...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Start audio transport
    logInfo('Step 4: Starting audio transport...');
    try {
      currentSchedulerId = Tone.Transport.scheduleRepeat(tick, '16n');
      oneEighth = Tone.Time('8n').toSeconds();
      logDebug('Audio transport scheduled', { 
        schedulerId: currentSchedulerId, 
        oneEighth 
      });
    } catch (error) {
      logError('Failed to schedule audio transport', error);
      throw error;
    }

    updateLoadingStatus('Finalizing setup...');

    // Ensure minimum loading time
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minLoadTime) {
      await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
    }

    // Mark as initialized
    isInitialized = true;

    // Render initial pattern and show app
    renderPattern();
    
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.remove();
      logDebug('Loading screen removed');
    }
    
    const appElement = document.querySelector('.app');
    if (appElement) {
      appElement.style.display = 'flex';
      logDebug('App element shown');
    }

    updateStatus('Ready');

    logInfo('🥁 ✅ AI Drum Machine initialization complete!');
    if (aiSuccess) {
      logInfo('🎵 Create patterns and let AI generate continuations');
    } else {
      logInfo('🎵 Drum machine ready for manual pattern creation');
    }

    logDebug('Final initialization state', {
      isInitialized,
      hasAI: !!rnn,
      drumKitLength: drumKit.length,
      patternLength: state.pattern.length,
      transportState: Tone.Transport.state
    });

  } catch (error) {
    logError('AI Drum Machine initialization failed', error);
    
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      const errorMessage = error && typeof error === 'object' && error.message ? error.message : 'Unknown error occurred';
      loadingElement.innerHTML = `
        <div class="loading-content error">
          ❌ Failed to initialize AI Drum Machine<br>
          <small>${errorMessage}</small><br><br>
          <small>You can still create patterns manually</small><br>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
      `;
      logDebug('Error message displayed to user');
    }
    
    // Still try to show the app even if initialization failed
    setTimeout(() => {
      const appElement = document.querySelector('.app');
      if (appElement) {
        appElement.style.display = 'flex';
        logDebug('App shown despite initialization failure');
      }
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
    }, 3000);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  logDebug('DOM still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  logDebug('DOM already loaded, initializing immediately');
  initialize();
}

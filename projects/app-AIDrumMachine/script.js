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

// Simplified logging functions
function logInfo(message) {
  console.log(`🥁 ${message}`);
}

function logError(message, error = null) {
  if (error) {
    console.error(`❌ ${message}:`, error);
  } else {
    console.error(`❌ ${message}`);
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

// Audio output handler
let outputs = {
  internal: {
    play: (drumIdx, velocity, time) => {
      try {
        if (drumKit[drumIdx]) {
          drumKit[drumIdx].get(velocity).start(time);
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

let stepEls = [];
let hasBeenStarted = false;
let oneEighth = Tone.Time('8n').toSeconds();
let activeOutput = 'internal';
let currentSchedulerId;
let stepCounter;

async function initializeAudio() {
  logInfo('Initializing audio system...');

  try {
    await Tone.start();
    logInfo('Tone.js audio context started');

    // Create reverb with fallback
    try {
      reverb = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01
      }).toDestination();
      await reverb.ready;
      reverb.wet.value = 0.35;
      logInfo('Reverb initialized');
    } catch (e) {
      reverb = new Tone.Gain(0.8).toDestination();
      logInfo('Using fallback gain instead of reverb');
    }

    // Create panning for snare
    let snarePanner = new Tone.Panner().connect(reverb);
    let snareLFO = new Tone.LFO(0.13, -0.25, 0.25);
    snareLFO.connect(snarePanner.pan);
    snareLFO.start();

    // Initialize drum kit with synth fallbacks
    let sampleBaseUrl = './sounds';

    // Create synthetic drum sounds as fallbacks
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
        return new Tone.Synth().connect(reverb);
      }
    };

    // Initialize drum kit with synthetic sounds
    drumKit = [
      // Kick
      {
        high: createSynthDrum('kick'),
        med: createSynthDrum('kick'),
        low: createSynthDrum('kick'),
        get: function(velocity) {
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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
          return {
            start: (time) => {
              try {
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

async function attemptToLoadSamples(sampleBaseUrl) {
  logInfo('Attempting to load actual drum samples...');

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

  try {
    // Test if the first sample exists
    const testSamplePath = `${sampleBaseUrl}/${samplePaths[0][0]}`;
    const testResponse = await fetch(testSamplePath);

    if (testResponse.ok) {
      logInfo('Sample files detected, loading actual drum sounds...');

      // Create panning for snare
      let snarePanner = new Tone.Panner().connect(reverb);
      let snareLFO = new Tone.LFO(0.13, -0.25, 0.25);
      snareLFO.connect(snarePanner.pan);
      snareLFO.start();

      // Replace synthetic drums with actual samples, maintaining the same interface
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
          return {
            start: (time) => {
              try {
                player.player(velocity).start(time);
              } catch (error) {
                logError(`Failed to start sample player ${index}`, error);
              }
            }
          };
        }
      }));

      logInfo('✅ Actual drum samples loaded successfully');
    } else {
      logInfo('No sample files found, using synthetic drums');
    }
  } catch (e) {
    logInfo('Sample files not available, using synthetic drums');
  }
}

function generatePattern(seed, length) {
  try {
    let seedSeq = toNoteSequence(seed);

    return rnn
      .continueSequence(seedSeq, length, temperature)
      .then(r => {
        const result = seed.concat(fromNoteSequence(r, length));
        logInfo('Pattern regenerated successfully');
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
  if (step % 4 === 0) {
    return 'high';
  } else if (step % 2 === 0) {
    return 'med';
  } else {
    return 'low';
  }
}

function humanizeTime(time) {
  return time - TIME_HUMANIZATION / 2 + Math.random() * TIME_HUMANIZATION;
}

function tick(time = Tone.now() - Tone.context.lookAhead) {
  if (_.isNumber(stepCounter) && state.pattern) {
    stepCounter++;

    let stepIdx = stepCounter % state.pattern.length;
    let isSwung = stepIdx % 2 !== 0;

    if (isSwung) {
      time += (state.swing - 0.5) * oneEighth;
    }

    let velocity = getStepVelocity(stepIdx);
    let drums = state.pattern[stepIdx];

    if (drums && drums.length > 0) {
      drums.forEach(d => {
        let humanizedTime = stepIdx === 0 ? time : humanizeTime(time);
        try {
          outputs[activeOutput].play(d, velocity, humanizedTime);
          visualizePlay(humanizedTime, stepIdx, d);
        } catch (error) {
          logError(`Failed to play drum ${d} in tick`, error);
        }
      });
    }
  }
}

function startPattern() {
  stepCounter = -1;
  updatePlayPauseIcons();
  updateStatus('Playing');
}

function stopPattern() {
  stepCounter = null;
  updatePlayPauseIcons();
  updateStatus('Stopped');
}

function visualizePlay(time, stepIdx, drumIdx) {
  try {
    Tone.Draw.schedule(() => {
      if (!stepEls[stepIdx]) {
        return;
      }

      let animTime = oneEighth * 4 * 1000;
      let cellEl = stepEls[stepIdx].cellEls[drumIdx];

      if (cellEl && cellEl.classList.contains('on')) {
        cellEl.classList.add('playing');
        setTimeout(() => {
          cellEl.classList.remove('playing');
        }, animTime);
      }
    }, time);
  } catch (error) {
    logError('Visualization failed', error);
  }
}

function renderPattern(regenerating = false) {
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
    }

    for (let stepIdx = 0; stepIdx < state.pattern.length; stepIdx++) {
      let step = state.pattern[stepIdx];
      let stepEl, gutterEl, cellEls;

      if (stepEls[stepIdx]) {
        stepEl = stepEls[stepIdx].stepEl;
        gutterEl = stepEls[stepIdx].gutterEl;
        cellEls = stepEls[stepIdx].cellEls;
      } else {
        stepEl = document.createElement('div');
        stepEl.classList.add('step');
        stepEl.dataset.stepIdx = stepIdx;
        seqEl.appendChild(stepEl);
        cellEls = [];
      }

      stepEl.style.flex = stepIdx % 2 === 0 ? state.swing : 1 - state.swing;

      // Only create gutters between steps, not after the last one
      if (!gutterEl && stepIdx < state.pattern.length - 1) {
        gutterEl = document.createElement('div');
        gutterEl.classList.add('gutter');
        seqEl.insertBefore(gutterEl, stepEl.nextSibling);
      }

      // Set seed marker on the correct gutter (after seed length - 1)
      if (gutterEl && stepIdx === state.seedLength - 1 && stepIdx > 0) {
        gutterEl.classList.add('seed-marker');
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
  } catch (error) {
    logError('Pattern rendering failed', error);
  }
}

function repositionRegenerateButton() {
  try {
    let regenButton = document.querySelector('.regenerate');
    let sequencerEl = document.querySelector('.sequencer');
    let seedMarkerEl = document.querySelector('.gutter.seed-marker');

    if (!regenButton || !sequencerEl || !seedMarkerEl) {
      return;
    }

    let regenLeft = sequencerEl.offsetLeft + seedMarkerEl.offsetLeft + seedMarkerEl.offsetWidth / 2 - regenButton.offsetWidth / 2;
    let regenTop = sequencerEl.offsetTop + seedMarkerEl.offsetTop + seedMarkerEl.offsetHeight / 2 - regenButton.offsetHeight / 2;

    regenButton.style.left = `${regenLeft}px`;
    regenButton.style.top = `${regenTop}px`;
    regenButton.style.visibility = 'visible';
  } catch (error) {
    logError('Failed to reposition regenerate button', error);
  }
}

function regenerate() {
  if (!rnn) {
    logError('AI model not loaded, cannot regenerate');
    updateStatus('AI not available');
    return Promise.resolve();
  }

  try {
    let seed = _.take(state.pattern, state.seedLength);

    renderPattern(true);
    updateStatus('Generating with AI...');

    return generatePattern(seed, state.patternLength - seed.length).then(
      result => {
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
  stopPattern();
  renderPattern();
}

function toggleStep(cellEl) {
  try {
    if (state.pattern && cellEl.classList.contains('cell')) {
      let stepIdx = +cellEl.dataset.stepIdx;
      let cellIdx = +cellEl.dataset.cellIdx;
      let isOn = cellEl.classList.contains('on');

      if (isOn) {
        _.pull(state.pattern[stepIdx], cellIdx);
        cellEl.classList.remove('on');
      } else {
        state.pattern[stepIdx].push(cellIdx);
        cellEl.classList.add('on');
      }
    }
  } catch (error) {
    logError('Failed to toggle step', error);
  }
}

function toNoteSequence(pattern) {
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

    return sequence;
  } catch (error) {
    logError('Failed to create note sequence', error);
    throw error;
  }
}

function fromNoteSequence(seq, patternLength) {
  try {
    let res = _.times(patternLength, () => []);
    for (let { pitch, quantizedStartStep } of seq.notes) {
      if (reverseMidiMapping.has(pitch)) {
        const drumIdx = reverseMidiMapping.get(pitch);
        if (quantizedStartStep < patternLength) {
          res[quantizedStartStep].push(drumIdx);
        }
      }
    }

    return res;
  } catch (error) {
    logError('Failed to convert note sequence', error);
    throw error;
  }
}

function setSwing(newSwing) {
  state.swing = newSwing;
  renderPattern();
}

function setPatternLength(newLength) {
  state.patternLength = newLength;

  // Adjust pattern array
  if (newLength > state.pattern.length) {
    // Add empty steps
    while (state.pattern.length < newLength) {
      state.pattern.push([]);
    }
  } else {
    // Remove excess steps
    state.pattern = state.pattern.slice(0, newLength);
  }

  onPatternUpdated();
}

function updatePlayPauseIcons() {
  try {
    const playIcon = document.querySelector('.playpause .play-icon');
    const pauseIcon = document.querySelector('.playpause .pause-icon');

    if (!playIcon || !pauseIcon) {
      return;
    }

    if (_.isNumber(stepCounter)) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  } catch (error) {
    logError('Failed to update play/pause icons', error);
  }
}

function updateStatus(message) {
  try {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'status-indicator';
      if (message === 'Playing') {
        statusEl.classList.add('playing');
      }
    }
  } catch (error) {
    logError('Failed to update status', error);
  }
}

function setupEventListeners() {
  try {
    // Cell clicking
    const appEl = document.querySelector('.app');
    if (appEl) {
      appEl.addEventListener('click', event => {
        if (event.target.classList.contains('cell')) {
          toggleStep(event.target);
        }
      });
    }

    // Generate button
    const regenEl = document.querySelector('.regenerate');
    if (regenEl) {
      regenEl.addEventListener('click', event => {
        event.preventDefault();
        event.currentTarget.classList.remove('pulse');
        document.querySelector('.playpause').classList.remove('pulse');

        regenerate().then(() => {
          if (!hasBeenStarted) {
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
    }

    // Play/pause button
    const playPauseEl = document.querySelector('.playpause');
    if (playPauseEl) {
      playPauseEl.addEventListener('click', event => {
        event.preventDefault();
        document.querySelector('.playpause').classList.remove('pulse');

        try {
          if (_.isNumber(stepCounter)) {
            stopPattern();
            Tone.Transport.pause();
          } else {
            Tone.context.resume();
            Tone.Transport.start();
            startPattern();
            hasBeenStarted = true;
          }
        } catch (error) {
          logError('Play/pause failed', error);
        }
      });
    }

    // Removed seed marker dragging functionality to prevent issues

    // Controls
    const swingEl = document.querySelector('#swing');
    if (swingEl) {
      swingEl.addEventListener('input', evt => {
        const swingValue = +evt.target.value;
        setSwing(swingValue);
      });
    }

    const temperatureEl = document.querySelector('#temperature');
    if (temperatureEl) {
      temperatureEl.addEventListener('input', evt => {
        temperature = +evt.target.value;
      });
    }

    const tempoEl = document.querySelector('#tempo');
    if (tempoEl) {
      tempoEl.addEventListener('input', evt => {
        const tempoValue = +evt.target.value;

        try {
          Tone.Transport.bpm.value = tempoValue;
          state.tempo = tempoValue;
          oneEighth = Tone.Time('8n').toSeconds();

          const tempoValueEl = document.getElementById('tempo-value');
          if (tempoValueEl) {
            tempoValueEl.textContent = evt.target.value;
          }
        } catch (e) {
          logError('Tempo change failed', e);
        }
      });
    }

    const patternLengthEl = document.querySelector('#pattern-length');
    if (patternLengthEl) {
      patternLengthEl.addEventListener('change', evt => {
        const newLength = +evt.target.value;

        setPatternLength(newLength);
        // Ensure seed length doesn't exceed new pattern length
        if (state.seedLength >= newLength) {
          state.seedLength = Math.max(1, newLength - 1);
        }
        renderPattern();
      });
    }

    window.addEventListener('resize', repositionRegenerateButton);
  } catch (error) {
    logError('Failed to setup event listeners', error);
  }
}

// Main initialization function
async function initialize() {
  logInfo('🚀 Starting AI Drum Machine initialization...');

  try {
    function updateLoadingStatus(status) {
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
      logInfo('AI initialization failed, drum machine will work without AI features');
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
    }

    const appElement = document.querySelector('.app');
    if (appElement) {
      appElement.style.display = 'flex';
    }

    updateStatus('Ready');

    logInfo('🥁 ✅ AI Drum Machine initialization complete!');
    if (aiSuccess) {
      logInfo('🎵 Create patterns and let AI generate continuations');
    } else {
      logInfo('🎵 Drum machine ready for manual pattern creation');
    }

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
    }

    // Still try to show the app even if initialization failed
    setTimeout(() => {
      const appElement = document.querySelector('.app');
      if (appElement) {
        appElement.style.display = 'flex';
      }
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
    }, 3000);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

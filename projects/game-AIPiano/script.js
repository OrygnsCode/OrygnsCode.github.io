const MIN_NOTE = 48;
const MAX_NOTE = 84;

console.log('🎹 Initializing AI Piano...');

// AI and audio components
let rnn;
let temperature = 1.1;
let reverb;
let sampler;
let synthFilter;
let synthsPlaying = {};

// UI and interaction components
let builtInKeyboard;
let onScreenKeyboardContainer;
let onScreenKeyboard = [];

// Application state
let currentSeed = [];
let stopCurrentSequenceGenerator;
let showKeyboardLetters = true;
let showNoteNames = true;
let isInitialized = false;

// Note mappings
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const keyboardMap = {
  'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65, 't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'o': 72, 'k': 72, 'p': 73, 'l': 74
};

// Enhanced logging function
function logDebug(message, data = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  console.log(`[${timestamp}] 🎵 ${message}`, data || '');
}

function logError(message, error = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  console.error(`[${timestamp}] ❌ ${message}`, error || '');
}

function isAccidental(note) {
  let pc = note % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

function buildKeyboard(container) {
  if (!container) {
    logError('Container not found for keyboard building');
    return [];
  }

  // Clear existing keyboard
  container.innerHTML = '';

  let nAccidentals = _.range(MIN_NOTE, MAX_NOTE + 1).filter(isAccidental).length;
  let keyWidthPercent = 100 / (MAX_NOTE - MIN_NOTE - nAccidentals + 1);
  let keyInnerWidthPercent = 100 / (MAX_NOTE - MIN_NOTE - nAccidentals + 1) - 0.5;
  let gapPercent = keyWidthPercent - keyInnerWidthPercent;
  let accumulatedWidth = 0;

  return _.range(MIN_NOTE, MAX_NOTE + 1).map(note => {
    let accidental = isAccidental(note);
    let key = document.createElement('div');
    key.classList.add('key');
    key.dataset.note = note;

    if (accidental) {
      key.classList.add('accidental');
      key.style.left = `${accumulatedWidth - gapPercent - (keyWidthPercent / 2 - gapPercent) / 2}%`;
      key.style.width = `${keyWidthPercent / 2}%`;
    } else {
      key.style.left = `${accumulatedWidth}%`;
      key.style.width = `${keyInnerWidthPercent}%`;
    }

    // Add keyboard letter if it exists
    const keyboardLetter = getKeyboardLetter(note);
    if (keyboardLetter && showKeyboardLetters) {
      const letterSpan = document.createElement('span');
      letterSpan.className = 'key-letter';
      letterSpan.textContent = keyboardLetter.toUpperCase();
      key.appendChild(letterSpan);
    }

    // Add note name
    if (showNoteNames) {
      const noteSpan = document.createElement('span');
      noteSpan.className = 'note-name';
      noteSpan.textContent = getNoteNameFromMidi(note);
      key.appendChild(noteSpan);
    }

    container.appendChild(key);
    if (!accidental) accumulatedWidth += keyWidthPercent;
    return key;
  });
}

function getKeyboardLetter(midiNote) {
  for (const [letter, note] of Object.entries(keyboardMap)) {
    if (note === midiNote) return letter;
  }
  return null;
}

function getNoteNameFromMidi(midiNote) {
  const noteIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return noteNames[noteIndex] + octave;
}

function getSeedIntervals(seed) {
  let intervals = [];
  for (let i = 0; i < seed.length - 1; i++) {
    let rawInterval = seed[i + 1].time - seed[i].time;
    let measure = _.minBy(['8n', '4n'], subdiv =>
      Math.abs(rawInterval - Tone.Time(subdiv).toSeconds())
    );
    intervals.push(Tone.Time(measure).toSeconds());
  }
  return intervals;
}

function getSequenceLaunchWaitTime(seed) {
  if (seed.length <= 1) return 1;
  let intervals = getSeedIntervals(seed);
  let maxInterval = _.max(intervals);
  return maxInterval * 2;
}

function getSequencePlayIntervalTime(seed) {
  if (seed.length <= 1) return Tone.Time('8n').toSeconds();
  let intervals = getSeedIntervals(seed).sort();
  return _.first(intervals);
}

function detectChord(notes) {
  if (!notes.length) return ['CM'];
  try {
    // Simple chord detection - just use basic triads
    const noteSet = [...new Set(notes.map(n => n.note % 12))].sort();

    // Major chords
    const majorChords = [
      { pattern: [0, 4, 7], name: 'CM' },
      { pattern: [1, 5, 8], name: 'C#M' },
      { pattern: [2, 6, 9], name: 'DM' },
      { pattern: [3, 7, 10], name: 'D#M' },
      { pattern: [4, 8, 11], name: 'EM' },
      { pattern: [5, 9, 0], name: 'FM' },
      { pattern: [6, 10, 1], name: 'F#M' },
      { pattern: [7, 11, 2], name: 'GM' },
      { pattern: [8, 0, 3], name: 'G#M' },
      { pattern: [9, 1, 4], name: 'AM' },
      { pattern: [10, 2, 5], name: 'A#M' },
      { pattern: [11, 3, 6], name: 'BM' }
    ];

    // Find matching chord
    for (const chord of majorChords) {
      if (chord.pattern.every(note => noteSet.includes(note))) {
        return [chord.name];
      }
    }

    // Default fallback
    return ['CM'];
  } catch (e) {
    logError('Chord detection failed, using CM', e);
    return ['CM'];
  }
}

function buildNoteSequence(seed) {
  try {
    return mm.sequences.quantizeNoteSequence(
      {
        ticksPerQuarter: 220,
        totalTime: seed.length * 0.5,
        quantizationInfo: { stepsPerQuarter: 1 },
        timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
        tempos: [{ time: 0, qpm: 120 }],
        notes: seed.map((n, idx) => ({
          pitch: n.note,
          startTime: idx * 0.5,
          endTime: (idx + 1) * 0.5
        }))
      },
      1
    );
  } catch (e) {
    logError('Failed to build note sequence', e);
    return null;
  }
}

function startSequenceGenerator(seed) {
  if (!rnn || !rnn.isInitialized()) {
    logError('RNN not initialized, cannot start sequence generator');
    return () => {};
  }

  logDebug(`Starting AI sequence generator with ${seed.length} seed notes`);

  let running = true;
  let lastGenerationTask = Promise.resolve();

  let chords = detectChord(seed);
  let chord = _.first(chords) || 'CM';
  let seedSeq = buildNoteSequence(seed);

  if (!seedSeq) {
    logError('Failed to create seed sequence');
    return () => {};
  }

  let generatedSequence = [];
  let launchWaitTime = getSequenceLaunchWaitTime(seed);
  let playIntervalTime = getSequencePlayIntervalTime(seed);
  let generationIntervalTime = playIntervalTime;

  logDebug(`AI parameters - Chord: ${chord}, Wait: ${launchWaitTime}s, Interval: ${playIntervalTime}s`);

  function generateNext() {
    if (!running) return;
    if (generatedSequence.length < 8) {
      logDebug('Generating next AI sequence...');
      lastGenerationTask = rnn
        .continueSequence(seedSeq, 10, temperature, [chord])
        .then(genSeq => {
          if (genSeq && genSeq.notes && running) {
            const newNotes = genSeq.notes.map(n => n.pitch);
            generatedSequence = generatedSequence.concat(newNotes);
            logDebug(`AI generated ${newNotes.length} new notes`);
          }
          if (running) {
            setTimeout(generateNext, generationIntervalTime * 1000);
          }
        })
        .catch(err => {
          logError('AI generation failed', err);
          if (running) {
            setTimeout(generateNext, generationIntervalTime * 1000);
          }
        });
    } else {
      if (running) {
        setTimeout(generateNext, generationIntervalTime * 1000);
      }
    }
  }

  function consumeNext(time) {
    if (generatedSequence.length && running) {
      let note = generatedSequence.shift();
      if (note > 0) {
        machineKeyDown(note, time);
      }
    }
  }

  setTimeout(generateNext, launchWaitTime * 1000);
  let consumerId = Tone.Transport.scheduleRepeat(
    consumeNext,
    playIntervalTime,
    Tone.Transport.seconds + launchWaitTime
  );

  return () => {
    logDebug('Stopping AI sequence generator');
    running = false;
    Tone.Transport.clear(consumerId);
  };
}

function updateChord({ add = null, remove = null }) {
  if (add) {
    currentSeed.push({ note: add, time: Tone.now() });
    logDebug(`Added note ${add} to seed (${currentSeed.length} notes)`);
  }
  if (remove && _.some(currentSeed, { note: remove })) {
    _.remove(currentSeed, { note: remove });
    logDebug(`Removed note ${remove} from seed (${currentSeed.length} notes)`);
  }

  if (stopCurrentSequenceGenerator) {
    stopCurrentSequenceGenerator();
    stopCurrentSequenceGenerator = null;
  }
  if (currentSeed.length && !stopCurrentSequenceGenerator && isInitialized) {
    stopCurrentSequenceGenerator = startSequenceGenerator(_.cloneDeep(currentSeed));
  }
}

function humanKeyDown(note, velocity = 0.7) {
  if (note < MIN_NOTE || note > MAX_NOTE) return;

  try {
    let freq = Tone.Frequency(note, 'midi');

    // Enhanced synth for human playing
    let synth = new Tone.Synth({
      oscillator: { type: 'fattriangle' },
      envelope: { attack: 0.1, sustain: 1, release: 1 }
    });

    if (synthFilter) {
      synth.connect(synthFilter);
    } else {
      synth.toDestination();
    }

    synthsPlaying[note] = synth;
    synth.triggerAttack(freq, Tone.now(), velocity);

    if (sampler && sampler.loaded) {
      sampler.triggerAttack(freq);
    }

    updateChord({ add: note });

    animatePlay(onScreenKeyboard[note - MIN_NOTE], note, true);

  } catch (e) {
    logError(`Failed to play human note ${note}`, e);
  }
}

function humanKeyUp(note) {
  if (note < MIN_NOTE || note > MAX_NOTE) return;

  try {
    if (synthsPlaying[note]) {
      let synth = synthsPlaying[note];
      synth.triggerRelease();
      setTimeout(() => {
        try {
          synth.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
      }, 2000);
      synthsPlaying[note] = null;
    }

    updateChord({ remove: note });

  } catch (e) {
    logError(`Failed to release human note ${note}`, e);
  }
}

function machineKeyDown(note, time) {
  if (note < MIN_NOTE || note > MAX_NOTE) return;

  try {
    if (sampler && sampler.loaded) {
      sampler.triggerAttack(Tone.Frequency(note, 'midi'));
    }
    animatePlay(onScreenKeyboard[note - MIN_NOTE], note, false);
  } catch (e) {
    logError(`Failed to play machine note ${note}`, e);
  }
}

function animatePlay(keyEl, note, isHuman) {
  if (!keyEl) return;
  try {
    let sourceColor = isHuman ? '#1E88E5' : '#E91E63';
    let targetColor = isAccidental(note) ? '#2c2c2c' : '#ffffff';

    keyEl.classList.add(isHuman ? 'human-playing' : 'ai-playing');

    keyEl.animate(
      [{ backgroundColor: sourceColor }, { backgroundColor: targetColor }],
      { duration: isHuman ? 300 : 700, easing: 'ease-out' }
    );

    setTimeout(() => {
      keyEl.classList.remove(isHuman ? 'human-playing' : 'ai-playing');
    }, isHuman ? 300 : 700);
  } catch (e) {
    logError('Animation failed', e);
  }
}

function updateToggleDisplay() {
  logDebug('Updating keyboard display settings');
  // Rebuild keyboard with new toggle settings
  onScreenKeyboard = buildKeyboard(onScreenKeyboardContainer);
  setupMouseControls();
}

function setupMouseControls() {
  let pointedNotes = new Set();

  function updateTouchedNotes(evt) {
    let touchedNotes = new Set();
    for (let touch of Array.from(evt.touches)) {
      let element = document.elementFromPoint(touch.clientX, touch.clientY);
      let keyIndex = onScreenKeyboard.indexOf(element);
      if (keyIndex >= 0) {
        touchedNotes.add(MIN_NOTE + keyIndex);
        if (!evt.defaultPrevented) {
          evt.preventDefault();
        }
      }
    }
    for (let note of pointedNotes) {
      if (!touchedNotes.has(note)) {
        humanKeyUp(note);
        pointedNotes.delete(note);
      }
    }
    for (let note of touchedNotes) {
      if (!pointedNotes.has(note)) {
        humanKeyDown(note);
        pointedNotes.add(note);
      }
    }
  }

  onScreenKeyboard.forEach((noteEl, index) => {
    if (!noteEl) return;

    noteEl.addEventListener('mousedown', evt => {
      humanKeyDown(MIN_NOTE + index);
      pointedNotes.add(MIN_NOTE + index);
      evt.preventDefault();
    });

    noteEl.addEventListener('mouseover', () => {
      if (pointedNotes.size && !pointedNotes.has(MIN_NOTE + index)) {
        humanKeyDown(MIN_NOTE + index);
        pointedNotes.add(MIN_NOTE + index);
      }
    });
  });

  document.documentElement.addEventListener('mouseup', () => {
    pointedNotes.forEach(n => humanKeyUp(n));
    pointedNotes.clear();
  });

  document.documentElement.addEventListener('touchstart', updateTouchedNotes);
  document.documentElement.addEventListener('touchmove', updateTouchedNotes);
  document.documentElement.addEventListener('touchend', updateTouchedNotes);
}

function setupKeyboardControls() {
  // Computer keyboard controls
  const pressedKeys = new Set();

  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keyboardMap[key] && !pressedKeys.has(key)) {
      pressedKeys.add(key);
      humanKeyDown(keyboardMap[key]);
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keyboardMap[key] && pressedKeys.has(key)) {
      pressedKeys.delete(key);
      humanKeyUp(keyboardMap[key]);
      e.preventDefault();
    }
  });

  logDebug('Computer keyboard controls initialized');
}

function initializeControls() {
  logDebug('Initializing UI controls');

  // Get DOM elements
  onScreenKeyboardContainer = document.querySelector('.keyboard');

  if (!onScreenKeyboardContainer) {
    logError('Keyboard container not found');
    return false;
  }

  // Build initial keyboard
  onScreenKeyboard = buildKeyboard(onScreenKeyboardContainer);

  // Setup controls
  setupMouseControls();
  setupKeyboardControls();

  // Toggle controls
  const showKeysToggle = document.getElementById('showKeys');
  const showNotesToggle = document.getElementById('showNotes');

  if (showKeysToggle) {
    showKeysToggle.addEventListener('change', (e) => {
      showKeyboardLetters = e.target.checked;
      updateToggleDisplay();
    });
  }

  if (showNotesToggle) {
    showNotesToggle.addEventListener('change', (e) => {
      showNoteNames = e.target.checked;
      updateToggleDisplay();
    });
  }

  

  return true;
}

async function initializeAudio() {
  logDebug('Initializing audio system...');

  try {
    // Start Tone.js audio context
    await Tone.start();
    logDebug('Tone.js audio context started');

    // Create reverb
    try {
      reverb = new Tone.Reverb({
        decay: 2,
        wet: 0.25
      }).toDestination();
      logDebug('Reverb initialized');
    } catch (e) {
      logError('Reverb initialization failed, using direct output', e);
      reverb = null;
    }

    // Create sampler with high-quality sounds
    try {
      sampler = new Tone.Sampler({
        urls: {
          C3: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-c3.mp3',
          'D#3': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-ds3.mp3',
          'F#3': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-fs3.mp3',
          A3: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-a3.mp3',
          C4: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-c4.mp3',
          'D#4': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-ds4.mp3',
          'F#4': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-fs4.mp3',
          A4: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-a4.mp3',
          C5: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-c5.mp3',
          'D#5': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-ds5.mp3',
          'F#5': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-fs5.mp3',
          A5: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/plastic-marimba-a5.mp3'
        },
        release: 2
      });

      if (reverb) {
        sampler.connect(reverb);
      } else {
        sampler.toDestination();
      }

      logDebug('Sampler initialized with high-quality sounds');
    } catch (e) {
      logError('Sampler initialization failed', e);
      sampler = null;
    }

    // Create synth filter for human playing
    try {
      synthFilter = new Tone.Filter(300, 'lowpass').connect(new Tone.Gain(0.4).toDestination());
      logDebug('Synth filter initialized');
    } catch (e) {
      logError('Synth filter initialization failed', e);
      synthFilter = null;
    }

    return true;
  } catch (e) {
    logError('Audio initialization failed', e);
    return false;
  }
}

async function initializeAI() {
  logDebug('Initializing AI system (Google Magenta)...');

  try {
    // Check if Magenta is available
    if (typeof mm === 'undefined') {
      throw new Error('Magenta.js (mm) not loaded - check network connection');
    }

    logDebug('Magenta.js detected, initializing Improv RNN model...');

    // Initialize the Improv RNN model from Google Magenta
    rnn = new mm.MusicRNN(
      'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv'
    );

    logDebug('Loading RNN model... (this may take a moment)');
    await rnn.initialize();
    logDebug('✅ RNN model loaded successfully');

    // Test model with a simple sequence
    logDebug('Testing AI model...');
    const testSeed = buildNoteSequence([{ note: 60, time: Tone.now() }]);
    if (testSeed) {
      try {
        await rnn.continueSequence(testSeed, 5, temperature, ['CM']);
        logDebug('✅ AI model test successful');
      } catch (e) {
        logError('AI model test failed', e);
      }
    }

    return true;
  } catch (e) {
    logError('AI initialization failed', e);
    return false;
  }
}

// Main initialization function
async function initialize() {
  logDebug('🚀 Starting AI Piano initialization...');

  try {
    // Update loading message
    function updateLoadingStatus(status) {
      const statusElement = document.querySelector('.loading-status');
      if (statusElement) {
        statusElement.textContent = status;
      }
    }

    // Minimum loading time for better UX
    const minLoadTime = 2500;
    const startTime = Date.now();

    updateLoadingStatus('Initializing audio context...');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Initialize audio first
    logDebug('Step 1: Initializing audio...');
    const audioSuccess = await initializeAudio();
    if (!audioSuccess) {
      throw new Error('Audio initialization failed');
    }

    updateLoadingStatus('Loading Magenta.js neural network...');
    await new Promise(resolve => setTimeout(resolve, 600));

    // Initialize AI
    logDebug('Step 2: Initializing AI...');
    const aiSuccess = await initializeAI();
    if (!aiSuccess) {
      logError('AI initialization failed, piano will work without AI features');
    }

    updateLoadingStatus('Building piano interface...');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Initialize controls
    logDebug('Step 3: Initializing controls...');
    const controlsSuccess = initializeControls();
    if (!controlsSuccess) {
      throw new Error('Controls initialization failed');
    }

    updateLoadingStatus('Starting audio transport...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Start audio transport
    logDebug('Step 4: Starting audio transport...');
    Tone.Transport.start();
    logDebug('Audio transport started');

    updateLoadingStatus('Finalizing setup...');
    
    // Ensure minimum loading time
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minLoadTime) {
      await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
    }

    // Mark as initialized
    isInitialized = true;

    // Show keyboard and remove loading
    if (onScreenKeyboardContainer) {
      onScreenKeyboardContainer.classList.add('loaded');
    }
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.remove();
    }

    logDebug('🎹 ✅ AI Piano initialization complete!');
    if (aiSuccess) {
      logDebug('🎵 Start playing to collaborate with the AI using Google Magenta');
    } else {
      logDebug('🎵 Piano ready for manual play (AI features disabled)');
    }

    // Start audio context if needed
    if (typeof StartAudioContext !== 'undefined') {
      StartAudioContext(Tone.context, document.documentElement);
    }

  } catch (error) {
    logError('❌ AI Piano initialization failed', error);
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="loading-content error">
          ❌ Failed to initialize AI Piano<br>
          <small>${error.message}</small><br><br>
          <small>You can still play the piano manually</small>
        </div>
      `;
    }

    // Try to at least initialize basic controls
    try {
      initializeControls();
    } catch (e) {
      logError('Even basic controls failed to initialize', e);
    }
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

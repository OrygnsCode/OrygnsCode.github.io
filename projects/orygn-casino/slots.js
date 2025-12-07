/**
 * Slots Game Logic
 * Standalone module for /slots route
 */

document.addEventListener('DOMContentLoaded', () => {
    initSlotsGame();
});

/* --- Config --- */
const SYMBOLS = [
    { id: 'seven', weight: 1, payout: 10 },    // Rare
    { id: 'diamond', weight: 2, payout: 5 },
    { id: 'crown', weight: 3, payout: 4 },
    { id: 'wild', weight: 4, payout: 3 },      // Wild mechanic TODO
    { id: 'star', weight: 6, payout: 2 },
    { id: 'cherry', weight: 8, payout: 1 },    // Common
];

const REELS_COUNT = 5;
const ROWS_COUNT = 3;
const SYMBOL_HEIGHT = 133.33; // Matches CSS
const SPIN_DURATION_MS = 2000;

// State
let currentBet = 1.00;
let isSpinning = false;
let autoSpinActive = false;
let reelInstances = []; // Array of DOM elements

function initSlotsGame() {
    console.log("Slots: Init started");

    // 1. Sync Balance (Listen for updates)
    // 1. Sync Balance (Listen for updates)
    BalanceManager.subscribe(newBal => {
        const el = document.getElementById('userBalance');
        if (el) el.innerHTML = `${newBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    });

    // Init Display
    updateBalanceDisplay();

    // 2. Build Reels
    generateInitialReels();

    // 3. Bind Controls
    const btnSpin = document.getElementById('btnSpin');
    if (btnSpin) btnSpin.addEventListener('click', spinReels);

    const btnInc = document.getElementById('btnBetIncrease');
    if (btnInc) btnInc.addEventListener('click', () => adjustBet(1));

    const btnDec = document.getElementById('btnBetDecrease');
    if (btnDec) btnDec.addEventListener('click', () => adjustBet(-1));

    const btnAuto = document.getElementById('btnAutoSpin');
    if (btnAuto) btnAuto.addEventListener('click', toggleAutoSpin);

    // Bet Input Manual Entry
    const betInput = document.getElementById('betInput');
    if (betInput) {
        betInput.addEventListener('change', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0.1) val = 1.00;
            currentBet = val;
            e.target.value = currentBet.toFixed(2);
        });
    }

    // 4. Init UI State
    updateAutoSpinInputVisibility();
}

function updateBalanceDisplay() {
    const el = document.getElementById('userBalance');
    if (el) el.innerHTML = `${BalanceManager.get().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function adjustBet(delta) {
    if (isSpinning) return;
    currentBet += delta;
    if (currentBet < 0.1) currentBet = 0.1;
    // Cap bet if needed?
    document.getElementById('betInput').value = currentBet.toFixed(2);
}

function generateInitialReels() {
    const container = document.getElementById('reelsContainer');
    container.innerHTML = '';

    for (let i = 0; i < REELS_COUNT; i++) {
        const col = document.createElement('div');
        col.className = 'reel-col';
        col.id = `reel-${i}`;

        // Populate with random symbols initially
        const initialSymbols = getRandomSymbols(ROWS_COUNT + 1); // +1 for animation buffer
        initialSymbols.forEach(sym => {
            col.appendChild(createSymbolElement(sym));
        });

        container.appendChild(col);
    }
}

// Config - Dynamic
function getSpinDuration() {
    return document.getElementById('btnTurbo')?.checked ? 150 : 2000;
}
function getStaggerDelay() {
    return document.getElementById('btnTurbo')?.checked ? 50 : 300;
}

// Sound Manager (Softer)
const Sound = {
    synth: null,
    winSynth: null,
    init: async () => {
        if (!window.Tone) return;
        await Tone.start();

        // Softer FM Synth
        Sound.synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
        Sound.synth.volume.value = -12;
        Sound.synth.set({
            harmonicity: 0.5,
            modulationIndex: 0.5,
            oscillator: { type: "sine" },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.5 }
        });

        // Softer Win Synth
        Sound.winSynth = new Tone.Synth({
            oscillator: { type: "fmsine" },
            envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 2 } // Slower bells
        }).toDestination();
        Sound.winSynth.volume.value = -8;
    },
    playSpin: () => {
        // Lower Octaves (C3/C4)
        if (Sound.synth) Sound.synth.triggerAttackRelease(["C3", "E3", "G3"], "32n");
    },
    playWin: (amount) => {
        if (!Sound.winSynth) return;
        if (amount > 10) {
            // Big Win: Pentatonic Scale Up (Lower)
            const now = Tone.now();
            Sound.winSynth.triggerAttackRelease("C4", "8n", now);
            Sound.winSynth.triggerAttackRelease("D4", "8n", now + 0.15);
            Sound.winSynth.triggerAttackRelease("E4", "8n", now + 0.3);
            Sound.winSynth.triggerAttackRelease("G4", "8n", now + 0.45);
            Sound.winSynth.triggerAttackRelease("A4", "4n", now + 0.6);
        } else {
            // Small Win
            Sound.winSynth.triggerAttackRelease("C5", "8n"); // Just one chime
        }
    }
};

// SVG PATHS (Enhanced)
const ICONS = {
    // Bold '7' - Classic
    'seven': `<path d="M10,10 L50,10 L30,55" fill="none" stroke="#FF0055" stroke-width="8" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M10,10 L50,10 L30,55" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="butt" stroke-linejoin="miter"/>`,

    // Improved Diamond
    'diamond': `<path d="M30,5 L55,20 L30,55 L5,20 Z" fill="rgba(0,243,255,0.1)" stroke="#00F3FF" stroke-width="2" stroke-linejoin="round"/><path d="M5,20 L55,20" stroke="#00F3FF" stroke-width="1"/><path d="M30,5 L30,55" stroke="#00F3FF" stroke-width="1"/>`,

    'crown': `<path d="M10,45 L10,25 L20,35 L30,15 L40,35 L50,25 L50,45 Z" fill="none" stroke="#FFD700" stroke-width="2" stroke-linejoin="round"/><circle cx="10" cy="20" r="2" fill="#FFD700"/><circle cx="30" cy="10" r="2" fill="#FFD700"/><circle cx="50" cy="20" r="2" fill="#FFD700"/>`,
    'wild': `<rect x="5" y="15" width="50" height="30" rx="4" fill="#A020F0" stroke="#fff" stroke-width="2"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="'Outfit', sans-serif" font-weight="900" font-size="16">WILD</text>`,
    'star': `<path d="M30,10 L36,25 L52,25 L40,35 L45,50 L30,42 L15,50 L20,35 L8,25 L24,25 Z" fill="none" stroke="#BAC4D1" stroke-width="1.5" stroke-linejoin="round"/>`,
    'cherry': `<circle cx="20" cy="40" r="8" fill="#FF4D4D" stroke="#fff" stroke-width="1"/><circle cx="40" cy="40" r="8" fill="#FF4D4D" stroke="#fff" stroke-width="1"/><path d="M20,32 Q30,10 40,32" fill="none" stroke="#00E701" stroke-width="3" stroke-linecap="round"/><path d="M30,10 L35,5" stroke="#00E701" stroke-width="3"/>`
};

function createSymbolElement(symbolId) {
    const div = document.createElement('div');
    div.className = 'reel-symbol';
    div.dataset.symbol = symbolId;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', '0 0 60 60');
    svg.style.overflow = 'visible'; // Ensure strokes aren't clipped

    // Inject HTML directly
    svg.innerHTML = ICONS[symbolId] || ICONS['seven'];

    div.appendChild(svg);
    return div;
}

function getRandomSymbols(count) {
    // Weighted Random
    const pool = [];
    SYMBOLS.forEach(s => {
        for (let i = 0; i < s.weight; i++) pool.push(s.id);
    });

    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return result;
}

async function spinReels() {
    if (isSpinning) return;

    // Init Audio context on first interaction
    if (window.Tone && Tone.context.state !== 'running') {
        await Sound.init();
    }

    const balance = BalanceManager.get();
    if (balance < currentBet) {
        alert("Insufficient Balance"); // TODO: Use nicer notification
        autoSpinActive = false;
        updateAutoSpinBtn();
        return;
    }

    isSpinning = true;
    Sound.playSpin(); // SFX

    // Deduct Bet
    BalanceManager.update(-currentBet);
    // updateBalanceDisplay handled by listener

    // Clear previous
    document.getElementById('paylinesOverlay').innerHTML = '';
    document.querySelectorAll('.reel-symbol.winner').forEach(el => el.classList.remove('winner'));
    removeConfetti();

    document.getElementById('btnSpin').disabled = true;
    document.getElementById('lastWin').textContent = "0.00 ORY";
    document.getElementById('lastWin').style.color = 'var(--text-secondary)';
    document.getElementById('lastWin').style.textShadow = 'none';

    // Generate Outcome (RTP Logic Here - Simple Random for now)
    // We generate the final 3 rows for all 5 reels
    const outcome = [];
    for (let i = 0; i < REELS_COUNT; i++) {
        outcome.push(getRandomSymbols(ROWS_COUNT));
    }

    // Animate
    const reels = document.querySelectorAll('.reel-col');

    // Outcome layout: [Col0[Row0, Row1, Row2], ...]

    const duration = getSpinDuration();
    const stagger = getStaggerDelay();

    const promises = Array.from(reels).map((reel, index) => {
        return new Promise(resolve => {
            // Stagger start
            setTimeout(() => {
                // 1. Prepare "Blur Strip"
                // Append a sequence of random symbols to simulate motion
                const stripFragment = document.createDocumentFragment();
                const tempSymbols = getRandomSymbols(30); // 30 randoms for blur
                tempSymbols.forEach(s => stripFragment.appendChild(createSymbolElement(s)));

                // Append outcome at bottom
                outcome[index].forEach(s => stripFragment.appendChild(createSymbolElement(s)));

                reel.appendChild(stripFragment);

                // 2. Start CSS Animation (TranslateY)
                // We want to scroll up (move content up) so new symbols appear from bottom?
                // Actually Slots usually scroll DOWN (symbols fall from top).
                // If scrolling down, we need to prepend? 

                // Simplified: "Fast Scroll" via Transition
                // We are currently at translateY(0).
                // We want to move to roughly -2000px?

                // Let's use a trick:
                // Prepend the 20 symbols + outcome ABOVE the current view.
                // Animate from -height to 0.

                // Let's try the "Blur + Swap" improved:
                reel.style.transition = `transform ${duration / 1000}s cubic-bezier(0.5, 0, 0.2, 1)`;
                reel.style.transform = `translateY(-${3000 + (Math.random() * 200)}px)`; // Move wildly
                reel.classList.add('spinning'); // Adds blur

                // After spin duration, we reset
                setTimeout(() => {
                    reel.classList.remove('spinning');
                    reel.style.transition = 'none';
                    reel.style.transform = 'translateY(0)';

                    // Force Reflow
                    void reel.offsetWidth;

                    // Set Final Content
                    reel.innerHTML = '';
                    outcome[index].forEach(sym => reel.appendChild(createSymbolElement(sym)));

                    // Stop Sound per reel?
                    // if(index === 4) Sound.playStop();

                    // Small "Bounce" Effect?
                    reel.style.animation = 'none';
                    setTimeout(() => reel.style.animation = 'bounceStop 0.2s ease-out', 10);

                    resolve();
                }, duration + (index * stagger));

            }, index * (stagger / 3));
        });
    });

    await Promise.all(promises);

    // Check Win
    checkWin(outcome);

    isSpinning = false;
    document.getElementById('btnSpin').disabled = false;

    if (autoSpinActive) {
        const countEl = document.getElementById('autoSpinCount');
        let remaining = parseInt(countEl.value);

        if (!isNaN(remaining) && remaining > 0) {
            remaining--;
            countEl.value = remaining;

            if (remaining === 0) {
                // STOP
                autoSpinActive = false;
                document.getElementById('btnAutoSpin').checked = false;
                updateAutoSpinInputVisibility();
                return;
            }
        } else {
            // Invalid/Zero/Empty -> Stop immediately
            autoSpinActive = false;
            document.getElementById('btnAutoSpin').checked = false;
            updateAutoSpinInputVisibility();
            return;
        }

        setTimeout(spinReels, duration < 1000 ? 500 : 1000);
    }
}

function checkWin(outcome) {
    const middleRow = outcome.map(col => col[1]);
    const firstSym = middleRow[0];

    // Improved Logic: Handle Wild chains correctly
    let matchCount = 1;
    let effectiveSymbol = firstSym === 'wild' ? null : firstSym;

    for (let i = 1; i < middleRow.length; i++) {
        const current = middleRow[i];
        if (current === 'wild') {
            matchCount++;
        } else {
            if (effectiveSymbol === null) {
                effectiveSymbol = current;
                matchCount++;
            } else if (current === effectiveSymbol) {
                matchCount++;
            } else {
                break;
            }
        }
    }

    let winAmount = 0;

    if (matchCount >= 3) {
        // Determine Winning Symbol for Payout
        const winSym = effectiveSymbol || 'wild'; // If effective is still null, it's all wilds

        const symbolConfig = SYMBOLS.find(s => s.id === winSym) || SYMBOLS[0];
        const multiplier = symbolConfig.payout * (matchCount - 2);
        winAmount = currentBet * multiplier;

        // Visuals
        highlightWin(matchCount);
        drawWinLine();
        Sound.playWin(matchCount); // Win SFX

        // Confetti for big wins
        if (matchCount >= 4 || winAmount >= 10) {
            triggerConfetti();
        }

        const winEl = document.getElementById('lastWin');
        winEl.textContent = `${winAmount.toFixed(2)} ORY`;
        winEl.style.color = '#00E701';
        winEl.style.textShadow = '0 0 10px rgba(0,231,1,0.5)';

        // Pop Animation
        winEl.classList.remove('pop');
        void winEl.offsetWidth; // Force Reflow
        winEl.classList.add('pop');
        setTimeout(() => winEl.classList.remove('pop'), 500);

        BalanceManager.update(winAmount);
        // updateBalanceDisplay handled by listener
        addHistoryFunction(winAmount);
    } else {
        addHistoryFunction(0);
    }
}

function highlightWin(count) {
    for (let i = 0; i < count; i++) {
        const reel = document.getElementById(`reel-${i}`);
        if (reel && reel.children[1]) {
            reel.children[1].classList.add('winner');
        }
    }
}

function drawWinLine() {
    const overlay = document.getElementById('paylinesOverlay');
    if (!overlay) return;
    overlay.innerHTML = ''; // Clear existing

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.overflow = 'visible';

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '50%');
    line.setAttribute('x2', '100%');
    line.setAttribute('y2', '50%');
    line.setAttribute('stroke', '#00E701');
    line.setAttribute('stroke-width', '6');
    line.setAttribute('stroke-linecap', 'round');
    line.style.filter = 'drop-shadow(0 0 8px #00E701)';

    // Animation: Draw Left to Right
    line.setAttribute('stroke-dasharray', '1000');
    line.setAttribute('stroke-dashoffset', '1000');

    // CSS Animation for dashoffset
    const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    animate.setAttribute('attributeName', 'stroke-dashoffset');
    animate.setAttribute('from', '1000');
    animate.setAttribute('to', '0');
    animate.setAttribute('dur', '0.4s');
    animate.setAttribute('fill', 'freeze');
    animate.setAttribute('calcMode', 'spline');
    animate.setAttribute('keySplines', '0.4 0 0.2 1');

    line.appendChild(animate);
    svg.appendChild(line);
    overlay.appendChild(svg);
}

function toggleAutoSpin() {
    const btn = document.getElementById('btnAutoSpin');
    autoSpinActive = btn.checked;
    updateAutoSpinInputVisibility();

    if (autoSpinActive && !isSpinning) {
        // Validation: If input is empty/invalid, set default
        const countEl = document.getElementById('autoSpinCount');
        if (!countEl.value || parseInt(countEl.value) <= 0) {
            countEl.value = 50;
        }
        spinReels();
    }
}

function updateAutoSpinBtn() {
    const btn = document.getElementById('btnAutoSpin');
    if (btn.type === 'checkbox') {
        btn.checked = autoSpinActive;
    }
    updateAutoSpinInputVisibility();
}

function updateAutoSpinInputVisibility() {
    const input = document.getElementById('autoSpinCount');
    if (input) {
        input.style.display = autoSpinActive ? 'block' : 'none';
    }
}

// Make spin recursion check for remaining spins
// We need to modify the end of 'spinReels' too (via next tool step or careful multi-chunk if possible)
// But I will address the recursion part here in spinReels first. 
// Actually, I can't modify spinReels in this chunk effectively because it's far up.
// I will just update the toggle logic here and handle recursion in next step or assume existing recursion calls toggle/check.

// Existing recursion:
// if (autoSpinActive) { setTimeout(spinReels, ...) }

// I need to intercept that.
// Let's modify logic to DECREMENT the select value if it's not -1 (Infinity)


// History Helper
function addHistoryFunction(winAmount) {
    const historyList = document.getElementById('slots-history');
    if (!historyList) return;

    // Create new entry
    const div = document.createElement('div');
    div.className = 'history-item fade-in';
    const isWin = winAmount > 0;

    // Format: time | result
    div.innerHTML = `
        <div class="history-info">
            <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        <div class="history-value ${isWin ? 'win' : 'loss'}">
            ${isWin ? '+' + winAmount.toFixed(2) : '-' + currentBet.toFixed(2)}
        </div>
    `;

    historyList.insertBefore(div, historyList.firstChild);
    historyList.insertBefore(div, historyList.firstChild);
    if (historyList.children.length > 20) historyList.lastChild.remove();
}

// Visual Effects
function triggerConfetti() {
    const colors = [
        '#00F3FF', // Cyan
        '#FF0055', // Pink
        '#FFD700', // Gold
        '#FFFFFF', // White
        '#7000FF'  // Violet
    ];
    const container = document.querySelector('.slots-board-wrapper') || document.body;

    for (let i = 0; i < 80; i++) {
        const conf = document.createElement('div');

        // Random Classes
        const speeds = ['slow', 'medium', 'fast'];
        const shapes = ['circle', 'rect']; // 'triangle' requires clip-path, stick to simple for now

        conf.className = `confetti ${speeds[Math.floor(Math.random() * speeds.length)]} ${shapes[Math.floor(Math.random() * shapes.length)]}`;

        // Random Position & Style
        conf.style.left = Math.random() * 100 + '%';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationName = 'confetti-drop'; // Strict binding
        conf.style.animationDelay = Math.random() * 1.5 + 's';

        container.appendChild(conf);

        setTimeout(() => conf.remove(), 3000);
    }
}

function removeConfetti() {
    document.querySelectorAll('.confetti').forEach(c => c.remove());
}

// Main JavaScript for Orygn Casino

document.addEventListener('DOMContentLoaded', () => {
    console.log('Orygn Casino Initialized');

    // --- Notification System ---
    function showNotification(message, type = 'info') {
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `notification-toast type-${type}`;

        // Premium Icon Mapping
        let iconHtml = '';
        if (type === 'success') iconHtml = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        else if (type === 'error') iconHtml = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        else iconHtml = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

        toast.innerHTML = `
            <div class="toast-icon-wrapper">${iconHtml}</div>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // --- Banner Plinko Simulation ---
    function initBannerPlinko() {
        const bannerCanvas = document.getElementById('banner-plinko-canvas');
        if (!bannerCanvas) return; // Not on the page (mobile / different view)

        // Setup Matter.js
        const Engine = Matter.Engine,
            Render = Matter.Render,
            World = Matter.World,
            Bodies = Matter.Bodies,
            Runner = Matter.Runner,
            Events = Matter.Events;

        const engine = Engine.create();
        const world = engine.world;
        engine.world.gravity.y = 1.0; // Standard gravity

        // Scale canvas for high DPI
        const width = 320;
        const height = 240;
        bannerCanvas.width = width * 2;
        bannerCanvas.height = height * 2;
        bannerCanvas.style.width = width + 'px';
        bannerCanvas.style.height = height + 'px';

        const ctx = bannerCanvas.getContext('2d');
        ctx.scale(2, 2); // Internal coordinate system is 320x240

        // Pegs Configuration
        const pegRadius = 3;
        const pegs = [];
        const rows = 5;
        const startY = 40;
        const gap = 30;

        for (let r = 0; r < rows; r++) {
            const pegsInRow = 3 + r; // Pyramid
            for (let c = 0; c < pegsInRow; c++) {
                // Center alignment
                const x = width / 2 + (c - (pegsInRow - 1) / 2) * gap;
                const y = startY + r * gap;
                const peg = Bodies.circle(x, y, pegRadius, {
                    isStatic: true,
                    render: { visible: false }, // We draw manually
                    restitution: 0.8
                });
                pegs.push(peg);
            }
        }
        World.add(world, pegs);

        // Bumper walls to keep it contained-ish
        const leftWall = Bodies.rectangle(width / 2 - 120, height / 2 + 50, 10, height, { isStatic: true, angle: 0.3, render: { visible: false } });
        const rightWall = Bodies.rectangle(width / 2 + 120, height / 2 + 50, 10, height, { isStatic: true, angle: -0.3, render: { visible: false } });
        // Don't add walls, let it fall free

        // Ball Logic
        let ball = null;

        function spawnBall() {
            if (ball) World.remove(world, ball);

            const startX = width / 2 + (Math.random() - 0.5) * 10; // Slight random offset
            ball = Bodies.circle(startX, -20, 6, {
                restitution: 0.5,
                friction: 0.001,
                render: { visible: false },
                label: 'ball'
            });
            World.add(world, ball);
        }

        spawnBall();

        // Custom Render Loop
        (function renderLoop() {
            if (!document.getElementById('banner-plinko-canvas')) return; // Exit if unmounted

            Engine.update(engine, 1000 / 60);

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Draw Pegs (Glowing)
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

            pegs.forEach(peg => {
                ctx.beginPath();
                ctx.arc(peg.position.x, peg.position.y, pegRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Ball (Neon)
            if (ball) {
                // Trail effect (optional, keep simple for now)

                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00f3ff';
                ctx.fillStyle = '#00f3ff';

                ctx.beginPath();
                ctx.arc(ball.position.x, ball.position.y, 6, 0, Math.PI * 2);
                ctx.fill();

                // Respawn if out of bounds
                if (ball.position.y > height + 50) {
                    spawnBall();
                }
            }

            ctx.shadowBlur = 0; // Reset
            requestAnimationFrame(renderLoop);
        })();
    }

    // --- Global State ---
    const balanceEl = document.querySelector('.balance-amount');

    // Subscribe to updates
    BalanceManager.subscribe(newBal => {
        balanceEl.textContent = newBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });

    // Initial Sync
    balanceEl.textContent = BalanceManager.get().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function updateBalanceDisplay() {
        // Redundant with listener but kept for function calls
        // No-op or fetch fresh
    }

    // Init Banner Physics immediately
    initBannerPlinko();



    // --- Navigation Logic ---
    const lobbySection = document.querySelector('.game-grid-section');
    const featuredBanner = document.querySelector('.featured-banner');
    const gameView = document.getElementById('game-view');
    const backBtn = document.getElementById('back-to-lobby');
    const gameTitle = document.getElementById('current-game-title');

    // Plinko specific elements
    const playBtn = document.getElementById('play-btn');
    const betInput = document.getElementById('bet-amount');
    const riskSelect = document.getElementById('risk-level');
    const rowSelect = document.getElementById('row-count');
    const historyList = document.getElementById('plinko-history');

    // Game Card Click Handlers
    document.querySelectorAll('.game-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            // Index 0: Crash, 1: Plinko, 2: Mines, 3: Dice
            const gameName = card.querySelector('h3').textContent;

            if (gameName === 'Plinko') {
                lobbySection.classList.add('hidden');
                featuredBanner.classList.add('hidden');
                gameView.classList.remove('hidden');
                gameTitle.textContent = 'Plinko X';
                initPlinko();
            } else if (gameName === 'Crash') {
                // Show Crash View
                lobbySection.classList.add('hidden');
                featuredBanner.classList.add('hidden');
                document.getElementById('crash-view').classList.remove('hidden');
                initCrash(); // Start Crash Logic
            } else if (gameName === 'Mines') {
                lobbySection.classList.add('hidden');
                featuredBanner.classList.add('hidden');
                document.getElementById('mines-view').classList.remove('hidden');
                initMines();
            } else if (gameName === 'Dice') {
                lobbySection.classList.add('hidden');
                featuredBanner.classList.add('hidden');
                document.getElementById('dice-view').classList.remove('hidden');
                initDice();
            } else {
                showNotification(`${gameName} is coming soon!`, 'info');
            }
        });
    });

    // Back to Lobby Handlers
    document.getElementById('back-to-lobby').addEventListener('click', returnToLobby);
    document.getElementById('back-to-lobby-crash').addEventListener('click', returnToLobby);
    document.getElementById('back-to-lobby-mines').addEventListener('click', returnToLobby);
    document.getElementById('back-to-lobby-dice').addEventListener('click', returnToLobby);

    function returnToLobby() {
        gameView.classList.add('hidden'); // Plinko
        document.getElementById('crash-view').classList.add('hidden');
        document.getElementById('mines-view').classList.add('hidden');
        document.getElementById('dice-view').classList.add('hidden');

        lobbySection.classList.remove('hidden');
        featuredBanner.classList.remove('hidden');
        stopPlinko();
        stopCrash();
        // stopMines(); // No loop to stop, but good practice if animation exists
    }

    // Banner Play Button
    document.querySelector('.play-btn-large').addEventListener('click', () => {
        // Open Plinko by default from banner
        lobbySection.classList.add('hidden');
        featuredBanner.classList.add('hidden');
        gameView.classList.remove('hidden');
        gameTitle.textContent = 'Plinko X';
        initPlinko();
    });



    // --- Plinko Logic (Discrete Path Model) ---

    let canvas, ctx;
    let animationId;
    let isGameActive = false;
    let clickSynth;
    let notes = [];

    // Game State
    let activeBalls = []; // Array of ball objects
    const MAX_BALLS = 50; // Limit active balls to prevent lag

    // Configuration
    let currentConfig = {
        width: 620,
        height: 534,
        pegRadius: 4,
        ballRadius: 7,
        gap: 32,
        rowSpacing: 32,
        startY: 32
    };

    function calculateGrid(rows) {
        const paddingX = 32;
        const paddingY = 32;
        const bottomPegs = rows + 2; // Based on r+3 logic (row 0 has 3, row N-1 has N+2)

        const availableWidth = currentConfig.width - (paddingX * 2);
        const gap = availableWidth / (bottomPegs - 1);

        const availableHeight = currentConfig.height - (paddingY * 2);
        // Ensure we use the full height for the rows
        const rowSpacing = availableHeight / Math.max(1, rows - 1);

        currentConfig.gap = gap;
        currentConfig.rowSpacing = rowSpacing;
        currentConfig.startY = paddingY;
    }

    // Payout Tables (House Edge < 1.0)
    // Structure: [Rows][Risk] = Array of multipliers
    const PAYOUTS = {
        8: {
            low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
            medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
            high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
        },
        10: {
            low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
            medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
            high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
        },
        12: {
            low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
            medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
            high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
        },
        14: {
            low: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1], // Adjusted for 15 slots
            medium: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
            high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
        },
        16: {
            low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
            medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
            high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
        }
    };

    // Note frequencies for sound
    // Note frequencies for sound (Lower Octaves for softer sound)
    const NOTE_FREQS = [
        "C#3", "C3", "B3", "A#3", "A3", "G#2", "G2", "F#2",
        "F2", "F#2", "G2", "G#2", "A3", "A#3", "B3", "C3", "C#3"
    ];

    function initPlinko() {
        if (isGameActive) return;
        isGameActive = true;

        canvas = document.getElementById('plinko-canvas');
        ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = currentConfig.width;
        canvas.height = currentConfig.height;

        // Initialize Audio
        if (!clickSynth) {
            clickSynth = new Tone.NoiseSynth({ volume: -25 }).toDestination();
            notes = NOTE_FREQS.map(freq => {
                const synth = new Tone.PolySynth().toDestination();
                synth.set({ volume: -20 });
                return { synth, freq };
            });
        }

        // Initial calculation
        const rows = parseInt(rowSelect.value);
        calculateGrid(rows);

        renderMultipliers();
        startAnimationLoop();
    }

    function stopPlinko() {
        isGameActive = false;
        cancelAnimationFrame(animationId);
        activeBalls = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function startAnimationLoop() {
        if (!isGameActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBoard();
        updateAndDrawBalls();

        animationId = requestAnimationFrame(startAnimationLoop);
    }

    function drawBoard() {
        const rows = parseInt(rowSelect.value);

        // Peg Glow
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.fillStyle = '#ffffff';

        for (let r = 0; r < rows; r++) {
            const pegsInRow = r + 3;
            for (let c = 0; c < pegsInRow; c++) {
                const x = currentConfig.width / 2 + (c - (pegsInRow - 1) / 2) * currentConfig.gap;
                const y = currentConfig.startY + r * currentConfig.rowSpacing;

                ctx.beginPath();
                ctx.arc(x, y, currentConfig.pegRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Reset shadow for other elements if needed, but balls use it too
        ctx.shadowBlur = 0;
    }

    function updateAndDrawBalls() {
        const rows = parseInt(rowSelect.value);

        for (let i = activeBalls.length - 1; i >= 0; i--) {
            const ball = activeBalls[i];

            // Update Progress
            ball.progress += ball.speed;

            // Calculate Position
            // Current Row Index
            const currentRow = Math.floor(ball.progress);
            const nextRow = currentRow + 1;
            const rowProgress = ball.progress - currentRow; // 0 to 1 between rows

            if (currentRow >= rows) {
                // Ball Finished
                finishBall(ball);
                activeBalls.splice(i, 1);
                continue;
            }

            // Calculate X/Y based on path
            // Path is array of 0 (Left) or 1 (Right) steps
            // Current X Index = Sum of steps so far
            // We need to interpolate between current peg and next peg

            // Peg position logic:
            // Row r, Index c: x = Center + (c - (r+2)/2) * Gap
            // Note: pegsInRow = r + 3. Center index is (r+2)/2.

            // Steps sum gives us 'c' relative to the start.
            // Start (Row 0) has 3 pegs (indices 0, 1, 2). Ball starts at index 1 (Center).
            // So current C = 1 + sum(path[0...currentRow-1])

            let currentC = 1;
            for (let k = 0; k < currentRow; k++) currentC += ball.path[k];

            let nextC = currentC + ball.path[currentRow]; // Next target index

            // Coordinates
            const currentY = currentConfig.startY + currentRow * currentConfig.rowSpacing;
            const nextY = currentConfig.startY + nextRow * currentConfig.rowSpacing;

            const currentX = currentConfig.width / 2 + (currentC - (currentRow + 2) / 2) * currentConfig.gap;
            const nextX = currentConfig.width / 2 + (nextC - (nextRow + 2) / 2) * currentConfig.gap;

            // Interpolation (Parabolic arc for bounce effect)
            // Linear X, Parabolic Y offset
            const x = currentX + (nextX - currentX) * rowProgress;

            // Bounce: y = y_linear - bounce_height * 4 * p * (1-p)
            const yLinear = currentY + (nextY - currentY) * rowProgress;
            const bounce = 10 * 4 * rowProgress * (1 - rowProgress); // 10px bounce height
            const y = yLinear - bounce;

            // Store position for trail
            if (!ball.trail) ball.trail = [];
            ball.trail.push({ x, y });
            if (ball.trail.length > 8) ball.trail.shift();

            // Draw Trail
            ctx.shadowBlur = 0; // No shadow for trail to save perf/clean look
            for (let t = 0; t < ball.trail.length; t++) {
                const pos = ball.trail[t];
                const alpha = (t / ball.trail.length) * 0.5;
                const size = currentConfig.ballRadius * (0.5 + 0.5 * (t / ball.trail.length));

                ctx.fillStyle = `rgba(255, 235, 59, ${alpha})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Ball with Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffeb3b';
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(x, y, currentConfig.ballRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset

            // Play sound on bounce (approx when rowProgress is near 0.5 or 0)
            // Let's play when it hits a peg (rowProgress near 0)
            if (rowProgress < 0.1 && !ball.hasBounced[currentRow]) {
                ball.hasBounced[currentRow] = true;
                // clickSynth.triggerAttackRelease("32n"); // Optional click
            }
        }
    }

    function dropBall(betAmount) {
        if (activeBalls.length >= MAX_BALLS) return;

        const rows = parseInt(rowSelect.value);

        // --- Improved Distribution Logic ---
        // Pure binomial (50/50) makes edges virtually impossible (1 in 65k for 16 rows).
        // We use a "Fat-Tailed" Gaussian to make the game feel fairer and more exciting.

        // 1. Determine Target Slot
        // Natural Binomial SD = sqrt(rows) / 2. (e.g., 2.0 for 16 rows)
        // We widen this to make edges reachable.
        const naturalSD = Math.sqrt(rows) / 2;
        const fatSD = naturalSD * 0.95; // 0.95 Tightens spread slightly (House Edge)

        let targetSlot;
        do {
            // Box-Muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // Map to slot index
            const mean = rows / 2;
            const val = mean + z * fatSD;
            targetSlot = Math.round(val);
        } while (targetSlot < 0 || targetSlot > rows); // Clamp to valid slots

        // 2. Generate Path to Target
        // To land in 'targetSlot', we need exactly 'targetSlot' RIGHT moves (1s)
        // and 'rows - targetSlot' LEFT moves (0s).
        const path = [];
        for (let i = 0; i < targetSlot; i++) path.push(1); // Right
        for (let i = 0; i < rows - targetSlot; i++) path.push(0); // Left

        // Shuffle the path to make it look random
        for (let i = path.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [path[i], path[j]] = [path[j], path[i]];
        }

        activeBalls.push({
            path: path,
            progress: -1, // Start above first row
            speed: 0.15 + Math.random() * 0.05, // Slight speed variation
            betAmount: betAmount,
            hasBounced: {}
        });

        // Play drop sound
        clickSynth.triggerAttackRelease("32n");
    }

    function finishBall(ball) {
        const rows = parseInt(rowSelect.value);
        const risk = riskSelect.value;

        // Calculate Final Slot Index
        // Start Index (Row 0) = 1 (Center of 3 pegs)
        // Final Index = 1 + Sum(Path)
        // But wait, the slots are between pegs.
        // Row N has N+3 pegs. There are N+2 gaps? No.
        // Standard Plinko: N rows -> N+1 slots.
        // Let's align with the multiplier table.
        // 16 rows -> 17 multipliers.
        // Path sum ranges from 0 to 16.
        // So Slot Index = Sum(Path).

        const slotIndex = ball.path.reduce((a, b) => a + b, 0);

        // Get Multiplier
        // Ensure we have a table for this row count
        const table = PAYOUTS[rows] || PAYOUTS[16];
        const mults = table[risk];
        const multiplier = mults[slotIndex];
        const winAmount = ball.betAmount * multiplier;

        BalanceManager.update(winAmount);
        // updateBalanceDisplay handled by listener

        // Visual Feedback
        const el = document.getElementById(`note-${slotIndex}`);
        if (el) {
            el.dataset.pressed = "true";
            setTimeout(() => el.dataset.pressed = "false", 300);

            // Play Note (Map slot index to note array, wrap if needed)
            const noteIndex = Math.floor(slotIndex * (notes.length / mults.length));
            const noteObj = notes[noteIndex] || notes[slotIndex % notes.length];

            if (noteObj && Tone.context.state === 'running') {
                noteObj.synth.triggerAttackRelease(noteObj.freq, "16n");
            }
        }

        addToHistory(multiplier, winAmount - ball.betAmount);
    }

    function renderMultipliers() {
        const container = document.getElementById('plinko-multipliers');
        container.innerHTML = '';

        const risk = riskSelect.value;
        const rows = parseInt(rowSelect.value);
        const table = PAYOUTS[rows] || PAYOUTS[16];
        const mults = table[risk];

        mults.forEach((val, i) => {
            const note = document.createElement('div');
            note.className = 'note';
            note.id = `note-${i}`;
            note.textContent = `${val}x`;

            // Tier class
            if (val >= 10) note.classList.add('tier-extreme');
            else if (val >= 2) note.classList.add('tier-high');
            else if (val >= 1) note.classList.add('tier-med');
            else note.classList.add('tier-low');

            container.appendChild(note);
        });
    }

    function addToHistory(multiplier, profit) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const profitClass = profit >= 0 ? 'profit-pos' : 'profit-neg';
        const profitSign = profit >= 0 ? '+' : '';

        item.innerHTML = `
            <span class="history-mult">${multiplier}x</span>
            <span class="history-profit ${profitClass}">${profitSign}${profit.toFixed(2)}</span>
        `;

        historyList.insertBefore(item, historyList.firstChild);
        if (historyList.children.length > 20) {
            historyList.lastElementChild.remove();
        }
    }

    // --- Interaction ---

    playBtn.addEventListener('click', async () => {
        if (Tone.context.state !== 'running') await Tone.start();

        const bet = parseFloat(betInput.value);
        if (isNaN(bet) || bet <= 0) {
            showNotification('Invalid bet amount', 'error');
            return;
        }
        if (bet > BalanceManager.get()) {
            showNotification('Insufficient balance', 'error');
            return;
        }

        BalanceManager.update(-bet);
        // updateBalanceDisplay handled by listener
        dropBall(bet);
    });

    // Controls
    document.querySelectorAll('.bet-mod').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const game = e.target.dataset.game; // 'crash' or undefined (plinko)

            let input = betInput; // Default to Plinko
            if (game === 'crash') input = document.getElementById('crash-bet-amount');

            let current = parseFloat(input.value) || 0;
            if (action === 'half') input.value = (current / 2).toFixed(2);
            if (action === 'double') input.value = (current * 2).toFixed(2);
        });
    });

    riskSelect.addEventListener('change', () => {
        renderMultipliers();
    });

    rowSelect.addEventListener('change', () => {
        const rows = parseInt(rowSelect.value);
        calculateGrid(rows);
        renderMultipliers();
        // Clear active balls on row change to prevent visual glitches
        activeBalls = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Initial render
    updateBalanceDisplay();

    // Sidebar dummy data
    const winsList = document.getElementById('wins-list');
    if (winsList) {
        const games = [
            { name: 'Crash', icon: '🚀' },
            { name: 'Plinko', icon: '🎯' },
            { name: 'Mines', icon: '💣' },
            { name: 'Dice', icon: '🎲' },
            { name: 'Slots', icon: '🎰' },
            { name: 'Wheel', icon: '🎡' }
        ];
        const users = ['User88', 'CryptoKing', 'LuckyDuck', 'MoonBoi', 'Whale99', 'SatoshiFan'];

        function addRandomWin() {
            const randomGame = games[Math.floor(Math.random() * games.length)];
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomAmount = (Math.random() * 1000).toFixed(2);

            const winItem = document.createElement('div');
            winItem.className = 'win-item';
            winItem.innerHTML = `
                <div class="game-icon">${randomGame.icon}</div>
                <div class="win-details">
                    <span class="user">${randomUser}</span>
                    <span class="game">${randomGame.name}</span>
                </div>
                <div class="win-amount">+ ${randomAmount}</div>
            `;

            winsList.insertBefore(winItem, winsList.firstChild);
            if (winsList.children.length > 5) {
                winsList.lastElementChild.remove();
            }
        }
        setInterval(addRandomWin, 4000);
    }
    // --- Crash X Logic ---
    let crashCanvas, crashCtx;
    let crashAnimationId;
    let crashState = 'IDLE'; // IDLE, BETTING, FLYING, CRASHED
    let crashMultiplier = 1.00;
    let crashPoint = 0;
    let crashStartTime = 0;
    let crashBet = 0;
    let crashAutoCashout = 2.00;
    let isCrashBetPlaced = false;
    let hasCashedOut = false;
    let crashHistory = [];
    let crashParticles = []; // Array for explosion particles

    // Autobet State
    let isAutobetActive = false;
    let isAutobetRunning = false;
    let autobetRemaining = 0;

    const crashMultiplierEl = document.getElementById('crash-multiplier');
    const crashStatusEl = document.getElementById('crash-status');
    const crashActionBtn = document.getElementById('crash-action-btn');
    const crashBetInput = document.getElementById('crash-bet-amount');
    const crashAutoInput = document.getElementById('crash-auto-cashout');
    const crashHistoryList = document.getElementById('crash-history');

    // New UI Elements
    const crashLiveEarningsEl = document.getElementById('crash-live-earnings');
    const crashEarningsValueEl = document.getElementById('crash-earnings-value');
    const crashAutobetToggle = document.getElementById('crash-autobet-toggle');
    const crashAutobetSettings = document.getElementById('crash-autobet-settings');
    const crashAutobetStopInput = document.getElementById('crash-autobet-stop');
    const crashAutoCashoutToggle = document.getElementById('crash-auto-cashout-toggle');
    const crashAutoCashoutWrapper = document.getElementById('crash-auto-cashout-wrapper');

    let isAutoCashoutEnabled = true;

    function initCrash() {
        crashCanvas = document.getElementById('crash-canvas');
        crashCtx = crashCanvas.getContext('2d');

        // Resize canvas
        crashCanvas.width = 620;
        crashCanvas.height = 400;

        // Reset UI
        updateCrashUI();

        // Force Autobet OFF
        if (crashAutobetToggle) crashAutobetToggle.checked = false;
        isAutobetActive = false;
        if (crashAutobetSettings) crashAutobetSettings.classList.add('hidden');

        // Force Auto Cashout OFF
        if (crashAutoCashoutToggle) crashAutoCashoutToggle.checked = false;
        isAutoCashoutEnabled = false;
        if (crashAutoCashoutWrapper) crashAutoCashoutWrapper.classList.add('hidden');

        startCrashLoop();
    }

    function stopCrash() {
        cancelAnimationFrame(crashAnimationId);
        crashState = 'IDLE';
        crashParticles = [];
    }

    function startCrashLoop() {
        if (crashState === 'IDLE') {
            // Start countdown
            crashState = 'BETTING';
            let countdown = 5;
            crashParticles = []; // Clear particles
            isCrashBetPlaced = false; // Reset bet state
            updateCrashUI(); // Update UI to enable button

            // Handle Autobet
            if (isAutobetRunning) {
                if (autobetRemaining !== 0) {
                    placeCrashBet();

                    if (autobetRemaining > 0) {
                        autobetRemaining--;
                        if (autobetRemaining === 0) {
                            isAutobetActive = false;
                            isAutobetRunning = false;
                            crashAutobetToggle.checked = false;
                            crashAutobetSettings.classList.add('hidden');
                        } else {
                            crashAutobetStopInput.value = autobetRemaining;
                        }
                    }
                } else {
                    // Infinite mode (-1) or just active
                    placeCrashBet();
                }
            }

            const countInterval = setInterval(() => {
                if (crashState !== 'BETTING') {
                    clearInterval(countInterval);
                    return;
                }

                crashStatusEl.textContent = `NEXT ROUND IN ${countdown.toFixed(1)}s`;
                countdown -= 0.1;

                if (countdown <= 0) {
                    clearInterval(countInterval);
                    startCrashRound();
                }
            }, 100);
        }
    }

    function startCrashRound() {
        crashState = 'FLYING';
        crashStartTime = Date.now();
        hasCashedOut = false;

        // RNG: 5% House Edge
        // Crash Point = 0.95 / (1 - U)
        // Where U is random [0, 1)
        crashPoint = 0.95 / (1 - Math.random());
        if (crashPoint < 1.00) crashPoint = 1.00; // Instant crash possible

        // Cap at reasonable max for sim
        if (crashPoint > 1000) crashPoint = 1000;

        crashStatusEl.textContent = 'FLYING...';
        crashMultiplierEl.classList.add('crash-climbing');
        crashMultiplierEl.classList.remove('crash-crashed');

        updateCrashUI();
        animateCrash();
    }

    function animateCrash() {
        if (crashState !== 'FLYING') return;

        const now = Date.now();
        const elapsed = (now - crashStartTime) / 1000; // seconds

        // Growth function: M = e^(k * t)
        // Slower start: k = 0.04 (Even slower)
        crashMultiplier = Math.pow(Math.E, 0.04 * elapsed);

        // Update Live Earnings
        if (isCrashBetPlaced && !hasCashedOut) {
            const currentWin = (crashBet * crashMultiplier).toFixed(2);
            crashEarningsValueEl.textContent = currentWin;
        }

        // Check Auto Cashout
        if (isCrashBetPlaced && !hasCashedOut && isAutoCashoutEnabled && crashMultiplier >= parseFloat(crashAutoInput.value)) {
            cashOutCrash();
        }

        // Check Crash
        if (crashMultiplier >= crashPoint) {
            triggerCrash();
            return;
        }

        drawCrashGraph();
        crashMultiplierEl.textContent = crashMultiplier.toFixed(2) + 'x';

        crashAnimationId = requestAnimationFrame(animateCrash);
    }

    function triggerCrash() {
        crashState = 'CRASHED';
        crashMultiplier = crashPoint; // Snap to actual crash point
        crashMultiplierEl.textContent = crashMultiplier.toFixed(2) + 'x';

        crashMultiplierEl.classList.remove('crash-climbing');
        crashMultiplierEl.classList.add('crash-crashed');
        crashStatusEl.textContent = 'CRASHED';

        // Create Explosion
        createExplosion();

        // Handle Loss
        if (isCrashBetPlaced && !hasCashedOut) {
            // Lost bet
            addToCrashHistory(crashPoint, -crashBet);
            isCrashBetPlaced = false;
        } else if (!isCrashBetPlaced) {
            addToCrashHistory(crashPoint, 0);
        }

        updateCrashUI();

        // Continue animation for particles
        animateCrashEnd();

        // Restart loop after delay
        setTimeout(() => {
            crashState = 'IDLE';
            crashMultiplierEl.classList.remove('crash-crashed');
            crashMultiplierEl.textContent = '1.00x';
            crashCanvas.width = crashCanvas.width; // Clear canvas
            startCrashLoop();
        }, 3000);
    }

    function animateCrashEnd() {
        if (crashState !== 'CRASHED') return;

        drawCrashGraph(); // Draw static graph
        updateAndDrawParticles(); // Draw explosion

        if (crashParticles.length > 0) {
            crashAnimationId = requestAnimationFrame(animateCrashEnd);
        }
    }

    function createExplosion() {
        const w = crashCanvas.width;
        const h = crashCanvas.height;

        // --- Configuration (Must match drawCrashGraph) ---
        const padding = { top: 40, right: 60, bottom: 40, left: 50 };
        const graphW = w - padding.left - padding.right;
        const graphH = h - padding.top - padding.bottom;

        // --- Dynamic Scaling ---
        const currentTime = (Date.now() - crashStartTime) / 1000;
        let maxTime = Math.max(10, currentTime);
        let maxMult = Math.max(2, crashMultiplier);

        // Add headroom (must match drawCrashGraph)
        maxTime *= 1.1;
        maxMult *= 1.1;

        // Helper: Map Data to Screen
        const mapX = (t) => padding.left + (t / maxTime) * graphW;
        const mapY = (m) => (h - padding.bottom) - ((m - 1) / (maxMult - 1)) * graphH;

        // Explosion at current tip
        const x = mapX(currentTime);
        const y = mapY(crashMultiplier);

        for (let i = 0; i < 50; i++) {
            crashParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)` // Orange/Yellow/Red
            });
        }
    }

    function updateAndDrawParticles() {
        for (let i = crashParticles.length - 1; i >= 0; i--) {
            const p = crashParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;

            if (p.life <= 0) {
                crashParticles.splice(i, 1);
                continue;
            }

            crashCtx.globalAlpha = p.life;
            crashCtx.fillStyle = p.color;
            crashCtx.beginPath();
            crashCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            crashCtx.fill();
            crashCtx.globalAlpha = 1.0;
        }
    }

    function cashOutCrash() {
        if (!isCrashBetPlaced || hasCashedOut || crashState === 'CRASHED') return;

        hasCashedOut = true;
        const winAmount = crashBet * crashMultiplier;
        const profit = winAmount - crashBet;

        BalanceManager.update(winAmount);
        // updateBalanceDisplay handled by listener

        // Visual feedback
        crashStatusEl.textContent = `CASHED OUT @ ${crashMultiplier.toFixed(2)}x`;
        crashStatusEl.style.color = 'var(--success)';

        addToCrashHistory(crashMultiplier, profit); // Log the cashout immediately
        isCrashBetPlaced = false; // Bet resolved

        updateCrashUI();
    }

    function drawCrashGraph() {
        const w = crashCanvas.width;
        const h = crashCanvas.height;
        crashCtx.clearRect(0, 0, w, h);

        // --- Configuration ---
        const padding = { top: 40, right: 60, bottom: 40, left: 50 };
        const graphW = w - padding.left - padding.right;
        const graphH = h - padding.top - padding.bottom;

        // --- Dynamic Scaling ---
        const currentTime = (Date.now() - crashStartTime) / 1000;
        // Min scale: 10 seconds, 2x multiplier
        let maxTime = Math.max(10, currentTime);
        let maxMult = Math.max(2, crashMultiplier);

        // Add headroom
        maxTime *= 1.1;
        maxMult *= 1.1;

        // Helper: Map Data to Screen
        const mapX = (t) => padding.left + (t / maxTime) * graphW;
        // Logarithmic Y scale usually looks better for crash, but linear is requested/standard for simple clones.
        // Let's stick to Linear for Mult-1 (since it starts at 1x)
        // Y maps (1 to maxMult) -> (bottom to top)
        const mapY = (m) => (h - padding.bottom) - ((m - 1) / (maxMult - 1)) * graphH;

        // --- Draw Grid & Axes ---
        crashCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        crashCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        crashCtx.font = '12px "Roboto Mono", monospace';
        crashCtx.lineWidth = 1;
        crashCtx.textAlign = 'right';
        crashCtx.textBaseline = 'middle';

        // Y-Axis (Multiplier)
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const val = 1 + (i / ySteps) * (maxMult - 1);
            const y = mapY(val);

            // Grid line
            crashCtx.beginPath();
            crashCtx.moveTo(padding.left, y);
            crashCtx.lineTo(w - padding.right, y);
            crashCtx.stroke();

            // Label
            crashCtx.fillText(val.toFixed(1) + 'x', padding.left - 10, y);
        }

        // X-Axis (Time)
        crashCtx.textAlign = 'center';
        crashCtx.textBaseline = 'top';
        const xSteps = 5;
        for (let i = 0; i <= xSteps; i++) {
            const val = (i / xSteps) * maxTime;
            const x = mapX(val);

            // Grid line
            crashCtx.beginPath();
            crashCtx.moveTo(x, h - padding.bottom);
            crashCtx.lineTo(x, padding.top);
            crashCtx.stroke();

            // Label
            crashCtx.fillText(val.toFixed(0) + 's', x, h - padding.bottom + 10);
        }

        // --- Draw Curve ---
        // We draw from t=0 to t=currentTime
        // Dynamic resolution: 1 step per 2 pixels of width, min 100
        const steps = Math.max(100, Math.floor(graphW / 2));

        // Gradient Fill
        const gradient = crashCtx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        gradient.addColorStop(0, 'rgba(58, 130, 247, 0.5)');
        gradient.addColorStop(1, 'rgba(58, 130, 247, 0.0)');

        crashCtx.beginPath();
        crashCtx.moveTo(mapX(0), mapY(1)); // Start at 0s, 1x

        let lastX = mapX(0);
        let lastY = mapY(1);

        for (let i = 1; i <= steps; i++) {
            const t = (i / steps) * currentTime;
            const m = Math.pow(Math.E, 0.04 * t); // Match animateCrash

            const x = mapX(t);
            const y = mapY(m);

            crashCtx.lineTo(x, y);
            lastX = x;
            lastY = y;
        }

        // Close path for fill
        crashCtx.lineTo(lastX, h - padding.bottom);
        crashCtx.lineTo(mapX(0), h - padding.bottom);
        crashCtx.fillStyle = gradient;
        crashCtx.fill();

        // Stroke Line
        crashCtx.beginPath();
        crashCtx.moveTo(mapX(0), mapY(1));
        for (let i = 1; i <= steps; i++) {
            const t = (i / steps) * currentTime;
            const m = Math.pow(Math.E, 0.04 * t); // Match animateCrash
            crashCtx.lineTo(mapX(t), mapY(m));
        }

        crashCtx.strokeStyle = crashState === 'CRASHED' ? '#ff4d4d' : '#3a82f7';
        crashCtx.lineWidth = 4;
        crashCtx.lineCap = 'round';
        crashCtx.lineJoin = 'round';
        crashCtx.shadowBlur = 15;
        crashCtx.shadowColor = crashState === 'CRASHED' ? '#ff4d4d' : '#3a82f7';
        crashCtx.stroke();
        crashCtx.shadowBlur = 0;

        // --- Draw Rocket ---
        if (crashState === 'FLYING') {
            crashCtx.save();
            crashCtx.translate(lastX, lastY);

            // Calculate rotation based on slope at the tip
            // Slope dy/dx in screen space
            // We can approximate by taking a point slightly back
            const dt = 0.1; // small time delta
            const prevT = Math.max(0, currentTime - dt);
            const prevM = Math.pow(Math.E, 0.04 * prevT); // Match animateCrash
            const prevX = mapX(prevT);
            const prevY = mapY(prevM);

            const dx = lastX - prevX;
            const dy = lastY - prevY;
            const angle = Math.atan2(dy, dx); // Screen space angle

            crashCtx.rotate(angle);

            // Draw Sleek Rocket Shape
            crashCtx.fillStyle = '#fff';
            crashCtx.shadowBlur = 10;
            crashCtx.shadowColor = '#fff';

            crashCtx.beginPath();
            // Nose
            crashCtx.moveTo(10, 0);
            // Tail Right
            crashCtx.lineTo(-10, 6);
            // Center indent
            crashCtx.lineTo(-6, 0);
            // Tail Left
            crashCtx.lineTo(-10, -6);
            crashCtx.closePath();
            crashCtx.fill();

            // Thruster Flame
            crashCtx.fillStyle = '#ff9f43';
            crashCtx.shadowColor = '#ff9f43';
            crashCtx.beginPath();
            crashCtx.moveTo(-8, 0);
            crashCtx.lineTo(-14, 3);
            crashCtx.lineTo(-18, 0); // Tip of flame
            crashCtx.lineTo(-14, -3);
            crashCtx.closePath();
            crashCtx.fill();

            crashCtx.restore();
        }
    }

    function updateCrashUI() {
        if (crashState === 'BETTING') {
            if (isCrashBetPlaced) {
                crashActionBtn.textContent = 'BET LOCKED IN';
                crashActionBtn.disabled = true;
                crashActionBtn.className = 'play-btn-large action-btn btn-waiting';
                crashBetInput.disabled = true;
                crashLiveEarningsEl.classList.remove('hidden');
                crashEarningsValueEl.textContent = crashBet.toFixed(2); // Start at bet amount
            } else {
                crashActionBtn.textContent = 'PLACE BET';
                crashActionBtn.disabled = false;
                crashActionBtn.className = 'play-btn-large action-btn btn-betting';
                crashBetInput.disabled = false;
                crashLiveEarningsEl.classList.add('hidden');
            }
        } else if (crashState === 'FLYING') {
            if (isCrashBetPlaced && !hasCashedOut) {
                crashActionBtn.textContent = 'CASH OUT';
                crashActionBtn.disabled = false;
                crashActionBtn.className = 'play-btn-large action-btn btn-cashout';
                crashLiveEarningsEl.classList.remove('hidden');
            } else {
                crashActionBtn.textContent = 'WAITING...';
                crashActionBtn.disabled = true;
                crashActionBtn.className = 'play-btn-large action-btn btn-waiting';
                if (hasCashedOut) {
                    // Keep earnings visible if cashed out
                } else {
                    crashLiveEarningsEl.classList.add('hidden');
                }
            }
            crashBetInput.disabled = true;
        } else {
            crashActionBtn.textContent = 'CRASHED';
            crashActionBtn.disabled = true;
            crashActionBtn.className = 'play-btn-large action-btn btn-waiting';
            if (!hasCashedOut) crashLiveEarningsEl.classList.add('hidden');
        }
    }

    function placeCrashBet() {
        if (crashState !== 'BETTING' || isCrashBetPlaced) return;

        const bet = parseFloat(crashBetInput.value);
        if (isNaN(bet) || bet <= 0) { alert('Invalid bet amount'); return; }
        if (bet > BalanceManager.get()) { alert('Insufficient funds'); return; }

        BalanceManager.update(-bet);
        // updateBalanceDisplay handled by listener
        crashBet = bet;
        isCrashBetPlaced = true;
        updateCrashUI();
    }

    crashActionBtn.addEventListener('click', () => {
        if (crashState === 'BETTING') {
            if (isAutobetActive && !isAutobetRunning) {
                isAutobetRunning = true;
                // Count this manual bet as the first one
                if (autobetRemaining > 0) {
                    autobetRemaining--;
                    crashAutobetStopInput.value = autobetRemaining;
                    if (autobetRemaining === 0) {
                        isAutobetActive = false;
                        isAutobetRunning = false;
                        crashAutobetToggle.checked = false;
                        crashAutobetSettings.classList.add('hidden');
                    }
                }
            }
            placeCrashBet();
        } else if (crashState === 'FLYING') {
            cashOutCrash();
        }
    });

    // Autobet Toggle
    crashAutobetToggle.addEventListener('change', (e) => {
        isAutobetActive = e.target.checked;
        if (isAutobetActive) {
            crashAutobetSettings.classList.remove('hidden');
            const stopVal = parseInt(crashAutobetStopInput.value);
            autobetRemaining = isNaN(stopVal) ? -1 : stopVal; // -1 for infinite
        } else {
            crashAutobetSettings.classList.add('hidden');
            autobetRemaining = 0;
            isAutobetRunning = false; // Stop immediately if toggled off
        }
    });

    crashAutobetStopInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        autobetRemaining = isNaN(val) ? -1 : val;
    });

    // Space Key Listener
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('crash-view').classList.contains('hidden')) return;

        if (e.code === 'Space') {
            // Prevent scrolling
            e.preventDefault();

            if (crashState === 'BETTING' && !isCrashBetPlaced) {
                if (isAutobetActive && !isAutobetRunning) {
                    isAutobetRunning = true;
                    if (autobetRemaining > 0) {
                        autobetRemaining--;
                        crashAutobetStopInput.value = autobetRemaining;
                        if (autobetRemaining === 0) {
                            isAutobetActive = false;
                            isAutobetRunning = false;
                            crashAutobetToggle.checked = false;
                            crashAutobetSettings.classList.add('hidden');
                        }
                    }
                }
                placeCrashBet();
            } else if (crashState === 'FLYING') {
                cashOutCrash();
            }
        }
    });

    function addToCrashHistory(mult, profit) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const isWin = profit > 0;
        const colorClass = isWin ? 'profit-pos' : (profit < 0 ? 'profit-neg' : '');

        item.innerHTML = `
            <span class="history-mult" style="color: ${mult >= 2 ? 'var(--success)' : 'var(--text-secondary)'}">${mult.toFixed(2)}x</span>
            <span class="history-profit ${colorClass}">${profit > 0 ? '+' : ''}${profit.toFixed(2)}</span>
        `;

        crashHistoryList.insertBefore(item, crashHistoryList.firstChild);
        if (crashHistoryList.children.length > 20) crashHistoryList.lastElementChild.remove();
    }

    // Auto Cashout Toggle
    crashAutoCashoutToggle.addEventListener('change', (e) => {
        isAutoCashoutEnabled = e.target.checked;
        if (isAutoCashoutEnabled) {
            crashAutoCashoutWrapper.classList.remove('hidden');
        } else {
            crashAutoCashoutWrapper.classList.add('hidden');
        }
    });

    // --- Mines X Logic ---

    // Constants
    const MINES_GRID_SIZE = 25;
    const HOUSE_EDGE = 0.99; // 1% House Edge for calculation

    // State
    let minesState = 'IDLE'; // IDLE, ACTIVE, CASHED_OUT, BUSTED
    let minesGrid = []; // Array of { isMine: bool, revealed: bool }
    let minesCount = 3;
    let minesBet = 0;
    let minesSafePicks = 0;
    let minesMultiplier = 1.00;

    // UI Elements
    const minesGridEl = document.getElementById('mines-grid');
    const minesBetInput = document.getElementById('mines-bet-amount');
    const minesCountSelect = document.getElementById('mines-count');
    const minesActionBtn = document.getElementById('mines-action-btn');
    const minesCashoutBtn = document.getElementById('mines-cashout-btn');
    const minesMultiplierEl = document.getElementById('mines-multiplier-value');
    const minesNextProfitEl = document.getElementById('mines-next-profit');
    const minesStatusPanel = document.getElementById('mines-status-panel');
    const minesOverlay = document.getElementById('mines-overlay');
    const minesResultMsg = document.getElementById('mines-result-msg');
    const minesHistoryList = document.getElementById('mines-history');

    function initMines() {
        createMinesGrid();
        updateMinesUI();
    }

    function createMinesGrid() {
        minesGridEl.innerHTML = '';
        for (let i = 0; i < MINES_GRID_SIZE; i++) {
            const tile = document.createElement('div');
            tile.className = 'mine-tile';
            tile.dataset.index = i;
            tile.addEventListener('click', () => handleTileClick(i));
            minesGridEl.appendChild(tile);
        }
    }

    function startMinesRound() {
        // Validate
        const bet = parseFloat(minesBetInput.value);
        if (isNaN(bet) || bet <= 0) { alert('Invalid bet amount'); return; }
        if (bet > BalanceManager.get()) { alert('Insufficient funds'); return; }

        minesCount = parseInt(minesCountSelect.value);

        // Deduct Balance
        BalanceManager.update(-bet);
        // updateBalanceDisplay handled by listener

        // Setup State
        minesBet = bet;
        minesState = 'ACTIVE';
        minesSafePicks = 0;
        minesMultiplier = 1.00;
        minesGrid = new Array(MINES_GRID_SIZE).fill(null).map(() => ({ isMine: false, revealed: false }));

        // Place Mines (Randomly)
        let placed = 0;
        while (placed < minesCount) {
            const idx = Math.floor(Math.random() * MINES_GRID_SIZE);
            if (!minesGrid[idx].isMine) {
                minesGrid[idx].isMine = true;
                placed++;
            }
        }

        // Reset UI
        minesOverlay.classList.add('hidden');
        minesStatusPanel.classList.remove('hidden');

        const tiles = document.querySelectorAll('.mine-tile');
        tiles.forEach(t => {
            t.className = 'mine-tile';
            t.innerHTML = '';
        });

        updateMinesUI();
    }

    function handleTileClick(index) {
        if (minesState !== 'ACTIVE') return;
        if (minesGrid[index].revealed) return;

        const tileEl = minesGridEl.children[index];
        const isMine = minesGrid[index].isMine;

        minesGrid[index].revealed = true;

        if (isMine) {
            // GAME OVER
            minesState = 'BUSTED';
            tileEl.classList.add('revealed-mine');
            tileEl.innerHTML = '<span class="bomb-icon">💣</span>';
            // Reveal all mines
            revealAllMines();
            // Show result
            minesResultMsg.textContent = 'BUSTED';
            minesResultMsg.style.color = '#ff4d4d';
            minesOverlay.classList.remove('hidden');

            // Log History
            addToMinesHistory(minesCount, minesSafePicks, 0, -minesBet);

            // Play explosion sound
            if (clickSynth) clickSynth.triggerAttackRelease("8n");

            // Enable Restart immediately
            enableMinesRestart();

        } else {
            // SAFE
            minesSafePicks++;
            tileEl.classList.add('revealed-safe');
            tileEl.innerHTML = '<span class="gem-icon">💎</span>';

            // Play gem sound
            if (clickSynth) clickSynth.triggerAttackRelease("32n");

            // Update Multiplier
            calculateMinesMultiplier();

            // Check Auto Win (All safe tiles found)
            const safeTilesTotal = MINES_GRID_SIZE - minesCount;
            if (minesSafePicks === safeTilesTotal) {
                cashOutMines();
            } else {
                updateMinesUI();
            }
        }
    }

    function calculateMinesMultiplier() {
        // Multiplier based on probability
        // P(Win) = C(Safe, Picks) / C(Total, Picks) -- standard way
        // Simplified iterative:
        // Current Mult = Previous Mult * (Remaining Tiles / Remaining Safe)
        // Start = 1.00

        // Let's recalculate from scratch to be safe
        let mult = 1.00;
        let remainingTiles = MINES_GRID_SIZE;
        let remainingSafe = MINES_GRID_SIZE - minesCount;

        for (let i = 0; i < minesSafePicks; i++) {
            mult *= (remainingTiles / remainingSafe);
            remainingTiles--;
            remainingSafe--;
        }

        // Apply House Edge
        mult = mult * HOUSE_EDGE;
        minesMultiplier = mult;
        console.log(`Mines Math: Picks=${minesSafePicks} Mines=${minesCount} Mult=${mult.toFixed(4)}`);
    }

    function getNextMultiplier() {
        // What would be the multiplier if we pick one more safe tile?
        let mult = minesMultiplier;
        let remainingTiles = MINES_GRID_SIZE - minesSafePicks;
        let remainingSafe = MINES_GRID_SIZE - minesCount - minesSafePicks;

        // If 0 safe left, multiplier is infinite theoretically but we limit logic
        if (remainingSafe <= 0) return mult;

        // Wait, current minesMultiplier ALREADY has house edge.
        // We want: Next = Current * (Remaining / Safe) * 1 (House Edge applied once per step? Or total?)
        // Applying edge per step compounds it too much.
        // Correct way: Raw Probability -> Inverse -> Apply Edge.

        // Re-calculate RAW
        let rawMult = 1.00;
        let rT = MINES_GRID_SIZE;
        let rS = MINES_GRID_SIZE - minesCount;

        for (let i = 0; i < minesSafePicks + 1; i++) {
            rawMult *= (rT / rS);
            rT--;
            rS--;
        }

        return rawMult * HOUSE_EDGE;
    }

    function cashOutMines() {
        if (minesState !== 'ACTIVE') return;

        minesState = 'CASHED_OUT';
        const winAmount = minesBet * minesMultiplier;
        const profit = winAmount - minesBet;

        BalanceManager.update(winAmount);
        // updateBalanceDisplay handled by listener

        // Visuals
        // Remove old overlay text assignment
        // minesResultMsg.textContent = `WON ${winAmount.toFixed(2)}`;
        showNotification(`You won ${winAmount.toFixed(2)} ORY!`, 'success');
        // minesResultMsg.style.color = 'var(--success)';
        // minesOverlay.classList.remove('hidden'); // Don't show overlay on win anymore

        revealAllMines(true); // Reveal mines but dimmed

        addToMinesHistory(minesCount, minesSafePicks, minesMultiplier, profit);
        updateMinesUI();

        // Victory Sound
        if (notes && notes[0]) notes[0].synth.triggerAttackRelease("C5", "8n");

        // Enable Restart immediately
        enableMinesRestart();
    }

    function enableMinesRestart() {
        // Switch UI back to "Betting" mode but keep the board visible
        // We override the default updateMinesUI behavior for IDLE state slightly
        minesActionBtn.classList.remove('hidden');
        minesCashoutBtn.classList.add('hidden');
        minesActionBtn.textContent = 'BET';
        minesActionBtn.disabled = false;

        minesBetInput.disabled = false;
        minesCountSelect.disabled = false;
    }

    // Removed resetMinesGame - startMinesRound handles cleanup

    function revealAllMines(win = false) {
        minesGrid.forEach((cell, i) => {
            if (cell.isMine && !cell.revealed) {
                const tile = minesGridEl.children[i];
                tile.classList.add('revealed-mine');
                if (win) tile.classList.add('revealed-dimmed');
                tile.innerHTML = '<span class="bomb-icon">💣</span>';
            } else if (!cell.isMine && !cell.revealed) {
                const tile = minesGridEl.children[i];
                tile.classList.add('disabled');
            }
        });
    }

    function updateMinesUI() {
        if (minesState === 'ACTIVE') {
            minesActionBtn.classList.add('hidden');
            minesCashoutBtn.classList.remove('hidden');

            // Enable cashout only if picks > 0
            if (minesSafePicks > 0) {
                minesCashoutBtn.disabled = false;
                minesCashoutBtn.textContent = `CASHOUT ${(minesBet * minesMultiplier).toFixed(2)}`;
            } else {
                minesCashoutBtn.disabled = true;
                minesCashoutBtn.textContent = 'PICK A TILE';
            }

            // Disable Inputs
            minesBetInput.disabled = true;
            minesCountSelect.disabled = true;

        } else {
            // When not active, ensure action button is visible and cashout is hidden
            // Specific input/button states are handled by enableMinesRestart()
            minesActionBtn.classList.remove('hidden');
            minesCashoutBtn.classList.add('hidden');
        }

        minesMultiplierEl.textContent = minesMultiplier.toFixed(2) + 'x';

        // Next Profit Preview
        if (minesState === 'ACTIVE') {
            const nextMult = getNextMultiplier();
            const currentWin = minesBet * minesMultiplier;
            const nextWin = minesBet * nextMult;
            const diff = nextWin - currentWin;
            minesNextProfitEl.textContent = `+${diff.toFixed(2)}`;
            minesNextProfitEl.parentElement.classList.remove('hidden');
        } else {
            minesNextProfitEl.parentElement.classList.add('hidden');
        }
    }

    function addToMinesHistory(mines, picks, mult, profit) {
        const item = document.createElement('div');
        item.className = 'history-item';

        // Format
        const isWin = profit >= 0;
        const colorClass = isWin ? 'profit-pos' : 'profit-neg';

        item.innerHTML = `
            <span class="game-info" style="font-size: 0.75rem; color: var(--text-secondary)">${mines} Mines / ${picks} Hits</span>
            <div style="display:flex; gap: 8px;">
                 <span class="history-mult">${mult.toFixed(2)}x</span>
                 <span class="history-profit ${colorClass}">${profit >= 0 ? '+' : ''}${profit.toFixed(2)}</span>
            </div>
        `;

        minesHistoryList.insertBefore(item, minesHistoryList.firstChild);
        if (minesHistoryList.children.length > 15) minesHistoryList.lastElementChild.remove();
    }

    // Listeners
    if (minesActionBtn) minesActionBtn.addEventListener('click', () => {
        if (minesState !== 'ACTIVE') startMinesRound();
    });

    // Clean up any existing restart buttons functionality involves just removing them
    // as we now use the main BET button.

    if (minesCashoutBtn) minesCashoutBtn.addEventListener('click', () => {
        cashOutMines();
    });

    // Bet Modifiers
    document.querySelectorAll('.bet-mod[data-game="mines"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            let val = parseFloat(minesBetInput.value) || 0;
            if (action === 'half') val /= 2;
            if (action === 'double') val *= 2;
            minesBetInput.value = val.toFixed(2);
        });
    });



    // --- Dice X Logic ---
    let diceTarget = 50.00;
    let dicePayout = 1.98;
    let diceChance = 50.00;
    let isRollingDice = false;

    // Elements - Selected lazily
    let diceSliderContainer, diceSliderFill, diceSliderHandle; // Refactored variables
    let diceTargetVal, diceMultVal, diceChanceVal, diceProfitVal;
    let diceResultDisplay, diceActionBtn, diceBetInput, diceHistoryList;
    let diceInitDone = false;

    function initDice() {
        console.log('initDice: Initializing...');
        // Always ensuring elements are fresh or just use delegation for actions
        diceSliderContainer = document.getElementById('dice-slider-container');
        // diceSlider = document.getElementById('dice-slider'); // REMOVED: Native input
        diceSliderFill = document.getElementById('dice-slider-fill');
        diceSliderHandle = document.getElementById('dice-slider-handle');

        diceTargetVal = document.getElementById('dice-target-value');
        diceMultVal = document.getElementById('dice-multiplier-value');
        diceChanceVal = document.getElementById('dice-chance-value');
        diceProfitVal = document.getElementById('dice-profit-value');

        diceResultDisplay = document.getElementById('dice-result-number');
        diceActionBtn = document.getElementById('dice-action-btn'); // FIXED: Was missing!
        diceBetInput = document.getElementById('dice-bet-amount');
        diceHistoryList = document.getElementById('dice-history');

        // Check for critical missing elements
        if (!diceActionBtn) console.error('CRITICAL: diceActionBtn not found!');

        if (!diceInitDone) {
            // Event Delegation for Dice Actions
            const diceView = document.getElementById('dice-view');
            if (diceView) {
                diceView.addEventListener('click', (e) => {
                    const target = e.target;

                    // Roll Button
                    if (target.id === 'dice-action-btn' || target.closest('#dice-action-btn')) {
                        console.log('Delegate: Roll Dice clicked');
                        rollDice();
                    }

                    // Bet Modifiers
                    if (target.classList.contains('bet-mod') && target.dataset.game === 'dice') {
                        const action = target.dataset.action;
                        let current = parseFloat(diceBetInput.value) || 0;
                        if (action === 'half') diceBetInput.value = (current / 2).toFixed(2);
                        if (action === 'double') diceBetInput.value = (current * 2).toFixed(2);
                        updateDiceCalculations();
                    }
                });
            }

            // Custom Slider Logic
            if (diceSliderContainer) {
                initCustomSlider();
            }

            // Bet Input
            if (diceBetInput) {
                diceBetInput.addEventListener('input', updateDiceCalculations);
            }

            diceInitDone = true;
        }

        updateDiceUI();
        updateDiceCalculations();
    }


    // --- Custom Slider Implementation ---
    function initCustomSlider() {
        let isDragging = false;

        const updateSliderFromEvent = (clientX) => {
            const rect = diceSliderContainer.getBoundingClientRect();
            let rawX = clientX - rect.left;
            let width = rect.width;

            // Clamp
            if (rawX < 0) rawX = 0;
            if (rawX > width) rawX = width;

            const percentage = (rawX / width) * 100;

            // Map percentage (0-100) to value (min-max)
            // min=2, max=98
            const min = 2;
            const max = 98;
            const value = min + ((percentage / 100) * (max - min));

            // Snap to integer
            diceTarget = Math.round(value);

            // Re-Clamp value
            if (diceTarget < min) diceTarget = min;
            if (diceTarget > max) diceTarget = max;

            updateDiceUI();
            updateDiceCalculations();
        };

        // Mouse Events
        diceSliderContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateSliderFromEvent(e.clientX);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent text selection
            updateSliderFromEvent(e.clientX);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch Events
        diceSliderContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateSliderFromEvent(e.touches[0].clientX);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling
            updateSliderFromEvent(e.touches[0].clientX);
        }, { passive: false });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    function updateDiceUI() {
        const min = 2;
        const max = 98;
        const val = diceTarget;

        const percentage = ((val - min) / (max - min)) * 100;

        if (diceSliderFill) diceSliderFill.style.width = percentage + '%';
        if (diceSliderHandle) diceSliderHandle.style.left = percentage + '%';

        if (diceTargetVal) diceTargetVal.textContent = val.toFixed(2);
    }

    function updateDiceCalculations() {
        // Safety check + Re-select if null (defensive coding)
        if (!diceMultVal || !diceChanceVal || !diceProfitVal || !diceBetInput) {
            diceMultVal = document.getElementById('dice-multiplier-value');
            diceChanceVal = document.getElementById('dice-chance-value');
            diceProfitVal = document.getElementById('dice-profit-value');
            diceBetInput = document.getElementById('dice-bet-amount');

            // If still null, we cannot proceed
            if (!diceMultVal || !diceChanceVal || !diceProfitVal || !diceBetInput) {
                console.warn('Dice elements missing in updateDiceCalculations');
                return;
            }
        }

        // Roll Under Logic
        // Chance = Target (since 0 to 100)
        // e.g. Target 50 -> Chance 50%

        diceChance = diceTarget;

        // House Edge 1%
        // Payout = (100 - Edge) / Chance
        // Edge = 1.0
        const edge = 1.0;
        dicePayout = (100 - edge) / diceChance;

        // Clamp logic to avoid infinity
        if (dicePayout < 1.0102) dicePayout = 1.0102;

        diceMultVal.textContent = dicePayout.toFixed(4) + 'x';
        diceChanceVal.textContent = diceChance.toFixed(2) + '%';

        // Profit Calc
        const bet = parseFloat(diceBetInput.value) || 0;
        const profit = (bet * dicePayout) - bet;
        diceProfitVal.textContent = '+' + profit.toFixed(2);
    }


    function rollDice() {
        if (isRollingDice) return;

        const bet = parseFloat(diceBetInput.value);
        if (isNaN(bet) || bet <= 0) {
            showNotification('Invalid bet amount', 'error');
            return;
        }
        if (bet > BalanceManager.get()) {
            showNotification('Insufficient balance', 'error');
            return;
        }

        // Deduct Balance
        BalanceManager.update(-bet);
        // updateBalanceDisplay handled by listener

        isRollingDice = true;
        diceActionBtn.disabled = true;

        // Reset Visuals
        diceResultDisplay.classList.remove('win', 'loss');
        diceResultDisplay.classList.add('rolling');

        // Animation: "Data Decrypt" Effect
        let frameCount = 0;
        const maxFrames = 25;
        const chars = '0123456789';

        const interval = setInterval(() => {
            try {
                // Random scramble effect
                let scrambled = '';
                scrambled += chars[Math.floor(Math.random() * 10)];
                scrambled += chars[Math.floor(Math.random() * 10)];
                scrambled += '.';
                scrambled += chars[Math.floor(Math.random() * 10)];
                scrambled += chars[Math.floor(Math.random() * 10)];

                diceResultDisplay.textContent = scrambled;

                frameCount++;
                if (frameCount >= maxFrames) {
                    clearInterval(interval);
                    finalizeDiceRoll(bet);
                }
            } catch (e) {
                console.error("Anim error", e);
                clearInterval(interval);
                isRollingDice = false;
                diceActionBtn.disabled = false;
            }
        }, 20); // Faster updates
    }

    function playDiceSound(type) {
        if (!window.Tone || Tone.context.state !== 'running') return;
        try {
            const synth = new Tone.Synth().toDestination();
            if (type === 'win') {
                // Happy high ping
                const now = Tone.now();
                synth.triggerAttackRelease("E5", "16n", now);
                synth.triggerAttackRelease("G5", "16n", now + 0.1);
            } else if (type === 'loss') {
                // Low thud
                synth.triggerAttackRelease("C2", "8n");
            }
        } catch (e) {
            console.warn("Audio error", e);
        }
    }

    function finalizeDiceRoll(betAmount) {
        try {
            // Generate Result
            const result = (Math.random() * 100);
            const resultFormatted = result.toFixed(2);

            diceResultDisplay.textContent = resultFormatted;
            diceResultDisplay.classList.remove('rolling');

            // Win Condition: Roll UNDER Target
            const currentTarget = parseFloat(diceTarget.toFixed(2));
            const isWin = result < currentTarget;

            // Ensure history list is available
            const list = document.getElementById('dice-history') || diceHistoryList;

            if (isWin) {
                const winAmount = betAmount * dicePayout;
                const profit = winAmount - betAmount;



                BalanceManager.update(winAmount);
                // updateBalanceDisplay handled by listener

                // Win Visuals
                diceResultDisplay.classList.add('win');
                showNotification(`You won ${winAmount.toFixed(2)} ORY!`, 'success');

                // Play Win Sound
                playDiceSound('win');

                if (list) addDiceHistory(resultFormatted, currentTarget.toFixed(2), dicePayout.toFixed(4), profit, true);

                // Temporary Flash Logic (Reset to neutral)
                setTimeout(() => {
                    diceResultDisplay.classList.remove('win');
                }, 2000);

            } else {
                // Loss Visuals
                diceResultDisplay.classList.add('loss');
                playDiceSound('loss');
                if (list) addDiceHistory(resultFormatted, currentTarget.toFixed(2), dicePayout.toFixed(4), -betAmount, false);

                // Temporary Flash Logic (Reset to neutral)
                setTimeout(() => {
                    diceResultDisplay.classList.remove('loss');
                }, 2000);
            }

        } catch (err) {
            console.error("Dice Finalize Error", err);
        } finally {
            isRollingDice = false;
            diceActionBtn.disabled = false;
        }
    }

    function addDiceHistory(result, target, payout, profit, isWin) {
        // Robust selector
        const list = document.getElementById('dice-history') || diceHistoryList;
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'history-item';

        const profitClass = isWin ? 'profit-pos' : 'profit-neg';
        const profitSign = isWin ? '+' : '';

        item.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <span style="font-weight:700; color: ${isWin ? 'var(--success)' : 'var(--text-secondary)'}">${result}</span>
                <span style="font-size:0.75rem; color:var(--text-secondary);">&lt; ${target}</span>
            </div>
            <div style="text-align:right;">
                <span class="history-mult" style="font-size:0.75rem; display:block;">${payout}x</span>
                <span class="history-profit ${profitClass}">${profitSign}${profit.toFixed(2)}</span>
            </div>
        `;

        if (diceHistoryList && diceHistoryList.parentNode) {
            list.insertBefore(item, list.firstChild);
            if (list.children.length > 20) {
                list.lastElementChild.remove();
            }
        } else if (list) {
            // Fallback if the variable was stale but we found 'list' via getElementById
            list.insertBefore(item, list.firstChild);
            if (list.children.length > 20) {
                list.lastElementChild.remove();
            }
        }
    }
});

// --- Setup -----------------------------------------------
// - Canvas Context -
var cnv = document.getElementById('cnv'),
    ctx = cnv.getContext('2d');
ctx.scale(20, 20);

// Color palette for the blocks
var palettes = {
    standard: ['#ffeb3b', '#9c27b0', '#ff9800', '#3f51b5', '#03a9f4', '#4caf50', '#f44336'],
    experiment: ['#607d8b', '#8bc34a', '#009688', '#e91e63', '#ffc107', '#00bcd4', '#673ab7'],
}
var palette = palettes.standard;

// Game information
var level = 0;
var linesCleared = 0;
var paused = false;
var pieceArray = ['T', 'O', 'I', 'L', 'J', 'S', 'Z'];

// Arena
var arena = {
    // Props
    pos: { x: 10, y: 2 },
    matrix: createMatrix(10, 20),
    // Methods
    draw: function () {
        drawMatrix(this.matrix, this.pos);
        this.drawOutline();
    },
    drawOutline: function () {
        ctx.lineWidth = 0.1;
        ctx.strokeStyle = "#FFF";
        ctx.strokeRect(this.pos.x, this.pos.y, this.matrix[0].length, this.matrix.length);
    },
};

// Player
var player = {
    // Props
    matrix: [],
    nextPiece: [],
    heldPiece: randomPiece(),
    pos: { x: 0, y: 0 },
    score: 0,
    highscore: 0,
    // Methods
    collisionCheck: function (pos) {
        var m = this.matrix, o = pos || this.pos;
        for (var y = 0; y < m.length; ++y) {
            for (var x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (arena.matrix[y + o.y] && arena.matrix[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    },
    draw: function () {
        drawMatrix(this.matrix, { x: this.pos.x + arena.pos.x, y: this.pos.y + arena.pos.y });
        // Ghost piece
        for (var y = 0; y < 20; y++) {
            if (this.collisionCheck({ x: this.pos.x, y: y }) && y >= this.pos.y) {
                drawMatrix(this.matrix, { x: this.pos.x + arena.pos.x, y: y + arena.pos.y - 1 }, 'rgba(255,255,255,0.15)');
                return false;
            }
        }
    },
    drop: function () {
        this.pos.y++;
        if (this.collisionCheck()) {
            this.pos.y--;
            this.merge();
            lineCheck();
            this.reset();
        }
        dropCount = 0;
    },
    hardDrop: function () {
        var count = 0;
        while ((!this.collisionCheck()) && count < 20) {
            this.pos.y++;
            count++;
        }
        this.pos.y--;
        this.score += Math.max(count - 1, 0) * 2;
        this.highscore = Math.max(this.highscore, this.score);
        this.drop();
    },
    merge: function () {
        this.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena.matrix[y + this.pos.y][x + this.pos.x] = value;
                }
            });
        });
    },
    reset: function () {
        this.matrix = this.nextPiece;
        this.nextPiece = randomPiece();
        this.pos.y = 0;
        this.pos.x = Math.floor(arena.matrix[0].length / 2) - Math.floor(this.matrix[0].length / 2);

        // Game Over check
        if (this.collisionCheck()) { reset(); }
    },
    rotate: function (dir) {
        for (var y = 0; y < this.matrix.length; ++y) {
            for (var x = 0; x < y; ++x) {
                [
                    this.matrix[x][y],
                    this.matrix[y][x],
                ] = [
                        this.matrix[y][x],
                        this.matrix[x][y],
                    ];
            }
        }

        if (dir > 0) { this.matrix.forEach(row => row.reverse()); }
        else { matrix.reverse(); }

        // collision check in case we rotate into the wall/another piece
        var pos = this.pos.x;
        var offset = 1;
        while (this.collisionCheck()) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.matrix[0].length) {
                this.rotate(-dir);
                this.pos.x = pos;
                return;
            }
        }
    },
    shift: function (dir) {
        this.pos.x += dir;
        if (this.collisionCheck()) { this.pos.x -= dir; }
    },
    switchPiece: function () {
        [this.heldPiece, this.matrix] = [this.matrix, this.heldPiece];

        // collision check in case we rotate into the wall/another piece
        var pos = this.pos.x;
        var offset = 1;
        while (this.collisionCheck()) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.matrix[0].length) {
                player.switchPiece();
                this.pos.x = pos;
                return;
            }
        }
    },
};

// Player Piece drop timer
var lastTime = 0;
var dropCount = 0;
var dropInterval = 1000;

// ---------------------------------------------------------

// --- Input Handling --------------------------------------
// --- Input Handling --------------------------------------
document.addEventListener('keydown', function (e) {
    switch (e.keyCode) {
        case 80: paused = !paused; break; // P - Pause
        case 82: reset(); break;          // R - Reset
    }
    if (!paused) {
        e.preventDefault();
        switch (e.keyCode) {
            case 37: player.shift(-1); break;     // Left
            case 38: player.rotate(1); break;     // Up
            case 39: player.shift(1); break;      // Right
            case 40: player.drop(); break;        // Down
            case 32: player.hardDrop(); break;    // Space
            case 16: player.switchPiece(); break; // Shift
            // default: console.log(e.keyCode);
        }
    }
});

// Mobile Controls
function setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnDown = document.getElementById('btn-down');
    const btnDrop = document.getElementById('btn-drop');

    // System buttons
    const btnHome = document.getElementById('btn-home');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');

    const addTouchListener = (btn, action) => {
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            action();
        }, { passive: false });

        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            action();
        });
    };

    // Game Controls
    addTouchListener(btnLeft, () => { if (!paused) player.shift(-1); });
    addTouchListener(btnRight, () => { if (!paused) player.shift(1); });
    addTouchListener(btnRotate, () => { if (!paused) player.rotate(1); });
    addTouchListener(btnDown, () => { if (!paused) player.drop(); });
    addTouchListener(btnDrop, () => { if (!paused) player.hardDrop(); });

    // System Controls
    addTouchListener(btnHome, () => {
        window.location.href = '/';
    });

    addTouchListener(btnPause, () => {
        paused = !paused;
    });

    addTouchListener(btnReset, () => {
        reset();
    });
}

setupMobileControls();
// ---------------------------------------------------------

// --- Functions -------------------------------------------
function init() {
    reset();
    frameFunction();
}
function reset() {
    player.nextPiece = randomPiece();
    arena.matrix.forEach(row => row.fill(0));
    player.reset();
    player.score = 0;
    player.heldPiece = randomPiece();
    dropCount = 0;
    linesCleared = 0;
    level = 0;
}

function frameFunction(time = 0) {
    // Cover previous frame
    coverFrame();

    // Timer for player piece drop
    if (!paused) {
        var deltaTime = time - lastTime;
        lastTime = time;
        dropCount += deltaTime;
        if (dropCount > Math.max((dropInterval - (level * 60)), 60)) { player.drop(); }
    }

    // Draw stuff
    draw();

    // Next Frame
    requestAnimationFrame(frameFunction);
}

function coverFrame() {
    ctx.fillStyle = 'rgba(0,10,30,1)';
    ctx.fillRect(0, 0, cnv.width, cnv.height);
}

function createMatrix(w, h) {
    var matrix = [];
    while (h--) { matrix.push(new Array(w).fill(0)); }
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case 'O':
            return [
                [1, 1],
                [1, 1],
            ]; break;
        case 'T':
            return [
                [0, 0, 0],
                [2, 2, 2],
                [0, 2, 0],
            ]; break;
        case 'L':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ]; break;
        case 'J':
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ]; break;
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ]; break;
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ]; break;
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ]; break;
    }
}

function drawMatrix(matrix, offset, color) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (color) {
                    ctx.fillStyle = paused ? 'rgba(0,0,0,0)' : color;
                } else {
                    ctx.fillStyle = paused ? 'rgba(255,255,255,0.2)' : (palette[value - 1] || 'white');
                };
                ctx.strokeStyle = 'rgba(0,10,30,1)';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    player.draw();
    arena.draw();
    drawUI();
}

function drawUI() {
    ctx.fillStyle = '#FFF';
    ctx.font = '1px monospace';
    ctx.textAlign = 'left';
    // Title or something
    ctx.fillText('Tetris', 3, 3);
    ctx.font = '0.8px monospace';
    ctx.fillText('Back to', 3, 4.2);
    ctx.fillText('OrygnsCode', 3, 5.0);
    ctx.fillText('Home', 3, 5.8);
    ctx.font = '1px monospace'; // Reset font for subsequent text
    // Instructions
    ctx.fillText('← / → = Move Horizontally', 6, 25);
    ctx.fillText('↑ = Rotate    // SHIFT = Switch', 6, 26);
    ctx.fillText('↓ = Soft Drop // SPACE = Hard Drop', 6, 27);
    ctx.fillText('P = Pause     // R = Reset', 6, 28);
    // Highscore
    ctx.fillText('Highscore', 21, 3);
    ctx.fillText(player.highscore, 21, 4);
    // Player Score
    ctx.fillText('Player Score', 21, 6);
    ctx.fillText(player.score, 21, 7);
    // Level
    ctx.fillText('Level', 21, 9);
    ctx.fillText(level, 21, 10);
    // Lines
    ctx.fillText('Lines Cleared', 21, 12);
    ctx.fillText(linesCleared, 21, 13);
    // Held Piece
    ctx.fillText('Held Piece', 3, 15);
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = "#FFF";
    ctx.strokeRect(3, 16, 6, 6);
    drawMatrix(player.heldPiece, { x: 4, y: 17 })
    // Next Piece
    ctx.fillStyle = '#FFF';
    ctx.fillText('Next Piece', 21, 15);
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = "#FFF";
    ctx.strokeRect(21, 16, 6, 6);
    drawMatrix(player.nextPiece, { x: 22, y: 17 })
    // Pause Text
    if (paused) {
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText('Game Paused', 5 + arena.pos.x, 8 + arena.pos.y);
    }
}

function lineCheck() {
    var rowMultiplier = 1;
    for (var y = arena.matrix.length - 1; y > 0; y--) {
        if (arena.matrix[y].every(function (x) { return x > 0; })) {
            linesCleared++;
            var row = arena.matrix.splice(y, 1)[0];
            arena.matrix.unshift(row.fill(0));
            player.score += rowMultiplier * 50;
            player.highscore = Math.max(player.highscore, player.score);
            rowMultiplier *= 2;
            y++; // Because of the splicing offset
            // Level
            level = Math.floor(linesCleared / 10);
        }
    }
}

function randomPiece() {
    return (createPiece(pieceArray[Math.floor(Math.random() * pieceArray.length)]));
}
// ---------------------------------------------------------

init();

// --- Clickable Link for "Back to OrygnsCode Home" ---
cnv.addEventListener('click', function (event) {
    const clickX = event.offsetX / 20; // Scale factor is 20
    const clickY = event.offsetY / 20; // Scale factor is 20

    const textFont = '0.8px monospace';
    const commonTextX = 3;
    const commonTextHeight = 0.8; // Approximation

    const previousFont = ctx.font;
    ctx.font = textFont; // Set font for measurements

    // Line 1: "Back to"
    const text1 = "Back to";
    const text1YBaseline = 4.2;
    const text1Width = ctx.measureText(text1).width;
    const x1_1 = commonTextX;
    const y1_1 = text1YBaseline - commonTextHeight;
    const x2_1 = commonTextX + text1Width;
    const y2_1 = text1YBaseline;
    const clickedLine1 = clickX >= x1_1 && clickX <= x2_1 && clickY >= y1_1 && clickY <= y2_1;

    // Line 2: "OrygnsCode"
    const text2 = "OrygnsCode";
    const text2YBaseline = 5.0;
    const text2Width = ctx.measureText(text2).width;
    const x1_2 = commonTextX;
    const y1_2 = text2YBaseline - commonTextHeight;
    const x2_2 = commonTextX + text2Width;
    const y2_2 = text2YBaseline;
    const clickedLine2 = clickX >= x1_2 && clickX <= x2_2 && clickY >= y1_2 && clickY <= y2_2;

    // Line 3: "Home"
    const text3 = "Home";
    const text3YBaseline = 5.8;
    const text3Width = ctx.measureText(text3).width;
    const x1_3 = commonTextX;
    const y1_3 = text3YBaseline - commonTextHeight;
    const x2_3 = commonTextX + text3Width;
    const y2_3 = text3YBaseline;
    const clickedLine3 = clickX >= x1_3 && clickX <= x2_3 && clickY >= y1_3 && clickY <= y2_3;

    ctx.font = previousFont; // Restore previous font

    if (clickedLine1 || clickedLine2 || clickedLine3) {
        const homeLink = document.getElementById('homeLink');
        if (homeLink) {
            homeLink.click();
        }
    }
});

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that accepts degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;

// Configuration
const canvasDefaultWidth = 375; // Original fixed width, used for internal game logic scaling
const canvasDefaultHeight = 375; // Original fixed height, used for internal game logic scaling
const platformHeight = 100;
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

const canvas = document.getElementById("game");
// Canvas dimensions are set to full screen in the resize event and initially
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// Initialize layout
resetGame();

// Resets game variables and layouts but does not start the game (game starts on mousedown)
function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  for(let i = 0; i < 10; i++) { // Generate initial trees
    generateTree();
  }

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw(); // Initial draw
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  const lastTree = trees.last();
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = treeColors[Math.floor(Math.random() * treeColors.length)];

  trees.push({ x, color });
}

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;

  const lastPlatform = platforms.last();
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

// Event Listeners
window.addEventListener("keydown", function (event) {
  if (event.key == " ") { // Spacebar to reset
    event.preventDefault();
    resetGame();
  }
});

window.addEventListener("mousedown", function (event) {
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", function (event) {
  if (phase == "stretching") {
    phase = "turning";
  }
});

window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw(); // Redraw with new dimensions
});

restartButton.addEventListener("click", function (event) {
  event.preventDefault(); // Prevent any default button action
  resetGame();
  // restartButton.style.display = "none"; // resetGame already hides it
});


// The main game loop
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  let deltaTime = timestamp - lastTimestamp;

  switch (phase) {
    case "waiting":
      return; // Stop the loop
    case "stretching": {
      sticks.last().length += deltaTime / stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += deltaTime / turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          score += perfectHit ? 2 : 1;
          scoreElement.innerText = score;

          if (perfectHit) {
            perfectElement.style.opacity = 1;
            perfectElement.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                perfectElement.style.opacity = 0;
                perfectElement.style.transform = 'translateY(0px)';
            }, 1000);
          }
          // Generate new platforms and trees as the hero progresses
          generatePlatform();
          generateTree(); 
          generateTree();
        }
        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += deltaTime / walkingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth; // heroWidth ensures he walks off the edge
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += deltaTime / transitioningSpeed;

      const targetPlatform = platforms[platforms.length - sticks.length]; // The platform hero is moving to
      if (sceneOffset > targetPlatform.x + targetPlatform.w - paddingX) {
        sticks.push({
          x: targetPlatform.x + targetPlatform.w,
          length: 0,
          rotation: 0
        });
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180) {
        sticks.last().rotation += deltaTime / turningSpeed;
      }
      heroY += deltaTime / fallingSpeed;
      
      // Check if hero is off screen
      const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasDefaultHeight) / 2; 
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        return; // Stop animation
      }
      break;
    }
    default:
      throw Error("Wrong phase: " + phase);
  }

  draw();
  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90) {
    throw Error(`Stick is ${sticks.last().rotation}° not 90°`);
  }
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 < stickFarX &&
    stickFarX < platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  ) {
    return [platformTheStickHits, true]; // Perfect hit
  }
  return [platformTheStickHits, false]; // Normal hit or miss
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawBackground();

  // Center game area. The game logic uses canvasDefaultWidth/Height for its coordinate system.
  ctx.translate(
    (window.innerWidth - canvasDefaultWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasDefaultHeight) / 2
  );

  drawPlatforms();
  drawSticks(); // Draw sticks before hero so hero is on top
  drawHero();   // Draw hero after platforms and sticks

  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "black";
    ctx.fillRect(
      x,
      canvasDefaultHeight - platformHeight, // Positioned from bottom of default canvas height
      w,
      platformHeight + (window.innerHeight - canvasDefaultHeight) / 2 // Extend to bottom of actual screen
    );

    if (sticks.last().x < x) { // Only draw perfect area on upcoming platforms
      ctx.fillStyle = "red";
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasDefaultHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
    }
  });
}

function drawHero() {
  ctx.save();
  ctx.fillStyle = "black";
  // Hero's y position is relative to the top of the platform
  ctx.translate(
    heroX - heroWidth / 2, 
    heroY + canvasDefaultHeight - platformHeight - heroHeight / 2 
  );

  // Body
  drawRoundedRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4, // Body part, legs are separate
    5 // Corner radius
  );

  // Legs
  const legDistance = 5;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false); // Right leg
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false); // Left leg
  ctx.fill();

  // Eye
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Bandana
  ctx.fillStyle = "red";
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5); // Main band
  // Bandana ties
  ctx.beginPath();
  ctx.moveTo(-9, -14.5); // Start of first tie
  ctx.lineTo(-17, -18.5);
  ctx.lineTo(-14, -8.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -10.5); // Start of second tie
  ctx.lineTo(-15, -3.5);
  ctx.lineTo(-5, -7);
  ctx.fill();

  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fill();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();
    ctx.translate(stick.x, canvasDefaultHeight - platformHeight); // Anchor at bottom-left of stick start
    ctx.rotate((Math.PI / 180) * stick.rotation);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black"; // Stick color
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length); // Draw upwards
    ctx.stroke();
    ctx.restore();
  });
}

function drawBackground() {
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#BBD691");
  gradient.addColorStop(1, "#FEF1E1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

  trees.forEach((tree) => drawTree(tree.x, tree.color));
}

function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(x, color) {
  ctx.save();
  // Tree's horizontal position is affected by sceneOffset and its own stretch factor,
  // but vertical is based on the hill it's on, not affected by horizontal scroll directly.
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x), // Corrected to remove hill1Stretch application here
    getTreeY(x, hill1BaseHeight, hill1Amplitude) // Use the X for sin wave, not windowX
  );

  const treeTrunkHeight = 5;
  const treeTrunkWidth = 2;
  const treeCrownHeight = 25;
  const treeCrownWidth = 10;

  ctx.fillStyle = "#7D833C"; // Trunk color
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight); // Bottom-left of crown
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight)); // Top point of crown
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight); // Bottom-right of crown
  ctx.closePath(); // Close path for fill
  ctx.fillStyle = color; // Crown color
  ctx.fill();
  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  // Use a consistent scroll offset for hills
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + sineBaseY
  );
}

function getTreeY(treeX, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  // Tree's Y position on the hill is determined by its original X coordinate
  // on the stretched sine wave of the hill it's "planted" on.
  // This needs to use the *game world* X, not windowX, and incorporate the hill's stretch.
  // Note: The original `getTreeY` only used `Math.sinus(x)`, which might not be right if `x` isn't scaled.
  // For simplicity, let's assume trees are on the first hill for their Y calculation.
  return Math.sinus((sceneOffset * backgroundSpeedMultiplier + treeX) * hill1Stretch) * amplitude + sineBaseY;
}

// Start the animation loop if it's not already started (e.g., for initial draw)
// The actual game starts on mousedown.
window.requestAnimationFrame(animate); // This will initially do nothing until phase changes from "waiting"

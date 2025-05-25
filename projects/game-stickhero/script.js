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
let lastTimestamp; 

let heroX; 
let heroY; 
let sceneOffset; 

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;

// Configuration
const canvasDefaultWidth = 375; 
const canvasDefaultHeight = 375; 
const platformHeight = 100;
const heroDistanceFromEdge = 10; 
const paddingX = 100; // This is the X position on the default canvas where the hero should be when waiting
const perfectAreaSize = 10;
const backgroundSpeedMultiplier = 0.2;
const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;
const stretchingSpeed = 4; 
const turningSpeed = 4; 
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;
const heroWidth = 17;
const heroHeight = 30;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// Initialize layout
resetGame();

function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0; 
  score = 0;

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  // The first platform's right edge should align with paddingX for the hero's waiting spot
  platforms = [{ x: paddingX - 50, w: 50 }]; 
  
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  for(let i = 0; i < 10; i++) { 
    generateTree();
  }

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0; 

  draw(); 
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;
  const lastTree = trees.last();
  let furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
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
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  platforms.push({ x, w });
}

window.addEventListener("keydown", function (event) {
  if (event.key == " ") { 
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
  draw(); 
});
restartButton.addEventListener("click", function (event) {
  event.preventDefault(); 
  resetGame();
});

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }
  let deltaTime = timestamp - lastTimestamp;

  switch (phase) {
    case "waiting":
      return; 
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
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      // Calculate the target platform the hero has just landed on.
      // The current stick is sticks.last(). It started on platforms[sticks.length - 2]
      // and landed (or tried to land) on platforms[sticks.length - 1].
      const landedPlatformIndex = sticks.length -1; // This is the index of the platform the hero is on
      const landedPlatform = platforms[landedPlatformIndex];

      if (!landedPlatform) {
          console.error("Transitioning phase: landedPlatform is undefined.");
          resetGame(); return;
      }
      
      // The amount to scroll: make the landedPlatform's right edge appear at paddingX
      const targetXForLandedPlatformEdge = landedPlatform.x + landedPlatform.w;
      const desiredSceneOffset = targetXForLandedPlatformEdge - paddingX;

      // Move sceneOffset towards desiredSceneOffset
      let Tspeed = deltaTime / transitioningSpeed;
      if (sceneOffset < desiredSceneOffset) {
          sceneOffset += Tspeed;
          if (sceneOffset >= desiredSceneOffset) {
              sceneOffset = desiredSceneOffset; // Snap to exact position
          }
      } else if (sceneOffset > desiredSceneOffset) { // Should not happen if always moving right
          sceneOffset -= Tspeed; 
          if (sceneOffset <= desiredSceneOffset) {
              sceneOffset = desiredSceneOffset;
          }
      }
      
      // Check if transition is complete
      if (sceneOffset === desiredSceneOffset) {
        // Add new stick starting from the edge of the platform the hero is now on
        sticks.push({
          x: landedPlatform.x + landedPlatform.w,
          length: 0,
          rotation: 0
        });
        
        // Update heroX to the start of the new stick path (relative to new world coordinates)
        heroX = landedPlatform.x + landedPlatform.w - heroDistanceFromEdge;
        heroY = 0; 

        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180) {
        sticks.last().rotation += deltaTime / turningSpeed;
      }
      heroY += deltaTime / fallingSpeed;
      const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasDefaultHeight) / 2; 
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        return; 
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
  if (!sticks.length || sticks.last().rotation !== 90) { // Added !sticks.length check
    // If called at a weird time, or if stick isn't flat, assume no hit.
    return [undefined, false]; 
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
    return [platformTheStickHits, true];
  }
  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();
  ctx.translate(
    (window.innerWidth - canvasDefaultWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasDefaultHeight) / 2
  );
  drawPlatforms();
  drawSticks(); 
  drawHero();   
  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "black";
    ctx.fillRect(
      x,
      canvasDefaultHeight - platformHeight, 
      w,
      platformHeight + (window.innerHeight - canvasDefaultHeight) / 2 
    );
    // Only draw perfect area if sticks array exists and its last element has an x value
    if (sticks.length > 0 && sticks.last() && typeof sticks.last().x !== 'undefined' && sticks.last().x < x) { 
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

function drawHero() { /* ... (Keep as you provided) ... */ }
function drawRoundedRect(x, y, width, height, radius) { /* ... (Keep as you provided) ... */ }
function drawSticks() { /* ... (Keep as you provided) ... */ }
function drawBackground() { /* ... (Keep as you provided) ... */ }
function drawHill(baseHeight, amplitude, stretch, color) { /* ... (Keep as you provided) ... */ }
function drawTree(x, color) { /* ... (Keep as you provided) ... */ }
function getHillY(windowX, baseHeight, amplitude, stretch) { /* ... (Keep as you provided) ... */ }
function getTreeY(treeX, baseHeight, amplitude) { /* ... (Keep as you provided) ... */ }

window.requestAnimationFrame(animate);

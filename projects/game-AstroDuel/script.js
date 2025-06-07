// Game parameters
let canvas, centerPoint, ctx, game_mode, playing, player1, player2, start;
// The scoreboard is used to keep track of the health of the players at the top of the screen
const scoreboard = document.querySelector(".scoreboard");
// Each player has a shield score in percent
const shield_p1 = document.querySelector(".shield_p1");
const shield_p2 = document.querySelector(".shield_p2");
// The game over screen has an explosion controlled and sized with two variables
const crash = document.querySelector(".crash");
const explosion = document.querySelector(".explosion");
// The result screen has a customised message and result of the game
const message = document.querySelector(".message");
const result = document.querySelector(".result");
// Each of the planet graphics is dynamically styled and positioned
const planet1 = document.querySelector(".planet-one");
const planet2 = document.querySelector(".planet-two");
// The space variable is where the stars are drawn
const space = document.querySelector(".space");
// On the start screen there are buttons to toggle whether the player is a computer or human
const playerOneToggle = document.querySelector("#playerOne");
const playerTwoToggle = document.querySelector("#playerTwo");
// There is also a toggle button for the asteroids to create variety in the game
const asteroidsToggle = document.querySelector("#obstacles");

// Control instruction text
const playerOneControlsText = "Controls W, A, S, D, Z to fire";
const playerTwoControlsText = "Controls ↑, ↓, ←, →, Space to shoot";
// The gutter hides the new asteroids being added to the game so it is best to keep the rocket on screen to avoid being hit
const gutter = 150;
// For the popup boxes there is a background overlay
const overlay = document.getElementById("overlay");
// The popup messages has its own selector so that they can be toggled from the start screen to the end game screen
let popup = document.getElementById("popup");
const contenders = document.getElementById("contenders");
const p1_graphic = document.getElementById("player1");
const p2_graphic = document.getElementById("player2");
// Asteroid parameters group
let asteroids;
let asteroidColor;
// How often new asteroids appear on screen
const asteroidRate = 200;
// The maximum number of asteroids that can be in the game at any given time
let asteroidMax = 5;
// Start the timeout at zero
let asteroidTimeout = 0;
// Define subtle colour differences between the size of the asteroids
const asteroidColors = ["#9F96BC", "#666078", "#494556"];
// The maximum size of the asteroids
const asteroidSizeMax = 30;
// The maximum speed of the asteroids
const asteroidSpeed = 2;
// How big the asteroids should split when they are broken
const splitSize = 10;

// Rocket parameters
const rocketSize = 33;
const rocketWidth = 40;
const rocketArea = 1236.22;
const acceleration = 0.15;
const turnRate = 5;

// Shooting parameters
const shootingRate = 10;
const shootingSpeed = 12;

// Function to handle SVG files
function importSVG(name) {
  console.log("importSVG name:", name);
  const svg = document.getElementById(name);
  let object_svg = new Image();
  const data = new XMLSerializer().serializeToString(svg);
  console.log("importSVG object_svg.src before:", object_svg.src);
  object_svg.src = "data:image/svg+xml;base64," + window.btoa(data); // The btoa() method encodes a string in base-64
  console.log("importSVG object_svg.src after:", object_svg.src);
  return object_svg;
}

// Import the inline SVG elements
let player1_svg = importSVG("player1");
console.log("player1_svg:", player1_svg);
let player2_svg = importSVG("player2");
console.log("player2_svg:", player2_svg);
let flicker_svg = importSVG("flicker");
console.log("flicker_svg:", flicker_svg);

// Set the size of the explosion early on because the size changes with the animation cause a bug
const explosionSize = {
  width: (explosion.getBoundingClientRect().width / 2).toFixed(),
  height: (explosion.getBoundingClientRect().height / 2).toFixed()
};

// Popup UI handling
function openPopup() {
  console.log("openPopup called");
  start = popup.querySelector(".start-button");
  start.addEventListener("click", startGame);
  console.log("startGame event listener added to start button");
  contenders.style.display = "block";
  popup.style.display = "block";
  overlay.style.display = "block";
  contenders.style.opacity = "1";
  popup.style.opacity = "1";
  overlay.style.opacity = "0.6";
}

function closePopup() {
  start.removeEventListener("click", startGame);
  overlay.style.opacity = "0";
  popup.style.opacity = "0";
  contenders.style.opacity = "0";
  popup.style.display = "none";
  overlay.style.display = "none";
  contenders.style.display = "none";
}

// The following function creates a tesseract effect to keep the game objects roughly on screen
function tesseractMove() {
  // If on the right side of the screen then come back on the left side
  if (this.x > canvas.width + gutter) {
    this.x = 0 - gutter / 2 + this.vx;
  } else if (this.x < 0 - gutter) {
    // Or if they go off the left side then they come back on the right
    this.x = canvas.width + gutter / 2 + this.vx;
  } else {
    // Otherwise just update the x position with the velocity
    this.x += this.vx;
  }
  // If on the bottom side of the screen then come back on the top side
  if (this.y > canvas.height + gutter) {
    this.y = 0 - gutter / 2 + this.vy;
  } else if (this.y < 0 - gutter) {
    // Or if they go off the top side then they come back on the bottom
    this.y = canvas.height + gutter / 2 + this.vy;
  } else {
    // Otherwise just update the y position with the velocity
    this.y += this.vy;
  }
}

// Function to check whether two positions intersect other by returning a distance
function checkBoundary(dot1, dot2) {
  const x1 = dot1[0],
    y1 = dot1[1],
    x2 = dot2[0],
    y2 = dot2[1];
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// Math functions
function rad(angle) {
  return angle * Math.PI / 180;
}

// Define a new rocket with a token and a role
function Rocket(token, role) {
  // Give the rocket an ID based on the token of its creation
  this.id = token;
  // Starting position for player one is on the left of the screen
  if (token == "one") {
    this.x = canvas.width / 4;
  } else {
    // The other player starts on the right hand side of the screen
    this.x = canvas.width / 4 * 3;
  }
  // Both players start in the middle of the y axis
  this.y = centerPoint.y;

  // Starting velocity is 0 on both axis
  this.vx = 0;
  this.vy = 0;

  // Rocket controls
  this.thruster = false;
  this.rotateLeft = false;
  this.rotateRight = false;
  this.fire = false;
  // Set the SVG to use
  if (token == "one") {
    this.svg = player1_svg;
    this.score = shield_p1;
  } else {
    this.svg = player2_svg;
    this.score = shield_p2;
  }

  // Set rocket dependent timeouts
  this.shotTimeout = shootingRate;
  this.flameTimeout = 0;
  // Starting health for the rockets is 100% and the game ends when one rocket reaches zero
  this.health = 100;
  // Set the direction for the rocket to be facing this needs to match the SVG direction to avoid a display bug on Safari (90 is towards the top of the screen)
  if (token == "one") {
    // Player one faces the bottom of the screen to match the start screen graphic
    this.direction = 270;
  } else {
    this.direction = 90;
  }

  // Store all rocket's shots in an array
  this.shots = [];

  // Rocket methods
  this.getPoints = getRocketPoints;
  this.update = updateRocket;
  this.move = tesseractMove;
  this.render = renderRocket;
}

// Define the Enemy object which is a computer controlled Rocket
function Enemy(token, role) {
  // The enemy takes all the parameters of the Rocket
  Rocket.call(this, token, role);
  // The enemy also has a "sworn enemy" which is the oposing player and is defined in the start game function
  this.swornEnemy = "";
  // New direction to calculate how much the Enemy should turn
  this.newDirection = 0;
  // Result of the difference between the direction and the new direction
  this.angleDiff = 0;
  // New position to define where the Enemy should aim at
  this.newPosition = {
    x: 0,
    y: 0
  };
  // Set an interval for how often the Enemy should be searching
  this.searchInterval = 0;
  // Check if the Enemy has found its target
  this.targetFound = false;
  // Set an interval for how often the Enemy moves
  this.moveInterval = 0;
  // Set an interval for how often the Enemy should panic
  this.panicInterval = 50;
  // Set the proximity for how close the Enemy is to its target
  this.proximity = 0;
  // Check if the Enemy is "safe" and out of the proximity of other game objects
  this.safe = true;
  // Store the closest target to the Enemy
  this.closestTarget = "";
  // Track the distance of the closest target
  this.closestDistance = 0;
  // Create a random reaction if the target is too close
  this.fightOrFlight = 0;
  // AI state
  this.aiState = "ATTACKING";
  this.closestPlayerTarget = null;
  this.closestAsteroidThreat = null;
  this.distanceToPlayer = 0;
  // Burst firing properties
  this.isBurstFiring = false;
  this.burstShotCount = 0;
  this.defaultShotsPerBurst = 3; 
  this.defaultBurstPauseDuration = 20; 
  this.burstPauseTime = 0;
  // Reaction delay properties
  this.reactionDelayFrames = 0;
  this.minReactionDelay = 3; // Frames, tunable
  this.maxReactionDelay = 8; // Frames, tunable
  // Tactical mode properties
  this.currentTacticalMode = "OFFENSIVE"; // Default mode
  this.modeSwitchCooldown = 0; // Frames until next possible mode switch
  this.minModeDuration = 300; // Min frames AI stays in one mode (e.g., 5 seconds at 60fps)
  this.maxModeDuration = 600; // Max frames AI stays in one mode (e.g., 10 seconds at 60fps)
  // Mode-specific parameters
  this.offensiveShotsPerBurst = 4;
  this.offensiveBurstPauseDuration = 15;
  this.defensiveShotsPerBurst = 2;
  this.defensiveBurstPauseDuration = 30;
  this.offensiveEngagementMinDist = 120;
  this.offensiveEngagementMaxDist = 220;
  this.defensiveEngagementMinDist = 220;
  this.defensiveEngagementMaxDist = 320;
  this.offensiveFleeMaxProbHealth = 0.45; 
  this.defensiveFleeMaxProbHealth = 0.55;
  this.defaultFleeMinProbHealth = 0.20; 
  // Ramming properties
  this.rammingCooldown = 0;
  this.minRammingCooldown = 900; 
  this.maxRammingCooldown = 1800;
  this.rammingChargeDuration = 0;
  this.maxRammingChargeDuration = 120;
  this.ramHealthThreshold = 40;
  this.ramConsiderHealthAdvantage = 15;
}

// Setup the Enemy prototype
Enemy.prototype = Object.create(Rocket.prototype);
Object.defineProperty(Enemy.prototype, "constructor", {
  value: Enemy,
  enumerable: false,
  writable: true
});

// Give the enemy player a set of functions which creates a behaviour
Enemy.prototype.behaviour = function() {
  // Apply reaction delay
  if (this.reactionDelayFrames > 0) {
    this.reactionDelayFrames--;
    // AI continues with its last set rotation/thrust/fire commands as they are not cleared here.
    return;
  }

  // Ramming Cooldown Management
  if (this.rammingCooldown > 0) {
    this.rammingCooldown--;
  }

  // Tactical Mode Switching Logic
  if (this.modeSwitchCooldown > 0) {
    this.modeSwitchCooldown--;
  }

  if (this.modeSwitchCooldown <= 0) {
    // Time to consider a mode switch
    const newMode = (this.currentTacticalMode === "OFFENSIVE") ? "DEFENSIVE" : "OFFENSIVE";
    this.currentTacticalMode = newMode;
    // console.log(this.id, "switched to tactical mode:", this.currentTacticalMode); // For debugging

    // Set cooldown for the next switch
    this.modeSwitchCooldown = Math.floor(Math.random() * (this.maxModeDuration - this.minModeDuration + 1)) + this.minModeDuration;

    // Trigger reaction delay for the mode switch itself
    this.reactionDelayFrames = Math.floor(Math.random() * (this.maxReactionDelay - this.minReactionDelay + 1)) + this.minReactionDelay;
    
    // Reset action flags as a new mode is engaged
    this.rotateLeft = false;
    this.rotateRight = false;
    this.thruster = false;
    this.fire = false;
    return; // Exit behaviour early, action will pick up after delay
  }

  // Keep the direction within 360 degrees
  if (this.direction > 360) {
    this.direction -= 360;
  } else if (this.direction < 0) {
    this.direction += 360;
  }

  // Set a function to create random numbers to make less predictable behaviour
  function randomise(max) {
    return Math.floor(Math.random() * max);
  }
  // Function to set a new position for the enemy to target and move to
  const randomPosition = function() {
    this.newPosition.x = randomise(canvas.width);
    this.newPosition.y = randomise(canvas.height);
  }.bind(this);

  // Set function to find the angle to the given coordinates from the enemy's rocket's position
  const findAngle = function(targetX, targetY) {
    const dx = this.x - targetX;
    const dy = this.y - targetY;
    let angle = Math.atan2(dy, dx);
    // Set the newDirection based on the calculated angle
    this.newDirection = 180 - angle * (180 / Math.PI);
    // The enemy needs to work out the quickest way to turn to face the target
    this.angleDiff = this.newDirection - this.direction;
    if (this.angleDiff < -180) {
      this.angleDiff = this.angleDiff + 360;
    } else if (this.angleDiff > 180) {
      this.angleDiff = this.angleDiff - 360;
    }
    this.angleDiff = this.angleDiff.toFixed();
  }.bind(this);

  // Set a function to turn the rocket to face the calculated angleDiff
  const turnToFace = function() {
    if (this.angleDiff > 5) {
      this.rotateLeft = true;
      this.rotateRight = false;
    } else if (this.angleDiff < -5) { // Corrected condition for turning right
      this.rotateLeft = false;
      this.rotateRight = true;
    } else {
      this.rotateLeft = false;
      this.rotateRight = false;
    }
  }.bind(this);

  // AI shooting logic including burst fire
  const manageShootingLogic = function() {
    if (this.burstPauseTime > 0) {
        this.burstPauseTime--;
        this.fire = false;
        return;
    }

    // Check if AI is aiming adequately (angleDiff is set by findAngle called in attack)
    if (Math.abs(this.angleDiff) < 15) { // Consider target "in sight" for shooting, tunable angle
        if (!this.isBurstFiring) { // Start a new burst
            this.isBurstFiring = true;
            this.burstShotCount = 0; // Reset count for the new burst
        }
    } else { // Target not in sight for shooting
        if (this.isBurstFiring) { // Was bursting, but lost preferred angle
            this.isBurstFiring = false; // Stop current burst
             // Use mode-specific pause duration
            this.burstPauseTime = (this.currentTacticalMode === "OFFENSIVE") ? this.offensiveBurstPauseDuration : this.defensiveBurstPauseDuration;
        }
        this.fire = false;
        return;
    }

    let currentShots = (this.currentTacticalMode === "OFFENSIVE") ? this.offensiveShotsPerBurst : this.defensiveShotsPerBurst;
    let currentPause = (this.currentTacticalMode === "OFFENSIVE") ? this.offensiveBurstPauseDuration : this.defensiveBurstPauseDuration;

    if (this.isBurstFiring) {
        if (this.burstShotCount < currentShots) {
            // AI intends to fire. Actual shot depends on rocket's own shotTimeout.
            this.fire = true;
            // Note: burstShotCount is incremented in updateRocket when a shot is actually made.
        } else { // Burst is complete
            this.isBurstFiring = false;
            this.fire = false;
            this.burstPauseTime = currentPause; // Start pause after burst
        }
    } else {
        this.fire = false; // Not in a burst, not firing.
    }
  }.bind(this);


  // Set the attack function in bursts
  const attack = function(target) {
    if (this.searchInterval <= 0) {
      this.fire = false; // Stop firing when re-evaluating
      this.searchInterval = randomise(30) + 35;
    } else {
      this.searchInterval--;
    }

    const predictionFactor = 12; // Tunable: how many frames ahead to predict
    const predictedX = target.x + target.vx * predictionFactor;
    const predictedY = target.y + target.vy * predictionFactor;

    findAngle(predictedX, predictedY);
    turnToFace();
    manageShootingLogic(); // Replaced shootIfInRange

    // Thruster logic based on tactical mode
    let engagementMinDist = (this.currentTacticalMode === "OFFENSIVE") ? this.offensiveEngagementMinDist : this.defensiveEngagementMinDist;
    let engagementMaxDist = (this.currentTacticalMode === "OFFENSIVE") ? this.offensiveEngagementMaxDist : this.defensiveEngagementMaxDist;

    if (Math.abs(this.angleDiff) > 15) { // If aiming is significantly off, prioritize turning
      this.thruster = true;
    } else { // Aiming is relatively good
      if (this.distanceToPlayer > engagementMaxDist) { // Too far, get closer
        this.thruster = true;
      } else if (this.distanceToPlayer < engagementMinDist) { // Player is too close
        if (this.currentTacticalMode === "DEFENSIVE") {
            // Defensive mode: Actively try to create distance
            this.fire = false; // Optional: pause firing to focus on repositioning
            
            // Calculate a point directly away from the player
            const backOffDist = 50; // How far to project the immediate back-off point
            const angleToPlayer = Math.atan2(this.swornEnemy.y - this.y, this.swornEnemy.x - this.x);
            const backOffTargetX = this.x - backOffDist * Math.cos(angleToPlayer);
            const backOffTargetY = this.y - backOffDist * Math.sin(angleToPlayer);

            findAngle(backOffTargetX, backOffTargetY); // Aim towards this back-off point
            // turnToFace() is called by the main attack logic after this block
            this.thruster = true; // Thrust to move to the back-off point
        } else { // Offensive mode and too close
            this.thruster = false; // Hold position, focus on shooting if possible
        }
      } else { // Optimal distance for current mode
        this.thruster = false; // Hold position
      }
    }
  }.bind(this);

  // Define a flee function
  const flee = function(threat) {
    const fleeDist = 200; // How far to project the escape point
    const angleToThreat = Math.atan2(threat.y - this.y, threat.x - this.x);
    const fleeX = this.x - fleeDist * Math.cos(angleToThreat);
    const fleeY = this.y - fleeDist * Math.sin(angleToThreat);

    findAngle(fleeX, fleeY);
    turnToFace();
    this.thruster = true; // Always move when fleeing

    // The panic interval gives the chance to find a new position if the enemy doesn't feel like it can find a "safe" position
    if (this.panicInterval <= 0) {
      // this.safe was part of older logic, consider if it's still needed or if state changes cover this.
      // For now, mimicking previous reset.
      this.panicInterval = randomise(60) + 30;
    } else {
      this.panicInterval--;
    }
  }.bind(this);

  const dodge = function(asteroidThreat) {
    const dodgeDist = 150; // How far to project the escape point
    const angleToAsteroid = Math.atan2(asteroidThreat.y - this.y, asteroidThreat.x - this.x);
    const dodgeX = this.x - dodgeDist * Math.cos(angleToAsteroid);
    const dodgeY = this.y - dodgeDist * Math.sin(angleToAsteroid);

    findAngle(dodgeX, dodgeY);
    turnToFace();
    this.thruster = true; // Always move when dodging
  }.bind(this);


  // Define an ability for the Enemy to find the closest entities
  const findClosestEntities = function() {
    // Calculate distance to the sworn enemy (player)
    let dist_x_player = this.x - this.swornEnemy.x;
    let dist_y_player = this.y - this.swornEnemy.y;
    this.distanceToPlayer = Math.sqrt(dist_x_player * dist_x_player + dist_y_player * dist_y_player);
    this.closestPlayerTarget = this.swornEnemy; // swornEnemy is always the player

    this.closestAsteroidThreat = null;
    let closestAsteroidDistance = Infinity;

    if (obstacles) {
      for (let i = 0; i < asteroids.length; i++) {
        let dist_x_asteroid = this.x - asteroids[i].x;
        let dist_y_asteroid = this.y - asteroids[i].y;
        let currentAsteroidDistance = Math.sqrt(dist_x_asteroid * dist_x_asteroid + dist_y_asteroid * dist_y_asteroid);
        if (currentAsteroidDistance < closestAsteroidDistance) {
          closestAsteroidDistance = currentAsteroidDistance;
          this.closestAsteroidThreat = asteroids[i];
        }
      }
    }
    // Overall closestDistance for legacy compatibility if needed, but prefer specific distances
    this.closestDistance = this.distanceToPlayer;
  }.bind(this);

  // Determine AI State
  findClosestEntities();

  let determinedNextState = null;

  if (this.health < 20) { // Critically low health
      determinedNextState = "FLEEING";
  } else { // Not critically low, consider mode-specific flee probability
      const healthPercentage = this.health / 100;
      const modeSpecificFleeMaxProbHealth = (this.currentTacticalMode === "OFFENSIVE") ? this.offensiveFleeMaxProbHealth : this.defensiveFleeMaxProbHealth;
      const minProbHealth = this.defaultFleeMinProbHealth; // Using the default min threshold
      let fleeProbability = 0;

      if (this.health < modeSpecificFleeMaxProbHealth * 100) {
           fleeProbability = (modeSpecificFleeMaxProbHealth - healthPercentage) / (modeSpecificFleeMaxProbHealth - minProbHealth);
           fleeProbability = Math.max(0, Math.min(1, fleeProbability)); // Clamp
      }

      if (Math.random() < fleeProbability) {
          determinedNextState = "FLEEING";
      }
  }

  // If not already decided to flee based on health probability:
  if (!determinedNextState) {
      const playerDist = this.distanceToPlayer;
      const asteroidThreat = this.closestAsteroidThreat;
      if (obstacles && asteroidThreat) {
          const asteroidDist = Math.sqrt(Math.pow(this.x - asteroidThreat.x, 2) + Math.pow(this.y - asteroidThreat.y, 2));
          if (asteroidDist < 100 && asteroidDist < playerDist) { 
              determinedNextState = "DODGING_ASTEROID";
          }
      }
  }

  // Ramming Condition Check (before defaulting to ATTACKING)
  if (!determinedNextState && this.rammingCooldown <= 0 && this.health >= this.ramHealthThreshold) {
      const playerHealth = this.swornEnemy.health;
      let canConsiderRam = false;

      if (this.health > playerHealth + this.ramConsiderHealthAdvantage) {
          canConsiderRam = true;
      } else if (this.distanceToPlayer < this.offensiveEngagementMaxDist && Math.random() < 0.05) {
           canConsiderRam = true;
      }

      if (canConsiderRam) {
          determinedNextState = "RAMMING";
          this.rammingChargeDuration = this.maxRammingChargeDuration; 
          this.rammingCooldown = Math.floor(Math.random() * (this.maxRammingCooldown - this.minRammingCooldown + 1)) + this.minRammingCooldown;
      }
  }

  // Default to ATTACKING if no other state was chosen
  if (!determinedNextState) {
      determinedNextState = "ATTACKING";
  }

  // Apply reaction delay if state is changing
  if (this.aiState !== determinedNextState) {
      this.aiState = determinedNextState;
      this.reactionDelayFrames = Math.floor(Math.random() * (this.maxReactionDelay - this.minReactionDelay + 1)) + this.minReactionDelay;
      // When delay is set, clear any pending rotation/thrust/fire from previous state logic
      this.rotateLeft = false;
      this.rotateRight = false;
      this.thruster = false;
      this.fire = false;
      return; // Exit behaviour early, action will pick up after delay
  }

  // Execute behavior based on AI state (if no reaction delay from state change)
  switch (this.aiState) {
    case "ATTACKING":
      // console.log(this.id, "is ATTACKING", this.closestPlayerTarget.id);
      attack(this.closestPlayerTarget);
      break;
    case "FLEEING":
      // console.log(this.id, "is FLEEING from", this.closestPlayerTarget.id);
      flee(this.closestPlayerTarget);
      break;
    case "DODGING_ASTEROID":
      // console.log(this.id, "is DODGING_ASTEROID", this.closestAsteroidThreat);
      dodge(this.closestAsteroidThreat);
      break;
    case "RAMMING":
      this.fire = false; // No shooting while ramming

      if (this.rammingChargeDuration > 0 && this.distanceToPlayer < (this.offensiveEngagementMaxDist * 1.5)) {
          const predictionFactor = 10; 
          const predictedX = this.swornEnemy.x + this.swornEnemy.vx * predictionFactor;
          const predictedY = this.swornEnemy.y + this.swornEnemy.vy * predictionFactor;

          findAngle(predictedX, predictedY);
          turnToFace();
          this.thruster = true; // Full thrust

          this.rammingChargeDuration--;
      } else {
          // Ramming charge ended
          this.aiState = "ATTACKING"; 
          this.rammingChargeDuration = 0; 
      }
      break;
    default:
      // console.log(this.id, "is in default ATTACKING state");
      attack(this.closestPlayerTarget);
  }
};

// Calculate the position of the rocket
function getRocketPoints() {
  // Store the points in an array to loop over later
  let points = [];
  // Define the left and right sides based on the direction
  let leftSide = rad(this.direction - rocketWidth);
  let rightSide = rad(this.direction + rocketWidth);
  // Simplify the rocket's shape to a triangle
  // Rocket top point
  points.push([
    this.x + rocketSize * Math.cos(rad(this.direction)),
    this.y - rocketSize * Math.sin(rad(this.direction))
  ]);
  // Rocket left point
  points.push([
    this.x - rocketSize * Math.cos(leftSide),
    this.y + rocketSize * Math.sin(leftSide)
  ]);
  // Rocket right point
  points.push([
    this.x - rocketSize * Math.cos(rightSide),
    this.y + rocketSize * Math.sin(rightSide)
  ]);
  // Return the array of points
  return points;
}

// Update the effects on the rocket
function updateRocket() {
  if (this.id === "one") {
    console.log("updateRocket for player1");
  }
  // If pushing the up key then apply the thruster
  if (this.thruster) {
    if (this.id === "one") {
      console.log("player1 thruster true");
    }
    this.vx += acceleration * Math.cos(rad(this.direction));
    this.vy -= acceleration * Math.sin(rad(this.direction));
  }
  // Left rotates the rocket anti-clockwise
  if (this.rotateLeft) {
    if (this.id === "one") {
      console.log("player1 rotateLeft true");
    }
    this.direction += turnRate;
  }
  // Right rotates the rocket clockwise
  if (this.rotateRight) {
    if (this.id === "one") {
      console.log("player1 rotateRight true");
    }
    this.direction -= turnRate;
  }
  // If the rocket is firing with the spacebar
  if (this.fire) {
    if (this.id === "one") {
      console.log("player1 fire true");
    }
    // Limit the shots being fired with a timeout
    if (this.shotTimeout >= shootingRate) {
      // Get the points for the rocket to work out where the rocket is firing from
      let position = this.getPoints();
      let shotCreationDirection = this.direction;
      if (this instanceof Enemy) {
        const maxAccuracyOffset = 4; // Degrees, tunable
        const accuracyError = (Math.random() - 0.5) * 2 * maxAccuracyOffset;
        shotCreationDirection += accuracyError;
      }
      // Add a new shot taking into account the direction the shot is being fired and who fired the shot
      this.shots.push(
        new Shot(position[0][0], position[0][1], shotCreationDirection, this.id)
      );
      // Reset the timeout
      this.shotTimeout = 0;
      if (this instanceof Enemy && this.isBurstFiring) {
        this.burstShotCount++;
      }
    } else {
      // Otherwise increase the timeout
      this.shotTimeout++;
    }
    // If not firing
  } else {
    // Reset shot timeout directly
    this.shotTimeout = shootingRate;
  }
  // Loop through all the shots and update them all
  for (let i = 0; i < this.shots.length; i++) {
    this.shots[i].update(i);
    if (this.shots[i].hit == true) {
      // Remove shots that have hit a game object
      this.shots.splice(i, 1);
    }
  }

  // If the rocket is moving then slow this motion slightly
  if (this.vx != 0) {
    // Reduce X velocity
    this.vx -= 0.01 * this.vx;
  }
  if (this.vy != 0) {
    // Reduce Y velocity
    this.vy -= 0.01 * this.vy;
  }
  // Move the rocket
  this.move();
}
// Try to prevent collisions by using the rockets' shields to repel each other
function collisionPrevention() {
  // Calculate the distance between the plater and enemy
  let dist_x = player1.x - player2.x;
  let dist_y = player1.y - player2.y;
  // Get the repel distance
  let repel = Math.sqrt(dist_x * dist_x + dist_y * dist_y);
  // If the rockets are too close to each other
  if (repel < 40) {
    // Set new repel variables for x and y
    let repelX = dist_x / repel;
    let repelY = dist_y / repel;
    // Apply this to both rockets
    player1.vx += repelX * 5;
    player1.vy += repelY * 5;
    player2.vx -= repelX * 5;
    player2.vy -= repelY * 5;
    // Reduce the health of both rockets as a consequence of the impact on the shield
    player1.health = Math.max(0, player1.health - 5);
    player2.health = Math.max(0, player2.health - 5);
  }
}

// Function to render the appearence of the rocket
function renderRocket() {
  // Get the points of the rocket
  let points = this.getPoints();
  // Calculate the angle it is facing
  let angle = rad((this.direction + 270) * -1);
  // The following between "save" and "restore" is used to position the SVG image in the right place and angle
  ctx.save();
  ctx.translate(points[0][0], points[0][1]);
  ctx.rotate(angle);
  ctx.translate(-33.85, 0);
  ctx.drawImage(this.svg, 0, 0);
  // Adding in the addition of the rocket's thruster if it is active
  if (this.thruster) {
    // First reset the timeout if the thruster key is pushed
    this.flameTimeout = 12;
  }
  // If the timeout is above zero then add the flicker svg
  if (this.flameTimeout > 0) {
    ctx.drawImage(flicker_svg, 0, 0);
    this.flameTimeout--;
  }
  ctx.restore();
  // Loop through all the shots
  for (let i = 0; i < this.shots.length; i++) {
    // And display the shot on the screen
    this.shots[i].render();
  }
}

// For a little variation let the asteroid color depend on the size
function sizeColor(size) {
  if (size > 30) {
    return 2;
  } else if (size > 20) {
    return 1;
  } else {
    return 0;
  }
}

// Define a new Asteroid
function Asteroid(x, y, size, vx, vy) {
  // Position on the x and y axis
  this.x = x;
  this.y = y;
  this.size = size;
  this.radius = size * 2 + 5;
  this.vx = vx;
  this.vy = vy;

  // Store the position of the points on the asteroid
  this.points = [];
  for (let i = 0; i < size; i++) {
    // Calculate random sizes to create an asteroid-like jagged edge
    let dist = Math.random() * 15 - 5 + this.radius;
    // Distrubute the points around the whole circumference of the asteroid
    let angle = i * 360 / size;
    // Add the randomly calculated point to the array
    this.points.push([
      dist * Math.cos(rad(angle)),
      dist * Math.sin(rad(angle))
    ]);
  }

  //Define the color of the asteroid based on the size
  this.color = sizeColor(this.size);

  // Define the methods of the asteroid
  this.explode = explodeAsteroid;
  this.update = updateAsteroid;
  this.move = tesseractMove;
  this.render = renderAsteroid;
}

// Define what happens when the asteroid is blasted by a shot from the rocket
function explodeAsteroid() {
  // Reduce the size by the predefined split size variable
  if (this.size - splitSize >= splitSize - 1) {
    // This leaves two new asteroids, the first being the reduced size of the original
    asteroids.push(
      new Asteroid(this.x, this.y, this.size - splitSize, this.vx, this.vy)
    );
    // The second asteroid is the broken off piece
    asteroids.push(
      new Asteroid(
        this.x,
        this.y,
        splitSize,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2
      )
    );
  }
}

// Update the affects of the asteroid
function updateAsteroid(num) {
  // Set the asteroid's position in an array to check for collisions
  const asteroid_xy = [this.x, this.y];
  // Define a function to check the proximity of the game's active rockets
  function checkProximity(target) {
    // Avoid checking asteroids that have already been removed
    if (asteroids[num] === undefined) {
      return;
    }
    // Need to load in the rocket points to check for collisions
    let rocketPoints = target.getPoints();
    // Check all the rocket's points for collisions
    for (let i = 0; i < rocketPoints.length; i++) {
      // Check whether the rocket has crashed into the asteroid
      let proximityToRocket = checkBoundary(asteroid_xy, [
        rocketPoints[i][0],
        rocketPoints[i][1]
      ]);
      // If the proximity is less than the radius then there has been a collision and reduce the health based on the radius of the asteroid
      if (proximityToRocket < asteroids[num].radius) {
        let rawDamage = asteroids[num].radius / 4;
        let damage = Math.round(rawDamage); // Round to the nearest whole number
        target.health = Math.max(0, target.health - damage);
        asteroids[num].explode();
        asteroids.splice(num, 1);
        return;
      }
    }
  }

  // Need to check the proximity of both of the players with the asteroids
  checkProximity(player1);
  checkProximity(player2);
  // Don't check an asteroid if it was removed
  if (asteroids[num] === undefined) {
    return;
  } else {
    // Move the asteroids
    asteroids[num].move();
  }
}

// Define the appearance of the asteroids
function renderAsteroid() {
  ctx.beginPath();
  ctx.moveTo(this.x + this.points[0][0], this.y + this.points[0][1]);
  for (let i = this.size - 1; i >= 0; i -= 1) {
    ctx.lineTo(this.x + this.points[i][0], this.y + this.points[i][1]);
  }
  ctx.fillStyle = asteroidColor;
  ctx.fill();
}

// Define a new shot being made in the game
function Shot(x, y, direction, owner) {
  this.x = x;
  this.y = y;
  this.vx = shootingSpeed * Math.cos(rad(direction));
  this.vy = -shootingSpeed * Math.sin(rad(direction));
  this.hit = false;
  this.owner = owner;
  // Define player based shot colours
  if (owner == "one") {
    this.color = "#5ecb84";
  } else {
    this.color = "#EDBB0B";
  }
  // Shot methods
  this.update = updateShot;
  this.render = renderShot;
}

// Update the game affects on the shot
function updateShot(slug) {
  // If the shot goes off screen then just count it as a hit for it to be easily removed from the game
  if (
    this.x > canvas.width + gutter ||
    this.x < 0 - gutter ||
    this.y > canvas.height + gutter ||
    this.y < 0 - gutter
  ) {
    this.hit = true;
  }
  // If the shot hasn't hit anything so far
  if (!this.hit) {
    function checkProximity(target, slug) {
      // Need the rocket to check for collisions
      const points = target.getPoints();
      // Rocket co-ordinates for calculating the areas
      const aX = points[0][0];
      const aY = points[0][1];
      const bX = points[2][0];
      const bY = points[2][1];
      const cX = points[1][0];
      const cY = points[1][1];
      // Shot co-ordinates
      const sX = slug.x;
      const sY = slug.y;
      // Calculate the combined areas of the shot and the target
      const area1 = Math.abs(
        (sX * (bY - cY) + bX * (cY - sY) + cX * (sY - bY)) / 2
      ); // SBC
      const area2 = Math.abs(
        (aX * (sY - cY) + sX * (cY - aY) + cX * (aY - sY)) / 2
      ); // ASC
      const area3 = Math.abs(
        (aX * (bY - sY) + bX * (sY - aY) + sX * (aY - bY)) / 2
      ); // ABS
      const area = (area1 + area2 + area3).toFixed(2);
      // If the rocket area is the same as the area calculated above then the shot has hit the target
      if (rocketArea == area) {
        slug.hit = true;
        target.health = Math.max(0, target.health - 1);
      }
    }
    // Only check for collisions with the oposing player
    if (this.owner == "one") {
      checkProximity(player2, this);
    } else {
      checkProximity(player1, this);
    }
  }
  // If the shot still hasn't hit anything and obstacles were enabled
  if (!this.hit && obstacles) {
    // Check all the asteroids for collisions
    for (let i = 0; i < asteroids.length; i++) {
      let proximityToAsteroid = checkBoundary(
        [asteroids[i].x, asteroids[i].y],
        [this.x, this.y]
      );
      // Check whether the proximity is less than the asteroid's radius
      if (proximityToAsteroid <= asteroids[i].radius) {
        // Explode the asteroid which was hit, this creates two smaller asteroids
        asteroids[i].explode();
        // Remove the asteroid from the game
        asteroids.splice(i, 1);
        // The shot has hit something and will be removed from the game
        this.hit = true;
      }
    }
  }
  // Now remove the shot from the game if it has hit something
  if (this.hit == true) {
    return;
  } else {
    // Otherwise move the shot according to the velocity
    this.x += this.vx;
    this.y += this.vy;
  }
}

// Define how the shot looks on screen
function renderShot() {
  ctx.strokeStyle = this.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(this.x, this.y);
  ctx.lineTo(this.x + this.vx, this.y + this.vy);
  ctx.stroke();
}

// Show the shield health of both players but only update it if there has been a change
function renderScore(target) {
  let count = target.score.innerHTML;
  // Ensure health is not displayed as negative, and update if current health is less than displayed or if it's the initial setup.
  let currentHealthDisplay = Math.max(0, target.health);
  if (playing && currentHealthDisplay < parseInt(count)) { // Check against integer value of displayed count
    target.score.innerHTML = currentHealthDisplay;
  } else if (parseInt(count) === 100 && target.health < 100) { // Handle initial update from 100
     target.score.innerHTML = currentHealthDisplay;
  } else if (!playing && target.health === 100) { // Ensure initial display is correct before game starts
     target.score.innerHTML = 100;
  }
  // More robust update: always set to current clamped health if it differs from display
  if (target.score.innerHTML != currentHealthDisplay.toString()) {
      target.score.innerHTML = currentHealthDisplay;
  }
}

// Define a function which is checking for the end of the game
function checkGameStatus() {
  // First check if both players have been destroyed
  if (player1.health <= 0 && player2.health <= 0) {
    gameOver("tie");
    // Check player 1's health
  } else if (player1.health <= 0) {
    gameOver(player1);
    // Check player 2's health
  } else if (player2.health <= 0) {
    gameOver(player2);
  }
}

// Handling the random position of the background planet
function placePlanet(planet) {
  let x = Math.floor(Math.random() * canvas.width);
  let y = Math.floor(Math.random() * canvas.height);
  // Vary the scale to keep the background interesting
  let scale = 0.5 + Math.random() * 2;
  let transform = "translate(" + x + "px, " + y + "px) scale(" + scale + ")";
  planet.style.transform = transform;
}

// Deciding where things should go
function placeElements() {
  // Changing the opacity is to prevent a visual bug
  planet1.style.opacity = 0;
  planet2.style.opacity = 0;
  space.style.opacity = 0;
  // Calculate the new solar system layout
  placePlanet(planet1);
  placePlanet(planet2);
  createStars();
  // Make the elements visible again
  planet1.style.opacity = 1;
  planet2.style.opacity = 1;
  space.style.opacity = 1;
}

// Fill the background with randomly positioned stars
function createStars() {
  let heightMax = window.innerHeight - 4,
    widthMax = window.innerWidth - 4;
  space.innerHTML = "";

  for (let i = 0; i < 50; i++) {
    const star =
      '\n <div style="left:' +
      Math.floor(Math.random() * widthMax) +
      "px; top:" +
      Math.floor(Math.random() * heightMax) +
      "px; height:" +
      Math.ceil(Math.random() * 100) / 100 +
      "vmax; width:" +
      Math.ceil(Math.random() * 100) / 100 +
      'vmax;" class="star star' +
      i +
      '"><svg viewBox="0 0 513 513"><use xlink:href="#star"/></svg></div>';
    space.insertAdjacentHTML("beforeend", star);
  }
}

// Calculate the sizes for the game which are dependent on the window size
function calculateSizes() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerPoint = {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
  // Hide the score counter for the start of the game
  scoreboard.style.opacity = 0;
}

// Variables relating to the start screen toggles
let playerOne = true;
let playerTwo = false;
let obstacles = true;

// Inverse the option
function toggleOption(option) {
  return !option;
}

// Switch the player from computer to human
function switchPlayer(target) {
  if (target) {
    return "Computer";
  } else {
    return "Human";
  }
}

// Switch the obstacles on or off
function switchObstacles() {
  if (obstacles) {
    return "Asteroids: On";
  } else {
    return "Asteroids: Off";
  }
}

// Button event listeners
playerOneToggle.addEventListener("click", function() {
  playerOne = toggleOption(playerOne);
  this.innerHTML = playerOne ? "Computer" : "Human<br><span class='control-instr'>" + playerOneControlsText + "</span>";
});

playerTwoToggle.addEventListener("click", function() {
  playerTwo = toggleOption(playerTwo);
  this.innerHTML = playerTwo ? "Computer" : "Human<br><span class='control-instr'>" + playerTwoControlsText + "</span>";
});
asteroidsToggle.addEventListener("click", function() {
  obstacles = toggleOption(obstacles);
  this.textContent = switchObstacles();
});

// Define if the player takes the Rocket or Enemy object
function setPlayer(toggle, number) {
  // Checking if the toggle is true which means that it is computer controlled and takes the Enemy class
  if (toggle == true) {
    return new Enemy(number, "computer");
  } else {
    // If not true then the player is human
    return new Rocket(number, "human");
  }
}
// Define the changes to be made at the start of the game
function startGame() {
  console.log("startGame called");
  // Setup the background
  placeElements();
  // Empty the arrays of asteroids
  asteroids = [];
  // Create the players for the new game
  player1 = setPlayer(playerOne, "one");
  player2 = setPlayer(playerTwo, "two");
  console.log("player1 and player2 objects created:", player1, player2);
  // Define the sworn enemy of the players if they are controlled by the computer
  if (playerOne == true) {
    player1.swornEnemy = player2;
  }
  if (playerTwo == true) {
    player2.swornEnemy = player1;
  }
  // Reset the scoreboard
  shield_p1.innerHTML = Math.max(0, player1.health);
  shield_p2.innerHTML = Math.max(0, player2.health);
  scoreboard.style.opacity = 1;
  // Hide the explosion
  crash.style.opacity = 0;
  explosion.classList.remove("explode");
  // Close the popup UI
  closePopup();
  // Reset the result and message
  result.innerHTML = "";
  message.innerHTML = "";
  // Set playing to true to start the game!
  playing = true;
  console.log("playing set to true");
  // Set the interval to make the game work
  game_mode = setInterval(function() {
    console.log("setInterval callback called");
    if (playing) {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Add new asteroids based on a timeout and if toggled on at the start screen
      if (obstacles) {
        if (
          asteroidTimeout >= asteroidRate &&
          asteroids.length <= asteroidMax
        ) {
          // Choose a side at random
          let side = Math.floor(Math.random() * 2);
          if (side == 0) {
            // Place the asteroid at the left side
            asteroids.push(
              new Asteroid(
                -gutter,
                Math.random() * canvas.height,
                Math.floor(Math.random() * asteroidSizeMax) + 10,
                Math.random() * asteroidSpeed,
                Math.random() * (asteroidSpeed * 2) - asteroidSpeed
              )
            );
          } else if (side == 1) {
            // Place the asteroid at the right side
            asteroids.push(
              new Asteroid(
                canvas.width + gutter,
                Math.random() * canvas.height,
                Math.floor(Math.random() * asteroidSizeMax) + 10,
                Math.random() * -asteroidSpeed,
                Math.random() * (asteroidSpeed * 2) - asteroidSpeed
              )
            );
          }
          // Reset the timeout
          asteroidTimeout = 0;
        } else {
          // If a new asteroid isn't being made then increase the timeout
          asteroidTimeout++;
        }
      }
      // Check for computer controlled players and apply the behaviour algorithm
      if (playerOne == true) {
        player1.behaviour();
      }
      if (playerTwo == true) {
        player2.behaviour();
      }
      // Calculate the player position
      player1.update();
      // Calculate the enemy's position
      player2.update();
      // Check for potential collisions
      collisionPrevention();
      // Loop over the asteroids array and update them all if the obstacles are toggled on
      if (obstacles) {
        for (let i = 0; i < asteroids.length; i++) {
          // Calculate the asteroids' positions
          asteroids[i].update(i);
        }
      }
      // Render the player's position
      player1.render();
      // Render the enemy's position
      player2.render();
      // Loop through and render the asteroids in order of colour to optimize canvas capabilities
      if (obstacles) {
        for (let i = 0; i < asteroidColors.length; i++) {
          asteroidColor = asteroidColors[i];
          for (let j = 0; j < asteroids.length; j++) {
            if (asteroids[j].color == i) {
              // Render the asteroids if the colour matches
              asteroids[j].render();
            }
          }
        }
      }
      // Render the score for both players
      renderScore(player1);
      renderScore(player2);
      // Check for potential game over condition
      checkGameStatus();
    }
    // If the game ends during the updates then make sure that everything gets rendered first before clearing the interval
    if (!playing) {
      clearInterval(game_mode);
    }
  }, 1000 / 60);
}

// Define what happens at the end of the game
function gameOver(target) {
  console.log("gameOver called with target:", target);
  p1_graphic.style.opacity = 0;
  p2_graphic.style.opacity = 0;
  // Stop the game from being played
  playing = false;
  // If the window was resized
  if (target == "resized") {
    result.innerHTML = "The game is using your screen size.";
    message.innerHTML = "Don't resize the screen during the game.";
  } else if (target == "tie") {
    // If the game was a tie.
    result.innerHTML = "TIE!";
    message.innerHTML = "Both rockets exploded, try again?";
  } else if (target == player1) {
    // If player1 caused the game to end
    p2_graphic.style.opacity = 1;
    result.innerHTML = "Red Rocket Is Victorious!";
  } else if (target == player2) {
    // If player2 caused the game to end
    p1_graphic.style.opacity = 1;
    result.innerHTML = "Blue Rocket Is Victorious!";
  }
  // Set the explosion for the middle of the screen it it was a tie
  if (target == "tie") {
    target = centerPoint;
  }
  // Define the place for the end game graphic to be displayed using the target that caused the game to end
  const x = target.x - explosionSize.width;
  const y = target.y - explosionSize.height;
  // For variation add some rotation to the graphic
  degrees = Math.floor(Math.random() * 360);
  // Compile the transform properties
  const transform =
    "translate(" + x + "px, " + y + "px) rotate(" + degrees + "deg)";
  // Sednd the transform to the container for the graphic
  crash.style.transform = transform;
  // Make the graphic visible
  crash.style.opacity = 1;
  // Add the class that triggers the end game animation
  explosion.classList.add("explode");
  // Make sure that the results popup screen is selected
  popup = document.getElementById("results");
  // Show the popup UI to the player
  openPopup();

  // Get reference to the Main Menu button on the results screen
  const resultsMainMenuButton = document.querySelector("#results #mainMenuButton");
  // Check if it exists to prevent errors if HTML is out of sync
  if (resultsMainMenuButton) {
    resultsMainMenuButton.addEventListener('click', function handleGoToMainMenu() {
      closePopup(); // Close the results popup
      popup = document.getElementById('popup'); // IMPORTANT: Point back to the main menu popup
      openPopup(); // Open the main menu popup
    }, { once: true }); // Use { once: true } to auto-remove listener after first click
  }
}

// Define what to do when the page loads
document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOMContentLoaded event fired");
  // Define the sizes based on the user's window
  calculateSizes();
  // Place the background elements
  placeElements();
  // Open the popup UI for the player
  openPopup();

  // Set initial button content based on default player types
  playerOneToggle.innerHTML = playerOne ? "Computer" : "Human<br><span class='control-instr'>" + playerOneControlsText + "</span>";
  playerTwoToggle.innerHTML = playerTwo ? "Computer" : "Human<br><span class='control-instr'>" + playerTwoControlsText + "</span>";

  // Define keyboard functions
  document.addEventListener(
    "keydown",
    function(event) {
      console.log("keydown event:", event);
      if (event.defaultPrevented) {
        return;
      }
      if (playing) {
        // Prevent the default keyboard function while playing the game
        event.preventDefault();
        const key = event.code || event.key || event.keyCode; // Preferred order
        // If player two is not a computer
        if (playerTwo == false) {
          switch (key) {
            case "ArrowUp": // event.key || event.code
            case 38: // event.keyCode
              console.log("ArrowUp pressed - Player 2 Thruster ON");
              // Apply Thruster
              player2.thruster = true;
              break;
            case "ArrowLeft": // event.key || event.code
            case 37: // event.keyCode
              console.log("ArrowLeft pressed - Player 2 Rotate Left ON");
              // Rotate Left
              player2.rotateLeft = true;
              break;
            case "ArrowRight": // event.key || event.code
            case 39: // event.keyCode
              console.log("ArrowRight pressed - Player 2 Rotate Right ON");
              // Rotate Right
              player2.rotateRight = true;
              break;
            case "Space": // event.code
            case " ": // event.key
            case 32: // event.keyCode
              console.log("Space pressed - Player 2 Fire ON");
              // Start firing
              player2.fire = true;
              break;
          }
        }
        // If player one is not a computer
        if (playerOne == false) {
          switch (key) {
            case "KeyW": // event.code
            case "w": // event.key
            case 87: // event.keyCode
              console.log("KeyW pressed - Player 1 Thruster ON");
              player1.thruster = true;
              break;
            case "KeyA": // event.code
            case "a": // event.key
            case 65: // event.keyCode
              console.log("KeyA pressed - Player 1 Rotate Left ON");
              // Stop rotating Left
              player1.rotateLeft = true;
              break;
            case "KeyD": // event.code
            case "d": // event.key
            case 68: // event.keyCode
              console.log("KeyD pressed - Player 1 Rotate Right ON");
              // Stop rotating Right
              player1.rotateRight = true;
              break;
            case "KeyZ": // event.code
            case "z": // event.key
            case 90: // event.keyCode
              console.log("KeyZ pressed - Player 1 Fire ON");
              // Stop firing
              player1.fire = true;
              break;
          }
        }
      }
    },
    true
  );

  document.addEventListener(
    "keyup",
    function(event) {
      console.log("keyup event:", event);
      if (event.defaultPrevented) {
        return;
      }
      const key = event.code || event.key || event.keyCode; // Preferred order
      if (playing) {
        // If player two is not a computer
        if (playerTwo == false) {
          switch (key) {
            case "ArrowUp": // event.key || event.code
            case 38: // event.keyCode
              console.log("ArrowUp released - Player 2 Thruster OFF");
              // Apply Thruster
              player2.thruster = false;
              break;
            case "ArrowLeft": // event.key || event.code
            case 37: // event.keyCode
              console.log("ArrowLeft released - Player 2 Rotate Left OFF");
              // Rotate Left
              player2.rotateLeft = false;
              break;
            case "ArrowRight": // event.key || event.code
            case 39: // event.keyCode
              console.log("ArrowRight released - Player 2 Rotate Right OFF");
              // Rotate Right
              player2.rotateRight = false;
              break;
            case "Space": // event.code
            case " ": // event.key
            case 32: // event.keyCode
              console.log("Space released - Player 2 Fire OFF");
              // Start firing
              player2.fire = false;
              break;
          }
        }
        //if player one is not a computer
        if (playerOne == false) {
          switch (key) {
            case "KeyW": // event.code
            case "w": // event.key
            case 87: // event.keyCode
              console.log("KeyW released - Player 1 Thruster OFF");
              player1.thruster = false;
              break;
            case "KeyA": // event.code
            case "a": // event.key
            case 65: // event.keyCode
              console.log("KeyA released - Player 1 Rotate Left OFF");
              // Stop rotating Left
              player1.rotateLeft = false;
              break;
            case "KeyD": // event.code
            case "d": // event.key
            case 68: // event.keyCode
              console.log("KeyD released - Player 1 Rotate Right OFF");
              // Stop rotating Right
              player1.rotateRight = false;
              break;
            case "KeyZ": // event.code
            case "z": // event.key
            case 90: // event.keyCode
              console.log("KeyZ released - Player 1 Fire OFF");
              // Stop firing
              player1.fire = false;
              break;
          }
        }
      }
    },
    true
  );

  // If the window is resized
  window.addEventListener("resize", function(event) {
    // Calculate the new sizes
    calculateSizes();
    // If the game is being played then it should be reset
    if (playing) {
      gameOver("resized");
    }
  });
});

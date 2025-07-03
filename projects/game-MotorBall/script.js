
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;

let engine;
let world;

const exaustClouds = 25;
let car;
let computerCar;
let ball;

// for goal explosion effect
let sparks = [];

let goalHeight;
let goalWaitPeriod = false;

let playerScore = 0;
let computerScore = 0;

let gameStarted = false;
let gamePaused = false;

// Menu elements
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const startGameButton = document.getElementById('startGameButton');
const pauseButton = document.getElementById('pauseButton');
const pauseMenu = document.getElementById('pauseMenu');
const resumeGameButton = document.getElementById('resumeGameButton');
const restartMatchButton = document.getElementById('restartMatchButton');
const returnToMainMenuButton = document.getElementById('returnToMainMenuButton');
const canvasPlaceholder = document.getElementById('canvas-placeholder');

let p5Canvas; // Variable to hold the p5.js canvas element

function setup() {
    console.log("Setup function started.");
    const h = min(window.innerHeight, window.innerWidth * 0.61);
    const w = min(window.innerWidth, h * 1.64);
    
    // Create the canvas and parent it to the placeholder div
    p5Canvas = createCanvas(w, h).parent(canvasPlaceholder);
    p5Canvas.style('display', 'none'); // Hide canvas initially
    console.log("p5Canvas created and parented to canvasPlaceholder.");

    goalHeight = width / 6;

    engine = Engine.create();
    world = engine.world;

    engine.world.gravity.y = 0;

    addWalls();
    resetGame(); // Initial setup

    // Event Listeners
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
        console.log("startGameButton event listener added.");
    } else {
        console.error("startGameButton not found!");
    }
    if (pauseButton) {
        pauseButton.addEventListener('click', togglePause);
        console.log("pauseButton event listener added.");
    } else {
        console.error("pauseButton not found!");
    }
    if (resumeGameButton) {
        resumeGameButton.addEventListener('click', togglePause);
        console.log("resumeGameButton event listener added.");
    } else {
        console.error("resumeGameButton not found!");
    }
    if (restartMatchButton) {
        restartMatchButton.addEventListener('click', restartMatch);
        console.log("restartMatchButton event listener added.");
    } else {
        console.error("restartMatchButton not found!");
    }
    if (returnToMainMenuButton) {
        returnToMainMenuButton.addEventListener('click', returnToMainMenu);
        console.log("returnToMainMenuButton event listener added.");
    } else {
        console.error("returnToMainMenuButton not found!");
    }

    // Add global keyboard event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    console.log("Global keyboard event listeners added.");

    // Ensure game container is hidden at start
    if (gameContainer) {
        gameContainer.style.display = 'none';
        console.log("gameContainer set to display: none.");
    } else {
        console.error("gameContainer not found!");
    }
    console.log("Setup function finished.");
}

function resetGame() {
    console.log("resetGame function called.");
    // Clear existing bodies except walls (if walls are static and don't need recreation)
    World.clear(world, false); 

    // Add walls if they were cleared or need to be recreated on reset
    addWalls(); 

    const redHexVals = [255, 100, 100];
    const playerStartX = width / 4;
    car = new Car(redHexVals, playerStartX);

    const blueHexVals = [100, 100, 255];
    const computerStartX = 3 * width / 4;
    computerCar = new Car(blueHexVals, computerStartX);

    ball = new Ball();

    playerScore = 0;
    computerScore = 0;
    sparks = []; // Clear any existing sparks
    goalWaitPeriod = false;

    // Re-position elements if they exist (e.g., ball, cars)
    if (ball && ball.body) {
        Body.setPosition(ball.body, { x: width / 2, y: height / 2 });
        Body.setVelocity(ball.body, { x: 0, y: 0 });
    }
    // Reset car positions and velocities if necessary for a clean restart
    if (car && car.body) {
        Body.setPosition(car.body, { x: width/4, y: height/4 });
        Body.setVelocity(car.body, { x: 0, y: 0 });
        Body.setAngularVelocity(car.body, 0);
        Body.setAngle(car.body, 0);
    }
    if (computerCar && computerCar.body) {
        Body.setPosition(computerCar.body, { x: 3*width/4, y: 3*height/4 });
        Body.setVelocity(computerCar.body, { x: 0, y: 0 });
        Body.setAngularVelocity(computerCar.body, 0);
        Body.setAngle(computerCar.body, PI);
    }

}

function startGame() {
    console.log("startGame function called.");
    if (mainMenu) mainMenu.style.display = 'none';
    else console.error("mainMenu not found in startGame!");

    if (gameContainer) gameContainer.style.display = 'flex'; // Use flex for gameContainer
    else console.error("gameContainer not found in startGame!");

    if (p5Canvas) p5Canvas.style('display', 'block'); // Show the p5.js canvas
    else console.error("p5Canvas not found in startGame!");

    if (pauseButton) pauseButton.style.display = 'block'; // Show the pause button
    else console.error("pauseButton not found in startGame!");

    gameStarted = true;
    gamePaused = false;
    resetGame();
    console.log("Game started: " + gameStarted + ", Paused: " + gamePaused);
}

function togglePause() {
    console.log("togglePause function called. Current gamePaused: " + gamePaused);
    gamePaused = !gamePaused;
    if (gamePaused) {
        if (pauseMenu) pauseMenu.style.display = 'flex';
        else console.error("pauseMenu not found in togglePause!");

        if (p5Canvas) p5Canvas.style('opacity', '0.5'); // Dim canvas
        else console.error("p5Canvas not found in togglePause!");

        if (pauseButton) pauseButton.style.display = 'none'; // Hide pause button when menu is open
        else console.error("pauseButton not found in togglePause!");
        if (gameContainer) gameContainer.style.height = 'calc(100% - 150px)'; // Reduce game container height
    } else {
        if (pauseMenu) pauseMenu.style.display = 'none';
        else console.error("pauseMenu not found in togglePause!");

        if (p5Canvas) p5Canvas.style('opacity', '1'); // Restore canvas opacity
        else console.error("p5Canvas not found in togglePause!");

        if (pauseButton) pauseButton.style.display = 'block'; // Show pause button
        else console.error("pauseButton not found in togglePause!");
        if (gameContainer) gameContainer.style.height = '100%'; // Restore game container height
    }
    console.log("Game paused: " + gamePaused);
}

function restartMatch() {
    console.log("restartMatch function called.");
    resetGame();
    togglePause(); // Unpause the game and hide pause menu
}

function returnToMainMenu() {
    console.log("returnToMainMenu function called.");
    gameStarted = false;
    gamePaused = false;
    if (mainMenu) mainMenu.style.display = 'flex';
    else console.error("mainMenu not found in returnToMainMenu!");

    if (gameContainer) gameContainer.style.display = 'none';
    else console.error("gameContainer not found in returnToMainMenu!");

    if (p5Canvas) p5Canvas.style('display', 'none'); // Hide the p5.js canvas
    else console.error("p5Canvas not found in returnToMainMenu!");

    if (pauseMenu) pauseMenu.style.display = 'none'; // Ensure pause menu is hidden
    else console.error("pauseMenu not found in returnToMainMenu!");

    if (p5Canvas) p5Canvas.style('opacity', '1'); // Reset canvas opacity
    else console.error("p5Canvas not found in returnToMainMenu!");

    if (pauseButton) pauseButton.style.display = 'none'; // Hide pause button
    else console.error("pauseButton not found in returnToMainMenu!");

    console.log("Returned to main menu. Game started: " + gameStarted + ", Paused: " + gamePaused);
}

// New global keydown event handler
function handleKeyDown(event) {
    // console.log("Key Down: key = " + event.key + ", keyCode = " + event.keyCode);
    if (gameStarted && !gamePaused) {
        switch(event.key) {
            case 'ArrowRight':
            case 'd':
            case 'D':
                // console.log("Right/D key pressed - rotating right.");
                car.rotate(PI / 72);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                // console.log("Left/A key pressed - rotating left.");
                car.rotate(-PI / 72);
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                // console.log("Up/W key pressed - accelerating.");
                car.accelerating(true);
                break;
        }
    }
}

// New global keyup event handler
function handleKeyUp(event) {
    // console.log("Key Up: key = " + event.key + ", keyCode = " + event.keyCode);
    if (gameStarted && !gamePaused) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                // console.log("Up/W key released - stopping acceleration.");
                car.accelerating(false);
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'd':
            case 'D':
                // console.log("Right/Left/A/D key released - stopping rotation.");
                car.rotate(0);
                break;
        }
    }
}

function draw() {
    if (!gameStarted) {
        return; // Don't draw if game hasn't started
    }

    if (gamePaused) {
        // Draw the current state, but don't update physics or game logic
        drawSoccerField();
        car.render();
        computerCar.render();
        ball.render();
        displayScores();
        goSparksGo(); // Continue showing sparks if they exist
        return; 
    }

    if (goalWaitPeriod) {
        translate(random(-13, 13), random(-13, 13));
    }

    drawSoccerField();

    Engine.update(engine);

    car.render();
    car.update();

    computerCar.render();
    computerCar.update();

    computerCar.accelerating(true);
    computerCar.pointTowardsBall();


    ball.render();
    if (ball.didScore()) {
        const [x, y] = [ball.body.position.x, ball.body.position.y];
        x < width / 2 ? computerScore++ : playerScore++;
        shootSparks(x, y);
        Body.setPosition(ball.body, { x: width / 2, y: height / 2 });
        Body.setVelocity(ball.body, { x: 0, y: 0 });
        goalWaitPeriod = true;
        setTimeout(function() {
            goalWaitPeriod = false;
        }, 1000);
    }

    displayScores();

    if (goalWaitPeriod) {
        fill(random(255), random(255), random(255));
        textSize(64);
        text("GOOOOOOAL", width / 2 - 200, height / 2);
    }

    goSparksGo();
}

function displayScores() {
    textSize(18);
    noStroke();
    fill(255, 100, 100);
    text("player", width / 2 - 100, height / 16);
    fill(100, 100, 255);
    text("computer", width / 2 + 50, height / 16);
    fill(4);
    textSize(48);
    text(playerScore, width / 2 - 88, height / 6);
    text(computerScore, width / 2 + 78, height / 6);
}

function shootSparks(x, y) {
    const xVel = x < width / 2 ? 10 : -10;
    const xPos = x < width / 2 ? 0 : width;
    for (var i = 0; i < 50; i++) {
        var s = new Spark(xPos, y, xVel);
        sparks.push(s);
    }
}

function goSparksGo() {
    for (var i = sparks.length - 1; i >= 0; i--) {
        sparks[i].update();
        sparks[i].render();
        if (sparks[i].done()) {
            sparks.splice(i, 1);
        }
    }
}

function drawSoccerField() {
    background(254);
    noFill();
    stroke(55);
    strokeWeight(1);

    line(width / 2, 0, width / 2, height);
    ellipse(width / 2, height / 2, width / 6);

    rect(0, height / 2 - width / 6, width / 6, width / 3);
    stroke(255, 100, 100);
    rect(0, height / 2 - width / 12, width / 18, goalHeight);
    strokeWeight(10);
    line(0, height / 2 - width / 12, 0, height / 2 - width / 12 + goalHeight);
    strokeWeight(1);
    stroke(0);
    rect(width - width / 6, height / 2 - width / 6, width / 6, width / 3);
    stroke(100, 100, 255);
    rect(width - width / 18, height / 2 - width / 12, width / 18, goalHeight);
    strokeWeight(10);
    line(width, height / 2 - width / 12, width, height / 2 - width / 12 + goalHeight);
    strokeWeight(1);
    stroke(0);
}

function addWalls() {
    const wallThickness = 500;
    const wt2 = wallThickness / 2;

    // Check if walls already exist to prevent adding duplicates on reset
    if (!world.bodies.some(body => body.label === 'wall')) {
        bottomWall = new Wall(width / 2, height + wt2, width, wallThickness, 0);
        bottomWall.body.label = 'wall';
        topWall = new Wall(width / 2, -wt2, width, wallThickness, 0);
        topWall.body.label = 'wall';
        leftWall = new Wall(-wt2, height / 2, height, wallThickness, PI / 2);
        leftWall.body.label = 'wall';
        rightWall = new Wall(width + wt2, height / 2, height, wallThickness, PI / 2);
        rightWall.body.label = 'wall';
    }
}

class Wall {
    constructor(x, y, w, h, a) {
      var options = {
        friction: 0.5,
        restitution: 0.5,
        angle: a,
        isStatic: true
      }
      this.body = Bodies.rectangle(x, y, w, h, options);
      this.w = w;
      this.h = h;
      World.add(world, this.body);
    }
  }
  
  class Ball {
    constructor() {
      this.position = createVector(width/2, height/2)
      this.radius = width/32
      const options = {
        restitution: 0.9,
        friction: 0.001,
        density: 0.0001
      }
      this.body = Bodies.circle(
        this.position.x, this.position.y, this.radius/2, options
      )
      World.add(world, this.body)
    }
  
    didScore() {
      const [x, y] = [this.body.position.x, this.body.position.y]
      const topOfGoalY = height/2 + goalHeight/2
      const bottomOfGoalY = height/2 - goalHeight/2
      const withinGoalRange = y < topOfGoalY && y > bottomOfGoalY
      if (withinGoalRange) {
        return (x <= this.radius/2 || x >= width - this.radius/2)
      }
      return false
    }
  
    render() {
      this.position.x = this.body.position.x
      this.position.y = this.body.position.y
  
      push()
      translate(this.body.position.x, this.body.position.y)
      rotate(this.body.angle)
      fill(173,255,47)
      ellipse(0, 0, this.radius)
      fill(54)
      ellipse(0, 0, this.radius/3)
      line(-this.radius/2, 0, this.radius/2, 0)
      pop()
    }
  }
  
  class Car {
    constructor(paintColor, startX) {
      const startY = startX < width/2 ? height/4 : 3*height/4
      this.position = createVector(startX, startY)
      this.width = width/36
      this.length = this.width * 2
      this.isAccelerating = false
      this.rotation = 0
      this.color = paintColor
      this.history = [];
      const options = { density: 0.01, friction: 0.2, mass: 50 }
      this.body = Bodies.rectangle(
        this.position.x, this.position.y, this.length, this.width, options
      )
      World.add(world, this.body)
      if (startX > width/2) {
        Body.setAngle(this.body, PI)
      }
    }
  
    update() {
      if (this.isAccelerating) {
        this.accelerate()
      }
      this.rotate(this.rotation)
      this.history.push([this.body.position.x, this.body.position.y]);
      if (this.history.length > exaustClouds) {
        this.history.splice(0, 1);
      }
      this.position.x = this.body.position.x
      this.position.y = this.body.position.y
    }
  
    accelerating(isAccelerating) {
      this.isAccelerating = isAccelerating
    }
  
    accelerate() {
      var force = p5.Vector.fromAngle(this.body.angle)
      force.mult(0.02);
      Body.applyForce(this.body, this.body.position, force)
    }
  
    rotate(rotation) {
      this.rotation = rotation
      Body.setAngularVelocity(this.body, rotation)
    }
  
    pointTowardsBall() {
      const desired = p5.Vector.sub(ball.position, this.position)
      const angle = desired.heading()
      Body.setAngle(this.body, angle);
    }
  
    render() {
      var angle = this.body.angle;
      push()
      rectMode(CENTER)
      translate(this.body.position.x, this.body.position.y)
      rotate(angle);
      // tires
      fill(54)
      ellipse(this.length/3, -this.width/2, this.width/4, this.width/8)
      ellipse(this.length/3, this.width/2, this.width/4, this.width/8)
      ellipse(-this.length/3, -this.width/2, this.width/4, this.width/8)
      ellipse(-this.length/3, this.width/2, this.width/4, this.width/8)
      // car body
      fill(this.color)
      rect(0, 0, this.length, this.width, 5);
      fill(54);
      rect(-this.length/24, 0, 0.7 * this.length, 0.8 * this.width, 5);
      fill(this.color);
      rect(-this.length/12, 0, 0.45 * this.length, 0.6 * this.width, 5);
      // headlights
      fill(255, 255, 200)
      ellipse(this.length/2, -this.width/3, this.width/8, this.width/4);
      ellipse(this.length/2, this.width/3, this.width/8, this.width/4);
      pop()
      push()
      noStroke();
      const carWidth = this.width;
      this.history.forEach(function(h, i) {
        const [ x, y ] = h
        push()
        translate(x, y)
        rotate(angle);
        fill(54, i);
        ellipse(-carWidth, 0, exaustClouds - i + random(-10, 10), exaustClouds - i + random(-3, 3));
        pop()
      })
      pop()
    }
  }
  
  class Spark {
    constructor(x, y, xVel) {
      this.pos = createVector(x, y);
      this.lifespan = 255;
  
      this.vel = createVector(random(0, xVel), random(-xVel, xVel));
      // we just want the direction
      this.vel.normalize();
      // then add random speed
      this.vel.mult(random(0, 20));
      this.fill = [random(255), random(255), random(255)]
    }
  
    update() {
      this.vel.mult(0.95);
      this.lifespan -= 5;
      this.pos.add(this.vel);
    }
  
    done() {
      return this.lifespan < 0;
    }
  
    render() {
      if (!this.done()) {
        noStroke();
        fill(this.fill, this.lifespan);
        rect(this.pos.x, this.pos.y, this.lifespan/20, this.lifespan/20, 3);
      }
    }
  }

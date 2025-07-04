
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

// Boost system
let playerBoostMeter = 100;
let computerBoostMeter = 100;
let playerIsBoosting = false;
let computerIsBoosting = false;
let boostDuration = 0.8;
let boostCooldown = 5;
let playerBoostStartTime = 0;
let computerBoostStartTime = 0;

// Advanced AI system
let aiState = {
    currentAction: 'idle',
    decisionTimer: 0,
    decisionInterval: 150, // ms between decisions
    ballPrediction: { x: 0, y: 0 },
    threatLevel: 0,
    aggressiveness: 0.7,
    lastBallPosition: { x: 0, y: 0 },
    ballVelocityHistory: [],
    reactionTime: 100 // ms delay for realistic AI
};

let gameTime = 0;
let matchDuration = 120;
let clouds = [];

// Define all classes first before any other functions

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
        this.position = createVector(width/2, height/2);
        this.radius = width/32;
        const options = {
            restitution: 0.9,
            friction: 0.001,
            density: 0.0001
        };
        this.body = Bodies.circle(
            this.position.x, this.position.y, this.radius/2, options
        );
        World.add(world, this.body);
    }

    didScore() {
        const [x, y] = [this.body.position.x, this.body.position.y];
        const topOfGoalY = height/2 + goalHeight/2;
        const bottomOfGoalY = height/2 - goalHeight/2;
        const withinGoalRange = y < topOfGoalY && y > bottomOfGoalY;
        if (withinGoalRange) {
            return (x <= this.radius/2 || x >= width - this.radius/2);
        }
        return false;
    }

    render() {
        this.position.x = this.body.position.x;
        this.position.y = this.body.position.y;

        push();
        translate(this.body.position.x, this.body.position.y);
        rotate(this.body.angle);
        fill(173,255,47);
        ellipse(0, 0, this.radius);
        fill(54);
        ellipse(0, 0, this.radius/3);
        line(-this.radius/2, 0, this.radius/2, 0);
        pop();
    }
}

class Car {
    constructor(paintColor, startX) {
        const startY = startX < width/2 ? height/4 : 3*height/4;
        this.position = createVector(startX, startY);
        this.width = width/36;
        this.length = this.width * 2;
        this.isAccelerating = false;
        this.rotation = 0;
        this.color = paintColor;
        this.history = [];
        
        const options = { density: 0.01, friction: 0.2, mass: 50 };
        this.body = Bodies.rectangle(
            this.position.x, this.position.y, this.length, this.width, options
        );
        
        if (!this.body) {
            throw new Error("Failed to create Matter.js body");
        }
        
        World.add(world, this.body);
        
        if (startX > width/2) {
            Body.setAngle(this.body, PI);
        }
        
        console.log("Car constructed successfully with body:", this.body.id);
    }

    update() {
        if (this.isAccelerating) {
            this.accelerate();
        }
        this.rotate(this.rotation);
        this.history.push([this.body.position.x, this.body.position.y]);
        if (this.history.length > exaustClouds) {
            this.history.splice(0, 1);
        }
        this.position.x = this.body.position.x;
        this.position.y = this.body.position.y;
    }

    accelerating(isAccelerating) {
        this.isAccelerating = isAccelerating;
    }

    accelerate(boostMultiplier = 1) {
        if (!this.body) return;

        var force = p5.Vector.fromAngle(this.body.angle);
        force.mult(0.02 * boostMultiplier);
        Body.applyForce(this.body, this.body.position, force);

        // Create exhaust clouds
        let cloudChance = boostMultiplier > 1 ? 0.7 : 0.3;
        if (random() < cloudChance) {
            let exhaustPos = this.getExhaustPosition();
            let cloudSize = boostMultiplier > 1 ? 1.3 : 1;
            clouds.push(new Cloud(exhaustPos.x, exhaustPos.y, cloudSize));
        }
    }

    rotate(rotation) {
        this.rotation = rotation;
        Body.setAngularVelocity(this.body, rotation);
    }

    pointTowardsBall() {
        if (!ball || !ball.position || !this.body) return;
        const desired = p5.Vector.sub(ball.position, this.position);
        const angle = desired.heading();
        Body.setAngle(this.body, angle);
    }

    pointTowards(x, y) {
        if (!this.body || !this.position) return;
        const desired = createVector(x - this.position.x, y - this.position.y);
        const angle = desired.heading();
        Body.setAngle(this.body, angle);
    }

    render() {
        var angle = this.body.angle;
        push();
        rectMode(CENTER);
        translate(this.body.position.x, this.body.position.y);
        rotate(angle);
        // tires
        fill(54);
        ellipse(this.length/3, -this.width/2, this.width/4, this.width/8);
        ellipse(this.length/3, this.width/2, this.width/4, this.width/8);
        ellipse(-this.length/3, -this.width/2, this.width/4, this.width/8);
        ellipse(-this.length/3, this.width/2, this.width/4, this.width/8);
        // car body
        fill(this.color);
        rect(0, 0, this.length, this.width, 5);
        fill(54);
        rect(-this.length/24, 0, 0.7 * this.length, 0.8 * this.width, 5);
        fill(this.color);
        rect(-this.length/12, 0, 0.45 * this.length, 0.6 * this.width, 5);
        // headlights
        fill(255, 255, 200);
        ellipse(this.length/2, -this.width/3, this.width/8, this.width/4);
        ellipse(this.length/2, this.width/3, this.width/8, this.width/4);
        pop();
        
        push();
        noStroke();
        const carWidth = this.width;
        this.history.forEach(function(h, i) {
            const [x, y] = h;
            push();
            translate(x, y);
            rotate(angle);
            fill(54, i);
            ellipse(-carWidth, 0, exaustClouds - i + random(-10, 10), exaustClouds - i + random(-3, 3));
            pop();
        });
        pop();
    }

    getExhaustPosition() {
        let angle = this.body.angle;
        let offset = p5.Vector.fromAngle(angle);
        offset.mult(-this.length / 2);
        return {
            x: this.body.position.x + offset.x,
            y: this.body.position.y + offset.y
        };
    }
}

class Spark {
    constructor(x, y, xVel) {
        this.pos = createVector(x, y);
        this.lifespan = 255;
        this.vel = createVector(random(0, xVel), random(-xVel, xVel));
        this.vel.normalize();
        this.vel.mult(random(0, 20));
        this.fill = [random(255), random(255), random(255)];
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

class Cloud {
    constructor(x, y, sizeMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.size = random(8, 15) * sizeMultiplier;
        this.opacity = 255;
        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
        this.life = 60;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= 4;
        this.life--;
    }

    render() {
        noStroke();
        fill(200, this.opacity);
        ellipse(this.x, this.y, this.size);
    }

    isDead() {
        return this.opacity <= 0 || this.life <= 0;
    }
}

// Advanced AI System
class AdvancedAI {
    static updateBallTracking() {
        if (!ball || !ball.body) return;
        
        const currentPos = { x: ball.body.position.x, y: ball.body.position.y };
        const currentVel = { x: ball.body.velocity.x, y: ball.body.velocity.y };
        
        // Track ball velocity history for prediction
        aiState.ballVelocityHistory.push(currentVel);
        if (aiState.ballVelocityHistory.length > 5) {
            aiState.ballVelocityHistory.shift();
        }
        
        // Predict ball position 0.5 seconds ahead
        aiState.ballPrediction.x = currentPos.x + currentVel.x * 30;
        aiState.ballPrediction.y = currentPos.y + currentVel.y * 30;
        
        aiState.lastBallPosition = currentPos;
    }
    
    static assessThreatLevel() {
        if (!ball || !computerCar) return 0;
        
        const ballPos = { x: ball.body.position.x, y: ball.body.position.y };
        const ballVel = ball.body.velocity;
        const goalX = width * 0.05;
        const goalCenter = { x: goalX, y: height * 0.5 };
        
        // Distance to our goal
        const distToGoal = Math.sqrt(Math.pow(ballPos.x - goalCenter.x, 2) + Math.pow(ballPos.y - goalCenter.y, 2));
        
        // Ball heading toward our goal?
        const headingToGoal = ballVel.x < -1 && ballPos.x < width * 0.5;
        
        // Speed factor
        const speed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);
        
        let threat = 0;
        if (distToGoal < 200) threat += 0.4;
        if (headingToGoal) threat += 0.3;
        if (speed > 5) threat += 0.2;
        if (ballPos.x < width * 0.3) threat += 0.1;
        
        return Math.min(threat, 1.0);
    }
    
    static makeDecision() {
        if (!computerCar || !ball) return;
        
        this.updateBallTracking();
        aiState.threatLevel = this.assessThreatLevel();
        
        const ballPos = { x: ball.body.position.x, y: ball.body.position.y };
        const carPos = { x: computerCar.body.position.x, y: computerCar.body.position.y };
        const ballVel = ball.body.velocity;
        const distToBall = Math.sqrt(Math.pow(carPos.x - ballPos.x, 2) + Math.pow(carPos.y - ballPos.y, 2));
        
        // Goal positions
        const ourGoal = { x: width * 0.05, y: height * 0.5 };
        const theirGoal = { x: width * 0.95, y: height * 0.5 };
        
        // High threat - emergency defense
        if (aiState.threatLevel > 0.7) {
            aiState.currentAction = 'emergency_defend';
            if (computerBoostMeter >= 100 && !computerIsBoosting) {
                this.activateBoost();
            }
        }
        // Ball very close and in our half - intercept
        else if (distToBall < 100 && ballPos.x < width * 0.6) {
            aiState.currentAction = 'intercept';
        }
        // Ball in opponent's half and we're close - attack
        else if (ballPos.x > width * 0.6 && distToBall < 150) {
            aiState.currentAction = 'attack';
            // Use boost if close to their goal
            if (ballPos.x > width * 0.8 && computerBoostMeter >= 100 && !computerIsBoosting) {
                this.activateBoost();
            }
        }
        // Ball in our half - defensive positioning
        else if (ballPos.x < width * 0.4) {
            aiState.currentAction = 'defend';
        }
        // Default - chase ball
        else {
            aiState.currentAction = 'chase';
        }
    }
    
    static executeAction() {
        if (!computerCar || !ball) return;
        
        const ballPos = { x: ball.body.position.x, y: ball.body.position.y };
        const carPos = { x: computerCar.body.position.x, y: computerCar.body.position.y };
        const ourGoal = { x: width * 0.05, y: height * 0.5 };
        const theirGoal = { x: width * 0.95, y: height * 0.5 };
        
        switch (aiState.currentAction) {
            case 'emergency_defend':
                // Position directly between ball and goal
                const defensivePos = {
                    x: ourGoal.x + 80,
                    y: ballPos.y + (ourGoal.y - ballPos.y) * 0.3
                };
                computerCar.pointTowards(defensivePos.x, defensivePos.y);
                computerCar.accelerate(computerIsBoosting ? 1.8 : 1.2);
                break;
                
            case 'intercept':
                // Point to predicted ball position
                computerCar.pointTowards(aiState.ballPrediction.x, aiState.ballPrediction.y);
                computerCar.accelerate(computerIsBoosting ? 1.6 : 1.1);
                break;
                
            case 'attack':
                // Calculate angle to hit ball toward their goal
                const ballToGoal = {
                    x: theirGoal.x - ballPos.x,
                    y: theirGoal.y - ballPos.y
                };
                const hitPoint = {
                    x: ballPos.x - ballToGoal.x * 0.3,
                    y: ballPos.y - ballToGoal.y * 0.3
                };
                computerCar.pointTowards(hitPoint.x, hitPoint.y);
                computerCar.accelerate(computerIsBoosting ? 1.7 : 1.2);
                break;
                
            case 'defend':
                // Position between ball and goal, but not too close to goal
                const defendPos = {
                    x: Math.max(ourGoal.x + 120, ballPos.x - 100),
                    y: ballPos.y + (ourGoal.y - ballPos.y) * 0.4
                };
                computerCar.pointTowards(defendPos.x, defendPos.y);
                const distToDefendPos = Math.sqrt(Math.pow(carPos.x - defendPos.x, 2) + Math.pow(carPos.y - defendPos.y, 2));
                if (distToDefendPos > 60) {
                    computerCar.accelerate(computerIsBoosting ? 1.4 : 1.0);
                }
                break;
                
            case 'chase':
            default:
                computerCar.pointTowardsBall();
                computerCar.accelerate(computerIsBoosting ? 1.5 : 1.0);
                break;
        }
        
        // Random boost usage (low chance)
        if (random() < 0.005 && computerBoostMeter >= 100 && !computerIsBoosting) {
            this.activateBoost();
        }
    }
    
    static activateBoost() {
        if (computerBoostMeter >= 100 && !computerIsBoosting && computerCar) {
            computerIsBoosting = true;
            computerBoostStartTime = millis();
            // Create extra exhaust clouds
            for (let i = 0; i < 3; i++) {
                if (computerCar && computerCar.body) {
                    let exhaustPos = computerCar.getExhaustPosition();
                    clouds.push(new Cloud(exhaustPos.x, exhaustPos.y, 1.5));
                }
            }
        }
    }
}

function setup() {
    console.log("Setup function started.");
    const h = min(window.innerHeight, window.innerWidth * 0.61);
    const w = min(window.innerWidth, h * 1.64);

    p5Canvas = createCanvas(w, h).parent(canvasPlaceholder);
    p5Canvas.style('display', 'none');
    console.log("p5Canvas created and parented to canvasPlaceholder.");

    goalHeight = width / 6;

    engine = Engine.create();
    world = engine.world;
    engine.world.gravity.y = 0;

    addWalls();
    resetGame();

    // Event Listeners
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
        console.log("startGameButton event listener added.");
    }
    if (pauseButton) {
        pauseButton.addEventListener('click', togglePause);
        console.log("pauseButton event listener added.");
    }
    if (resumeGameButton) {
        resumeGameButton.addEventListener('click', togglePause);
        console.log("resumeGameButton event listener added.");
    }
    if (restartMatchButton) {
        restartMatchButton.addEventListener('click', restartMatch);
        console.log("restartMatchButton event listener added.");
    }
    if (returnToMainMenuButton) {
        returnToMainMenuButton.addEventListener('click', returnToMainMenu);
        console.log("returnToMainMenuButton event listener added.");
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    console.log("Global keyboard event listeners added.");

    if (gameContainer) {
        gameContainer.style.display = 'none';
        console.log("gameContainer set to display: none.");
    }
    console.log("Setup function finished.");
}

function resetGame() {
    console.log("resetGame function called.");
    
    World.clear(world, false);
    addWalls();

    // Create cars
    const redHexVals = [255, 100, 100];
    const playerStartX = width / 4;
    try {
        car = new Car(redHexVals, playerStartX);
        console.log("Player car created successfully");
    } catch (e) {
        console.error("Failed to create player car:", e);
        car = null;
    }

    const blueHexVals = [100, 100, 255];
    const computerStartX = 3 * width / 4;
    try {
        computerCar = new Car(blueHexVals, computerStartX);
        console.log("Computer car created successfully");
    } catch (e) {
        console.error("Failed to create computer car:", e);
        computerCar = null;
    }

    try {
        ball = new Ball();
        console.log("Ball created successfully");
    } catch (e) {
        console.error("Failed to create ball:", e);
        ball = null;
    }
    
    clouds = [];
    playerScore = 0;
    computerScore = 0;
    sparks = [];
    goalWaitPeriod = false;

    // Reset positions
    if (ball && ball.body) {
        Body.setPosition(ball.body, { x: width / 2, y: height / 2 });
        Body.setVelocity(ball.body, { x: 0, y: 0 });
    }
    
    if (car && car.body) {
        Body.setPosition(car.body, { x: width/4, y: height/4 });
        Body.setVelocity(car.body, { x: 0, y: 0 });
        Body.setAngularVelocity(car.body, 0);
        Body.setAngle(car.body, 0);
        playerBoostMeter = 100;
        playerIsBoosting = false;
    }
    
    if (computerCar && computerCar.body) {
        Body.setPosition(computerCar.body, { x: 3*width/4, y: 3*height/4 });
        Body.setVelocity(computerCar.body, { x: 0, y: 0 });
        Body.setAngularVelocity(computerCar.body, 0);
        Body.setAngle(computerCar.body, PI);
        computerBoostMeter = 100;
        computerIsBoosting = false;
    }
    
    // Reset AI state
    aiState.currentAction = 'idle';
    aiState.decisionTimer = 0;
    aiState.threatLevel = 0;
    aiState.ballVelocityHistory = [];
}

function startGame() {
    console.log("startGame function called.");
    if (mainMenu) mainMenu.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'flex';
    if (p5Canvas) p5Canvas.style('display', 'block');
    if (pauseButton) pauseButton.style.display = 'block';

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
        if (p5Canvas) p5Canvas.style('opacity', '0.5');
        if (pauseButton) pauseButton.style.display = 'none';
        if (gameContainer) gameContainer.style.height = 'calc(100% - 150px)';
    } else {
        if (pauseMenu) pauseMenu.style.display = 'none';
        if (p5Canvas) p5Canvas.style('opacity', '1');
        if (pauseButton) pauseButton.style.display = 'block';
        if (gameContainer) gameContainer.style.height = '100%';
    }
    console.log("Game paused: " + gamePaused);
}

function restartMatch() {
    console.log("restartMatch function called.");
    resetGame();
    togglePause();
}

function returnToMainMenu() {
    console.log("returnToMainMenu function called.");
    gameStarted = false;
    gamePaused = false;
    if (mainMenu) mainMenu.style.display = 'flex';
    if (gameContainer) gameContainer.style.display = 'none';
    if (p5Canvas) p5Canvas.style('display', 'none');
    if (pauseMenu) pauseMenu.style.display = 'none';
    if (p5Canvas) p5Canvas.style('opacity', '1');
    if (pauseButton) pauseButton.style.display = 'none';
    console.log("Returned to main menu. Game started: " + gameStarted + ", Paused: " + gamePaused);
}

function handleKeyDown(event) {
    if (gameStarted && !gamePaused && car) {
        switch(event.key) {
            case 'ArrowRight':
            case 'd':
            case 'D':
                car.rotate(PI / 72);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                car.rotate(-PI / 72);
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                car.accelerating(true);
                break;
            case 'Shift':
                if (playerBoostMeter >= 100 && !playerIsBoosting) {
                    activatePlayerBoost();
                }
                break;
        }
    }
}

function handleKeyUp(event) {
    if (gameStarted && !gamePaused && car) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                car.accelerating(false);
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'd':
            case 'D':
                car.rotate(0);
                break;
        }
    }
}

function draw() {
    if (!gameStarted) return;

    if (gamePaused) {
        drawSoccerField();
        if (car) car.render();
        if (computerCar) computerCar.render();
        if (ball) ball.render();
        displayScores();
        drawBoostMeter();
        goSparksGo();
        return; 
    }

    if (goalWaitPeriod) {
        translate(random(-13, 13), random(-13, 13));
    }

    drawSoccerField();
    Engine.update(engine);
    updateBoostSystem();

    if (car) {
        car.render();
        car.update();
    }

    if (computerCar) {
        computerCar.render();
        computerCar.update();
    }

    // Advanced AI Update
    aiState.decisionTimer += 1000/60;
    if (aiState.decisionTimer >= aiState.decisionInterval) {
        aiState.decisionTimer = 0;
        AdvancedAI.makeDecision();
    }
    AdvancedAI.executeAction();

    if (ball) {
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
    }

    displayScores();
    drawBoostMeter();

    if (goalWaitPeriod) {
        fill(random(255), random(255), random(255));
        textSize(64);
        text("GOOOOOOAL", width / 2 - 200, height / 2);
    }

    goSparksGo();

    // Update clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].update();
        clouds[i].render();
        if (clouds[i].isDead()) {
            clouds.splice(i, 1);
        }
    }
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

function updateBoostSystem() {
    if (playerIsBoosting) {
        if (millis() - playerBoostStartTime > boostDuration * 1000) {
            playerIsBoosting = false;
            playerBoostMeter = 0;
        }
    } else if (playerBoostMeter < 100) {
        playerBoostMeter += (100 / (boostCooldown * 60));
        playerBoostMeter = min(100, playerBoostMeter);
    }

    if (computerIsBoosting) {
        if (millis() - computerBoostStartTime > boostDuration * 1000) {
            computerIsBoosting = false;
            computerBoostMeter = 0;
        }
    } else if (computerBoostMeter < 100) {
        computerBoostMeter += (100 / (boostCooldown * 60));
        computerBoostMeter = min(100, computerBoostMeter);
    }
}

function activatePlayerBoost() {
    if (playerBoostMeter >= 100 && !playerIsBoosting && car) {
        playerIsBoosting = true;
        playerBoostStartTime = millis();
        for (let i = 0; i < 3; i++) {
            if (car && car.body) {
                let exhaustPos = car.getExhaustPosition();
                clouds.push(new Cloud(exhaustPos.x, exhaustPos.y, 1.5));
            }
        }
    }
}

function drawBoostMeter() {
    let meterWidth = 120;
    let meterHeight = 8;
    let meterX = 20;
    let meterY = 20;

    fill(0, 0, 0, 100);
    noStroke();
    rect(meterX, meterY, meterWidth, meterHeight, 4);

    if (playerIsBoosting) {
        fill(255, 100, 100);
    } else if (playerBoostMeter >= 100) {
        fill(100, 255, 100);
    } else {
        fill(100, 100, 255);
    }

    let fillWidth = (playerBoostMeter / 100) * meterWidth;
    rect(meterX, meterY, fillWidth, meterHeight, 4);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    text('BOOST', meterX, meterY + meterHeight + 5);

    if (playerIsBoosting) {
        text('BOOSTING!', meterX, meterY + meterHeight + 20);
    } else if (playerBoostMeter >= 100) {
        text('READY (Shift)', meterX, meterY + meterHeight + 20);
    } else {
        text(`${floor(playerBoostMeter)}%`, meterX, meterY + meterHeight + 20);
    }
}

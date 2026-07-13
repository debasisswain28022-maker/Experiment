// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;

// Player Car
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 50,
    speed: 0,
    maxSpeed: 8,
    acceleration: 0.3,
    friction: 0.95,
    color: '#ff0000'
};

// Game Objects
let obstacles = [];
let powerUps = [];
let particles = [];

// Input
const keys = {};

// Event Listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game Functions
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        document.getElementById('startBtn').textContent = 'Pause';
        gameLoop();
    }
}

function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('startBtn').textContent = gamePaused ? 'Resume' : 'Pause';
        if (!gamePaused) {
            gameLoop();
        }
    }
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    player.x = canvas.width / 2 - 15;
    player.speed = 0;
    obstacles = [];
    powerUps = [];
    particles = [];
    updateUI();
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('gameOver').classList.add('hidden');
    draw();
}

function restartGame() {
    resetGame();
    startGame();
}

function gameLoop() {
    if (!gamePaused) {
        update();
    }
    draw();
    
    if (gameRunning && !gamePaused) {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    // Player Movement
    if (keys['ArrowLeft'] && player.x > 0) {
        player.speed = -player.maxSpeed;
    } else if (keys['ArrowRight'] && player.x + player.width < canvas.width) {
        player.speed = player.maxSpeed;
    } else {
        player.speed *= player.friction;
    }

    player.x += player.speed;

    // Keep player on screen
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Spawn obstacles
    if (Math.random() < 0.015 * (1 + level * 0.2)) {
        spawnObstacle();
    }

    // Spawn power-ups
    if (Math.random() < 0.005 * level) {
        spawnPowerUp();
    }

    // Update obstacles
    obstacles = obstacles.filter(obs => {
        obs.y += obs.speed;
        
        // Check collision with player
        if (checkCollision(player, obs)) {
            createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2);
            lives--;
            updateUI();
            
            if (lives <= 0) {
                endGame();
                return false;
            }
            return false;
        }

        return obs.y < canvas.height + 50;
    });

    // Update power-ups
    powerUps = powerUps.filter(power => {
        power.y += power.speed;
        power.rotation += 0.1;
        
        if (checkCollision(player, power)) {
            score += 50;
            level = Math.floor(score / 200) + 1;
            updateUI();
            createExplosion(power.x + power.width / 2, power.y + power.height / 2, '#ffff00');
            return false;
        }

        return power.y < canvas.height + 50;
    });

    // Update particles
    particles = particles.filter(p => {
        p.life--;
        p.y += p.vy;
        p.x += p.vx;
        return p.life > 0;
    });

    // Increase score over time
    if (Math.random() < 0.02) {
        score += 1;
        updateUI();
    }
}

function spawnObstacle() {
    const width = 30 + Math.random() * 20;
    const x = Math.random() * (canvas.width - width);
    const colors = ['#0000ff', '#00ff00', '#ffff00', '#ff6600'];
    
    obstacles.push({
        x: x,
        y: -50,
        width: width,
        height: 50,
        speed: 3 + level * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function spawnPowerUp() {
    const x = Math.random() * (canvas.width - 30);
    
    powerUps.push({
        x: x,
        y: -50,
        width: 30,
        height: 30,
        speed: 2,
        rotation: 0,
        color: '#FFD700'
    });
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function createExplosion(x, y, color = '#ff6600') {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player
    drawCar(player.x, player.y, player.width, player.height, player.color);

    // Draw obstacles
    obstacles.forEach(obs => {
        drawCar(obs.x, obs.y, obs.width, obs.height, obs.color);
    });

    // Draw power-ups
    powerUps.forEach(power => {
        ctx.save();
        ctx.translate(power.x + power.width / 2, power.y + power.height / 2);
        ctx.rotate(power.rotation);
        ctx.fillStyle = power.color;
        ctx.fillRect(-power.width / 2, -power.height / 2, power.width, power.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-power.width / 2 + 5, -power.height / 2 + 5, 10, 10);
        ctx.restore();
    });

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    });

    // Draw pause text
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function drawCar(x, y, width, height, color) {
    // Car body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Car window
    ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
    ctx.fillRect(x + 5, y + 10, width - 10, 15);
    
    // Car light
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x + 5, y, width - 10, 5);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('speed').textContent = Math.abs(Math.round(player.speed * 10));
}

function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Initial draw
draw();
updateUI();
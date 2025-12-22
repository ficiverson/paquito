class TeddyBearGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config; // { onGameOver: (score, collectedNames) => void, babyNames: string[] }

    // Constants
    this.CANVAS_WIDTH = canvas.width;
    this.CANVAS_HEIGHT = canvas.height;
    this.GRAVITY = 0.5;
    this.JUMP_STRENGTH = -9;
    this.BEAR_SIZE = 60;
    this.OBSTACLE_WIDTH = 80;
    this.OBSTACLE_SPEED = this.CANVAS_WIDTH < 500 ? 2 : 2.5;
    this.GAP_HEIGHT = 250;

    // Balloon Colors (Bright & Pastel)
    this.BALLOON_COLORS = [
      '#FF6B9D', // Pink
      '#87CEEB', // Sky Blue
      '#FFB6C1', // Light Pink
      '#9370DB', // Medium Purple
      '#FFD700', // Gold
      '#98FB98', // Pale Green
      '#FFA07A', // Light Salmon
      '#DDA0DD'  // Plum
    ];

    // State
    this.score = 0;
    this.gameStarted = false;
    this.gameOver = false;
    this.bearY = 250;
    this.bearVelocity = 0;
    this.obstacles = [];
    this.balloons = [];
    this.collectedNames = []; // Fix: Track collected names locally

    // Timers
    this.obstacleTimer = 0;
    this.balloonTimer = 0;
    this.lastTime = 0;

    this.animationFrameId = null;
    this.handleInput = this.handleInput.bind(this);

    this.init();
  }

  init() {
    // Reset state
    this.score = 0;
    this.gameStarted = false;
    this.gameOver = false;
    this.bearY = this.CANVAS_HEIGHT / 2 - this.BEAR_SIZE / 2;
    this.bearVelocity = 0;
    this.obstacles = [];
    this.balloons = [];
    this.collectedNames = [];
    this.obstacleTimer = 0;
    this.balloonTimer = 2500; // Start almost ready to spawn a balloon (at 3000)
    this.lastTime = 0;

    // Bind events
    this.canvas.addEventListener('click', this.handleInput);
    this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });

    // Initial Draw
    this.draw(0);
  }

  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.canvas.removeEventListener('click', this.handleInput);
    this.canvas.removeEventListener('touchstart', this.handleInput);
  }

  handleInput(e) {
    e.preventDefault(); // Prevent double firing on some touch devices

    if (!this.gameStarted) {
      this.gameStarted = true;
      this.bearVelocity = this.JUMP_STRENGTH;
      this.start();
    } else if (!this.gameOver) {
      this.bearVelocity = this.JUMP_STRENGTH;
    }
  }

  gameLoop(currentTime) {
    if (this.gameOver) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    if (!this.gameOver) {
      this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  update(deltaTime) {
    // Update bear physics
    this.bearVelocity += this.GRAVITY;
    this.bearY += this.bearVelocity;

    // Check boundaries
    if (this.bearY < 0) {
      this.bearY = 0;
      this.bearVelocity = 0;
    }
    if (this.bearY > this.CANVAS_HEIGHT - this.BEAR_SIZE) {
      this.endGame();
      return;
    }

    // Update Obstacles
    this.updateObstacles(deltaTime);

    // Update Balloons
    this.updateBalloons(deltaTime);
  }

  updateObstacles(deltaTime) {
    this.obstacleTimer += deltaTime;
    // Difficulty curve
    const obstacleDelay = this.score < 3 ? 3500 : this.score < 8 ? 3000 : 2500;

    if (this.obstacleTimer > obstacleDelay) {
      this.obstacleTimer = 0;

      // Dynamic Gap Height: Easier (350) at start, Harder (250) after 5 points
      const currentGapHeight = this.score < 5 ? 350 : 250;

      this.obstacles.push({
        x: this.CANVAS_WIDTH,
        gapY: Math.random() * (this.CANVAS_HEIGHT - currentGapHeight - 100) + 50,
        gapHeight: currentGapHeight,
        passed: false,
      });
    }

    this.obstacles = this.obstacles.filter((obstacle) => {
      obstacle.x -= this.OBSTACLE_SPEED;

      // Collision Check
      if (
        this.bearX() + this.BEAR_SIZE > obstacle.x &&
        this.bearX() < obstacle.x + this.OBSTACLE_WIDTH &&
        (this.bearY < obstacle.gapY || this.bearY + this.BEAR_SIZE > obstacle.gapY + obstacle.gapHeight)
      ) {
        this.endGame();
      }

      // Check if passed
      if (!obstacle.passed && obstacle.x + this.OBSTACLE_WIDTH < this.bearX()) {
        obstacle.passed = true;
        // this.score += 1; // Removed: Score is now based on balloons
      }

      return obstacle.x > -this.OBSTACLE_WIDTH;
    });
  }

  updateBalloons(deltaTime) {
    this.balloonTimer += deltaTime;
    if (this.balloonTimer > 3000 && this.config.babyNames.length > 0) {
      this.balloonTimer = 0;
      const randomName = this.config.babyNames[Math.floor(Math.random() * this.config.babyNames.length)];
      const randomColor = this.BALLOON_COLORS[Math.floor(Math.random() * this.BALLOON_COLORS.length)];
      // Radius based on name length: min 20, plus 2.5 per character
      const radius = 20 + (randomName.length * 2.5);

      this.balloons.push({
        x: this.CANVAS_WIDTH,
        y: Math.random() * (this.CANVAS_HEIGHT - 100) + 50,
        name: randomName,
        collected: false,
        opacity: 1,
        color: randomColor,
        radius: radius
      });
    }

    this.balloons = this.balloons.filter((balloon) => {
      if (!balloon.collected) {
        balloon.x -= this.OBSTACLE_SPEED * 0.8;

        // Check collection (dynamic radius)
        const distance = Math.sqrt(
          Math.pow(balloon.x - (this.bearX() + 30), 2) + Math.pow(balloon.y - this.bearY, 2)
        );

        // Check if distance is less than (bear radius + balloon radius)
        // Bear is approx 30 radius (checking visually from drawBear)
        if (distance < (30 + balloon.radius)) {
          balloon.collected = true;
          this.collectedNames.push(balloon.name); // Fix: Add to collected names
          this.score += 1; // Score incremented on balloon collection
        }
      } else {
        // Animation
        balloon.opacity -= 0.05;
        balloon.y -= 2;
      }
      return balloon.opacity > 0;
    });
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#4A9FD8';
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // Draw clouds (static for now, could be animated)
    this.drawCloud(this.CANVAS_WIDTH * 0.12, 100);
    this.drawCloud(this.CANVAS_WIDTH * 0.75, 150);

    // Draw Bear
    this.drawBear();

    // Draw Obstacles
    this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));

    // Draw Balloons
    this.balloons.forEach(balloon => this.drawBalloon(balloon));

    // Draw Score
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.config.scoreLabel || 'Score'}: ${this.score}`, 20, 50);
  }

  drawCloud(x, y) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 40, 0, Math.PI * 2);
    this.ctx.arc(x + 40, y - 10, 50, 0, Math.PI * 2);
    this.ctx.arc(x + 80, y, 40, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawBear() {
    const bearX = this.bearX();
    const bearY = this.bearY;

    // Draw the Bear Emoji
    this.ctx.globalAlpha = 1.0; // Ensure full opacity
    this.ctx.fillStyle = '#000000'; // Reset fill style to solid
    this.ctx.font = '60px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🧸', bearX, bearY + 25);

    // Balloon strings
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(bearX + 10, bearY + 45);
    this.ctx.lineTo(bearX + 10, bearY - 30);
    this.ctx.moveTo(bearX + 50, bearY + 45);
    this.ctx.lineTo(bearX + 50, bearY - 30);
    this.ctx.stroke();

    // Balloons attached to bear
    const balloonColors = ['#FF6B9D', '#87CEEB', '#FFB6C1'];

    // Draw 3 balloons
    this.drawSimpleBalloon(bearX + 10, bearY - 30, balloonColors[0]);
    this.drawSimpleBalloon(bearX + 30, bearY - 35, balloonColors[1]);
    this.drawSimpleBalloon(bearX + 50, bearY - 30, balloonColors[2]);
  }

  drawSimpleBalloon(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 12, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawObstacle(obstacle) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    // Helper to draw a fluffy cloud pillar
    const drawCloudPillar = (yStart, yEnd) => {
      const step = 30;
      for (let y = yStart; y <= yEnd; y += step) {
        this.ctx.beginPath();
        // Add some random variation to x to make it look fluffy
        const xOffset = (Math.sin(y * 0.05) * 10);
        this.ctx.arc(obstacle.x + this.OBSTACLE_WIDTH / 2 + xOffset, y, 35, 0, Math.PI * 2);
        this.ctx.fill();
      }
    };

    // Top Cloud Pillar
    drawCloudPillar(-30, obstacle.gapY - 20);

    // Bottom Cloud Pillar
    drawCloudPillar(obstacle.gapY + obstacle.gapHeight + 20, this.CANVAS_HEIGHT + 30);
  }

  drawBalloon(balloon) {
    if (balloon.collected) {
      // Popping text
      this.ctx.fillStyle = `rgba(64, 130, 200, ${balloon.opacity})`;
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(balloon.name, balloon.x, balloon.y);
    } else {
      // Floating balloon
      this.ctx.globalAlpha = balloon.opacity;
      this.ctx.fillStyle = balloon.color;
      this.ctx.beginPath();
      this.ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;

      // Name
      this.ctx.fillStyle = `rgba(255, 255, 255, ${balloon.opacity})`;
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(balloon.name, balloon.x, balloon.y);
      this.ctx.textBaseline = 'alphabetic';
    }
  }

  endGame() {
    this.gameOver = true;
    if (this.config.onGameOver) {
      this.config.onGameOver(this.score, this.collectedNames);
    }
  }

  bearX() {
    return 100;
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800, // Base width
  height: 600, // Base height
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: { preload, create, update },
};

const game = new Phaser.Game(config);

let grandma;
let germs;
let vaccines;
let vaccinesCollected = 0;
let vaccineSpawned = false;
let germSpeed = 100; // Initial germ speed
let germSpawnRate = 1000; // Initial spawn rate (milliseconds)
let germSpawnEvent;
let gameOver = false;
let score = 0;
let scoreText;
let vaccinesText;
let scaleFactor;

function preload() {
  // Load germ image
  this.load.image('germ', 'assets/germ.png');

  // Load vaccine image
  this.load.image('vaccine', 'assets/vaccine.png');

  // Load grandma images
  for (let i = 1; i <= 37; i++) {
    this.load.image(`grandma${i}`, `assets/grandma${i}.png`);
  }

  // Load sound effects
  for (let i = 1; i <= 3; i++) {
    this.load.audio(`smash${i}`, `assets/sounds/smash${i}.mp3`);
    this.load.audio(`win${i}`, `assets/sounds/win${i}.mp3`);
    this.load.audio(`fail${i}`, `assets/sounds/fail${i}.mp3`);
  }
}

function create() {
  scaleFactor = this.scale.width / 800;

  // Select a random grandma image
  const randomGrandmaIndex = Phaser.Math.Between(1, 37);
  const grandmaKey = `grandma${randomGrandmaIndex}`;

  // Add grandma sprite
  grandma = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, grandmaKey);
  grandma.setImmovable(true);
  grandma.setScale(scaleFactor);

  // Create a group for germs
  germs = this.physics.add.group();

  // Spawn germs periodically
  germSpawnEvent = this.time.addEvent({
    delay: germSpawnRate,
    callback: spawnGerm,
    callbackScope: this,
    loop: true,
  });

  // Add collision detection between germs and grandma
  this.physics.add.overlap(germs, grandma, hitGrandma, null, this);

  // Enable input
  this.input.on('pointerdown', destroyGerm, this);

  // Display score
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#ffffff',
  });

  // Display vaccines collected
  vaccinesText = this.add.text(16, 50, 'Vaccines: 0/3', {
    fontSize: '32px',
    fill: '#ffffff',
  });

  // Create a group for vaccines
  vaccines = this.physics.add.group();

  // Spawn the first vaccine
  spawnVaccine.call(this);
}

function update() {
  if (gameOver) return;

  // Move germs toward grandma
  germs.children.iterate(function (germ) {
    this.physics.moveToObject(germ, grandma, germSpeed);
  }, this);
}

function spawnGerm() {
  const position = getRandomEdgePosition(this);  // Pass the scene context
  const germ = germs.create(position.x, position.y, 'germ');
  germ.setScale(scaleFactor);
  germ.setCollideWorldBounds(false);
}

function getRandomEdgePosition(scene) {
  const edges = ['top', 'bottom', 'left', 'right'];
  const edge = Phaser.Utils.Array.GetRandom(edges);

  let x, y;

  switch (edge) {
    case 'top':
      x = Phaser.Math.Between(0, scene.scale.width);
      y = 0;
      break;
    case 'bottom':
      x = Phaser.Math.Between(0, scene.scale.width);
      y = scene.scale.height;
      break;
    case 'left':
      x = 0;
      y = Phaser.Math.Between(0, scene.scale.height);
      break;
    case 'right':
      x = scene.scale.width;
      y = Phaser.Math.Between(0, scene.scale.height);
      break;
  }

  return { x, y };
}

function destroyGerm(pointer) {
  const germsAtPointer = germs.getChildren().filter((germ) =>
    germ.getBounds().contains(pointer.x, pointer.y)
  );

  if (germsAtPointer.length > 0) {
    germsAtPointer[0].destroy();

    // Play random smash sound
    const randomSmashIndex = Phaser.Math.Between(1, 3);
    this.sound.play(`smash${randomSmashIndex}`);

    score += 10;
    scoreText.setText('Score: ' + score);
  }
}

function hitGrandma(grandma, germ) {
  this.physics.pause();
  germ.setTint(0xff0000);
  gameOver = true;

  // Play random fail sound
  const randomFailIndex = Phaser.Math.Between(1, 3);
  this.sound.play(`fail${randomFailIndex}`);

  const gameOverText = this.add.text(
    this.scale.width / 2,
    this.scale.height / 2,
    'Game Over',
    { fontSize: '64px', fill: '#ff0000' }
  );
  gameOverText.setOrigin(0.5);
}

function spawnVaccine() {
  if (vaccineSpawned || gameOver) return;

  const position = {
    x: Phaser.Math.Between(50, this.scale.width - 50),
    y: Phaser.Math.Between(50, this.scale.height - 50),
  };

  const vaccine = vaccines.create(position.x, position.y, 'vaccine');
  vaccine.setScale(scaleFactor);
  vaccine.setInteractive();
  vaccineSpawned = true;

  // Listen for vaccine collection
  vaccine.on('pointerdown', () => {
    vaccine.destroy();
    vaccineSpawned = false;
    vaccinesCollected += 1;

    // Update vaccines collected text
    vaccinesText.setText('Vaccines: ' + vaccinesCollected + '/3');

    // Play vaccine collection sound (optional)
    // this.sound.play('vaccineCollect');

    checkWinCondition.call(this);
    increaseDifficulty.call(this);

    // Spawn next vaccine after a delay
    this.time.delayedCall(2000, spawnVaccine, [], this);
  });
}

function increaseDifficulty() {
  // Increase germ speed
  germSpeed += 50;

  // Decrease spawn rate (increase spawn frequency)
  germSpawnRate = Math.max(500, germSpawnRate - 200); // Minimum spawn rate of 500ms

  // Update germ spawn event
  germSpawnEvent.delay = germSpawnRate;
}

function checkWinCondition() {
  if (vaccinesCollected >= 3) {
    this.physics.pause();
    gameOver = true;

    // Play random win sound
    const randomWinIndex = Phaser.Math.Between(1, 3);
    this.sound.play(`win${randomWinIndex}`);

    const winText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'You Win!',
      { fontSize: '64px', fill: '#00ff00' }
    );
    winText.setOrigin(0.5);
  }
}

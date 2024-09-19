// Global Variables
let score = 0;
let vaccinesCollected = 0;
let gameOver = false;
let gameWon = false;

// Helper Function
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

// Start Scene
class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    // Load any assets for the start screen if needed
    // Comment out if 'start-background.png' is not available
    // this.load.image('start-bg', 'assets/start-background.png');
  }

  create() {
    // Background (optional)
    // Uncomment the following lines if 'start-bg' is available
    /*
    this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'start-bg')
      .setDisplaySize(this.scale.width, this.scale.height);
    */

    // Instruction Text
    const instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 100,
      'Collect 3 Flu vaccines to protect your classmate,\nand smash the germs along the way!',
      {
        fontSize: '32px',
        fill: '#ffffff',
        align: 'center',
      }
    );
    instructionText.setOrigin(0.5);

    // Begin Button
    const beginButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Begin', {
      fontSize: '48px',
      fill: '#00ff00',
    });
    beginButton.setOrigin(0.5);
    beginButton.setInteractive();

    beginButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

// Game Scene
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load game assets
    this.load.image('germ', 'assets/germ.png');
    this.load.image('vaccine', 'assets/vaccine.png');

    for (let i = 1; i <= 37; i++) {
      this.load.image(`grandma${i}`, `assets/grandma${i}.png`);
    }

    // Load sounds
    for (let i = 1; i <= 3; i++) {
      this.load.audio(`smash${i}`, `assets/sounds/smash${i}.mp3`);
      this.load.audio(`win${i}`, `assets/sounds/win${i}.mp3`);
      this.load.audio(`fail${i}`, `assets/sounds/fail${i}.mp3`);
    }

    // Load texts
    for (let i = 1; i <= 25; i++) {
      this.load.text(`text${i}`, `texts/text${i}.txt`);
    }
  }

  create() {
    // Reset Variables
    score = 0;
    vaccinesCollected = 0;
    gameOver = false;
    gameWon = false;
    this.germSpeed = 100;
    this.germSpawnRate = 1000;
    this.vaccineSpawned = false;

    // Scale Factor
    this.scaleFactor = this.scale.width / 800;

    // Random Grandma
    const randomGrandmaIndex = Phaser.Math.Between(1, 37);
    const grandmaKey = `grandma${randomGrandmaIndex}`;

    // Add Grandma
    this.grandma = this.physics.add.sprite(
      this.scale.width / 2,
      this.scale.height / 2,
      grandmaKey
    );
    this.grandma.setImmovable(true);
    this.grandma.setScale(0.5 * this.scaleFactor); // Adjusted scale

    // Germs Group
    this.germs = this.physics.add.group();

    // Spawn Germs
    this.germSpawnEvent = this.time.addEvent({
      delay: this.germSpawnRate,
      callback: this.spawnGerm,
      callbackScope: this,
      loop: true,
    });

    // Collision Detection
    this.physics.add.overlap(this.germs, this.grandma, this.hitGrandma, null, this);

    // Input
    this.input.on('pointerdown', this.destroyGerm, this);

    // Score Text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#ffffff',
    });

    // Vaccines Collected Text
    this.vaccinesText = this.add.text(16, 50, 'Vaccines: 0/3', {
      fontSize: '32px',
      fill: '#ffffff',
    });

    // Vaccines Group
    this.vaccines = this.physics.add.group();

    // Spawn First Vaccine
    this.time.delayedCall(2000, this.spawnVaccine, [], this);
  }

  update() {
    if (gameOver || gameWon) return;

    // Move germs toward grandma
    this.germs.children.iterate((germ) => {
      this.physics.moveToObject(germ, this.grandma, this.germSpeed);
    });
  }

  spawnGerm() {
    const position = getRandomEdgePosition(this);
    const germ = this.germs.create(position.x, position.y, 'germ');
    germ.setScale(0.1 * this.scaleFactor); // Smaller germ
    germ.setCollideWorldBounds(false);

    // Fade in effect
    germ.setAlpha(0);
    this.tweens.add({
      targets: germ,
      alpha: 1,
      duration: 500,
    });
  }

  destroyGerm(pointer) {
    const germsAtPointer = this.germs.getChildren().filter((germ) =>
      germ.getBounds().contains(pointer.x, pointer.y)
    );

    if (germsAtPointer.length > 0) {
      const germ = germsAtPointer[0];

      // Stop germ movement
      germ.body.setVelocity(0, 0);

      // Turn red
      germ.setTint(0xff0000);

      // Play random smash sound
      const randomSmashIndex = Phaser.Math.Between(1, 3);
      this.sound.play(`smash${randomSmashIndex}`);

      // Fade away
      this.tweens.add({
        targets: germ,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          germ.destroy();
        },
      });

      score += 10;
      this.scoreText.setText('Score: ' + score);
    }
  }

  hitGrandma(grandma, germ) {
    if (gameOver) return;

    gameOver = true;
    this.physics.pause();

    // Play random fail sound
    const randomFailIndex = Phaser.Math.Between(1, 3);
    this.sound.play(`fail${randomFailIndex}`);

    // Transition to End Scene
    this.scene.start('EndScene', { win: false });
  }

  spawnVaccine() {
    if (this.vaccineSpawned || gameOver || gameWon) return;

    const position = {
      x: Phaser.Math.Between(50, this.scale.width - 50),
      y: Phaser.Math.Between(50, this.scale.height - 50),
    };

    const vaccine = this.vaccines.create(position.x, position.y, 'vaccine');
    vaccine.setScale(0.05 * this.scaleFactor); // Tiny vaccine
    vaccine.setInteractive();

    this.vaccineSpawned = true;

    // Vaccine disappears after 1 second
    this.time.delayedCall(
      1000,
      () => {
        if (vaccine.active) {
          vaccine.destroy();
          this.vaccineSpawned = false;
          // Schedule next vaccine
          this.time.delayedCall(2000, this.spawnVaccine, [], this);
        }
      },
      [],
      this
    );

    // Collect Vaccine
    vaccine.on('pointerdown', () => {
      vaccine.destroy();
      this.vaccineSpawned = false;
      vaccinesCollected += 1;

      this.vaccinesText.setText('Vaccines: ' + vaccinesCollected + '/3');

      // Increase Difficulty
      this.increaseDifficulty();

      // Check Win Condition
      if (vaccinesCollected >= 3) {
        gameWon = true;
        this.physics.pause();

        // Play random win sound
        const randomWinIndex = Phaser.Math.Between(1, 3);
        this.sound.play(`win${randomWinIndex}`);

        // Transition to End Scene
        this.scene.start('EndScene', { win: true });
      } else {
        // Spawn next vaccine after a delay
        this.time.delayedCall(2000, this.spawnVaccine, [], this);
      }
    });
  }

  increaseDifficulty() {
    // Increase germ speed
    this.germSpeed += 50;

    // Decrease spawn rate (increase frequency)
    this.germSpawnRate = Math.max(500, this.germSpawnRate - 200);
    this.germSpawnEvent.reset({
      delay: this.germSpawnRate,
      callback: this.spawnGerm,
      callbackScope: this,
      loop: true,
    });
  }
}

// End Scene
class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' });
  }

  init(data) {
    this.win = data.win;
  }

  preload() {
    // Load any assets for the end screen
    // Comment out if 'gameover-background.png' is not available
    // this.load.image('end-bg', 'assets/gameover-background.png');
    this.load.image('tiny-germ', 'assets/germ.png');

    // Load texts if not already loaded
    for (let i = 1; i <= 25; i++) {
      if (!this.cache.text.exists(`text${i}`)) {
        this.load.text(`text${i}`, `texts/text${i}.txt`);
      }
    }
  }

  create() {
    // Black background
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0);

    // Tiny Germs Around
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      this.add.image(x, y, 'tiny-germ').setScale(0.05);
    }

    // Random Text
    const randomTextIndex = Phaser.Math.Between(1, 25);
    const randomText = this.cache.text.get(`text${randomTextIndex}`);

    const displayText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      randomText,
      {
        fontSize: '24px',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: this.scale.width - 40 },
      }
    );
    displayText.setOrigin(0.5);

    // Button
    const buttonText = this.win ? 'Save another classmate?' : 'Try Again';
    const button = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 100,
      buttonText,
      {
        fontSize: '32px',
        fill: '#00ff00',
      }
    );
    button.setOrigin(0.5);
    button.setInteractive();

    button.on('pointerdown', () => {
      // Restart Game Scene
      this.scene.start('GameScene');
    });
  }
}

// Now define the game configuration and create the game
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [StartScene, GameScene, EndScene],
};

const game = new Phaser.Game(config);

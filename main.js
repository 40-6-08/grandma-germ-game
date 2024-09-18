const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scene: {
      preload: preload,
      create: create,
      update: update,
    },
  };
  
  const game = new Phaser.Game(config);
  let grandma;
let germs;
let gameOver = false;
let score = 0;
let scoreText;
function preload() {
    this.load.image('grandma', 'assets/grandma.png');
    this.load.image('germ', 'assets/germ.png');
  }
  function create() {
    // Add grandma sprite at the center
    grandma = this.physics.add.sprite(config.width / 2, config.height / 2, 'grandma');
    grandma.setImmovable(true);
  
    // Create a group for germs
    germs = this.physics.add.group();
  
    // Spawn germs every second
    this.time.addEvent({
      delay: 1000,
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
  }
  function update() {
    if (gameOver) {
      return;
    }
  
    // Move germs toward grandma
    germs.children.iterate(function (germ) {
      this.physics.moveToObject(germ, grandma, 100);
    }, this);
  }
  function spawnGerm() {
    const position = getRandomEdgePosition();
    const germ = germs.create(position.x, position.y, 'germ');
    germ.setCollideWorldBounds(false);
  }
  function getRandomEdgePosition() {
    const edges = ['top', 'bottom', 'left', 'right'];
    const edge = Phaser.Utils.Array.GetRandom(edges);
  
    let x, y;
  
    switch (edge) {
      case 'top':
        x = Phaser.Math.Between(0, config.width);
        y = 0;
        break;
      case 'bottom':
        x = Phaser.Math.Between(0, config.width);
        y = config.height;
        break;
      case 'left':
        x = 0;
        y = Phaser.Math.Between(0, config.height);
        break;
      case 'right':
        x = config.width;
        y = Phaser.Math.Between(0, config.height);
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
      score += 10;
      scoreText.setText('Score: ' + score);
    }
  }
  function hitGrandma(grandma, germ) {
    this.physics.pause();
    germ.setTint(0xff0000);
    gameOver = true;
  
    const gameOverText = this.add.text(
      config.width / 2,
      config.height / 2,
      'Game Over',
      {
        fontSize: '64px',
        fill: '#ff0000',
      }
    );
    gameOverText.setOrigin(0.5);
  }
  
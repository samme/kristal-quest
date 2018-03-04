(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("initialize.js", function(exports, require, module) {
window.game = new Phaser.Game({

  width: 800,
  height: 600,
  type: Phaser.AUTO,
  title: '💎 Kristal Quest',
  url: 'https://github.com/samme/kristal-quest',
  version: '0.0.1',
  banner: {
    background: ['#eb4149', '#ebba16', '#42af5c', '#2682b1', '#28434d']
  },
  // pixelArt: true,
  clearBeforeRender: false,
  loader: {
    path: 'assets/',
    maxParallelDownloads: 6,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
      gravity: {
        y: 600
      },
      height: 775,
      width: 1600,
      x: 0,
      y: -200,
    }
  },
  scene: [
    require('scenes/boot'),
    require('scenes/default'),
    require('scenes/menu')
  ],

});

});

require.register("scenes/boot.js", function(exports, require, module) {
var GRAY = 0x222222;
var RED = 0xff2200;
var WHITE = 0xffffff;

module.exports = {

  key: 'boot',

  preload: function () {
    this.load.bitmapFont('smooth', 'atari-smooth.png', 'atari-smooth.xml');
    this.load.bitmapFont('sunset', 'atari-sunset.png', 'atari-sunset.xml');
    this.load.image('diamond');
    this.load.image('mtn');
    this.load.image('pineapple');
    this.load.image('platform');
    this.load.image('ship');
    this.load.image('slime');
    this.load.image('slimeeyes');
    this.load.image('space1');
    this.load.image('space2');
    this.load.image('star');
    this.load.image('yellow');
    this.load.spritesheet('dude', 'dude.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);
    this.createProgressBar();
  },

  create: function () {
    this.createAnims();
    // this.scene.start('default');
    this.scene.start('menu');
  },

  extend: {

    progressBar: null,

    progressBarRectangle: null,

    createAnims: function () {
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
      });

      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
    },

    createProgressBar: function () {
      var main = this.cameras.main;
      this.progressBarRectangle = new Phaser.Geom.Rectangle(0, 0, 0.5 * main.width, 50);
      Phaser.Geom.Rectangle.CenterOn(this.progressBarRectangle, 0.5 * main.width, 0.5 * main.height);
      this.progressBar = this.add.graphics();
    },

    onLoadComplete: function (loader) {
      console.log('onLoadComplete', loader);
      this.progressBar.destroy();
    },

    onLoadProgress: function (progress) {
      var rect = this.progressBarRectangle;
      var color = (this.load.failed.size > 0) ? RED : WHITE;
      this.progressBar
        .clear()
        .fillStyle(GRAY)
        .fillRect(rect.x, rect.y, rect.width, rect.height)
        .fillStyle(color)
        .fillRect(rect.x, rect.y, progress * rect.width, rect.height);
      console.log('progress', progress);
    }

  }

};

});

require.register("scenes/default.js", function(exports, require, module) {
var cursors;
var eyesGroup;
var gameOverText;
var gems;
var glow;
var pineapple;
var platforms;
var player;
var playerIsGlowing;
var playerIsSlimed;
var score;
var scoreText;
var slimes;
var starsEmitter;
var timeStarted;
var timerText;

var GREEN = 0x00ff22;
var SECOND = 1000;
var WHITE = 0xffffff;
var YELLOW = 0xffdd00;

module.exports = {

  key: 'default',

  init: function () {
    playerIsGlowing = false;
    playerIsSlimed = false;
    score = 0;
    timeStarted = null;

    // Force an update of `time.now`
    this.time.update(0, 0);
    timeStarted = this.time.now;
  },

  create: function () {
    this.add.image(400, 300, 'space1')
      .setScrollFactor(0, 0);

    this.add.tileSprite(400, 520, 1620, 176, 'mtn')
      .setScrollFactor(0.5);

    this.add.image(800, -200, 'ship')
      .setScrollFactor(1, 0.25);

    this.createPlatforms();
    this.createPineapple();
    this.createPlayer();
    this.createSlimes();
    this.createGems();
    this.createText();
    this.createGlow();
    this.createParticles();

    this.cameras.main.setBounds(0, -1200, 1600, 1800);
    this.cameras.main.startFollow(player);

    this.physics.add.collider([gems, pineapple, player, slimes], platforms);
    this.physics.add.overlap(player, gems, this.collectGem, this.isPlayerActive, this);
    this.physics.add.overlap(player, pineapple, this.collectPineapple, this.isPlayerActive, this);
    this.physics.add.overlap(player, slimes, this.slimePlayer, this.isPlayerActive, this);

    cursors = this.input.keyboard.createCursorKeys();

    if (this.physics.world.drawDebug) {
      this.input.keyboard.on('keydown_D', this.toggleDebugGraphic, this);
    }

    this.input.keyboard.once('keydown_G', this.startPlayerGlow, this);
    this.input.keyboard.once('keydown_Q', this.quit, this);
    this.input.keyboard.once('keydown_W', this.win, this);
    this.input.keyboard.once('keydown_L', this.lose, this);

    var debugGraphic = this.physics.world.debugGraphic;

    if (debugGraphic) {
      debugGraphic.setVisible(false);
    }
  },

  update: function () {
    this.updatePlayer();
    this.updateGlow();
    slimes.children.iterate(this.updateSlime, this);
    this.updateText();
  },

  extend: {

    checkGems: function () {
      if (gems.countActive(true) === 0) {
        this.win();
      }
    },

    collectGem: function (_player, gem) {
      gem.disableBody(true, true);
      starsEmitter.explode(10);
      score += 1;
      this.updateText();
      this.checkGems();
    },

    collectPineapple: function (_player, _pineapple) {
      _pineapple.disableBody(true, true);
      this.startPlayerGlow();
    },

    createGem: function (gem) {
      gem.body.allowGravity = false;
      gem.body.setSize(28, 28);

      gem
        .setBounce(1, 1)
        .setCollideWorldBounds(true)
        .setVelocity(120 * this.randomSign(), 120 * this.randomSign());
    },

    createGems: function () {
      gems = this.physics.add.group({
        key: 'diamond',
        repeat: 11,
        setXY: { x: 50, y: 0, stepX: 200 }
      });

      gems.children.iterate(this.createGem, this);
    },

    createGlow: function () {
      glow = this.add.image(player.x, player.y, 'yellow')
        .setAlpha(0.4)
        .setBlendMode('ADD')
        .setVisible(false);

      this.tweens.add({
        alpha: 0.6,
        duration: 2000,
        ease: 'Sine.easeInOut',
        loop: -1,
        targets: glow,
        yoyo: true
      });
    },

    createParticles: function () {
      starsEmitter = this.add.particles('star').createEmitter({
        accelerationY: -600,
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: { min: 500, max: 1500 },
        on: false,
        speed: 60
      });

      starsEmitter.startFollow(player);
    },

    createPineapple: function () {
      pineapple = this.physics.add.image(400, 300, 'pineapple')
        .setCollideWorldBounds(true);
    },

    createPlatforms: function () {
      platforms = this.physics.add.staticGroup();

      var between = Phaser.Math.Between;

      platforms.createMultiple([
        {
          key: 'platform',
          repeat: 2,
          setXY: { x: between(0, 400), y: 150, stepX: between(600, 800) }
        },
        {
          key: 'platform',
          repeat: 2,
          setXY: { x: between(-100, 300), y: 300, stepX: between(600, 1000) }
        },
        {
          key: 'platform',
          repeat: 2,
          setXY: { x: between(-200, 200), y: 450, stepX: between(600, 1200) }
        }
      ]);

      platforms.children.iterateLocal('setTint', 0x0000FA);
    },

    createPlayer: function () {
      player = this.physics.add.sprite(800, 600, 'dude');

      player
        .setBounce(0.2)
        .setCollideWorldBounds(true)
        .setDragX(600)
        .setName('player')
      ;

      player.body.maxVelocity.x = 300;
      player.body.setSize(16, 48);
    },

    createSlime: function (slime, i) {
      slime
        .setAlpha(0.75)
        .setBounce(1, 0.2)
        .setCollideWorldBounds(true)
        .setDataEnabled()
        .setData('eyes', eyesGroup.getFirst(false).setActive(true))
        .setData('i', i)
        .setMaxVelocity(60, 600)
        .setName('slime' + i)
        .setVelocity(60 * this.randomSign(), 0);

      slime.body.checkCollision.up = false;
      slime.body.setSize(24, 24);

      // Starts the `startClimb` timer
      this.slimeStopClimb(slime);
    },

    createSlimes: function () {
      slimes = this.physics.add.group({
        key: 'slime',
        repeat: 3,
        setXY: { x: 100, y: 0, stepX: 200 }
      });

      eyesGroup = this.add.group({
        classType: Phaser.GameObjects.Image,
        key: 'slimeeyes',
        repeat: slimes.getLength() - 1
      });

      // This part is awkward.
      // We will distribute eyes in `createSlime`.
      eyesGroup.children.iterateLocal('setActive', false);

      slimes.children.iterate(this.createSlime, this);
    },

    createText: function () {
      timerText = this.add.bitmapText(10, 10, 'smooth', '')
        .setFontSize(32)
        .setScrollFactor(0, 0);

      scoreText = this.add.bitmapText(110, 10, 'sunset', '')
        .setFontSize(32)
        .setScrollFactor(0, 0);

      gameOverText = this.add.bitmapText(400, 300, 'sunset', '')
        .setScrollFactor(0, 0)
        .setVisible(false);

      this.updateText();

      this.add.bitmapText(510, 10, 'smooth', '[Q] QUIT')
        .setAlpha(0.5)
        .setFontSize(32)
        .setScrollFactor(0, 0);
    },

    fadeOutGlow: function () {
      this.tweens.add({
        duration: 1 * SECOND,
        ease: 'Back.ease',
        scaleX: 0,
        scaleY: 0,
        targets: glow
      });
    },

    gameOver: function (msg) {
      gameOverText
        .setText(msg)
        .setOrigin(0.5)
        .setVisible(true);

      this.input.once('pointerup', this.quit, this);
    },

    isOnFloor: function (sprite) {
      return sprite.body.blocked.down || sprite.body.touching.down;
    },

    isPlayerActive: function () {
      return player.active;
    },

    lose: function () {
      this.gameOver('GAME OVER');
    },

    quit: function () {
      this.scene.start('menu');
    },

    randomSign: function () {
      return Math.random() > 0.5 ? 1 : -1;
    },

    secondsElapsed: function () {
      // console.assert(this.time.now < 1e9, '`time.now` is too large');

      return Math.floor((this.time.now - timeStarted) / SECOND);
    },

    shutdown: function () {
      console.log('shutdown');
    },

    slimePlayer: function (_player, slime) {
      if (playerIsGlowing) {
        return;
      }

      playerIsSlimed = true;

      player.anims.play('turn');
      player.body.allowDrag = true;

      player
        .setActive(false)
        .setDrag(1200, 0)
        .setTint(GREEN);

      slime
        .setAccelerationX(0)
        .setDrag(1200, 0)
        .setGravityY(0);

      // FPS
      // this.cameras.main.fade(10 * SECOND, 0.1, 0.8, 0.2);

      this.lose();
    },

    slimeStartClimb: function (slime) {
      if (this.isOnFloor(slime)) {
        slime
          .setAccelerationX(0)
          .setDragX(20)
          .setGravityY(-720);
      }

      this.time.delayedCall(Phaser.Math.Between(1, 2) * SECOND
        , this.slimeStopClimb, [slime], this);
    },

    slimeStopClimb: function (slime) {
      slime
        .setAccelerationX(15)
        .setDragX(0)
        .setGravityY(0);

      this.time.delayedCall(Phaser.Math.Between(3, 17) * SECOND
        , this.slimeStartClimb, [slime], this);
    },

    startPlayerGlow: function () {
      playerIsGlowing = true;

      glow
        .setPosition(player.x, player.y)
        .setScale(1)
        .setVisible(true);

      player.setTint(YELLOW);

      this.time.delayedCall(14 * SECOND, this.fadeOutGlow, null, this);
      this.time.delayedCall(15 * SECOND, this.stopPlayerGlow, null, this);
    },

    stopPlayerGlow: function () {
      playerIsGlowing = false;

      glow.setVisible(false);

      player.setTint(WHITE);
    },

    toggleDebugGraphic: function () {
      var debugGraphic = this.physics.world.debugGraphic;

      if (debugGraphic) {
        debugGraphic.setVisible(!debugGraphic.visible);
      }
    },

    toggleMap: function () {
      // TODO
    },

    updateGlow: function () {
      if (!glow.visible || !player.active) {
        return;
      }

      glow.x = Phaser.Math.Linear(glow.x, player.x, 0.75);
      glow.y = Phaser.Math.Linear(glow.y, player.y, 0.75);
    },

    updatePlayer: function () {
      if (playerIsSlimed) {
        return;
      }

      var onFloor = this.isOnFloor(player);

      player.body.allowDrag = onFloor && (player.body.speed > 0);

      if (onFloor) {
        if (cursors.left.isDown) {
          player.body.velocity.x -= 30;
          player.anims.play('left', true);
        } else if (cursors.right.isDown) {
          player.body.velocity.x += 30;
          player.anims.play('right', true);
        }

        if (cursors.up.isDown) {
          player.setVelocityY(-480);
        }
      }

      if (player.body.speed < 10) {
        player.anims.play('turn');
      }
    },

    updateSlime: function (slime) {
      var eyes = slime.getData('eyes');

      eyes.setPosition(
        Phaser.Math.Linear(slime.x, eyes.x, 0.25),
        Phaser.Math.Linear(slime.y, eyes.y, 0.25)
      );

      var velocity = slime.body.velocity;

      slime.scaleX = Phaser.Math.Linear(
        slime.scaleX,
        1 / (0.75 + Math.abs(velocity.y / 600)),
        0.5
      );

      if (this.isOnFloor(slime)) {
        if (playerIsGlowing) {
          slime.setAccelerationX(
            15 * Phaser.Math.Clamp(slime.x - player.x, -1, 1)
          );
        } else if (Phaser.Math.Within(velocity.x, 0, 60)) {
          slime.setAccelerationX(
            15 * Phaser.Math.Clamp(velocity.x, -1, 1)
          );
        }
      }
    },

    updateText: function () {
      scoreText.setText('*'.repeat(score));
      timerText.setText(String(this.secondsElapsed())); // 8ae34932965631f8c101a0102f3767d104fac260
    },

    win: function () {
      player.anims.play('turn');
      player.body.checkCollision.none = true;

      player
        .setAccelerationX(Phaser.Math.Clamp((800 - player.x), -600, 600))
        .setAccelerationY(-1200)
        .setCollideWorldBounds(false)
        .setDrag(600, 0);

      // After `explode`, `frequency` (-1) must be reset (0)
      starsEmitter
        .setFrequency(0, 1)
        .start(); // `flow(0, 1)` would also work.

      var elapsed = this.secondsElapsed();

      this.registry.set('lastTime', elapsed);

      // You would need to suspend/resume the state to save these?
      // if (elapsed < (this.registry.get('bestTime')) || Infinity) {
      //   this.registry.set('bestTime', elapsed);
      // }

      this.gameOver('HOORAY');
    }
  }

};

});

require.register("scenes/menu.js", function(exports, require, module) {
module.exports = {

  key: 'menu',

  create: function () {
    this.add.image(400, 300, 'space2');

    this.add.bitmapText(400, 200, 'sunset', 'KRISTAL\n QUEST')
      .setOrigin(0.5);

    this.add.bitmapText(400, 400, 'smooth', 'START')
      .setOrigin(0.25, 0.25)
      .setFontSize(32);

    var lastTime = this.scene.manager.getScene('default')
      .registry.get('lastTime');

    if (lastTime) {
      this.add.bitmapText(400, 500, 'sunset', 'Last Time: ' + lastTime)
        .setOrigin(0.125, 0.125)
        .setFontSize(16);
    }

    this.input.once('pointerup', this.start, this);

    this.input.keyboard.once('keydown_space', this.start, this);
  },

  extend: {

    start: function () {
      this.scene.start('default');
    }

  }


};

});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

require('initialize');
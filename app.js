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
  version: '0.0.3',
  banner: {
    background: ['#eb4149', '#ebba16', '#42af5c', '#2682b1', '#28434d']
  },
  // pixelArt: true,
  clearBeforeRender: false,
  loader: {
    path: 'assets/',
    maxParallelDownloads: 6
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
      y: -200
    }
  },
  scene: [
    require('scenes/boot'),
    require('scenes/default'),
    require('scenes/menu')
  ]

});

});

require.register("scenes/boot.js", function(exports, require, module) {
var GRAY = 0x222222;
var RED = 0xff2200;
var WHITE = 0xffffff;

module.exports = {

  key: 'boot',

  preload: function () {
    console.debug(this.scene.key, 'preload');
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
    console.debug(this.scene.key, 'create');
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

    onLoadComplete: function () {
      this.progressBar.destroy();
    },

    onLoadProgress: function (progress) {
      // console.debug('progress', progress);
      var rect = this.progressBarRectangle;
      var color = (this.load.failed.size > 0) ? RED : WHITE;
      this.progressBar
        .clear()
        .fillStyle(GRAY)
        .fillRect(rect.x, rect.y, rect.width, rect.height)
        .fillStyle(color)
        .fillRect(rect.x, rect.y, progress * rect.width, rect.height);
    }

  }

};

});

require.register("scenes/default.js", function(exports, require, module) {
var BLUE = 0x0000fa;

var GREEN = 0x00ff00;

var SECOND = 1000;

var SILVER = 0xcccccc;

var YELLOW = 0xffff00;

module.exports = {

  key: 'default',

  init: function (data) {
    var canvas = this.sys.game.canvas;

    this.level = data.level || 1;
    this.playerIsGlowing = false;
    this.playerIsSlimed = false;
    this.requestFullscreen = canvas.mozRequestFullScreen || canvas.webkitRequestFullscreen || canvas.requestFullscreen;
    this.score = 0;
    this.timeStarted = null;

    // Force an update of `time.now`
    this.time.update(0, 0);
    this.timeStarted = this.time.now;

    this.events.once('shutdown', this.onShutdown, this);

    console.debug(this.scene.key, 'init', data);
    console.debug('level', this.level);
    console.debug('this.timeStarted', this.timeStarted);
  },

  create: function () {
    console.debug(this.scene.key, 'create');

    this.add.image(400, 300, 'space1')
      .setScrollFactor(0, 0);

    this.add.image(800, -200, 'ship')
      .setScrollFactor(0.25, 0.25);

    this.mtn = this.add.tileSprite(400, 520, 800, 176, 'mtn')
      .setScrollFactor(0, 0.5);

    var levelMod = this.level % 10;
    var platformsCount = Phaser.Math.Clamp(10 - levelMod, 1, 9);
    var slimesCount = Phaser.Math.Clamp(levelMod, 1, 10);

    console.debug('levelMod', levelMod);
    console.debug('platformsCount', platformsCount);
    console.debug('this.slimesCount', this.slimesCount);

    this.createPlatforms(platformsCount);
    this.createPineapple();
    this.createPlayer();
    this.createSlimes(slimesCount);
    this.createGems();
    this.createText();
    this.createGlow();
    this.createParticles();

    this.cameras.main.setBounds(0, -1200, 1600, 1800);
    this.cameras.main.startFollow(this.player);

    this.physics.add.collider([this.gems, this.pineapple, this.player, this.slimes], this.platforms);
    this.physics.add.overlap(this.player, this.gems, this.collectGem, this.isPlayerActive, this);
    this.physics.add.overlap(this.player, this.pineapple, this.collectPineapple, this.isPlayerActive, this);
    this.physics.add.overlap(this.player, this.slimes, this.slimePlayer, this.isPlayerActive, this);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard.on('keydown_F', this.startFullscreen, this);
    this.input.keyboard.once('keydown_Q', this.quit, this);

    this.input.keyboard.once('keydown_N', function () {
      this.scene.manager.stop('default');
      this.scene.manager.start('default', { level: 1 + this.level });
    }, this);

    var debugGraphic = this.physics.world.debugGraphic;

    if (debugGraphic) {
      debugGraphic.setVisible(false);
      this.input.keyboard.on('keydown_D', this.toggleDebugGraphic, this);
    }
  },

  update: function () {
    this.updateBackground();
    this.updatePlayer();
    this.updateGlow();
    this.slimes.children.iterate(this.updateSlime, this);
    this.updateText();
  },

  extend: {

    cursors: null,

    eyesGroup: null,

    gameOverText: null,

    gems: null,

    glow: null,

    level: null,

    mtn: null,

    pineapple: null,

    platforms: null,

    player: null,

    playerIsGlowing: null,

    playerIsSlimed: null,

    quitText: null,

    requestFullscreen: null,

    score: null,

    scoreText: null,

    slimes: null,

    starsEmitter: null,

    timeStarted: null,

    timerText: null,

    checkGems: function () {
      if (this.gems.countActive(true) === 0) {
        this.win();
      }
    },

    cleanGameObject: function (obj) {
      if (obj.eyes) { obj.eyes = null; }
      if (obj.target) { obj.target = null; }
    },

    collectGem: function (player, gem) {
      gem.disableBody(true, true);
      this.starsEmitter.explode(10);
      this.score += 1;
      this.updateText();
      this.checkGems();
    },

    collectPineapple: function (player, pineapple) {
      pineapple.disableBody(true, true);
      this.startPlayerGlow();
    },

    createGem: function (gem, i) {
      gem.body.allowGravity = false;
      gem.body.setSize(28, 28);

      Phaser.Geom.Rectangle.Random(this.physics.world.bounds, gem);

      gem
        .setBounce(1, 1)
        .setCollideWorldBounds(true)
        .setName('gem' + i)
        .setVelocity(120 * this.randomSign(), 120 * this.randomSign());
    },

    createGems: function () {
      this.gems = this.physics.add.group({
        key: 'diamond',
        repeat: 11
      });

      this.gems.children.iterate(this.createGem, this);
    },

    createGlow: function () {
      this.glow = this.add.image(this.player.x, this.player.y, 'yellow')
        .setAlpha(0.4)
        .setBlendMode('ADD')
        .setVisible(false);

      // Probably this should be paused while the glow is invisible.
      this.tweens.add({
        alpha: 0.6,
        duration: 2000,
        ease: 'Sine.easeInOut',
        loop: -1,
        targets: this.glow,
        yoyo: true
      });
    },

    createParticles: function () {
      this.starsEmitter = this.add.particles('star').createEmitter({
        accelerationY: -600,
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: { min: 500, max: 1500 },
        on: false,
        speed: 60
      });

      this.starsEmitter.startFollow(this.player);
    },

    createPineapple: function () {
      this.pineapple = this.physics.add.image(0, 0, 'pineapple')
        .setCollideWorldBounds(true);

      Phaser.Geom.Rectangle.Random(this.physics.world.bounds, this.pineapple);
    },

    createPlatforms: function (count) {
      this.platforms = this.physics.add.staticGroup({
        key: 'platform',
        repeat: count - 1
      });

      Phaser.Actions.GridAlign(this.platforms.getChildren(), {
        width: 3,
        height: 3,
        cellWidth: 600,
        cellHeight: -160, // bottom to top
        position: 6, // CENTER?
        x: 200,
        y: 425
      });

      this.platforms.children.iterate(function (platform, i) {
        // platform.x += 100 * between(-2, 2);
        platform.x += 200 * ((i * count) % 2);
        // platform.y += 16 * between(-1, 1);
        platform.y += 32 * ((i * count) % 3);
        platform
          .refreshBody() // Because we moved a static body after creation
          .setTint(BLUE);
      });
    },

    createPlayer: function () {
      this.player = this.physics.add.sprite(800, 600, 'dude');

      this.player
        .setBounce(0.2)
        .setCollideWorldBounds(true)
        .setDragX(600)
        .setMaxVelocity(300, 1200)
        .setName('player');

      this.player.body.setSize(16, 48);
    },

    createSlime: function (slime, eyes, i) {
      slime
        .setAlpha(0.75)
        .setBounce(1, 0.2)
        .setCollideWorldBounds(true)
        .setDataEnabled()
        .setData('eyes', eyes)
        .setData('i', i)
        .setMaxVelocity(60 * Math.ceil(this.level / 9), 600)
        .setName('slime' + i)
        .setVelocity(60 * this.randomSign(), 0);

      slime.body.checkCollision.up = false;
      slime.body.setSize(24, 24);

      // Starts the `startClimb` timer
      this.slimeStopClimb(slime);
    },

    createSlimes: function (count) {
      this.slimes = this.physics.add.group({
        key: 'slime',
        repeat: count - 1,
        setXY: { x: 100, y: 0, stepX: 200 }
      });

      this.eyesGroup = this.add.group({
        classType: Phaser.GameObjects.Image,
        key: 'slimeeyes',
        repeat: count - 1
      });

      var eyes = this.eyesGroup.getChildren();

      this.slimes.children.iterate(function (slime, i) {
        this.createSlime(slime, eyes[i], i);
      }, this);
    },

    createText: function () {
      this.timerText = this.add.bitmapText(0, 5, 'smooth', '9999')
        .setFontSize(32)
        .setScrollFactor(0, 0);

      this.scoreText = this.add.bitmapText(125, 5, 'sunset', '')
        .setFontSize(32)
        .setScrollFactor(0, 0);

      this.gameOverText = this.add.bitmapText(400, 300, 'sunset', '')
        .setScrollFactor(0, 0)
        .setVisible(false);

      this.quitText = this.add.bitmapText(400, 450, 'smooth', '[Q] Quit')
        .setFontSize(32)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0, 0)
        .setTint(SILVER)
        .setVisible(false);

      this.add.bitmapText(525, 5, 'smooth', 'LEVEL ' + this.level)
        .setFontSize(32)
        .setScrollFactor(0, 0)
        .setTint(SILVER);

      this.updateText();
    },

    fadeOutGlow: function () {
      this.tweens.add({
        duration: 1 * SECOND,
        ease: 'Back.easeIn',
        scaleX: 0,
        scaleY: 0,
        targets: this.glow
      });
    },

    gameOver: function (msg) {
      this.gameOverText
        .setText(msg)
        .setOrigin(0.5) // must be after `setText`
        .setVisible(true);

      this.quitText.setVisible(true);

      this.scoreText.setActive(false);
      this.timerText.setActive(false);

      this.input.once('pointerup', this.quit, this);
    },

    hideGroup: function (group) {
      Phaser.Actions.SetVisible(group.getChildren(), false);
    },

    isOnFloor: function (sprite) {
      return sprite.body.blocked.down || sprite.body.touching.down;
    },

    isOnWall: function (sprite) {
      return sprite.body.touching.left || sprite.body.touching.right;
    },

    // Filter for some of the physics colliders
    isPlayerActive: function () {
      return this.player.active;
    },

    lose: function () {
      this.gameOver('GAME OVER'); // :(
    },

    onShutdown: function () {
      console.debug(this.scene.key, 'onShutdown');
      this.input.keyboard.removeAllListeners();
      this.physics.world.colliders.destroy();
    },

    quit: function () {
      this.scene.start('menu');
    },

    randomSign: function () {
      return Phaser.Math.RND.sign();
    },

    savePlayerProgress: function () {
      var elapsed = this.secondsElapsed();
      var registry = this.sys.game.registry;

      console.debug('elapsed', elapsed);

      registry.set('lastTime', elapsed);
      registry.set('levelCompleted', this.level);

      var bestTime = registry.get('bestTime');

      console.debug('bestTime', bestTime);

      if (elapsed < (bestTime || Infinity)) {
        registry.set('bestTime', elapsed);
      }

      console.debug('bestTime', registry.get('bestTime'));
    },

    secondsElapsed: function () {
      // console.assert(this.time.now < 1e9, '`time.now` is too large');

      return Math.floor((this.time.now - this.timeStarted) / SECOND);
    },

    showGroup: function (group) {
      Phaser.Actions.SetVisible(group.getChildren(), true);
    },

    slimePlayer: function (player, slime) {
      if (this.playerIsGlowing) {
        return;
      }

      this.playerIsSlimed = true;

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
          .setDragX(30)
          .setGravityY(-720);
      }

      this.time.delayedCall(Phaser.Math.Between(1, 2.5) * SECOND
        , this.slimeStopClimb, [slime], this);
    },

    slimeStopClimb: function (slime) {
      slime
        .setDragX(0)
        .setGravityY(0);

      this.time.delayedCall(Phaser.Math.Between(3, 17) * SECOND
        , this.slimeStartClimb, [slime], this);
    },

    startFullscreen: function () {
      if (!(document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled)) {
        console.warn('Fullscreen is unavailable here.');
        return;
      }

      if (document.fullscreenElement) {
        return;
      }

      this.requestFullscreen.call(this.sys.game.canvas);
    },

    startPlayerGlow: function () {
      this.playerIsGlowing = true;

      this.glow
        .setPosition(this.player.x, this.player.y)
        .setScale(1)
        .setVisible(true);

      this.player.setTint(YELLOW);

      this.time.delayedCall(9 * SECOND, this.fadeOutGlow, null, this);
      this.time.delayedCall(10 * SECOND, this.stopPlayerGlow, null, this);
    },

    stopPlayerGlow: function () {
      this.playerIsGlowing = false;
      this.glow.setVisible(false);
      this.player.clearTint();
      this.player.body.checkCollision.up = true;
    },

    toggleDebugGraphic: function () {
      var debugGraphic = this.physics.world.debugGraphic;

      if (debugGraphic) {
        debugGraphic.setVisible(!debugGraphic.visible);
        console.debug('toggleDebugGraphic', debugGraphic.visible);
      }
    },

    toggleMap: function () {
      // TODO
    },

    updateBackground: function () {
      var main = this.cameras.main;
      this.mtn.tilePositionX = 0.5 * main.scrollX;
    },

    updateGlow: function () {
      if (!this.glow.visible || !this.player.active) {
        return;
      }

      this.glow.x = Phaser.Math.Linear(this.glow.x, this.player.x, 0.75);
      this.glow.y = Phaser.Math.Linear(this.glow.y, this.player.y, 0.75);
    },

    updatePlayer: function () {
      if (this.playerIsSlimed) {
        return;
      }

      var onFloor = this.isOnFloor(this.player);

      this.player.body.allowDrag = onFloor;

      if (onFloor) {
        if (this.cursors.left.isDown) {
          this.player.body.velocity.x -= 30;
          this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
          this.player.body.velocity.x += 30;
          this.player.anims.play('right', true);
        }

        if (this.cursors.up.isDown) {
          this.player.setVelocityY(-480);
        }

        if (this.player.body.speed < 10) {
          this.player.anims.play('turn');
        }
      }
    },

    updateSlime: function (slime) {
      var eyes = slime.getData('eyes');
      var linear = Phaser.Math.Linear;

      eyes.setPosition(
        linear(slime.x, eyes.x, 0.25),
        linear(slime.y, eyes.y, 0.5)
      );

      var maxVelocity = slime.body.maxVelocity;
      var velocity = slime.body.velocity;
      var absVelocityX = Math.abs(velocity.x);
      var absVelocityY = Math.abs(velocity.y);
      var accel = maxVelocity / 5;

      slime.scaleX = linear(slime.scaleX, 1 / (0.75 + absVelocityY / 600), 0.5);

      if (this.playerIsSlimed) {
        return;
      }

      if (this.isOnFloor(slime)) {
        if (this.playerIsGlowing) {
          slime.setAccelerationX(
            2 * accel * Phaser.Math.Clamp(slime.x - this.player.x, -1, 1)
          );
        } else if (absVelocityX < maxVelocity.x) {
          slime.setAccelerationX(
            1 * accel * Phaser.Math.Clamp((velocity.x || this.randomSign()), -1, 1)
          );
        } else {
          slime.setAccelerationX(0);
        }
      }
    },

    updateText: function () {
      if (this.scoreText.active) {
        this.scoreText.setText('*'.repeat(this.score));
      }

      if (this.timerText.active) {
        this.timerText.setText(this.secondsElapsed());
      }
    },

    win: function () {
      this.player.anims.play('turn');
      this.player.body.checkCollision.none = true;

      this.player
        .setAccelerationX(Phaser.Math.Clamp((this.physics.world.bounds.centerX - this.player.x), -600, 600))
        .setAccelerationY(-1200)
        .setCollideWorldBounds(false)
        .setDrag(600, 0);

      // After `explode`, `frequency` (-1) must be reset to 0 (or larger)
      this.starsEmitter
        .setFrequency(0, 1)
        .start(); // `flow(0, 1)` would also work.

      this.savePlayerProgress();

      this.gameOver('HOORAY'); // :D
    }
  }

};

});

require.register("scenes/menu.js", function(exports, require, module) {
module.exports = {

  key: 'menu',

  create: function () {
    console.debug(this.scene.key, 'create');

    this.add.image(400, 300, 'space2');

    this.add.bitmapText(400, 200, 'sunset', 'KRISTAL\n QUEST')
      .setOrigin(0.5);

    this.add.bitmapText(400, 400, 'smooth', 'START')
      .setOrigin(0.25, 0.25)
      .setFontSize(32);

    var registry = this.sys.game.registry;
    var bestTime = registry.get('bestTime');
    var lastTime = registry.get('lastTime');

    this.level = 1 + (registry.get('levelCompleted') || 0);

    this.caption = this.add.bitmapText(400, 550, 'smooth',
      [
        ('Level: ' + this.level),
        (lastTime ? ('Last Time: ' + lastTime) : ''),
        (bestTime ? ('Best Time: ' + bestTime) : '')
      ].filter(Boolean).join('  '))
      .setOrigin(0.125, 0.125)
      .setFontSize(16);

    this.input.once('pointerup', this.start, this);

    this.input.keyboard.once('keydown_S', this.start, this);
    this.input.keyboard.once('keydown_SPACE', this.start, this);
  },

  extend: {

    caption: null,

    level: null,

    start: function () {
      this.scene.start('default', { level: this.level });
    }

  }

};

});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

require('initialize');
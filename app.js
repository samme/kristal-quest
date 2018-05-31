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
require.register("data/colors.js", function(exports, require, module) {
module.exports = Object.freeze({

  BLUE:   0x0000fa,
  GRAY:   0x222222,
  GREEN:  0x00ff00,
  RED:    0xff0000,
  SILVER: 0xcccccc,
  YELLOW: 0xffff00

});

});

require.register("initialize.js", function(exports, require, module) {
window.game = new Phaser.Game({

  width: 800,
  height: 600,
  type: Phaser.AUTO,
  title: '💎 Kristal Quest',
  url: 'https://github.com/samme/kristal-quest',
  version: '0.0.8',
  audio: { noAudio: true },
  banner: {
    background: ['#eb4149', '#ebba16', '#42af5c', '#2682b1', '#28434d']
  },
  // pixelArt: true,
  clearBeforeRender: false,
  plugins: {
    global: [
      { key: 'SceneWatcher', plugin: require('plugins/sceneWatcher'), start: true }
    ]
  },
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
  callbacks: {
    postBoot: function (game) {
      console.debug('game.config', game.config);
      game.scene.dump();
      console.log('plugins.getDefaultScenePlugins()', game.plugins.getDefaultScenePlugins());
      game.plugins.get('SceneWatcher').watch();
    }
  },
  scene: [
    require('scenes/boot'),
    require('scenes/default'),
    require('scenes/menu'),
    require('scenes/end')
  ]

});

});

require.register("plugins/sceneWatcher.js", function(exports, require, module) {
var Pad = Phaser.Utils.String.Pad;
var ICON_DEFAULT = ' ';
var ICON_PAUSED = '.';
var ICON_RUNNING = '*';
var ICON_SLEEPING = '-';
var NEWLINE = '\n';
var PAD_LEFT = 2;
var PAD_RIGHT = 1;
var EVENTS = [ 'boot', 'pause', 'resume', 'sleep', 'wake', 'start', 'ready', 'shutdown', 'destroy' ];
var SPACE = ' ';
var STATES = [ 'pending', 'init', 'start', 'loading', 'creating', 'running', 'paused', 'sleeping', 'shutdown', 'destroyed' ];
var VIEW_STYLE = {
  position: 'absolute',
  left: '0',
  top: '0',
  margin: '0',
  padding: '0',
  width: '20em',
  fontSize: '16px',
  lineHeight: '20px',
  backgroundColor: 'rgba(0,0,0,0.875)',
  color: 'white',
  pointerEvents: 'none'
};
var out = [];

var getIcon = function (scene) {
  switch (scene.sys.settings.status) {
  case Phaser.Scenes.RUNNING:
    return ICON_RUNNING;
  case Phaser.Scenes.SLEEPING:
    return ICON_SLEEPING;
  case Phaser.Scenes.PAUSED:
    return ICON_PAUSED;
  default:
    return ICON_DEFAULT;
  }
};

var getActiveIcon = function (scene) {
  return scene.sys.scenePlugin.isActive() ? '+' : ' ';
};

var getVisibleIcon = function (scene) {
  return scene.sys.scenePlugin.isVisible() ? '+' : ' ';
};

module.exports = new Phaser.Class({

  Extends: Phaser.Plugins.BasePlugin,

  eventHandlers: {},

  init: function () {
    this.view = document.createElement('pre');
    Object.assign(this.view.style, VIEW_STYLE);
    this.game.canvas.parentNode.append(this.view);

    EVENTS.forEach(function (eventName) {
      this.eventHandlers[eventName] = function (sys) {
        console.log(eventName, sys.settings.key);
      };
    }, this);
  },

  start: function () {
    this.game.events.on('poststep', this.postStep, this);
  },

  stop: function () {
    this.game.events.off('poststep', this.postStep, this);
  },

  destroy: function () {
    this.view.parentNode.remove(this.view);
    delete this.view;
    Phaser.Plugins.BasePlugin.call(this);
  },

  postStep: function () {
    this.view.textContent = this.getOutput();
  },

  getOutput: function () {
    return this.game.scene.scenes.map(this.getSceneOutput, this).join(NEWLINE);
    // var scenes = this.game.scene.scenes;

    // out.length = 0;

    // for (var i = 0, len = scenes.length; i < len; i++) {
    //   out[i] = this.getSceneOutput(scenes[i]);
    // }

    // return out.join(NEWLINE);
  },

  getSceneOutput: function (scene) {
    var settings = scene.sys.settings;

    return Pad(settings.key.substr(0, 12), 12, SPACE, PAD_RIGHT) + SPACE +
      getIcon(scene) + SPACE +
      // getActiveIcon(scene) + SPACE +
      // getVisibleIcon(scene) + SPACE +
      Pad(STATES[settings.status] || '?', 8, SPACE, PAD_LEFT) +
      Pad(scene.sys.updateList._list.length, 4, SPACE, PAD_RIGHT) +
      Pad(scene.sys.displayList.length, 4, SPACE, PAD_RIGHT);
  },

  watch: function () {
    this.game.scene.scenes.forEach(this.watchScene, this);
  },

  watchScene: function (scene) {
    var events = scene.events;

    for (var eventName in this.eventHandlers) {
      events.on(eventName, this.eventHandlers[eventName], this);
    }
  }

});

});

require.register("scenes/boot.js", function(exports, require, module) {
var GRAY = 0x222222;
var RED = 0xff2200;
var WHITE = 0xffffff;

module.exports = {

  key: 'boot',

  plugins: ['DataManagerPlugin', 'Loader'],

  init: function (data) {
    // console.debug('init', this.scene.key);
    //
    var registry = this.sys.game.registry;

    registry.set('levelCompleted', 0);

    this.events.once('shutdown', this.shutdown, this);
  },

  preload: function () {
    this.load.bitmapFont('smooth', 'atari-smooth.png', 'atari-smooth.xml');
    this.load.bitmapFont('sunset', 'atari-sunset.png', 'atari-sunset.xml');
    this.load.image([
      'diamond',
      'mtn',
      'platform',
      'ship',
      'slime',
      'slimeeyes',
      'space1',
      'space2',
      'star',
      'yellow'
    ]);
    this.load.spritesheet('dude', 'dude.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('fruit', 'fruit.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);
    this.createProgressBar();
  },

  create: function () {
    this.createAnims();
    this.scene.get('playOver').addListeners();
    this.scene.start('menu').remove();
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

    onLoadComplete: function (loader, totalComplete, totalFailed) {
      console.debug('complete', totalComplete);
      console.debug('failed', totalFailed);
    },

    onLoadProgress: function (progress) {
      // console.debug('progress', progress);
      var rect = this.progressBarRectangle;
      var color = (this.load.totalFailed > 0) ? RED : WHITE;
      this.progressBar
        .clear()
        .fillStyle(GRAY)
        .fillRect(rect.x, rect.y, rect.width, rect.height)
        .fillStyle(color)
        .fillRect(rect.x, rect.y, progress * rect.width, rect.height);
    },

    shutdown: function () {
      console.debug(this.scene.key, 'shutdown');
    }

  }

};

});

require.register("scenes/default.js", function(exports, require, module) {
var BLUE = 0x0000fa;
var GREEN = 0x00ff00;
var RED = 0xff0000;
var RND = Phaser.Math.RND;
var SECOND = 1000;
var YELLOW = 0xffff00;

module.exports = {

  key: 'play',

  plugins: ['Clock', 'DataManagerPlugin', 'InputPlugin', 'TweenManager'],

  init: function (data) {
    this.level = data.level || 1;
    this.playerIsGlowing = false;
    this.playerIsSlimed = false;
    this.score = 0;
    this.timeStarted = this.time.now;

    if (this.timeStarted > 1e9) {
      console.warn('time.now is too large', this.time.now);
      this.time.update(0, 0);
      this.timeStarted = this.time.now;
      console.warn('time.now was reset', this.time.now);
    }

    this.events.once('shutdown', this.shutdown, this);
  },

  create: function () {
    this.add.image(400, 300, 'space1')
      .setName('outerSpace')
      .setScrollFactor(0, 0);

    this.add.image(800, -200, 'ship')
      .setName('ship')
      .setScrollFactor(0.25, 0.25);

    this.mtn = this.add.tileSprite(400, 520, 800, 172, 'mtn')
      .setName('mountains')
      .setScrollFactor(0, 0.5);
    this.mtn.tilePositionY = 4; // Avoid bleed at the top edge

    var platformsCount = 9;
    var slimesCount = Phaser.Math.Snap.Ceil(this.level / 4, 2); // 2 to 26, by 2

    // console.debug('platformsCount', platformsCount);
    // console.debug('slimesCount', slimesCount);

    this.createPlatforms(platformsCount);
    this.createPineapple();
    this.createPlayer();
    this.createSlimes(slimesCount);
    this.createGems(this.gemsTotal);
    this.createText();
    this.createGlow();
    this.createParticles();

    this.cameras.main
      .setBounds(0, -1200, 1600, 1800)
      .startFollow(this.player);

    this.physics.add.collider(this.platforms, [this.gems, this.pineapple, this.player, this.slimes]);
    this.physics.add.overlap(this.player, this.gems, this.collectGem, this.isPlayerActive, this);
    this.physics.add.overlap(this.player, this.pineapple, this.collectPineapple, this.isPlayerActive, this);
    this.physics.add.overlap(this.player, this.slimes, this.collidePlayerVsSlime, this.isPlayerActive, this);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard.once('keydown_Q', this.quit, this);
    this.input.keyboard.once('keydown_N', this.nextLevel, this);
    this.input.keyboard.once('keydown_R', this.restartLevel, this);
    this.input.keyboard.once('keydown_L', this.lose, this);
    this.input.keyboard.once('keydown_W', this.win, this);

    var debugGraphic = this.physics.world.debugGraphic;

    if (debugGraphic) {
      // Seems to be lost after state restart
      debugGraphic.setVisible(false);
      this.input.keyboard.on('keydown_D', this.toggleDebugGraphic, this);
    }

    if (!this.sys.game.device.browser.safari) {
      console.table(this.sys.displayList.list, ['name', 'x', 'y', 'visible']);
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

    cherry: null,
    cursors: null,
    eyesGroup: null,
    gems: null,
    gemsTotal: 6,
    glow: null,
    glowTween: null,
    level: null,
    map: null,
    mtn: null,
    pineapple: null,
    platforms: null,
    player: null,
    playerIsGlowing: null,
    playerIsSlimed: null,
    score: null,
    scoreText: null,
    slimes: null,
    starsBurst: null,
    starsFlow: null,
    timeStarted: null,
    timerText: null,

    calcPlayerJumpVelocity: function (player) {
      return -300 * (1 + (Math.abs(player.body.velocity.x) / player.body.maxVelocity.x));
      // return -300 * (1 + (Math.pow(player.body.velocity.x / player.body.maxVelocity.x, 2)));
    },

    calcSlimeAccelerationX: function (slime) {
      var maxVelocity = slime.body.maxVelocity;
      var velocity = slime.body.velocity;

      if (this.playerIsGlowing) {
        return 0.4 * maxVelocity.x * Phaser.Math.Clamp(slime.x - this.player.x, -1, 1);
      } else if (Math.abs(velocity.x) < maxVelocity.x) {
        return 0.2 * maxVelocity.x * Phaser.Math.Clamp((velocity.x || RND.sign()), -1, 1);
      } else {
        return 0;
      }
    },

    calcSlimeInitialVelocity: function () {
      return 60 * RND.sign();
    },

    calcSlimeScaleX: function (slime) {
      return Phaser.Math.Linear(
        slime.scaleX,
        1 / (0.75 + Math.abs(slime.body.velocity.y) / 600),
        0.5
      );
    },

    checkGems: function () {
      if (this.gems.countActive(true) === 0) {
        this.win();
      }
    },

    collectGem: function (player, gem) {
      gem.disableBody(true, true);
      this.starsBurst.explode();
      this.score += 1;
      this.updateText();
      this.checkGems();
    },

    collectPineapple: function (player, pineapple) {
      pineapple.disableBody(true, true);
      this.startPlayerGlow();
    },

    collidePlayerVsSlime: function (player, slime) {
      if (this.playerIsGlowing || !this.isOnFloor(slime)) {
        return;
      }

      this.slimePlayer(player, slime);
    },

    createCherry: function () {
      this.cherry = this.physics.add.image(0, 0, 'fruit', 0)
        .setCollideWorldBounds(true);

      Phaser.Geom.Rectangle.Random(this.physics.world.bounds, this.cherry);
    },

    createGem: function (gem, i) {
      gem.body.allowGravity = false;
      gem.body.setSize(28, 28);

      Phaser.Geom.Rectangle.Random(this.physics.world.bounds, gem);

      gem
        .setName('gem' + i)
        .setVelocity(120 * RND.sign(), 120 * RND.sign());
    },

    createGems: function (count) {
      this.gems = this.physics.add.group({
        key: 'diamond',
        frameQuantity: count,
        bounceX: 1,
        bounceY: 1,
        collideWorldBounds: true
      });

      this.gems.children.iterate(this.createGem, this);
    },

    createGlow: function () {
      this.glow = this.add.image(this.player.x, this.player.y, 'yellow')
        .setAlpha(0.4)
        .setBlendMode('ADD')
        .setName('glow')
        .setVisible(false);

      // Probably this should be paused while the glow is invisible.
      this.glowTween = this.tweens.add({
        alpha: 0.6,
        duration: 2000,
        ease: 'Sine.easeInOut',
        loop: -1,
        targets: this.glow,
        yoyo: true
      });
    },

    createParticles: function () {
      var stars = this.add.particles('star');

      this.starsBurst = stars.createEmitter({
        accelerationY: -600,
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        follow: this.player,
        lifespan: SECOND,
        maxParticles: 30,
        name: 'starsBurst',
        on: false,
        quantity: 10,
        speed: { min: 30, max: 90 }
      });

      this.starsFlow = stars.createEmitter({
        accelerationY: -600,
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        follow: this.player,
        lifespan: SECOND,
        maxParticles: 60,
        name: 'starsFlow',
        on: false,
        speed: { min: 30, max: 90 }
      });

    },

    createPineapple: function () {
      this.pineapple = this.physics.add.image(0, 0, 'fruit', 10)
        .setCollideWorldBounds(true)
        .setName('pineapple');

      this.pineapple.body.setSize(8, 32);

      Phaser.Geom.Rectangle.Random(this.physics.world.bounds, this.pineapple);
    },

    createPlatforms: function (count) {
      this.platforms = this.physics.add.staticGroup({
        key: 'platform',
        frameQuantity: count
      });

      Phaser.Actions.GridAlign(this.platforms.getChildren(), {
        width: 3,
        height: 3,
        cellWidth: 600,
        cellHeight: -160, // bottom to top
        position: Phaser.Display.Align.CENTER,
        x: 200,
        y: 425
      });

      this.platforms.children.iterate(function (platform, i) {
        platform.x += 50 * ((i * this.level) % 16);
        platform.y += 32 * ((i * this.level) % 3);
        platform
          .refreshBody()
          .setName('platform' + i)
          .setTint(BLUE);
      }, this);
    },

    createPlayer: function () {
      this.player = this.physics.add.sprite(800, 600, 'dude');

      this.player
        .setBounce(0.2, 0.1)
        .setCollideWorldBounds(true)
        .setDragX(1200)
        .setMaxVelocity(300, 1200)
        .setName('player');

      this.player.body
        .setSize(16, 32)
        .setOffset(8, 16);
    },

    createSlime: function (slime, eyes, i) {
      slime
        .setAlpha(0.75)
        .setDataEnabled()
        .setData('eyes', eyes)
        .setData('i', i)
        .setMaxVelocity(60, 600)
        .setName('slime' + i)
        .setVelocity(this.calcSlimeInitialVelocity(), 0);

      slime.body.checkCollision.up = false;
      slime.body.setSize(24, 24);

      // Starts the `startClimb` timer
      this.slimeStopClimb(slime);
    },

    createSlimes: function (count) {
      this.slimes = this.physics.add.group({
        key: 'slime',
        frameQuantity: count,
        setXY: { x: 100, y: 0, stepX: 200 },
        bounceX: 1,
        bounceY: 0.2,
        collideWorldBounds: true
      });

      this.eyesGroup = this.add.group({
        classType: Phaser.GameObjects.Image,
        key: 'slimeeyes',
        frameQuantity: count
      });

      var eyes = this.eyesGroup.getChildren();

      this.slimes.children.iterate(function (slime, i) {
        this.createSlime(slime, eyes[i], i);
      }, this);
    },

    createText: function () {
      this.timerText = this.add.bitmapText(224, 0, 'smooth')
        .setFontSize(32)
        .setName('timerText')
        .setScrollFactor(0, 0);

      this.scoreText = this.add.bitmapText(0, 0, 'sunset')
        .setFontSize(32)
        .setName('scoreText')
        .setScrollFactor(0, 0);

      this.add.bitmapText(512, 0, 'smooth', 'Level ' + Phaser.Utils.String.Pad(this.level, 2, '0', 1))
        .setFontSize(32)
        .setName('levelText')
        .setScrollFactor(0, 0);

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

    gameOver: function (eventName) {
      console.debug('gameOver');

      this.scoreText.setActive(false);
      this.timerText.setActive(false);

      if (!this.scene.isActive('playOver') && !this.scene.isSleeping('playOver')) {
        this.scene.launch('playOver');
      }

      this.events.emit('gameover');

      if (eventName) {
        this.events.emit(eventName);
      }
    },

    isOnFloor: function (sprite) {
      return sprite.body.blocked.down || sprite.body.touching.down;
    },

    // Filter for some of the physics colliders
    isPlayerActive: function () {
      return this.player.active;
    },

    lose: function () {
      this.gameOver('lose');
    },

    nextLevel: function () {
      this.restartScene({ level: 1 + this.level });
    },

    shutdown: function () {
      this.input.keyboard.removeAllListeners(); // TODO
    },

    quit: function () {
      console.debug('quit');
      this.scene.switch('menu');
      this.scene.stop();
    },

    restartLevel: function () {
      this.restartScene({ level: this.level });
    },

    restartScene: function (data) {
      console.debug('restartScene', data);
      this.scene.restart(data);
    },

    savePlayerProgress: function () {
      var elapsed = this.secondsElapsed();
      var registry = this.sys.game.registry;

      // console.debug('elapsed', elapsed);

      registry.set('lastTime', elapsed);
      registry.set('levelCompleted', this.level);

      var bestTime = registry.get('bestTime');

      // console.debug('bestTime', bestTime);

      if (elapsed < (bestTime || Infinity)) {
        registry.set('bestTime', elapsed);
      }

      // console.debug('bestTime', registry.get('bestTime'));
      // console.debug('lastTime', registry.get('lastTime'));
      // console.debug('levelCompleted', registry.get('levelCompleted'));
    },

    secondsElapsed: function () {
      return Math.floor((this.time.now - this.timeStarted) / SECOND);
    },

    showGroup: function (group) {
      Phaser.Actions.SetVisible(group.getChildren(), true);
    },

    slimeExplode: function (slime) {
      slime
        .setTint(RED)
        .setVelocityY(-480 + slime.body.velocity.y);

      slime.getData('eyes').setFlipY(-1);
    },

    slimePlayer: function (player, slime) {
      this.playerIsSlimed = true;

      player.anims.play('turn');
      player.body.allowDrag = true;
      player.body.allowGravity = true;

      player
        .setAccelerationX(0)
        .setActive(false)
        .setDrag(1200, 60)
        .setTint(GREEN);

      slime
        .setAccelerationX(0)
        .setDrag(600, 0)
        .setGravityY(0);

      this.lose();
    },

    slimeStartClimb: function (slime) {
      if (this.isOnFloor(slime)) {
        slime
          .setAccelerationX(0)
          .setDragX(30)
          .setGravityY(-720);
      }

      this.time.delayedCall(Phaser.Math.Between(1, 2) * SECOND
        , this.slimeStopClimb, [slime], this);
    },

    slimeStopClimb: function (slime) {
      slime
        .setDragX(0)
        .setGravityY(0);

      this.time.delayedCall(Phaser.Math.Between(3, 17) * SECOND
        , this.slimeStartClimb, [slime], this);
    },

    slimesExplode: function () {
      this.slimes.children.iterate(this.slimeExplode, this);
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
    },

    toggleDebugGraphic: function () {
      var debugGraphic = this.physics.world.debugGraphic;

      if (debugGraphic) {
        debugGraphic.setVisible(!debugGraphic.visible);
      }
    },

    updateBackground: function () {
      var main = this.cameras.main;
      this.mtn.tilePositionX = 0.5 * main.scrollX;
    },

    updateEyes: function (eyes, slime) {
      eyes.setPosition(
        Phaser.Math.Linear(slime.x, eyes.x, 0.25),
        Phaser.Math.Linear(slime.y, eyes.y, 0.5)
      );
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

      var player = this.player;
      var body = player.body;
      var onFloor = this.isOnFloor(player);

      body.allowDrag = onFloor;
      body.allowGravity = !onFloor;

      if (onFloor) {
        if (this.cursors.left.isDown) {
          player.setAccelerationX(-1800);
          player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
          player.setAccelerationX(1800);
          player.anims.play('right', true);
        } else {
          player.setAccelerationX(0);
        }

        if (this.cursors.up.isDown) {
          player.setVelocityY(this.calcPlayerJumpVelocity(player));
        }
      } else {
        player.setAccelerationX(0);
      }

      if (body.speed < 9) {
        player.anims.play('turn');
      }
    },

    updateSlime: function (slime) {
      this.updateEyes(slime.getData('eyes'), slime);

      slime.scaleX = this.calcSlimeScaleX(slime);

      if (this.playerIsSlimed) {
        return;
      }

      if (this.isOnFloor(slime)) {
        slime.setAccelerationX(this.calcSlimeAccelerationX(slime));
      }
    },

    updateText: function () {
      if (this.scoreText.active) {
        var remaining = this.gemsTotal - this.score;

        this.scoreText.setText('*'.repeat(this.score) + '-'.repeat(remaining));
      }

      if (this.timerText.active) {
        this.timerText.setText('Time ' + this.secondsElapsed());
      }
    },

    win: function () {
      this.player.anims.play('turn');
      this.player.body.checkCollision.none = true;
      this.player
        .setAccelerationX(this.player.body.velocity.x / 6)
        .setAccelerationY(-1200)
        .setCollideWorldBounds(false)
        .setDrag(600, 0);

      this.starsFlow.start();
      this.savePlayerProgress();
      this.gameOver('win');
    }
  }

};

});

require.register("scenes/end.js", function(exports, require, module) {
module.exports = {

  key: 'playOver',

  plugins: ['InputPlugin'],



  init: function (data) {
    // console.debug('init', this.scene.key);

    if (this.scene.isActive()) {
      throw new Error('Already active');
    }

    if (this.sys.updateList._list.length > 100) {
      throw new Error('updateList too large');
    }


  },

  create: function () {
    if (this.sys.updateList._list.length > 100) {
      throw new Error('updateList too large');
    }

    if (this.title) {
      throw new Error('Already created');
    }

    this.cameras.main.setBackgroundColor(0x22000000);

    this.title = this.add.bitmapText(400, 300, 'sunset', 'Hello')
      .setName('title')
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0, 0);

    this.caption = this.add.bitmapText(400, 450, 'smooth', '[N] Next\n[R] Restart\n[Q] Quit')
      .setFontSize(32)
      .setName('caption')
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0, 0)
      .setTint(0xdddddd);

    this.input.on('pointerdown', this.startPlay, this);
  },

  extend: {

    addListeners: function () {
      console.log('addListeners');

      // this.events.on('sleep', this.onSleep, this);
      // this.events.on('wake', this.onWake, this);
      // this.events.once('shutdown', this.onShutdown, this);
      this.events.once('shutdown', console.trace);

      var playEvents = this.scene.get('play').events;

      playEvents.on('win', this.onWin, this);
      playEvents.on('lose', this.onLose, this);
      playEvents.on('gameover', this.wake, this);
      playEvents.on('shutdown', this.sleep, this);

      delete this.addListeners;
    },

    onWin: function () {
      this.title.setText('HOORAY');
    },

    onLose: function () {
      this.title.setText('OH NO');
    },

    onShutdown: function () {
      console.warn('Should not shutdown');
    },

    startPlay: function () {
      console.warn('startPlay');
      // debugger;
      this.scene.stop('play').launch('play');
    },

    sleep: function () {
      console.warn('sleep?');
      if (this.scene.isActive()) {
        console.warn('sleep!');
        this.scene.sleep();
      }
    },

    wake: function () {
      console.warn('wake!');
      this.scene.wake();
    }

  }

};

});

require.register("scenes/menu.js", function(exports, require, module) {
module.exports = {

  key: 'menu',

  plugins: ['DataManagerPlugin', 'InputPlugin'],

  init: function () {
    // console.debug('init', this.scene.key);

    this.events.once('shutdown', this.shutdown, this);
  },

  create: function () {
    this.add.image(400, 300, 'space2');

    this.add.bitmapText(400, 200, 'sunset', 'KRISTAL\n QUEST')
      .setOrigin(0.5);

    this.add.bitmapText(400, 400, 'smooth', 'START')
      .setOrigin(0.25, 0.25)
      .setFontSize(32);

    this.add.bitmapText(400, 550, 'smooth', this.captionText())
      .setOrigin(0.125, 0.125)
      .setFontSize(16);

    this.input.on('pointerdown', this.startPlay, this);

    this.input.keyboard.on('keydown_S', this.startPlay, this);
  },

  extend: {

    level: null,

    captionText: function () {
      var registry = this.sys.game.registry;

      return Phaser.Utils.String.Format('Level: %1  Last Time: %2  Best Time: %3', [
        this.getNextLevel(),
        registry.get('lastTime') || '-',
        registry.get('bestTime') || '-'
      ]);
    },

    getNextLevel: function () {
      return 1 + (this.sys.game.registry.get('levelCompleted') || 0);
    },

    shutdown: function () {
      // this.input.keyboard.removeAllListeners();
    },

    startPlay: function () {
      console.log('startPlay');
      this.scene.switch('play');
    }

  }

};

});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

require('initialize');
//# sourceMappingURL=app.js.map
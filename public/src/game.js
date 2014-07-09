var Q = Quintus({audioSupported: [ 'wav','mp3' ]})
      .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio')
      .setup({ maximize: true })
      .enableSound()
      .controls().touch();

var players = [];

var selfId;
var CURRENT_LEVEL = 'level1';
var UiHealth = document.getElementById("health");
var UiFireballs = document.getElementById("fireballs");
var UiPlayers = document.getElementById("players");
var box, button, label, socket;

require(['socket.io/socket.io.js']);

socket = io.connect('10.4.20.129:3000');

Q.animations('player', {
  run_left: { frames: [3, 1, 2], rate: 1/5 },
  run_right: { frames: [3, 1, 2], rate: 1/5 },
  stand_right: { frames: [4], rate: 1/3 },
  stand_left: { frames: [4], rate: 1/3 },
});

Q.animations('health', {
  s0: { frames: [0] },
  s1: { frames: [1] },
  s2: { frames: [2] },
  s3: { frames: [3] },
  s4: { frames: [4] },
  s5: { frames: [5] },
  s6: { frames: [6] },
  s7: { frames: [7] }
});

Q.animations('princess', {
  cry: { frames: [1, 2, 3, 4, 5, 6, 7], rate: 1/2 }
});

Q.animations('boss', {
  walk: { frames: [0, 1, 4, 5], rate: 1/2 },
  dead: { frames: [0] }
});

var objectFiles = [
  './src/players',
  './src/enemies',
  './src/boss',
  './src/shoe',
  './src/mashroom',
  './src/princess',
  './src/health_display',
  './src/beer',
  './src/door',
  './src/stage_elements'
];

require(objectFiles, function () {
  function setUp (stage, level, nextLevel) {
    socket.on('connected', function (data) {
      console.log("connected");
      UiPlayers.innerHTML = "Players: " + data['playerCount'];
    });

    socket.on('selfConnect', function (data) {
      console.log("selfConnect");
      if(!selfId){
        console.log("New player");
        UiPlayers.innerHTML = "Players: " + data['playerCount'];
        selfId = data['playerId'];
        console.log(selfId);
        var player = new Q.Alex({ x: 50, y: 50, playerId: data['playerId'], level: level, socket: socket });
        players.push({ player: player, playerId: data['playerId'] });
        stage.insert(player);
        stage.add('viewport').follow(player);
        stage.viewport.offsetX = 130;
        stage.viewport.offsetY = 200;
      }
    });

    socket.on('disconnected', function (data) {
      console.log("disconnected");
      UiPlayers.innerHTML = "Players: " + data['playerCount'];
      var arr = players.filter(function( obj ) {
        return obj.playerId == data['playerId'] ;
      });
      var result = arr[0];
      if (arr.length != 0 && result.player.p.level === level) {
        result.player.p.healthDisplay.destroy();
        result.player.destroy();
      }
    });

    socket.on('information', function (data) {
      var arr = players.filter(function( obj ) {
        return obj.playerId == data['playerId'];
      });
      var result = arr[0]
      if(data['level'] === level){
        if (arr.length == 0){
          console.log("new ghost");
          var player = new Q.Ghost({ x: 50, y: 50, level: data['level'], playerId: data['playerId'] });
          players.push({ player: player, playerId: data['playerId'] });
          console.log(stage);
          Q.stage().insert(player);
        } else if (result.playerId != selfId){
          result.player.p.x = data['x'];
          result.player.p.y = data['y'];
          result.player.p.vx = data['x'];
          result.player.p.vy = data['vy'];
          result.player.p.health = data['health'];
        }
      }
    });

    stage.on('complete',function() {
      var arr = players.filter(function( obj ) {
        return obj.playerId == selfId;
      });
      var result = arr[0];
      var playerHealth = result.player.p.health;
      var playerFireballs = result.player.p.bullets;
      players.splice( players.indexOf( result ), 1 );
      console.log("Player moving to next level");
      CURRENT_LEVEL = 'level2';
      player = new Q.Alex({ x: 50, y: 50, playerId: selfId, socket: socket, level: level, health: playerHealth, bullets: playerFireballs });
      players.push({ player: player, playerId: selfId });
      Q.clearStages();
      Q.stageScene(nextLevel, { player: player });
    });
  }

  Q.scene('ui', function(stage){
    UiHealth.innerHTML = "Health: " + Q.state.get("health");
    UiFireballs.innerHTML = "Fireballs: " + Q.state.get("bullets");

    Q.state.on("change.health", this, function() {
      UiHealth.innerHTML = "Health: " + Q.state.get("health");
    });

    Q.state.on("change.bullets", this, function() {
      UiFireballs.innerHTML = "Fireballs: " + Q.state.get("bullets");
    });
  });

  Q.scene('PlayerDead',function(stage) {
    button = stage.insert(new Q.UI.Button({ x: Q.width/2, y: Q.height/2, fill: '#CCCCCC', label: 'Play Again' }));
    button.on('click',function() {
      var arr = players.filter(function( obj ) {
        return obj.playerId == selfId;
      });
      var result = arr[0];
      result.player.p.healthDisplay.destroy();
      result.player.destroy();
      // players.splice( players.indexOf( result ), 1 );
      players = [];
      console.log("Player regeneration");
      player = new Q.Alex({ x: 50, y: 50, playerId: selfId, level: CURRENT_LEVEL, socket: socket });
      players.push({ player: player, playerId: selfId });
      Q.clearStages();
      Q.stageScene(CURRENT_LEVEL, { player: player });
      Q.state.set("health", player.p.health);
      Q.state.set("bullets", player.p.bullets);
    });

  });

  Q.scene('debug',function(stage) {
    CURRENT_LEVEL = 'debug';

    stage.insert(new Q.Repeater({ asset: '/images/background.png', speedX: 0.5, speedY: 0.5, scale: 1 }));
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/debug.json', sheet: 'tiles' }));

    if (stage.options.player) {
      stage.insert(player);
      stage.add('viewport').follow(player);
      stage.viewport.offsetX = 130;
      stage.viewport.offsetY = 200;
    }

    setUp(stage, 'debug', 'level1');

    stage.insert(new Q.Mashroom({x: 300, y:100 }));
    stage.insert(new Q.Mashroom({x: 290, y:100 }));
    stage.insert(new Q.Beer({ x: 300, y: 100 }));
    stage.insert(new Q.Beer({ x: 330, y: 100 }));
    stage.insert(new Q.Beer({ x: 360, y: 100 }));
    stage.insert(new Q.Beer({ x: 300, y: 100 }));
    stage.insert(new Q.Beer({ x: 330, y: 100 }));
    stage.insert(new Q.Beer({ x: 360, y: 100 }));
    stage.insert(new Q.Beer({ x: 300, y: 100 }));
    stage.insert(new Q.Beer({ x: 330, y: 100 }));
    stage.insert(new Q.Beer({ x: 360, y: 100 }));
    stage.insert(new Q.Boss({ x: 700, y: 50 }));

  });

  Q.scene('level1',function(stage) {
    CURRENT_LEVEL = 'level1';

    stage.insert(new Q.Repeater({ asset: '/images/background.png', speedX: 0.5, speedY: 0.5, scale: 1 }));
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/level1.json', sheet: 'tiles' }));

    if (stage.options.player) {
      stage.insert(player);
      stage.add('viewport').follow(player);
      stage.viewport.offsetX = 130;
      stage.viewport.offsetY = 200;
    }

    setUp(stage, 'level1', 'level2');

    stage.insert(new Q.MovingBar({ x: 1650, y: 150, yDistance: 300 }));
    stage.insert(new Q.MovingBar({ x: 2725, y: 150, yDistance: 300 }));
    stage.insert(new Q.MovingBar({ x: 2900, y: 150, yDistance: 300 }));
    stage.insert(new Q.Door({ x: 3500, y: 355 }));
    stage.insert(new Q.Beer({ x: 1350, y: 370 }));
    stage.insert(new Q.Beer({ x: 2150, y: 650 }));
    stage.insert(new Q.Beer({ x: 2250, y: 650 }));
    stage.insert(new Q.Beer({ x: 1950, y: 360 }));
    stage.insert(new Q.Beer({ x: 2450, y: 360 }));
    stage.insert(new Q.Mashroom({ x: 2450, y: 150 }));
    stage.insert(new Q.Goomba({ x: 600, y: 400 }));
    stage.insert(new Q.Goomba({ x: 650, y: 400 }));
    stage.insert(new Q.Goomba({ x: 1150, y: 400 }));
    stage.insert(new Q.Penguin({ x: 2150, y: 450 }));
    stage.insert(new Q.Penguin({ x: 2300, y: 450 }));
    stage.insert(new Q.Dragon({ x: 2300, y: 150 }));
    stage.insert(new Q.Narwhal({ x: 2150, y: 650 }));
    stage.insert(new Q.Narwhal({ x: 2300, y: 650 }));
    stage.insert(new Q.Narwhal({ x: 3300, y: 450 }));

  });

  Q.scene('level2',function(stage) {
    CURRENT_LEVEL = 'level2';

    stage.insert(new Q.Repeater({ asset: '/images/background.png', speedX: 0.5, speedY: 0.5, scale: 1 }));
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/level2.json', sheet: 'tiles' }));

    if (stage.options.player) {
      stage.insert(player);
      stage.add('viewport').follow(player);
      stage.viewport.offsetX = 130;
      stage.viewport.offsetY = 200;
    }

    setUp(stage, 'level2', 'level2');

    stage.insert(new Q.Princess({ x: 1700, y: 360 }));
    stage.insert(new Q.Boss({ x: 1000, y: 360 }));
    stage.insert(new Q.Mashroom({x: 300, y:350 }));
    stage.insert(new Q.Beer({ x: 300, y: 380 }));
    stage.insert(new Q.Beer({ x: 330, y: 380 }));
    stage.insert(new Q.Beer({ x: 360, y: 380 }));

  });

  var images;

  images = [
    '/images/mashroom.png',
    '/images/background.png',
    '/maps/debug.json',
    '/maps/level1.json',
    '/maps/level2.json',
    '/maps/level3.json',
    '/maps/level4.json',
    '/images/tiles.png',
    '/images/princess.gif',
    '/images/fluffy.png',
    '/images/monster.png',
    '/images/narwhal.png',
    '/images/penguin.png',
    '/images/boss.png',
    '/images/mario1.png',
    '/images/mario_fireball.gif',
    '/images/boss_fireball.gif',
    '/images/beer.png',
    '/images/bar.png',
    '/images/door.png',
    '/sounds/fireball.wav',
    '/sounds/stomp.wav',
    '/sounds/boss_fireball.wav',
    '/sounds/gulp.wav',
    '/images/health.png',
    '/sounds/mario_die.wav',
    '/sounds/nooo.wav',
    '/images/snowball.png',
    '/sounds/jump.wav',
    '/sounds/powerup.wav',
    '/sounds/world_clear.wav'
  ];

  Q.load(images.join(',') , function() {
    Q.sheet('tiles','/images/tiles.png', { tilew: 32, tileh: 32 });
    Q.sheet('tiles','/images/tiles.png', { tilew: 32, tileh: 32 });
    Q.sheet('player', '/images/mario1.png', { tilew: 400, tileh: 538 });
    Q.sheet('princess', '/images/princess.gif', { tilew: 24, tileh: 44 });
    Q.sheet('boss', '/images/boss.png', { tilew: 230 , tileh: 201 });
    Q.sheet('goomba', '/images/monster.png', { tilew: 500, tileh: 437 });
    Q.sheet('penguin', '/images/penguin.png', { tilew: 112, tileh: 142 });
    Q.sheet('dragon', '/images/fluffy.png', { tilew: 500, tileh: 392 });
    Q.sheet('narwhal', '/images/narwhal.png', { tilew: 800, tileh: 434 });
    Q.sheet('mashroom', '/images/mashroom.png', { tilew: 483, tileh: 480 });
    Q.sheet('fireball', '/images/mario_fireball.gif', { tilew: 20, tileh: 20 });
    Q.sheet('snowball', '/images/snowball.png', { tilew: 140, tileh: 129 });
    Q.sheet('bossfire', '/images/boss_fireball.gif', { tilew: 48, tileh: 16 });
    Q.sheet('beer', '/images/beer.png', { tilew: 32, tileh: 32 });
    Q.sheet('door', '/images/door.png', { tilew: 188, tileh: 225 });
    Q.sheet('health', '/images/health.png', { tilew: 16, tileh: 16 });
    Q.sheet('bar', '/images/bar.png', { tilew: 134, tileh: 32 });
    Q.state.reset({ "bullets": 0, "health": 10000000 });
    Q.stageScene(CURRENT_LEVEL, 0);
    Q.stageScene("ui", 1);
  });
});

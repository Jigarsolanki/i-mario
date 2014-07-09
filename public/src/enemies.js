Q.Sprite.extend('Enemy',{
  init: function(p, hash) {
    this._super(p, hash);
    this.addEventListeners();
    this.on('damage', 'onDamage');
  },
  insertHealthDisplay: function () {
    var hd = new Q.HealthDisplay();
    this.p.healthDisplay = hd;
    this.stage.insert(hd);
    hd.followObject(this);
  },
  onDamage: function (points) {
    if(this.p.health === this.p.originalHealth){
      this.insertHealthDisplay();
    }

    this.p.health -= points;

    if (this.p.health <= 0) {
      this.destroy();
      this.p.healthDisplay.destroy();
    }
  },
  addEventListeners: function() {
    this.add('2d, aiBounce, animation');

    this.on('bump.left,bump.right,bump.bottom',function(collision) {
      if(collision.obj.isA('Player')) {
        collision.obj.trigger('damage');
      } else if (collision.obj.isA('Ghost')){
        return;
      }
    });

    this.on('bump.top',function(collision) {
      if(collision.obj.isA('Player')) {
        this.destroy();
        if (this.p.healthDisplay){
          this.p.healthDisplay.destroy();
        }
        collision.obj.p.vy = -300;
        Q.audio.play("/sounds/stomp.wav");
      } else if(collision.obj.isA('Ghost')){
        return;
      }
    });
  },
  step: function () {

  }
});

Q.Enemy.extend('Goomba', {
  init: function(p){
    this._super(p, {
      sheet: 'goomba',
      vx: 100,
      originalHealth: 50,
      health: 50,
      scale: 0.07
    });
    this.className = 'Enemy';
  },
  step: function () {
    if (this.p.vx > 0){
      this.p.flip = "x";
    }
  }
});

require(['./src/dragon_fire'], function () {
  Q.Enemy.extend('Dragon', {
    init: function(p) {
      this._super(p, {
        sheet: 'dragon',
        vx: 100,
        health: 50,
        originalHealth: 50,
        scale: 0.07,
        fireStep: 75
      });
      this.className = 'Enemy';
    },
    step: function () {
      if(this.p.fireStep === 75){
        if(this.p.vx < 0) {
          this.stage.insert(new Q.DragonFire({ x: this.p.x - 15, y: this.p.y, vx: -250 }));
        } else {
          this.p.flip = "x";
          this.stage.insert(new Q.DragonFire({ x: this.p.x + 15, y: this.p.y, vx: 250 }));
        }
        this.p.fireStep = 0;
      }
      this.p.fireStep++;
    },
    addEventListeners: function() {
      this.add('2d, aiBounce, animation');

      this.on('bump.left,bump.right,bump.bottom',function(collision) {
        if(collision.obj.isA('Player')) {
          collision.obj.trigger('damage');
        } if(collision.obj.isA('TileLayer')) {
          this.p.vy = -400;
        }
      });

      this.on('bump.top',function(collision) {
        if(collision.obj.isA('Player')) {
          this.destroy();
          if (this.p.healthDisplay){
            this.p.healthDisplay.destroy();
          }
          collision.obj.p.vy = -300;
          Q.audio.play("/sounds/stomp.wav");
        }
      });
    }
  });
});

Q.Enemy.extend('Narwhal', {
  init: function(p){
    this._super(p, {
      sheet: 'narwhal',
      vx: 100,
      health: 30,
      originalHealth: 30,
      scale: 0.05
    });
    this.className = 'Enemy';
  },
  addEventListeners: function () {
    this.add('2d, aiBounce, animation');

    this.on('bump.left,bump.right,bump.bottom',function(collision) {
      if(collision.obj.isA('Player')) {
        collision.obj.trigger('damage');
      }
    });

    this.on('bump.top',function(collision) {
      if(collision.obj.isA('Player')) {
        this.destroy();
        if (this.p.healthDisplay){
          this.p.healthDisplay.destroy();
        }
        collision.obj.p.vy = -300;
        Q.audio.play("/sounds/stomp.wav");
      }
    });
  },
  step: function () {
    if (this.p.vx <  0){
      this.p.flip = "x";
    } else if (this.p.vx > 0 && this.p.flip === "x"){
      this.p.flip = "";
    }
    var player = Q('Player').items[0];
    if(player){
      if(Math.abs(player.p.y - this.p.y) < 40)  {
        //Find direction of player relative to this narwhal
        this.p.vx += ((player.p.x - this.p.x)/(Math.abs(player.p.x - this.p.x))) * 20;
        if(this.p.vx > 500){
          this.p.vx = 500;
        } else if(this.p.vx < -500){
          this.p.vx = -500
        }
      }
    }
  }
});

require(['./src/snowball'], function () {
  Q.Enemy.extend('Penguin',{
    init: function(p) {
      this._super(p, {
        sheet: 'penguin',
        scale: 0.25,
        snowballStep: 0,
        health: 30,
        originalHealth: 30
      });
      this.className = 'Enemy';
    },
    addEventListeners: function () {
      this.add('2d, aiBounce, animation');

      this.on('bump.left,bump.right,bump.bottom',function(collision) {
        if(collision.obj.isA('Player')) {
          collision.obj.trigger('damage');
        }
      });

      this.on('bump.top',function(collision) {
        if(collision.obj.isA('Player')) {
          this.destroy();
          if (this.p.healthDisplay){
            this.p.healthDisplay.destroy();
          }
          collision.obj.p.vy = -300;
          Q.audio.play("/sounds/stomp.wav");
        }
      });
    },
    step: function () {
      var player = Q('Player').items[0];
      if (player) {
        if(this.p.x - player.p.x > 0){
          this.p.direction = "right";
        } else {
          this.p.direction = "left";
        }
      }
      if(this.p.snowballStep === 100){
        if(this.p.direction === "right") {
          this.stage.insert(new Q.Snowball({ x: this.p.x - 15, y: this.p.y, vx: -150, vy: -400 }));
        } else {
          this.stage.insert(new Q.Snowball({ x: this.p.x + 15, y: this.p.y, vx:  150, vy: -400 }));
        }
        this.p.snowballStep = 0;
      }
      this.p.snowballStep++;
    }
  });
});

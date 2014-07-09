require(['./src/boss_fire'], function (BossFire) {
  Q.Sprite.extend("Boss",{
    init: function(p) {
      this._super(p, {
        sheet: "boss",
        sprite: 'boss',
        frameJumpCount: 0,
        health: 600,
        originalHealth: 600,
        scale: 0.5,
        state: "walk",
        fireCollapsedTime: 0,
        jumpCount: 0,
        waitTime: 0
      });
      this.add('2d, aiBounce, animation');

      this.on('damage', 'onDamage');

      this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
        if(collision.obj.isA("Player") && this.p.state != "dead") {
          Q.audio.play('/sounds/mario_die.wav');
          Q.stageScene("PlayerDead",1, { label: "You Died" });
          collision.obj.destroy();
          collision.obj.p.healthDisplay.destroy();
        }
      });
      this.className = 'Enemy';
    },
    sensor: function (obj) {
      return;
    },
    onDamage: function (points) {
      this.p.health -= points;

      if (this.p.health <= 0) {
        this.on('sensor');
        this.p.sensor = true;
        this.p.angle = 90;
        this.p.y += 100;
        this.play("dead");
        this.p.state = "dead";
        this.p.healthDisplay.destroy();
        Q.audio.play('/sounds/nooo.wav');
      }
    },
    insertHealthDisplay: function () {
      var hd = new Q.HealthDisplay();
      this.p.healthDisplay = hd;
      this.stage.insert(hd);
      hd.followObject(this, -40);
    },
    switchStates: function () {
      this.p.vx = 0;
      this.p.frameJumpCount = 0;
      this.p.jumpCount = 0;
      this.p.waitTime = 0;
    },
    step: function (dt) {
      if(!this.p.healthDisplay){
        this.insertHealthDisplay();
      }
      var player = Q('Player').items[0];
      if(player){
        if(this.p.state != "dead"){
          if (this.p.x - player.p.x > 0){
            this.p.flip = "x";
          } else {
            this.p.flip = "";
          }
        }
        if (this.p.state === "walk"){
          var currentFrame;
          currentFrame = this.p.frameJumpCount++;
          if (currentFrame > 100 && currentFrame < 200 && currentFrame!== 0) {
            this.p.x += 1;
          }
          if (currentFrame > 250 && currentFrame < 350 && currentFrame!== 0) {
            this.p.x -= 1;
          }
          if (currentFrame > 350) {
            this.p.jumpCount++;
            this.p.frameJumpCount = 0;
            if (this.p.jumpCount > 0){
              this.switchStates();
              this.p.state = "dashWait";
            }
          }
          this.p.fireCollapsedTime += 1;
          if (this.p.fireCollapsedTime >= 200) {
            this.p.fireCollapsedTime = 0;
            if((player.p.x - this.p.x)/(Math.abs(player.p.x - this.p.x)) < 0){
              this.stage.insert(new Q.BossFire({ x: this.p.x - 30, y: this.p.y + 10, vx: -250, vy: 0, flip: "x" }));
            } else {
              this.stage.insert(new Q.BossFire({ x: this.p.x + 30, y: this.p.y + 10, vx: 250, vy: 0 }));
            }
            Q.audio.play('/sounds/boss_fireball.wav');
          }
        } else if (this.p.state === "dashWait"){
          var waitFrame = this.p.waitTime++;
          if (waitFrame === 200){
            this.switchStates();
            this.p.state = "dash";
          }
        } else if (this.p.state === "dash"){
          this.p.frameJumpCount++;
          if(this.p.frameJumpCount === 400){
            this.switchStates();
            this.p.state = "walk";
          } else {
            if(player){
              //Find direction of player relative to this narwhal
              this.p.vx += ((player.p.x - this.p.x)/(Math.abs(player.p.x - this.p.x))) * 40;
              if(this.p.vx > 500){
                this.p.vx = 500;
              } else if(this.p.vx < -500){
                this.p.vx = -500
              }
            }
          }
        }
      }
      if (!this.p.state === "dead"){
        this.play('walk');
      }
    }
  });
});

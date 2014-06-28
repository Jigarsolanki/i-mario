require(['./src/fireball'], function () {
  Q.Sprite.extend('Player',{
    init: function(p) {
      this._super(p, {
        sheet: 'player',
        sprite: 'player',
        flip: 'x',
        canFire: false,
        health: 100
      });

      this.add('2d, platformerControls, animation');

      Q.input.on('fire',this,'fireWeapon');

      this.on('hit.sprite',function (collision) {
        if (collision.obj.isA('Princess')) {
          var princess = collision.obj;
          this.stage.insert(new Q.Fireball({ x: princess.p.x - 15, y: princess.p.y, vx: -250 }));
          Q.stageScene('playerDead', 1, { label: "You died! This princess doesn't need rescuing." });
          this.destroy();
          Q.audio.play('/sounds/mario_die.wav');
        }

        if (collision.obj.isA('Mashroom')){
          this.p.canFire = true;
          Q.audio.play('/sounds/powerup.wav');
        }
      });

      this.on('damage', 'onDamage');
    },
    onDamage: function () {
      this.p.health -= 100;

      if (this.p.health > 0) {
        return;
      }
      Q.audio.play('/sounds/mario_die.wav');
      Q.stageScene("playerDead",1, { label: "You Died" });
      this.destroy();
    },
    fireWeapon: function () {
      if (!this.p.canFire) {
        return;
      }

      if (this.p.direction === 'left') {
        this.stage.insert(new Q.Fireball({ x: this.p.x - 15, y: this.p.y, vx: -250 }));
        this.stage.insert(new Q.Fireball({ x: this.p.x - 15, y: this.p.y + 15, vx: -250 }));
        if(Math.random() < 0.1) {
          this.stage.insert(new Q.Fireball({ x: this.p.x - 15, y: this.p.y + 100, vx: -250 }));
        }
      } else {
        this.stage.insert(new Q.Fireball({ x: this.p.x + 15, y: this.p.y, vx: 250 }));
        this.stage.insert(new Q.Fireball({ x: this.p.x + 15, y: this.p.y + 15, vx: 250 }));
        if(Math.random() < 0.1) {
          this.stage.insert(new Q.Fireball({ x: this.p.x + 15, y: this.p.y + 100, vx: 250 }));
        }
      }

      Q.audio.play('/sounds/fireball.wav');
    },
    step: function (dt) {
      if(this.p.vx > 0) {
        this.p.flip='x';
        this.play('run_right');
      } else if(this.p.vx < 0) {
        this.p.flip='';
        this.play('run_left');
      } else {
        this.play('stand_' + this.p.direction);
      }
    }
  });
  Q.Player.extend('Alex',{
    init: function(p) {
      this._super(p);
      this.className = 'Player';
    }
  });
});

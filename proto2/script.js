/*
$.post('ajax/test.html', {dataToServer:"example"}, function(data) {
	
});
*/

//---- Player class

function Player(id, team, x, y, direction) {
	this.id = id;
	this.team = team;
	this.x = x;
	this.y = y;
	this.direction = direction;
	this.actionsLeft = 0;
	this.flag = null;
};

//---- Flag class

function Flag(team, xspawn, yspawn) {
	this.team = team;
	this.xspawn = xspawn;
	this.yspawn = yspawn;
	this.onBase = true;
	this.turnsAlone = 0; //Nb of turns left on the field outside base
}

Flag.prototype.draw = function(ctx, caseSize) {
	if(this.onBase)
		ctx.drawImage(img['flag'], caseSize*this.xspawn, caseSize*this.yspawn, caseSize, caseSize);
}

//---- Game class

function Game() {
	this.players = [];
	this.flags = [];
	this.map = [
		[2,0,0,0,0,0,1,0,0,0,0,0,0,0],
		[0,3,1,0,0,0,1,0,0,0,0,0,0,0],
		[0,1,1,0,0,0,0,0,0,0,1,0,1,1],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,1,1,0,0,0,0,0,0],
		[0,0,0,0,0,1,1,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[1,1,0,1,0,0,0,0,0,0,0,1,1,0],
		[0,0,0,0,0,0,1,0,0,0,0,1,3,0],
		[0,0,0,0,0,0,1,0,0,0,0,0,0,2]
	];
	this.mouvement = [
		{x:1, y:0},
		{x:-1, y:0},
		{x:0, y:1},
		{x:0, y:-1}
	];
	this.myTeam = 0;
	this.caseSize = 60;
	this.actionsLeftMax = 10;
	this.turnsAloneMax = 6; //For flag
	this.teamTurn = -1;
};

Game.prototype.init = function() {
	this.players.push(new Player(1, 0, 13, 5, 'L'));
	this.players.push(new Player(42, 0, 8, 8, 'U'));
	this.players.push(new Player(2, 1, 4, 2, 'D'));
	this.players.push(new Player(3, 1, 2, 5, 'R'));
	
	this.flags.push(new Flag(0, 12, 8)); //Make sure flag index correspond to team & only 1 flag/team
	this.flags.push(new Flag(1, 1, 1));
	
	this.teamTurn = 1;
	this.nextTurn();
	
	//this.flags.push(null);
};

Game.prototype.nextTurn = function() {
	this.teamTurn = (this.teamTurn+1)%2;
	console.log('team turn = ',this.teamTurn);
	for(var i in this.players) {
		if(this.players[i].team == this.teamTurn) {
			this.players[i].actionsLeft = this.actionsLeftMax;
			console.log(this.players[i].id);
		} else {
			this.players[i].actionsLeft = 0;
		}
	}
}

Game.prototype.isNextTurn = function() {
	for(var i in this.players) {
		if(this.players[i].team == this.teamTurn
				&& this.players[i].actionsLeft > 0) {
			return false;
		}
	}
	return true;
}

Game.prototype.drawBg = function(ctx) {
	for(var i in this.map) {
		for(var j in this.map[i]) {
			switch(this.map[i][j]) {
				case 1:
					ctx.drawImage(img['bloc'], this.caseSize*j, this.caseSize*i, this.caseSize, this.caseSize);
					break;
				case 2:
					ctx.drawImage(img['spawn'], this.caseSize*j, this.caseSize*i, this.caseSize, this.caseSize);
					break;
				default:
					ctx.drawImage(img['void'], this.caseSize*j, this.caseSize*i, this.caseSize, this.caseSize);
			}
		}
	}
};

Game.prototype.drawFg = function(ctx) {
	for(var i in this.flags) {
		this.flags[i].draw(ctx, this.caseSize);
	}
	for(var i in this.players) {
		ctx.drawImage(img['perso'+this.players[i].direction], this.caseSize*this.players[i].x, this.caseSize*this.players[i].y, this.caseSize, this.caseSize);
		if(this.players[i].team == this.myTeam) {
			ctx.beginPath();
			ctx.arc((this.players[i].x+0.5)*this.caseSize, (this.players[i].y+0.5)*this.caseSize, 30, 0 , 2 * Math.PI, false);
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#CCC';
			ctx.stroke();
		}
	}
	
};

Game.prototype.getObject = function(x, y) {
	for(var i in this.players) {
		if(this.players[i].x == x && this.players[i].y == y) {
			return this.players[i];
		}
	}
};

Game.prototype.isCaseFree = function(x, y) {
	if(x<0 || y<0 || x>=this.map[0].length || y>=this.map.length) return false;
	for(var i in this.players) {
		if(this.players[i].x == x && this.players[i].y == y) {
			return false;
		}
	}
	return this.map[y][x] != 1;
};

Game.prototype.pickFlag = function(player) {
	if(player.flag) {
		if(player.x == this.flags[player.team].xspawn
				&& player.y == this.flags[player.team].yspawn) {
			player.flag.onBase = true;
			player.flag = null;
		}
	} else {
		for(var i in this.flags) {
			if(this.flags[i] != player.team
					&& this.flags[i].onBase
					&& this.flags[i].xspawn == player.x
					&& this.flags[i].yspawn == player.y
					) {
				this.flags[i].onBase = false;
				player.flag = this.flags[i];
				return;
			}
		}
	}
};

Game.prototype.move = function(id, dx, dy) {
	for(var i in this.players) {
		if(this.players[i].id == id && this.players[i].actionsLeft > 0) {
			var nx = this.players[i].x + dx;
			var ny = this.players[i].y + dy;
			if(this.isCaseFree(nx, ny)) {
				this.players[i].x += dx;
				this.players[i].y += dy;
				if(dx<0) this.players[i].direction = 'L';
				else if(dx>0) this.players[i].direction = 'R';
				else if(dy<0) this.players[i].direction = 'U';
				else this.players[i].direction = 'D';
				
				this.pickFlag(this.players[i]); //always tries to pick flag
				
				this.players[i].actionsLeft--;
				if(this.isNextTurn()) this.nextTurn();
				
				return true;
			}
		}
	}
	return false;
};

Game.prototype.IA = function() {
	for(var i in this.players) {
		if(this.players[i].team == this.teamTurn) {
			var mvt = this.mouvement[Math.floor(Math.random()*4)];
			this.move(this.players[i].id, mvt.x, mvt.y);
		}
	}
}

//---- Interface class

function Interface(game) {
	this.game = game;
	
	this.NOTHING = 0;
	this.OBJECT_SELECTED = 1;
	this.MY_PLAYER_SELECTED = 2;
	
	this.state = this.NOTHING;
	this.model = null;
};

Interface.prototype.click = function(xsource, ysource) {
	var x = Math.floor(xsource/this.game.caseSize);
	var y = Math.floor(ysource/this.game.caseSize);
	
	switch(this.state) {
		case this.MY_PLAYER_SELECTED:
			if(Math.abs(x-this.model.x)+Math.abs(y-this.model.y) <= 1) {
				if(this.game.move(this.model.id, x-this.model.x, y-this.model.y))
					break;
			}
			//No break here
		case this.NOTHING: case this.OBJECT_SELECTED:
			this.model = game.getObject(x, y);
			if(this.model) {
				if(this.model instanceof Player
						&& this.model.team == this.game.myTeam) {
					this.state = this.MY_PLAYER_SELECTED;
				} else {
					this.state = this.OBJECT_SELECTED;
				}
			} else {
				this.state = this.NOTHING;
			}
			break;
		default:
	}
};

Interface.prototype.drawOverlay = function(ctx) {
	switch(this.state) {
		case this.MY_PLAYER_SELECTED:
			//Vision
			
			//Mouvement
			if(this.model.actionsLeft > 0) {
				ctx.globalAlpha = 0.3;
				ctx.fillStyle= '#000';
				for(var i in this.game.mouvement) {
					if(this.game.isCaseFree(this.model.x+this.game.mouvement[i].x, this.model.y+this.game.mouvement[i].y))
						roundRect(ctx, (this.model.x+0.1+this.game.mouvement[i].x)*this.game.caseSize, (this.model.y+0.1+this.game.mouvement[i].y)*this.game.caseSize, 0.8*this.game.caseSize, 0.8*this.game.caseSize, 10);
				}
			}
			
			//Infos
			ctx.globalAlpha = 0.7;
			roundRect(ctx, can.width-410, 10, 400, 40, 5);
			ctx.globalAlpha = 1;
			for(var i=0; i<this.model.actionsLeft; i++) {
				roundRect(ctx, can.width-40-40*i, 20, 20, 20, 5);
			}
			
			
			//No break here
		case this.OBJECT_SELECTED:
			ctx.beginPath();
			ctx.arc((this.model.x+0.5)*this.game.caseSize, (this.model.y+0.5)*this.game.caseSize, 30, 0 , 2 * Math.PI, false);
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#C99';
			ctx.stroke();
			break;
		default:
	}
};

//---- Code !

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = false;
  }
  if (typeof fill === "undefined") {
    fill = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

var img = {
	'bloc':null,
	'void':null,
	'persoU':null,
	'persoD':null,
	'persoR':null,
	'persoL':null,
	'flag':null,
	'spawn':null,
};

function load() {
	for(var i in img) {
		img[i] = new Image();
		img[i].src = 'img/'+i+'.png';
	}
}
load();


var game = new Game();
game.init();
var inter = new Interface(game);

var can = document.getElementById('myCanvas');
var ctx = can.getContext('2d');

function render() {
	if(game.teamTurn != game.myTeam) {
		game.IA();
	}
	ctx.clearRect(0, 0, can.width, can.height);
	stats.begin();
	game.drawBg(ctx);
	game.drawFg(ctx);
	inter.drawOverlay(ctx);
	stats.end();
};

(function animloop(){
  requestAnimFrame(animloop);
  render();
})();

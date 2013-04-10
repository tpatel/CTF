var can = document.getElementById('myCanvas');

(function(can){
var ctx = can.getContext('2d');

//stats https://github.com/mrdoob/stats.js
var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );


//requestAnimationShim http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function( callback ){
				window.setTimeout(callback, 1000 / 60);
			};
})();

//---- Player class

function Player(id, team, x, y, direction) {
	this.id = id;
	this.team = team;
	this.x = x;
	this.y = y;
	this.xspawn = x;
	this.yspawn = y;
	this.view = 10;
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

//---- Team class

function Team() {
	this.score = 0;
}

//---- Game class

function Game() {
	this.players = [];
	this.flags = [];
	this.teams = [];
	this.map = null;
	this.width = 0;
	this.height = 0;
	this.mouvement = [
		{x:1, y:0},
		{x:-1, y:0},
		{x:0, y:1},
		{x:0, y:-1}
	];
	this.myTeam = 1;
	this.caseSize = 60;
	this.actionsLeftMax = 10;
	this.actionsToShoot = 10;
	this.turnsAloneMax = 6; //For flag
	this.teamTurn = -1;
	this.mask = null;
	
	this.initialized = false;
};

Game.prototype.applyGame = function(game) {
	for(var i in game) {
		this[i] = game[i];
	}
};

Game.prototype.initMask = function() {
	for(var i in this.mask) {
		for(var j in this.mask[i]) {
			this.mask[i][j] = 0;
		}
	}
	for(var j in this.players) {
		if(this.players[j].team == this.myTeam) {
			this.displayPosition(this.players[j].x, this.players[j].y, this.players[j].view);
		}
	}
	this.displayPosition(this.flags[this.myTeam].xspawn, this.flags[this.myTeam].yspawn, 2);
}

Game.prototype.displayPosition = function(x, y, size) {
	var imin = Math.max(0,y-size);
	var imax = Math.min(this.height-1,y+size);
	var jmin = Math.max(0,x-size);
	var jmax = Math.min(this.width-1,x+size);

	for(var i=imin; i<=imax; i++) {
		for(var j=jmin; j<=jmax; j++) {
			var dx = Math.abs(x-j);
			var dy = Math.abs(y-i);
			if(dx+dy <= size) {
				//Ray trace
				var x0=x, y0=y;
				var sx = 1, sy = 1;
				if(y >= i) sy = -1;
				if(x >= j) sx = -1;
				var err = dx-dy;
			
				this.mask[y0][x0] = 1;
				while((y0 != i || x0 != j)
						&& (this.map[y0][x0] != 1)) {
					var e2 = 2*err;
					if(e2 > -dy) {
						err -= dy;
						x0 += sx;
					}
					if(e2 < dx) {
						err += dx;
						y0 += sy;
					}
				
					this.mask[y0][x0] = 1;
				}
			}
		}
	}
}

Game.prototype.nextTurn = function() {
	while(this.isNextTurn()) {
		this.teamTurn = (this.teamTurn+1)%2;
		console.log('team turn = ',this.teamTurn);
		for(var i in this.players) {
			if(this.players[i].team == this.teamTurn) {
				this.players[i].actionsLeft += this.actionsLeftMax;
				console.log(this.players[i].id);
			} else {
				this.players[i].actionsLeft = 0;
			}
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


Game.prototype.getObject = function(x, y) {
	for(var i in this.players) {
		if(this.players[i].x == x && this.players[i].y == y) {
			return this.players[i];
		}
	}
	return null;
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
			this.teams[player.team].score++;
		}
	} else {
		for(var i in this.flags) {
			if(this.flags[i].team != player.team
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

Game.prototype.shoot = function(id, idShoot, broadcast) {
	if(id == idShoot) return false;
	for(var i in this.players) {
		if(this.players[i].id == id && this.players[i].actionsLeft >= 5) {
			var me = this.players[i];
			for(var j in this.players) {
				if(this.players[j].id == idShoot) {
					var him = this.players[j];
					if(Math.abs(me.x-him.x)+Math.abs(me.y-him.y) <= me.view
							&& me.team != him.team) {
						
						him.x = him.xspawn;
						him.y = him.yspawn;
						if(him.flag) {
							him.flag.onBase = true;
							him.flag = null;
						}
						him.actionsLeft = -this.actionsLeftMax;
						
						me.actionsLeft -= this.actionsToShoot;
						
						if(him.team == this.myTeam) {
							this.initMask();
						}
						
						this.nextTurn();
						if(broadcast) {
							socket.emit('shoot', {id:id, idShoot:idShoot});
						}
						return true;
					}
				}
			}
		}
	}
	return false;
};

Game.prototype.move = function(id, dx, dy, broadcast) {
	for(var i in this.players) {
		if(this.players[i].id == id && this.players[i].actionsLeft >= 1) {
			var nx = this.players[i].x + dx;
			var ny = this.players[i].y + dy;
			if(this.isCaseFree(nx, ny)) {
				this.players[i].x += dx;
				this.players[i].y += dy;
				if(dx<0) this.players[i].direction = 'L';
				else if(dx>0) this.players[i].direction = 'R';
				else if(dy<0) this.players[i].direction = 'U';
				else this.players[i].direction = 'D';
			
				if(this.players[i].team == this.myTeam) {
					this.initMask();
				}
			
				this.pickFlag(this.players[i]); //always tries to pick flag
			
				this.players[i].actionsLeft--;
				this.nextTurn();
				
				if(broadcast) {
					socket.emit('move', {id:this.players[i].id, dx:dx, dy:dy});
				}
				
				return true;
			}
		}
	}
	return false;
};

//---- Interface class

function Interface(game) {
	this.game = game;
	
	this.NOTHING = 0;
	this.OBJECT_SELECTED = 1;
	this.MY_PLAYER_SELECTED = 2;
	
	this.state = this.NOTHING;
	this.model = null;
};

Interface.prototype.click = function(source) {
	var x = Math.floor(source.x/this.game.caseSize);
	var y = Math.floor(source.y/this.game.caseSize);
	
	switch(this.state) {
		case this.MY_PLAYER_SELECTED:
			console.log('distance',Math.abs(x-this.model.x)+Math.abs(y-this.model.y));
			if(Math.abs(x-this.model.x)+Math.abs(y-this.model.y) <= 1) {
				if(this.game.move(this.model.id, x-this.model.x, y-this.model.y, true))
					break;
			}
			//No break here
			var ennemy = game.getObject(x, y);
			if(ennemy && this.game.shoot(this.model.id, ennemy.id, true)) { //Try to shoot
				break;
			}
			//No break here
		case this.NOTHING: case this.OBJECT_SELECTED:
			this.model = game.getObject(x, y);
			if(this.model) {
				if(this.model.team != null //this.model.team instanceof Player
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

Interface.prototype.drawBackground = function(ctx) {
	for(var i in this.game.map) {
		for(var j in this.game.map[i]) {
			switch(this.game.map[i][j]) {
				case 1:
					ctx.drawImage(img['bloc'], this.game.caseSize*j, this.game.caseSize*i, this.game.caseSize, this.game.caseSize);
					break;
				case 2:
					ctx.drawImage(img['spawn'], this.game.caseSize*j, this.game.caseSize*i, this.game.caseSize, this.game.caseSize);
					break;
				default:
					ctx.drawImage(img['void'], this.game.caseSize*j, this.game.caseSize*i, this.game.caseSize, this.game.caseSize);
			}
			if(!this.game.mask[i][j]) {
				ctx.globalAlpha = 0.5;
				roundRect(ctx, this.game.caseSize*j, this.game.caseSize*i, this.game.caseSize, this.game.caseSize, 0);
				ctx.globalAlpha = 1;
			}
		}
	}
};

Interface.prototype.drawForeground = function(ctx) {
	for(var i in this.game.flags) {
		var flagi = this.game.flags[i];
		if(flagi.onBase)
			ctx.drawImage(img['flag'], this.game.caseSize*flagi.xspawn, this.game.caseSize*flagi.yspawn, this.game.caseSize, this.game.caseSize);
	}
	for(var i in this.game.players) {
		var playeri = this.game.players[i];
		if(playeri.team == this.game.myTeam
				|| this.game.mask[playeri.y][playeri.x]) {
			ctx.drawImage(img['perso'+playeri.direction], this.game.caseSize*playeri.x, this.game.caseSize*playeri.y, this.game.caseSize, this.game.caseSize);
			if(playeri.team == this.game.myTeam) {
				ctx.beginPath();
				ctx.arc((playeri.x+0.5)*this.game.caseSize, (playeri.y+0.5)*this.game.caseSize, 30, 0 , 2 * Math.PI, false);
				ctx.lineWidth = 2;
				ctx.strokeStyle = '#CCC';
				ctx.stroke();
			}
			if(playeri.flag) {
				smallFont();
				ctx.fillText('F', this.game.caseSize*(playeri.x+0.8), this.game.caseSize*(playeri.y+0.2));
			}
		}
	}
};

Interface.prototype.drawOverlay = function(ctx) {
	
	ctx.globalAlpha = 0.5;
	roundRect(ctx, can.width/2-120, can.height-60, 80, 40, 5);
	roundRect(ctx, can.width/2+40, can.height-60, 80, 40, 5);
	ctx.globalAlpha = 1;
	bigFont();
	ctx.fillText(this.game.teams[0].score, can.width/2-80, can.height-40);
	ctx.fillText(this.game.teams[1].score, can.width/2+80, can.height-40);
	
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
var inter = new Interface(game);


ctx.textAlign='center';
ctx.textBaseline='middle';

function bigFont() {
	ctx.font = 'bold 20px Arial';
}

function smallFont() {
	ctx.font = 'bold 14px Arial';
}


function render() {
	if(!game.initialized) {
		stats.begin();
		bigFont();
		ctx.fillText('Waiting for another player...', can.width/2, can.height/2);
		stats.end();
		return;
	}
	ctx.clearRect(0, 0, can.width, can.height);
	stats.begin();
	inter.drawBackground(ctx);
	inter.drawForeground(ctx);
	inter.drawOverlay(ctx);
	stats.end();
};

function coordinates(event){
	//SO http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
	if (event.offsetX !== undefined && event.offsetY !== undefined) { return {x:event.offsetX, y:event.offsetY}; }
	var totalOffset = (function(can) {
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var currentElement = can;
		do {
			totalOffsetX += currentElement.offsetLeft;
			totalOffsetY += currentElement.offsetTop;
		} while(currentElement = currentElement.offsetParent)
		return {x:totalOffsetX,y:totalOffsetY};
	})(can);

	return {
		x:(event.pageX - totalOffset.x),
		y:(event.pageY - totalOffset.y)
	};
}

can.onclick = function(event) {
	inter.click(coordinates(event));
};

(function animloop(){
  requestAnimFrame(animloop);
  render();
})();


var socket = io.connect('http://localhost');
socket.on('init', function (data) {
	console.log(data);
	game.applyGame(data);
	game.initMask();
});
socket.on('move', function(data) {
	game.move(data.id, data.dx, data.dy);
});
socket.on('shoot', function(data) {
	game.shoot(data.id, data.idShoot);
});

})(can);

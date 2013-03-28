//---- Player class

function Player(id, team, x, y, direction) {
	this.id = id;
	this.team = team;
	this.x = x;
	this.y = y;
	this.xspawn = x;
	this.yspawn = y;
	this.view = 4;
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
	this.turnsAloneMax = 6; //For flag
	this.teamTurn = -1;
	this.AIplaying = false;
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
						//FIXME: kill everybody being on spawn zone
						him.x = him.xspawn;
						him.y = him.yspawn;
						if(him.flag) {
							him.flag.onBase = true;
							him.flag = null;
						}
						him.actionsLeft = -this.actionsLeftMax;
						
						me.actionsLeft -= 5;
						
						if(me.team == this.myTeam) {
							this.initMask();
						}
						
						if(this.isNextTurn()) this.nextTurn();
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
				if(this.isNextTurn()) this.nextTurn();
				
				if(broadcast) {
					socket.emit('move', {id:this.players[i].id, dx:dx, dy:dy});
				}
				
				return true;
			}
		}
	}
	return false;
};

// Here server specifics begin

Game.prototype.init = function() {
	this.map = [
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				[0,3,1,0,0,0,1,1,0,0,0,0,0,0],
				[0,1,1,0,2,0,1,1,0,0,1,0,1,0],
				[0,0,0,0,1,0,0,0,0,0,0,0,0,0],
				[0,0,2,0,0,0,1,1,1,0,0,1,0,0],
				[0,0,1,0,0,1,1,1,0,0,0,2,0,0],
				[0,0,0,0,0,0,0,0,0,1,0,0,0,0],
				[0,1,0,1,0,0,1,1,0,2,0,1,1,0],
				[0,0,0,0,0,0,1,1,0,0,0,1,3,0],
				[0,0,0,0,0,0,0,0,0,0,0,0,0,0]
			];
	this.width = this.map[0].length;
	this.height = this.map.length;

	this.mask = new Array(this.map.length);
	for(var i=0;i<this.mask.length;i++) {
		this.mask[i] = new Array(this.map[i].length);
	}

	this.players.push(new Player(0, 0, 4, 2, 'D'));
	this.players.push(new Player(1, 0, 2, 4, 'R'));
	this.players.push(new Player(2, 1, 11, 5, 'L'));
	this.players.push(new Player(3, 1, 9, 7, 'U'));
	
	this.flags.push(new Flag(0, 1, 1));
	this.flags.push(new Flag(1, 12, 8)); //Make sure flag index correspond to team & only 1 flag/team
	
	
	this.teams.push(new Team());
	this.teams.push(new Team());
	
	this.initMask();
	
	this.teamTurn = 1;
	this.nextTurn();
	
	//this.flags.push(null);
	this.initialized = true;
};

exports.Game = Game;

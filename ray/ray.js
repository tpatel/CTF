function Map() {

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
	
	this.mask = new Array(this.map.length);
	for(var i=0;i<this.mask.length;i++) {
		this.mask[i] = new Array(this.map[i].length);
	}
}

Map.prototype.initMask = function(x, y, size) {
	for(var i in this.mask) {
		for(var j in this.mask[i]) {
			this.mask[i][j] = 0;
		}
	}
}

Map.prototype.display = function() {
	var str = '';
	for(var i in this.map) {
		for(var j in this.map[i]) {
			var c = this.map[i][j];
			str += (c == 1 ? '#' : '.');
		}
		str+='\n';
	}
	console.log(str);
}

Map.prototype.displayPosition = function(x, y, size) {
	this.initMask();
	for(var i in this.map) {
		for(var j in this.map[i]) {
			if(Math.abs(y-i)+Math.abs(x-j) < size) {
				//Ray trace
				//console.log(i, j);
				var x0=x, y0=y;
				var dx = Math.abs(x-j);
				var dy = Math.abs(y-i);
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
				/*
				var end = false;
				for(var yi=0;Math.abs(yi-y)<=size && !end && yi>=0 && yi <this.map.length;yi+=deltaY) {
					//console.log(Math.abs(yi-y), deltaY);
					end = false;
					for(var xj=0;Math.abs(yi-y)+Math.abs(xj-x)<=size && xj>=0 && xj <this.map[yi].length;xj+=deltaX) {
						//console.log(this.mask, yi, xj);
						this.mask[yi][xj] = 1;
						if(this.map[yi][xj] ==1) {
							end = true;
							break;
						}
					}
				}*/
			}
		}
	}
	var str = '';
	for(var i in this.map) {
		for(var j in this.map[i]) {
			if(i==y && j==x) {
				str+= '£';
			} else {
				var c = this.map[i][j];
				str += (this.mask[i][j] == 1 ? (c == 1 ? '#' : '.') : ' ');
			}
		}
		str+='\n';
	}
	console.log(str);
}



var m = new Map();
//m.initMask();
m.display();

m.displayPosition(8,3, 8);

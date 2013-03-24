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
	this.width = this.map[0].length;
	this.height = this.map.length;
	
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
	var str = '';
	for(var i in this.map) {
		for(var j in this.map[i]) {
			if(i==y && j==x) {
				str+= '£';
			} else {
				var c = this.map[i][j];
				str += (this.mask[i][j] == 1 ? (c == 1 ? '#' : '.') : '?');
			}
		}
		str+='\n';
	}
	console.log(str);
}



var m = new Map();
//m.initMask();
m.display();

m.displayPosition(3,4, 5);

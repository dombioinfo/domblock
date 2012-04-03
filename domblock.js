function DomBlock () {
	this.ROW = 13;
	this.COL = 14;
	this.map = new Array();
	this.nbDestroyedCube = 0;
	this.zone = new Array();
	this.indexZone = -1;
	this.nbMaxColor = 3;
	
	this.initMap = function(nbMax) {
		this.nbMaxColor = nbMax;
		for (var i=0; i<this.ROW; i++) {
			this.map[i] = new Array();
			for (var j=0; j<this.COL; j++) {
				this.map[i][j] = (Math.round(Math.random()*1000)) % this.nbMaxColor + 1;
				//console.log("map["+i+"]["+j+"] = "+ this.map[i][j]);
			}
		}
	};
	
	/**
	 * 
	 */
	this.initZone = function() {
		var k;
		this.indexZone = -1;
		for (k=0; k<this.ROW*this.COL; k++) {
			this.zone[k] = function() {
				this.i = -1;
				this.j = -1;
			};
		}
	};
	
	/**
	 * @param tab is an 1D-array
	 * @param x
	 * @param y
	 */ 
	this.isIn = function(tab, x, y) {
		var k;
	    for (k=0; k<tab.length; k++) {
	        if (tab[k] && tab[k].i == x && tab[k].j == y) {
	            return 1;
	        }
	    }
	    return 0;
	};
	
	/**
	 * ce n'est pas r�ellement un tri par insertion on fait seulement remonter les zeros
	 */
	this.triInsertionMap = function(colId) {
		var elem;
	   
		for (var i=1; i<this.ROW; ++i) {
			elem = this.map[i][colId];
			for (var j=i; j>0 && elem<1; j--) {
				this.map[j][colId] = this.map[j-1][colId];
			}
			this.map[j][colId] = elem;
		}
	};
	
	/**
	 * @param zone is an 1D-array of size ROWxCOL
	 */
	this.getZone = function(x, y, val) {
	    if (x>=0 && x<this.ROW && y>=0 && y<this.COL) {
	       
	        if (this.map[x][y] == val && !this.isIn(this.zone, x, y)) {
	            this.indexZone++;
	            this.zone[this.indexZone].i = x;
	            this.zone[this.indexZone].j = y;
	        } else {
	            return(this);
	        }
	       
	        // NORD
	        if (!this.isIn(this.zone, x-1, y)) {
	            this.getZone(x-1, y, val);
	        }
	       
	        // SUD
	        if (!this.isIn(this.zone, x+1, y)) {
	        	this.getZone(x+1, y, val);
	        }
	       
	        // EST
	        if (!this.isIn(this.zone, x, y+1)) {
	        	this.getZone(x, y+1, val);
	    	}
	       
	        // OUEST
	        if (!this.isIn(this.zone, x, y-1)) {
	        	this.getZone(x, y-1, val);
	        }
	
	    }

	    return this;
	};
	
	/**
	 * 
	 */
	this.decalageColGaucheMap = function() {
	    var foundValue;
	    var index;
	   
	    index = 0;
	    while (index < this.COL) {
	        // on cherche la premi�re colonne vide => 'index'
	        if (this.map[this.ROW-1][index] == 0) {
	            // on cherche la premi�re colonne non-vide suivante => 'foundValue'
	            foundValue = index+1;
	            while (foundValue < this.COL && this.map[this.ROW-1][foundValue] == 0) {
	                foundValue++;
	            }
	            if (foundValue < this.COL && foundValue > -1) {
	                // on copie toute la colonne 'foundValue' dans la colonne 'index'
	                for (var i=0; i<this.ROW; i++) {
	                    this.map[i][index] = this.map[i][foundValue];
	                    this.map[i][foundValue] = 0;
	                }
	            }
	        }
	        index++;
	    }
	};
	
	/**
	 * 
	 */
	this.updateMap = function() {
		var k;
		
	    // on change les cellules selectionn� en zero
	    for (k=0; k<=this.indexZone; k++) {
	        this.map[this.zone[k].i][this.zone[k].j] = 0;
	    }
	   
	    // on fait remonter les zero par colonnes
	    for (k=0; k<this.COL; k++) {
	        this.triInsertionMap(k);
	    }
	   
	    // on d�cale les colonnes sur la gauche
	    this.decalageColGaucheMap();
		
		this.nbDestroyedCube += (this.indexZone+1);

		// re-init indexZone;
		this.indexZone = -1;
	};
	
	/**
	 * 
	 */
	this.isContinuable = function() {
	    this.indexZone = -1;
	   
	    for (var i=this.ROW-1; i>=0; i--) {
	        for (var j=0; j<this.COL; j++) {
	            this.initZone();
	            if(this.map[i][j] != 0) this.getZone(i, j, this.map[i][j]);
	            if(this.indexZone >= 2) return 1;
	            this.indexZone = -1;
	        }
	    }
	    return 0;
	};
	
	/**
	 * 
	 */
	this.addPenality = function(numPenality, type) {
        // search a empty place
        for (var i=0; i<this.ROW; i++) {
            for(var j=0; j<this.COL; j++) {
                if ((type == Domblock.PENALITY_ADD && this.map[i][j] == 0) || (type == Domblock.PENALITY_MODIFY && this.map[i][j] > 0)) {
                    var previousValue = this.map[i][j];
                    this.map[i][j] = (Math.round(Math.random()*1000)) % this.nbMaxColor + 1;
                    if (type == Domblock.PENALITY_ADD && previousValue == this.map[i][j]) {
                        this.map[i][j] = (this.map[i][j]+1)%this.nbMaxColor + 1;
                    }
                    numPenality--;
                    if (numPenality == 0) {
                        break;
                    }
                }
            } // for COL
            if (numPenality == 0) {
                break;
            }
        } // for ROW
		this.indexZone = -1;
		this.updateMap();
	};
	
	return this;
}

DomBlock.prototype.PENALITY_ADD = 0;
DomBlock.prototype.PENALITY_MODIFY = 1;

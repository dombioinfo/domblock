function Bloc (initPosX, initPosY) {
	// variables de base
	this.posX = (initPosX) ? initPosX : 0;
	this.posY = (initPosY) ? initPosY : 0;
	this.dX = 0; // Math.random()%10;
	this.dY = 0; // Math.random()%10;
	
	this.imgObj = new Image();
	this.imgObj.src = "./res/03_sprite_cube.png";
	this.imgObjHover = new Image();
	this.imgObjHover.src = "./res/03_sprite_cube_hover.png";
	
	// variables sp�cifiques
	this.bHover = false;
	
	this.widthSprite = new Array(40, 40, 40, 40, 40, 40, 40);
	this.heightSprite = new Array(40, 40, 40, 40, 40, 40, 40);
	
	// m�thode de base
	this.display = function(context, spriteIndex, bHover) {
		
		if (spriteIndex != -1 && this.imgObj) {
			var sourceWidth = 40;
	        var sourceHeight = 40;
	        var sourceX = sourceWidth*spriteIndex;
	        var sourceY = 0;
	        var destWidth = sourceWidth;
	        var destHeight = sourceHeight;
	        var destX = this.posX;
	        var destY = this.posY;
	        var img = this.imgObj;
	        if (bHover) {
	        	img = this.imgObjHover;
	        }
			
	        context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

		} else {
			context.fillStyle = "#333333";
			context.fillRect(this.posX, this.posY, 40, 40);
		}
		
		context.save();
		context.translate(this.posX, this.posY);
		
		context.beginPath();
		context.rect(0, 0, 40, 40);
		context.lineWidth = 1;
		context.strokeStyle = "black";
		context.stroke();
		
		context.restore();
		
	};
	
	return this;
}


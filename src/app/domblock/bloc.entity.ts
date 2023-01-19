/**
 * 
 */
export class Bloc {
    imgObj: HTMLImageElement = new Image();
    imgObjHover: HTMLImageElement = new Image();
    bHover: boolean = false;

    widthSprite: number[] = new Array(40, 40, 40, 40, 40, 40, 40);
    heightSprite: number[] = new Array(40, 40, 40, 40, 40, 40, 40);

    constructor(
        public posX: number,
        public posY: number,
        public dX: number = 0,
        public dY: number = 0
    ) {
        // this.imgObj = new Image();
        // this.imgObj.onload = () => {
        //     // console.debug('sprite cube loaded');
        // };
        // this.imgObj.src = "./assets/03_sprite_cube.png";
        // this.imgObjHover = new Image();
        // this.imgObjHover.onload = () => {
        //     // console.debug('sprite hover cube loaded');
        // };
        // this.imgObjHover.src = "./assets/03_sprite_cube_hover.png";
    }

    display(context: CanvasRenderingContext2D, spriteIndex: number, img: ImageBitmap): void {
        if (spriteIndex != -1) {
            let sourceWidth = 40;
            let sourceHeight = 40;
            let sourceX = sourceWidth * spriteIndex;
            let sourceY = 0;
            let destWidth = sourceWidth;
            let destHeight = sourceHeight;
            let destX = this.posX;
            let destY = this.posY;

            // let img = this.imgObj;
            // if (bHover) {
            //     img = this.imgObjHover;
            // }
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
    }
}

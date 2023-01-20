import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { COL, DomblockService, Penality, ROW } from './domblock.service';
import { Bloc } from './bloc.entity';
import { WebsocketService } from './websocket.service';
import { Data, Message, Player } from './player.entity';

const enum Board {
  WIDTH = 560,
  HEIGHT = 520
}

const g_StayingCubeByLevel: number[] = new Array(
  0.88, // niveau 1
  0.90, // niveau 2
  0.92, // etc
  0.94,
  0.96,
  0.88, // niveau 6
  0.90, // niveau 7
  0.92, // etc
  0.94,
  0.96,
  0.88, // niveau 11
  0.90, // niveau 12
  0.92, // etc
  0.94,
  0.96
);

@Component({
  selector: 'app-domblock',
  templateUrl: './domblock.component.html',
  styleUrls: ['./domblock.component.scss'],
  providers: [
    DomblockService,
    { provide: 'nbMaxColor', useValue: 3 },
  ]
})
export class DomblockComponent implements OnInit {
  // nbColor: number = 0;
  isGameOver = false;
  level: number = 0;
  levelView: number = this.level + 1;
  score: number = 0;
  goal: string = '';
  status: string = '';
  pointCube: number = 45;

  blocPenality: number = 0;

  isPause: boolean = false;
  objectList: Bloc[] = new Array();
  userList: Player[] = new Array();
  userListView: string = '';
  @ViewChild('canvas') canvasView!: ElementRef;
  canvas: any;
  context: any;

  sessionId: any;
  hostWs: string = "localhost";
  port: number = 3000;

  constructor(private domblock: DomblockService, private socketService: WebsocketService) {
    // this.socket = new WebSocket('ws://' + this.hostWs + ':' + this.port + '/');
    // this.initSocket(this.hostWs);
    this.sessionId = uuidv4();
    // this.nbColor = domblock.nbMaxColor;
  }

  ngOnInit() {
    console.debug("[ngOnInit] Start");

    this.canvas = document.getElementById('boardgame') as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.socketService.receiveMessage().subscribe((message: string) => {
      console.debug("Received a message from the server!", message);
      let data: Message = JSON.parse(message);
      switch (data.action) {
        case "userlist":
          console.debug("[" + data.action + "]");
          //this.socketService.getUserList(/*data.param*/);
          this.getUserList(data.param);
          break;
        case "bchit":
          console.debug("[" + data.action + "]" + JSON.stringify(data));
          console.debug("data.param.numbloc: " + data.param.numbloc);
          this.domblock.applyPenality(data.param.numbloc, Penality.MODIFY);
          if (!this.domblock.isContinuable()) {
            this.nextLevel();
          }
          this.refresh();
          break;
        default:
          console.warn("Action: '" + data.action + "' is not defined");
          break;
      }
    });
    this.socketService.getUserList().subscribe((userList: Player[]) => {
      this.userList = userList;
    });

    this.run();
    console.debug("[ngOnInit] Stop");
  }

  refresh(): void {
    this.clearContext(this.context, 0, Board.WIDTH, 0, Board.HEIGHT);

    // console.debug("[refresh] objectList.length=" + this.objectList.length);

    for (let i = 0; i < this.objectList.length; i++) {
      let obj: Bloc = this.objectList[i];
      if (!this.isPause) {
        if (obj.posX + obj.dX > Board.WIDTH || obj.posX + obj.dX < 0) {
          obj.dX *= -1;
        }
        if (obj.posY + obj.dY > Board.HEIGHT || obj.posY + obj.dY < 0) {
          obj.dY *= -1;
        }
        obj.posX += obj.dX;
        obj.posY += obj.dY;
      }
      let x = Math.floor(i / COL);
      let y = i % COL;
      obj.display(this.context, this.domblock.map[x][y], this.objectList[i].bHover ? this.domblock.imgHover : this.domblock.img);
    }
    this.updatePane(0, false);
    if (this.isGameOver) {
      this.quit("Game over");
    }
  } // refresh

  clearContext(ctx: CanvasRenderingContext2D, startwidth: number, ctxwidth: number, startheight: number, ctxheight: number): void {
    ctx.clearRect(startwidth, startheight, ctxwidth, ctxheight);
  } // clearContext

  quit(message: string): void {
    this.status = message;
    this.canvas.style.opacity = '0.3';
    // window.document.onkeydown = null;
    // window.document.onmousemove = null;
    // window.document.onclick = null;

  } // quit

  updatePane(numBloc: number, sendStatus: boolean): void {
    let totalCube: number = COL * ROW;
    let goalCalculated: string = this.domblock.nbDestroyedCell + "/" + Math.floor(g_StayingCubeByLevel[this.level] * totalCube);
    this.goal = goalCalculated;

    if (sendStatus && this.socketService != null) {
      let message: object = {
        action: 'hit',
        param: {
          "numbloc": numBloc,
          "level": (this.level + 1),
          "score": this.score,
          "goal": this.goal
        }
      };
      console.debug("[updatePane] message: " + JSON.stringify(message));
      this.socketService.sendMessage(JSON.stringify(message));
    }
  }

  run(): void {
    console.debug("[run] Start");
    // var inputServer = document.getElementById("server");
    // if (inputServer && inputServer !== undefined) {
    // inputServer.value = g_server;
    // }

    this.domblock.initialize();

    for (var i = 0; i < ROW; i++) {
      for (var j = 0; j < COL; j++) {
        let indice: number = i * COL + j;
        this.objectList[indice] = new Bloc(0, 0);
        var indexSprite = this.domblock.map[i][j];
        if (j > 0) {
          this.objectList[indice].posX = j * this.objectList[indice].widthSprite[indexSprite];
        }
        if (i > 0) {
          this.objectList[indice].posY = i * this.objectList[indice].heightSprite[indexSprite];
        }
      }
    }

    this.socketService.sendMessage(JSON.stringify({ action: 'userlist' }));

    this.refresh();
    this.status = 'C\'est parti !';
    console.debug("[run] Stop");
  } // run

  initObject(): void {
    console.debug("[initObject] Start");

    // TODO : manage the unload event
    // if (this.socket === null) {
    //   console.log("[initObject] reconnect");
    //   // this.socket.connect('ws://' + this.hostWs + ':' + this.port);
    // }

    this.canvas.style.opacity = '1';
    this.isGameOver = false;
    this.level = 0;
    this.levelView = this.level + 1;
    this.score = 0;
    this.goal = '';
    this.initHover();

    this.domblock.initialize();

    for (var i = 0; i < ROW; i++) {
      for (var j = 0; j < COL; j++) {

        var indice = i * COL + j;
        this.objectList[indice] = new Bloc(0, 0);
        var indexSprite = this.domblock.map[i][j];
        //console.debug("[initObject] indexSprite = " + indexSprite);
        //console.debug("widthSprite = " + this.objectList[indice].widthSprite[indexSprite]);
        if (j > 0) {
          this.objectList[indice].posX = j * this.objectList[indice].widthSprite[indexSprite];
        }
        if (i > 0) {
          this.objectList[indice].posY = i * this.objectList[indice].heightSprite[indexSprite];
        }
        //console.debug("[initObject] ind=" + indice + " :  [" + this.objectList[indice].posX + ", " + this.objectList[indice].posY + "]");
      }
    }
    console.debug("[initObject] Stop");
  }

  myKeyboard(event: KeyboardEvent): void {
    //console.debug("[keyboard] Start");
    //console.debug("Key = " + event.key);
    if (event.key == "ArrowLeft") { // Fleche de droite 

    } else if (event.key == "Arrowright") { // Fleche de gauche 

    } else if (event.key == "KeyP") { // touche 'p'
      this.isPause = !this.isPause;
    } else if (event.key == "KeyQ") { // touche 'q'
      // on stoppe l'animation
      this.quit("Quit");
    }
    this.refresh();
    //console.debug("[keyboard] Stop");
  }

  myMouseMove(event: MouseEvent | TouchEvent): number[] {
    // console.debug("myMouseEvent");
    let cubeIdRow: number = 0;
    let cubeIdCol: number = 0;
    if (event.target instanceof HTMLCanvasElement) {
      let mouseX = (event as TouchEvent).changedTouches ?
        (event as TouchEvent).changedTouches[0].pageX :
        (event as MouseEvent).pageX;
      let mouseY = (event as TouchEvent).changedTouches ?
        (event as TouchEvent).changedTouches[0].pageY :
        (event as MouseEvent).pageY;
      let rect = this.canvas.getBoundingClientRect();
      mouseX -= rect.left;
      mouseY -= rect.top;

      cubeIdRow = Math.floor(mouseY / 40);
      cubeIdCol = Math.floor(mouseX / 40);
      if (this.domblock.map[cubeIdRow] && this.domblock.map[cubeIdRow][cubeIdCol] && this.domblock.map[cubeIdRow][cubeIdCol] != 0) {
        this.domblock.initZone();
        this.initHover();
        this.domblock.getZone(cubeIdRow, cubeIdCol, this.domblock.map[cubeIdRow][cubeIdCol]);
        //console.debug("[myMouseMove] indexZone = " + this.domblock.indexZone);
        if (this.domblock.indexZone > 1) {
          this.displayScore4Zone(event);
          for (var l = 0; l <= this.domblock.indexZone; l++) {
            var index = this.domblock.zone[l].i * COL + this.domblock.zone[l].j;
            this.objectList[index].bHover = true;
            //console.debug("hover de "+index+" : " + this.objectList[index].bHover);
          }
        }
      }
    }
    this.refresh();
    return new Array(cubeIdRow, cubeIdCol);
  } // myMouseMove

  initHover(): void {
    for (var i = 0; i < this.objectList.length; i++) {
      this.objectList[i].bHover = false;
    }
  }

  displayScore4Zone(event: MouseEvent | TouchEvent) {
    if (event.target instanceof HTMLCanvasElement) {
      let mouseX = (event as TouchEvent).changedTouches ?
        (event as TouchEvent).changedTouches[0].pageX :
        (event as MouseEvent).pageX;
      let mouseY = (event as TouchEvent).changedTouches ?
        (event as TouchEvent).changedTouches[0].pageY :
        (event as MouseEvent).pageY;
      let rect = this.canvas.getBoundingClientRect();
      mouseX -= rect.left;
      mouseY -= rect.top;

      // console.debug("[displayScore4Zone] affiche score du bloc en position : " + mouseX + ", " + mouseY);
      // display the score of zone where mouse is pointing on
      let bonus: number = 0;
      bonus = this.domblock.indexZone / (COL * ROW);
      this.context.save();
      this.context.fillStyle = "#ffffff";
      this.context.font = "30pt Calibri";
      let message = this.domblock.indexZone * Math.floor(this.pointCube * (1 + bonus));
      // console.debug('[displayScore4Zone] message : ', message);
      this.context.fillText('' + (message), mouseX, mouseY);
      this.context.restore();
    }

  } // myMouseOver 

  myClick(event: MouseEvent | TouchEvent): void {
    let a_CoordMouse = this.myMouseMove(event);
    let numBloc: number = -1;
    if (event.target instanceof HTMLCanvasElement) {
      // console.debug("[myClick] " + a_CoordMouse[0] + "; " + a_CoordMouse[1]);
      if (this.domblock.map[a_CoordMouse[0]][a_CoordMouse[1]] != 0) {
        // console.debug("[myClick] indexZone = " + this.domblock.indexZone);
        if (this.domblock.indexZone > 1) {
          numBloc = this.domblock.indexZone + 1;
          let bonus: number = this.domblock.indexZone / (COL * ROW);
          //this.score += this.domblock.indexZone*Math.floor(this.pointCube*(1.5+bonus));
          this.score += 55 + (numBloc - 2) * this.pointCube;
          this.domblock.updateMap();
        }
        this.initHover();
        if (!this.domblock.isContinuable()) {
          this.nextLevel();
        }
        if (numBloc > 2) {
          this.updatePane(numBloc, true);
        }
        this.refresh();
      }
    }
  }

  nextLevel(): void {
    let totalCube: number = COL * ROW;
    if (this.domblock.nbDestroyedCell < Math.floor(g_StayingCubeByLevel[this.level] * totalCube)) {
      this.isGameOver = true;
    } else {
      this.level++;
      this.levelView = this.level + 1;
      this.domblock.nbDestroyedCell = 0;
      this.domblock.nbMaxColor += (this.level % 5 == 0) ? 1 : 0;
      if (this.level == g_StayingCubeByLevel.length) {
        this.quit("End");
      }
      this.run();
    }
  }

  /*********/

  updateServer(objId: string): void {
    let hostView = document.getElementById(objId) as HTMLInputElement;
    if (hostView) {
      // this.initSocket(hostView.value);
    }
  }

  getUserList(playerList: any) {
    console.debug('[getuserlist] Processing user list: ' + JSON.stringify(playerList));
    console.debug("[getuserlist] nombre de sessionId : " + playerList.length);
    //this.userList = this.socketService.getUserList();
    this.userListView = '';
    for (let session in playerList) {
      console.log("[getuserlist] surname: " + playerList[session]);
      // this.userListView += "<li><i class=\"avatar-icon\">&nbsp;</i>" + playerList[session] + "</li>\n";
      this.userListView += '' + playerList[session] + '\n';
    }
    //this.userList = userListHTML;
  }
}

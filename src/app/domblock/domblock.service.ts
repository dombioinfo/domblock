import { Inject, Injectable } from "@angular/core";
import { initialize } from "@ionic/core";

/**
 * 
 */
export const ROW: number = 13;
export const COL: number = 14;

export enum Penality {
    ADD = 0,
    MODIFY = 1
};

type Cell = {
    i: number;
    j: number;
};

@Injectable({
    providedIn: 'root'
})
export class DomblockService {

    map: number[][] = new Array();
    nbDestroyedCell: number = 0;
    zone: Cell[] = new Array();
    indexZone: number = -1;
    img: any;
    imgHover: any;

    constructor(@Inject('nbMaxColor') private nbMaxColor: number = 3) {
        this.img = new Image();
        this.img.onload = () => {
            console.debug('sprite hover cube loaded');
        };
        this.img.src = "./assets/03_sprite_cube.png";
        this.imgHover = new Image();
        this.imgHover.onload = () => {
            console.debug('sprite hover cube loaded');
        };
        this.imgHover.src = "./assets/03_sprite_cube_hover.png";

        this.initialize();
    }

    initialize(): void {
        this.nbDestroyedCell = 0;
        this.initMap();
        this.initZone();
    }

    initMap(): void {
        for (var i = 0; i < ROW; i++) {
            this.map[i] = new Array();
            for (var j = 0; j < COL; j++) {
                this.map[i][j] = (Math.round(Math.random() * 1000)) % this.nbMaxColor + 1;
                //console.log("map["+i+"]["+j+"] = "+ this.map[i][j]);
            }
        }
    }

    /**
     * 
     */
    initZone(): void {
        let k: number;
        this.indexZone = -1;
        for (k = 0; k < ROW * COL; k++) {
            this.zone[k] = { i: -1, j: -1 };
        }
    }

    /**
     * 
     * @param tab is an 1D-array
     * @param x 
     * @param y 
     * @returns 
     */
    isIn = function (tab: Cell[], x: number, y: number) {
        let k: number;
        for (k = 0; k < tab.length; k++) {
            if (tab[k] && tab[k].i == x && tab[k].j == y) {
                return 1;
            }
        }
        return 0;
    }

    /**
     * Ce n'est pas réellement un tri par insertion, on fait seulement remonter les zéros
     * @param colId 
     */
    triInsertionMap(colId: number): void {
        let elem: number;

        for (var i = 1; i < ROW; ++i) {
            elem = this.map[i][colId];
            for (var j = i; j > 0 && elem < 1; j--) {
                this.map[j][colId] = this.map[j - 1][colId];
            }
            this.map[j][colId] = elem;
        }
    }

    /**
     * 
     * @param x 
     * @param y 
     * @param val 
     * @returns 
     */
    getZone(x: number, y: number, val: number): void {
        if (x >= 0 && x < ROW && y >= 0 && y < COL) {

            if (this.map[x][y] == val && !this.isIn(this.zone, x, y)) {
                this.indexZone++;
                this.zone[this.indexZone].i = x;
                this.zone[this.indexZone].j = y;
            } else {
                return;
            }

            // NORTH
            if (!this.isIn(this.zone, x - 1, y)) {
                this.getZone(x - 1, y, val);
            }

            // SOUTH
            if (!this.isIn(this.zone, x + 1, y)) {
                this.getZone(x + 1, y, val);
            }

            // EAST
            if (!this.isIn(this.zone, x, y + 1)) {
                this.getZone(x, y + 1, val);
            }

            // WEST
            if (!this.isIn(this.zone, x, y - 1)) {
                this.getZone(x, y - 1, val);
            }
        }
        return;
        // return this;
    }

    /**
     * 
     */
    decalageColGaucheMap(): void {
        let foundValue: number;
        let index: number;

        index = 0;
        while (index < COL) {
            // on cherche la premiere colonne vide => 'index'
            if (this.map[ROW - 1][index] == 0) {
                // on cherche la premiere colonne non-vide suivante => 'foundValue'
                foundValue = index + 1;
                while (foundValue < COL && this.map[ROW - 1][foundValue] == 0) {
                    foundValue++;
                }
                if (foundValue < COL && foundValue > -1) {
                    // on copie toute la colonne 'foundValue' dans la colonne 'index'
                    for (var i = 0; i < ROW; i++) {
                        this.map[i][index] = this.map[i][foundValue];
                        this.map[i][foundValue] = 0;
                    }
                }
            }
            index++;
        }
    }

    /**
     * 
     */
    updateMap(): void {
        let k: number;

        // on change les cellules selectionné en zero
        for (k = 0; k <= this.indexZone; k++) {
            this.map[this.zone[k].i][this.zone[k].j] = 0;
        }

        // on fait remonter les zero par colonnes
        for (k = 0; k < COL; k++) {
            this.triInsertionMap(k);
        }

        // on décale les colonnes sur la gauche
        this.decalageColGaucheMap();

        this.nbDestroyedCell += (this.indexZone + 1);

        // re-init indexZone;
        this.indexZone = -1;
    }

    /**
     * 
     * @returns boolean
     */
    isContinuable(): boolean {
        this.indexZone = -1;

        for (var i = ROW - 1; i >= 0; i--) {
            for (var j = 0; j < COL; j++) {
                this.initZone();
                if (this.map[i][j] != 0) this.getZone(i, j, this.map[i][j]);
                if (this.indexZone >= 2) return true;
                this.indexZone = -1;
            }
        }
        return false;
    }

    applyPenality(numPenality: number, type: number): void {
        switch (type) {
            case Penality.MODIFY:
                this._penalityModify(numPenality);
                break;
            case Penality.ADD:
                this._penalityAdd(numPenality);
                break;
            default:
                console.log("[addPenality] This type '" + type + "' does not exist.");
                break;
        }
    }

    /**
     * 
     * @param numPenality 
     */
    private _penalityAdd(numPenality: number): void {
        // search a place to apply penality
        for (var i = ROW - 1; i >= 0; i--) {
            for (var j = COL - 1; j >= 0; j--) {
                if (this.map[i][j] == 0) {
                    this.map[i][j] = (Math.round(Math.random() * 1000)) % this.nbMaxColor + 1;
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
    }

    private _penalityModify(numPenality: number): void {
        // search a place to apply penality
        var stayedCube = (ROW * COL) - this.nbDestroyedCell;
        var limit = (numPenality < stayedCube) ? numPenality : stayedCube;

        var i = 0;
        while (i < limit) {
            var x = (Math.round(Math.random() * 1000)) % ROW;
            var y = (Math.round(Math.random() * 1000)) % COL;
            console.debug("[_penalityModify] x: " + x + " et y: " + y);
            console.debug("[_penalityModify] et map[x][y]: " + this.map[x][y]);
            while (this.map[x][y] <= 0) {
                if (this.map[ROW - 1][y] != 0) x++;
                else y--;
            }
            var previousValue = this.map[x][y];
            this.map[x][y] = (Math.round(Math.random() * 1000)) % this.nbMaxColor + 1;
            if (previousValue == this.map[x][y]) {
                this.map[x][y] = (this.map[x][y] + 1) % this.nbMaxColor + 1;
            }
            if (numPenality == 0) {
                break;
            }
            i++;
        } // while
        this.indexZone = -1;
        this.updateMap();
    }
}


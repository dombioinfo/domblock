import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { Player } from './player.entity';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    constructor(private socket: Socket) { }

    sendMessage(message: string) {
        this.socket.emit('message', message);
    }

    receiveMessage() : Observable<string>{
        return this.socket.fromEvent('message');
    }

    getUserList(): Observable<Player[]> {
        return this.socket.fromEvent('userlist');
    }
}

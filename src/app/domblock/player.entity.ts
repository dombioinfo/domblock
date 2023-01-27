export class Message {
    action: string = '';
    param: any;
}

export class Data {
    numbloc: number = 0;
    level: number = 0;
    score: number = 0;
    goal: string = '';
}

export class Player {
    data!: Data;
    status: string = '';
    surname: string = '';
}

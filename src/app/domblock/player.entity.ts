export type Message = {
    action: string,
    param: any
}

export type Data = {
    numbloc: number,
    level: number,
    score: number,
    goal: string
}

export class Player {
    data!: Data;
    status: string = '';
    surname: string = '';
}

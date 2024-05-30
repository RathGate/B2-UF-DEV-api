class Game {
    constructor(
        public fen: string,
        public history: string,
        public rounds: number,
        public score_id: number,
        public start_date?: Date,
        public end_date?: Date,
    ) {}
}

export default Game;
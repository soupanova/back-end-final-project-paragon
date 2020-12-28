module.exports = {
    /**
     * Server sends this to client when an error has occurred.
     * An additional "error" property will be available in the message.
     */
    ERROR: 'ERROR',
    /**
     * Client sends this when a player wants to create a new game.
     * Server should respond with the same action (as sucess confirmation)
     * or an "ERROR".
     */
    CREATE_AND_JOIN_GAME: 'CREATE_AND_JOIN_GAME',
    /**
     * Client sends this when a player wants to join a specific
     * existing game. Server should respond with the same
     * action (as success confirmation) or an "ERROR".
     */
    JOIN_GAME: 'JOIN_GAME',
    /**
     * Server sends this when the game has begun
     * (after the "readying" period).
     */
    GAME_STARTED: 'GAME_STARTED',
    /**
     * Server sends this whilst the first question
     * ("Whose fact is it?") is being shown and counted down.
     */
    GUESS_WHO_TIMER: 'GUESS_WHO_TIMER',
    /**
     * Server sends this to after the first question's countdown
     * ("Whose fact is it?") has finished. Clients should respond
     * with users' answers.
     */
    GUESS_WHO_CHOICE: 'GUESS_WHO_CHOICE',
    REVEAL_WHO_TIMER: 'REVEAL_WHO_TIMER',
    REVEAL_WHO: 'REVEAL_WHO',
    GUESS_FAKE_FACT_TIMER: 'GUESS_FAKE_FACT_TIMER',
    GUESS_FAKE_FACT_CHOICE: 'GUESS_FAKE_FACT_CHOICE',
    REVEAL_FAKE_FACT_TIMER: 'REVEAL_FAKE_FACT_TIMER',
    REVEAL_FAKE_FACT: 'REVEAL_FAKE_FACT',
    PODIUM: 'PODIUM',
    ANSWER: 'ANSWER',
}

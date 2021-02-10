module.exports = {
    /**
     * Server sends this to client when an error has occurred.
     * An additional "error" property will be available in the message.
     */
    ERROR: 'ERROR',
    /**
     * Specific error when a client has requested a game to be created
     * but an error occurred during creation.
     */
    ERROR_GAME_NOT_CREATED: 'ERROR_GAME_NOT_CREATED',
    /**
     * Specific error when a client has requested to join a game
     * but an error occurred whilst adding the player.
     *
     * (For example, an error should occur if a player tries to join a game that's already started.)
     */
    ERROR_GAME_NOT_JOINED: 'ERROR_GAME_NOT_JOINED',
    /**
     * Specific error that can occur at the end of the readying period. (For example, if there aren't enough
     * players.)
     */
    ERROR_GAME_NOT_STARTED: 'ERROR_GAME_NOT_STARTED',
    /**
     * Specific error when a client has submitted an answer, but an error occurred
     * whilst updating the client's answer on the server.
     */
    ERROR_ANSWER_NOT_UPDATED: 'ERROR_ANSWER_NOT_UPDATED',
    /**
     * Client sends this when a player wants to create a new game.
     * Server should respond with the same action (as sucess confirmation)
     * or "ERROR_GAME_NOT_CREATED".
     */
    CREATE_AND_JOIN_GAME: 'CREATE_AND_JOIN_GAME',
    /**
     * Client sends this when a player wants to join a specific
     * existing game. Server should respond with the same
     * action (as success confirmation) or "ERROR_GAME_NOT_JOINED".
     */
    JOIN_GAME: 'JOIN_GAME',
    JOIN_DUMMY_GAME: 'JOIN_DUMMY_GAME',
    LOBBY: 'LOBBY',

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
    REVEAL_WHO_TIMER: 'REVEAL_WHO_TIMER',
    REVEAL_WHO: 'REVEAL_WHO',
    GUESS_WHICH_FACT_TIMER: 'GUESS_WHICH_FACT_TIMER',
    REVEAL_WHICH_FACT_TIMER: 'REVEAL_WHICH_FACT_TIMER',
    REVEAL_WHICH_FACT: 'REVEAL_WHICH_FACT',
    PODIUM: 'PODIUM',
    ANSWER: 'ANSWER',
}

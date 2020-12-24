'use-strict'

const { v4: uuidv4 } = require('uuid')
const { STATE } = require('../../constants/game')
const factsGamePlayer = require('../factsGamePlayer/factsGamePlayer')

/**
 * Returns a game object in its "initial" state (i.e. before any
 * players have been added to it).
 */
module.exports.createNewGame = ({ totalRounds = 5 } = {}) => {
    if (
        'number' !== typeof totalRounds ||
        totalRounds < 1 ||
        0 !== totalRounds % 1
    ) {
        throw new Error(
            `totalRounds must be a whole number above 0. totalRounds = ${totalRounds}`
        )
    }

    return {
        gameId: uuidv4(),
        createdAt: Date.now(),
        state: STATE.READYING,
        totalRounds,
        currentRound: null,
        players: [],
        currentTurnId: null,
    }
}

/**
 * Takes in a game object and a player and returns a copy of the game
 * with the player added to it.
 */
module.exports.addPlayerToGame = (game, playerDetails) => {
    // If using a DB that allows conditional updates,
    // then use conditional expressions.
    // Problem with approach below is we may be acting on stale information.
    if (game.state !== STATE.READYING) {
        throw new Error(
            `Cannot join a game unless its state is ${STATE.READYING}. Game state = ${game.state}`
        )
    }

    const newPlayer = factsGamePlayer.createNewPlayer(playerDetails)

    return {
        ...game,
        players: [...game.players.map((player) => ({ ...player })), newPlayer],
    }
}

/**
 * Takes in an "unstarted" game object and returns a "started" copy of it
 * with certain properties updated.
 */
module.exports.startExistingGame = (game) => {
    return {
        ...game,
        state: STATE.IN_PROGRESS,
        players: game.players
            .map((value) => ({ value, sortBy: Math.random() }))
            .sort((a, b) => a.sortBy - b.sortBy)
            .map(({ value }) => ({ ...value })),
    }
}

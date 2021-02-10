// @ts-check
'use strict'

const { getGame } = require('./getGame')

/**
 * Gets the socket IDs currently connected to a specific game.
 */
module.exports.getSocketIdsForGame = async ({ gameId }) => {
    const game = await getGame({ gameId })
    return Object.values(game.players).map(({ socketId }) => socketId)
}

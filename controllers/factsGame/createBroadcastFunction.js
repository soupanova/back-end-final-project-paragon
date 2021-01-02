// @ts-check
'use strict'

const {
    getSocketIdsForGame,
} = require('../../models/factsGame/getSocketIdsForGame')

/**
 * Returns a function which can broadcast a given message to all players in the game.
 * This function doesn't re-fetch players' socketIds.
 *
 * @param {{ gameId: string, broadcastFunc: (d: any, sIds: string[]) => void, socketIds?: string[] }} options
 */
module.exports.createBroadcastFunction = async ({
    gameId,
    broadcastFunc,
    socketIds,
}) => {
    if (undefined === socketIds) {
        socketIds = await getSocketIdsForGame({ gameId })
    }
    return function broadcastToGamePlayers(data) {
        broadcastFunc(data, socketIds)
    }
}

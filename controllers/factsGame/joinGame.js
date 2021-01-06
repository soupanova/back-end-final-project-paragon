// @ts-check
'use strict'

const { addPlayerToGame } = require('../../models/factsGame/addPlayerToGame')
const { createNewPlayer } = require('../../models/factsGame/createNewPlayer')
const { createNewGame } = require('../../models/factsGame/createNewGame')
const { v4: uuidv4 } = require('uuid')

/**
 * Create the game (with creator) and write to database.
 */
module.exports.joinGame = async ({ playerDetails, gameId }) => {
    try {
        const player = createNewPlayer(playerDetails)
        const game = await addPlayerToGame({ gameId, player })
        return { game }
    } catch (err) {
        console.error('Failed to join game', err)
        return { error: 'Failed to join game' }
    }
}

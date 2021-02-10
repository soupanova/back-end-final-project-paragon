// @ts-check
'use strict'

const { createNewGame } = require('../../models/factsGame/createNewGame')
const { createNewPlayer } = require('../../models/factsGame/createNewPlayer')

/**
 * Create the game (with creator) and write to database.
 */
module.exports.createGame = async ({ creatorDetails, totalRounds }) => {
    try {
        const creator = createNewPlayer(creatorDetails)
        const game = await createNewGame({ creator, totalRounds })
        return { game }
    } catch (err) {
        console.error('Failed to create game', err)
        return { error: 'Failed to create game' }
    }
}

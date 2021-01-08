// @ts-check
'use strict'

const { addPlayerToGame } = require('../../models/factsGame/addPlayerToGame')
const { createNewPlayer } = require('../../models/factsGame/createNewPlayer')
const { getGame } = require('../../models/factsGame/getGame')
const { v4: uuidv4 } = require('uuid')
const { STATE } = require('../../constants/game')

/**
 * Create the game (with creator) and write to database.
 */
module.exports.joinGame = async ({ playerDetails, gameId }) => {
    try {
        const player = createNewPlayer(playerDetails)
        const game = await addPlayerToGame({ gameId, player })
        return { game }
    } catch (err) {
        let error = 'Failed to join game.'
        if ('ConditionalCheckFailedException' === err.name) {
            const game = await getGame({ gameId })
            if (STATE.READYING !== game.status) {
                error = 'Sorry, this particular game can no longer be joined.'
            }
        }
        return { error }
    }
}

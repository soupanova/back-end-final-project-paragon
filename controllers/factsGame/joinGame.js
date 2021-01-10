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

        switch (err.name) {
            case 'ResourceNotFoundException':
                error = "This particular game doesn't seem to exist."
                break
            case 'ConditionalCheckFailedException': {
                const game = await getGame({ gameId })
                if (STATE.READYING !== game.status) {
                    error = 'This particular game can no longer be joined.'
                }
                break
            }
        }

        return { error }
    }
}

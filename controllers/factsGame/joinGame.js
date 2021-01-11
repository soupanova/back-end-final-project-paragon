// @ts-check
'use strict'

const { addPlayerToGame } = require('../../models/factsGame/addPlayerToGame')
const { createNewPlayer } = require('../../models/factsGame/createNewPlayer')
const { getGame } = require('../../models/factsGame/getGame')
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
        console.error('Failed to join game', err)

        let errorMessage = 'Failed to join game.'

        if ('ConditionalCheckFailedException' === err.name) {
            const game = await getGame({ gameId })

            if (!game) {
                errorMessage =
                    "Sorry, this particular game doesn't seem to exist."
            } else if (game.status !== STATE.READYING) {
                errorMessage =
                    'Sorry, this particular game has started and can no longer be joined.'
            }
        }

        return { error: errorMessage }
    }
}

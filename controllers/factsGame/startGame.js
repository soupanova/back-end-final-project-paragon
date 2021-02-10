// @ts-check
'use strict'

const { startGame } = require('../../models/factsGame/startGame')
const {
    initialiseQuestions,
} = require('../../models/factsGame/initialiseQuestions')
const { getGame } = require('../../models/factsGame/getGame')

/**
 * Mark the game as having started and initialise its questions.
 */
module.exports.startGame = async ({ gameId }) => {
    try {
        const game = await startGame({ gameId })
        await initialiseQuestions(game)
        return { game }
    } catch (error) {
        console.log('Failed to start game', error)

        let errorMessage = 'Failed to start game'

        if ('ConditionalCheckFailedException' === error.name) {
            const game = await getGame({ gameId })
            const playerCount = Object.keys(game.players).length
            if (playerCount < game.totalRounds) {
                errorMessage = `Sorry, not enough players joined this game to play ${game.totalRounds} rounds.`
            }
        }

        return { error: errorMessage }
    }
}

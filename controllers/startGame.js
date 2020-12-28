// @ts-check
'use strict'

const { startGame } = require('../models/factsGame/startGame')
const {
    initialiseQuestions,
} = require('../models/factsGame/initialiseQuestions')

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
        return { error: 'Failed to start game' }
    }
}

'use strict'

const { v4: uuidv4 } = require('uuid')
const { playerSchema } = require('../schemas/readying')
/**
 * Takes in player details and returns a player object containing
 * those details.
 */
module.exports.createNewPlayer = (playerDetails = {}) => {
    /**
     * Shuffle up the order of the lie and fact, so that the lie is not always
     * in the same place (when it's shown to the user).
     */
    const shuffledFactAndLie =
        Math.random() < 0.5
            ? [playerDetails.fact, playerDetails.lie]
            : [playerDetails.lie, playerDetails.fact]

    const createdPlayer = {
        connected: true,
        score: 0,
        shuffledFactAndLie,
        currentAnswer: null,
        ...playerDetails,
    }

    const { error } = playerSchema.validate(createdPlayer)
    if (error) {
        throw error
    }

    return createdPlayer
}

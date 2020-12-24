'use-strict'

const { v4: uuidv4 } = require('uuid')

/**
 * Takes in player details and returns a player object containing
 * those details.
 */
module.exports.createNewPlayer = (playerDetails) => {
    /**
     * Shuffle up the order of the lie and fact, so that the lie is not always
     * in the same place (when it's shown to the user).
     */
    const shuffledFactAndLie =
        Math.random() < 0.5
            ? [playerDetails.fact, playerDetails.lie]
            : [playerDetails.lie, playerDetails.fact]

    const initialValue = {
        connected: true,
        playerId: uuidv4(), // Might need to take this in as arg, if it comes from authentication.
        score: 0,
        shuffledFactAndLie,
        currentAnswer: null,
    }

    /**
     * Add required properties to player. If they're missing, throw an error.
     */
    const requiredProperties = ['socketId', 'displayName', 'fact', 'lie']
    const createdPlayer = requiredProperties.reduce((acc, property) => {
        const value = playerDetails[property]
        const valueIsInvalid = 'string' !== typeof value && !value

        if (valueIsInvalid) {
            throw new Error(
                `Value for property "${property}" is invalid. Value = ${value}`
            )
        }
        return { ...acc, [property]: value }
    }, initialValue)

    return createdPlayer
}

module.exports.incrementPlayerScore = (player) => {}

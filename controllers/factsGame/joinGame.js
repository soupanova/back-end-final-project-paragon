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

/**
 * Create the game (add some players) and write to database.
 */
module.exports.joinDummyGame = async ({ playerDetails, gameId }) => {
    const [creator, ...otherPlayers] = Array.from({ length: 2 }, (_, i) => {
        return createNewPlayer({
            playerId: uuidv4(),
            fact: `Player ${i} fact`,
            lie: `Player ${i} lie`,
            displayName: `Player ${i}`,
        })
    })

    try {
        await createNewGame({ gameId, creator, totalRounds: 2 })

        for (const player of otherPlayers) {
            await addPlayerToGame({ gameId, player })
        }

        const player = createNewPlayer(playerDetails)
        const game = await addPlayerToGame({ gameId, player })
        return { game }
    } catch (err) {
        console.error('Failed to join game', err)
        return { error: 'Failed to join game' }
    }
}

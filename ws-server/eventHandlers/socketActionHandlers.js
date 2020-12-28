// @ts-check
'use strict'

const { startGame } = require('../../controllers/startGame')
const { createGame } = require('../../controllers/createGame')
const { playGame } = require('../../controllers/playGame')
const { joinGame } = require('../../controllers/joinGame')

const actions = require('../../constants/actions')
const {
    createBroadcastFunction,
} = require('../../controllers/createBroadcastFunction')
const { deleteGame } = require('../../models/factsGame/deleteGame')
const {
    updateCurrentAnswer,
} = require('../../models/factsGame/updateCurrentAnswer')

const delay = (seconds) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

module.exports = {
    async CREATE_AND_JOIN_GAME({ data, sendData, broadcastData, socketId }) {
        if (data.gameId) {
            return console.warn(
                `Request for new game shouldn't already contain a "gameId".`,
                data
            )
        }

        const { totalRounds = 1, readyingDuration = 2 } = data

        let gameId
        /**
         * Try to create the game.
         */
        {
            const { game, error } = await createGame({
                creatorDetails: {
                    ...data.player,
                    socketId,
                },
                totalRounds,
            })
            if (error) {
                sendData({ action: actions.ERROR, gameId: 'none', error })
                return
            }
            gameId = game.gameId
            sendData({ action: data.action, gameId })
        }

        console.log('Waiting for players to join')
        await delay(readyingDuration)

        /**
         * Try to start the game.
         */
        {
            const { error } = await startGame({ gameId })
            if (error) {
                const broadcastToGame = await createBroadcastFunction({
                    gameId,
                    broadcastFunc: broadcastData,
                })
                broadcastToGame({ gameId, action: actions.ERROR, error })
                try {
                    await deleteGame({ gameId })
                } catch (error) {
                    console.error(error)
                }
                return
            }
        }
        const broadcastToGame = await createBroadcastFunction({
            gameId,
            broadcastFunc: broadcastData,
        })
        broadcastToGame({ gameId, action: actions.GAME_STARTED })

        /**
         * Try to play the game.
         */
        {
            const { error } = await playGame({ gameId, broadcastToGame })
            if (error) {
                broadcastToGame({ gameId, action: actions.ERROR, error })
                return
            }
        }
    },

    async JOIN_GAME({ data, sendData, socketId }) {
        const { gameId } = data

        // Check here if data is good.
        const { error } = await joinGame({
            gameId,
            playerDetails: {
                ...data.player,
                socketId,
            },
        })

        if (error) {
            sendData({
                action: actions.ERROR,
                gameId,
                error: 'Failed to join game',
            })
            return
        }

        sendData({ action: actions.JOIN_GAME, gameId })
    },

    async ANSWER({ data, sendData }) {
        const { gameId, playerId, choice } = data

        try {
            await updateCurrentAnswer({ gameId, playerId, choice })
        } catch (err) {
            sendData({
                action: actions.ERROR,
                gameId,
                error: 'Failed to update answer',
            })
        }
        sendData({ action: actions.ANSWER, gameId, choice })
    },

    $default({ data }) {
        console.error('Unexpected message', data)
    },
}

// @ts-check
'use strict'

const { startGame } = require('../../controllers/factsGame/startGame')
const { createGame } = require('../../controllers/factsGame/createGame')
const { playGame } = require('../../controllers/factsGame/playGame')
const { joinGame } = require('../../controllers/factsGame/joinGame')
const {
    broadcastForNSeconds,
} = require('../../controllers/factsGame/broadcastForNSeconds')

const actions = require('../../constants/actions')
const {
    createBroadcastFunction,
} = require('../../controllers/factsGame/createBroadcastFunction')
const { deleteGame } = require('../../models/factsGame/deleteGame')
const {
    updateCurrentAnswer,
} = require('../../models/factsGame/updateCurrentAnswer')

const { delay } = require('../../controllers/factsGame/delay')
const { SOCKET_ID_PROPERTY } = require('../../constants/websocket')

const socketActionHandlers = {
    async CREATE_AND_JOIN_GAME({ data, sendData, broadcastData, socketId }) {
        if (data.gameId) {
            return console.warn(
                `Request for new game shouldn't already contain a "gameId".`,
                data
            )
        }
        console.log({ data })
        const { rounds: totalRounds, readyingDuration = 10 } = data
        console.log(totalRounds)
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
            // sendData({ action: data.action, gameId })
        }
        await delay(1)
        console.log('Waiting for players to join')

        {
            const broadcastToGame = await createBroadcastFunction({
                gameId,
                broadcastFunc: broadcastData,
            })
            await broadcastForNSeconds({
                broadcastFunc: (secondsLeft) => {
                    broadcastToGame({
                        gameId,
                        action: actions.LOBBY,
                        secondsLeft,
                    })
                },
                totalSeconds: readyingDuration,
            })

            console.log(
                `Finished waiting for players to join ${readyingDuration}`
            )
        }
        // await delay(3)
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
                    console.log(`Game with gameID ${gameId} has been deleted`)
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

        // await delay(1)

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
            console.error(err)
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

const tryToParseJson = (json) => {
    try {
        return { parsed: JSON.parse(json) }
    } catch (err) {
        return { parsingError: err.message }
    }
}

const createSendDataFunction = (socket) => {
    return function sendData(dataToSend) {
        if (!dataToSend.gameId) {
            console.warn('gameId missing', dataToSend)
        }
        const serialised = JSON.stringify(dataToSend, null, 2)
        socket.send(serialised)
        console.log('Sent back', serialised)
    }
}

module.exports.registerActionHandlers = (socket, broadcastData) => {
    const sendData = createSendDataFunction(socket)

    socket.on('message', (rawData) => {
        const { parsed, parsingError } = tryToParseJson(rawData)
        if (parsingError) {
            console.log('Malformed message', rawData)
            return sendData({ action: 'ERROR', error: parsingError })
        }
        console.log('Received', parsed)

        const messageDoesntHaveGameIdButShould =
            !parsed.gameId && parsed.action !== actions.CREATE_AND_JOIN_GAME
        if (messageDoesntHaveGameIdButShould) {
            console.warn('No game ID', parsed)
            return sendData({
                action: 'ERROR',
                error: 'gameId missing',
                received: rawData,
            })
        }

        try {
            const handler =
                socketActionHandlers[parsed.action] ??
                socketActionHandlers.$default

            handler({
                data: parsed,
                sendData,
                broadcastData,
                socketId: socket[SOCKET_ID_PROPERTY],
            })
        } catch (err) {
            console.warn(`Error whilst handling ${parsed.action}`)
            console.error(err)
        }
    })
}

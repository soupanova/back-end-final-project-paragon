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
const { v4: uuidv4 } = require('uuid')
const { addPlayerToGame } = require('../../models/factsGame/addPlayerToGame')
const { createNewPlayer } = require('../../models/factsGame/createNewPlayer')
const { getGame } = require('../../models/factsGame/getGame')

const socketActionHandlers = {
    async CREATE_AND_JOIN_GAME({
        data,
        sendData,
        broadcastData,
        socketId,
        onCreate,
    }) {
        if (data.gameId) {
            return console.warn(
                `Request for new game shouldn't already contain a "gameId".`,
                data
            )
        }
        const { rounds: totalRounds, readyingDuration = 30 } = data

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
                sendData({
                    action: actions.ERROR_GAME_NOT_CREATED,
                    gameId: 'none',
                    error,
                })
                return
            }
            gameId = game.gameId
            sendData({
                action: actions.CREATE_AND_JOIN_GAME,
                gameId: gameId,
            })
            if ('function' === typeof onCreate) {
                onCreate({ gameId })
            }
        }
        await delay(1)

        {
            console.log('Waiting for players to join')
            await broadcastForNSeconds({
                async broadcastFunc(secondsLeft) {
                    /**
                     * Created on each invocation as players will be joining during this stage
                     * and having a stale/fixed reference to socketIds would mean a player who's just
                     * joined would not receive the LOBBY event (the game would just hang for them
                     * until the game starts).
                     */

                    const game = await getGame({ gameId })

                    const players = Object.values(game.players)

                    const playersDisplayNames = players.map(
                        ({ displayName }) => displayName
                    )
                    const playersSocketIds = players.map(
                        ({ socketId }) => socketId
                    )

                    broadcastData(
                        {
                            gameId,
                            action: actions.LOBBY,
                            secondsLeft,
                            players: playersDisplayNames,
                        },
                        playersSocketIds
                    )
                },
                totalSeconds: readyingDuration,
            })

            console.log(
                `Finished waiting ${readyingDuration} seconds for players to join.`
            )
        }
    },

    async START_GAME({ data, broadcastData }) {
        const { gameId } = data

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
                broadcastToGame({
                    gameId,
                    action: actions.ERROR_GAME_NOT_STARTED,
                    error,
                })
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

        await delay(3)

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
                action: actions.ERROR_GAME_NOT_JOINED,
                gameId,
                error,
            })
            return
        }

        sendData({ action: actions.JOIN_GAME, gameId })
    },

    async JOIN_DUMMY_GAME({ data, socketId, sendData, broadcastData }) {
        console.log('JOIN_DUMMY_GAME running', { data })

        const [creator, ...otherPlayers] = Array.from({ length: 2 }, (_, i) => {
            return {
                playerId: uuidv4(),
                fact: `Player #${i}'s fact`,
                lie: `Player #${i}'s lie`,
                displayName: `Player #${i}`,
                socketId: uuidv4(),
            }
        })

        const gameId = await new Promise((resolve) => {
            socketActionHandlers.CREATE_AND_JOIN_GAME({
                data: {
                    action: actions.CREATE_AND_JOIN_GAME,
                    rounds: 3,
                    player: {
                        displayName: creator.displayName,
                        fact: creator.fact,
                        lie: creator.lie,
                        playerId: creator.playerId,
                    },
                },
                sendData: ({}) => void 0,
                socketId: creator.socketId,
                broadcastData,
                onCreate: ({ gameId }) => {
                    console.log('Hooked into game successfully', { gameId })
                    resolve(gameId)
                },
            })
        })

        for (const playerArgs of otherPlayers) {
            const player = createNewPlayer(playerArgs)
            await addPlayerToGame({ gameId, player })
        }

        const joinedPlayer = createNewPlayer({
            ...data.player,
            socketId,
        })
        await addPlayerToGame({ gameId, player: joinedPlayer })

        sendData({ action: actions.JOIN_GAME, gameId })
    },

    async ANSWER({ data, sendData }) {
        const { gameId, playerId, choice } = data

        try {
            await updateCurrentAnswer({ gameId, playerId, choice })
        } catch (err) {
            console.error(err)
            sendData({
                action: actions.ERROR_ANSWER_NOT_UPDATED,
                gameId,
                error:
                    "Sorry, failed to update answer! (It's not you, it's us.)",
            })
            return
        }
        sendData({ action: actions.ANSWER, gameId, choiceId: choice })
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
            return sendData({ action: actions.ERROR, error: parsingError })
        }
        console.log('Received', parsed)

        const messageDoesntHaveGameIdButShould =
            !parsed.gameId &&
            parsed.action !== actions.CREATE_AND_JOIN_GAME &&
            parsed.action !== actions.JOIN_DUMMY_GAME

        if (messageDoesntHaveGameIdButShould) {
            console.warn('No game ID', parsed)
            return sendData({
                action: actions.ERROR,
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

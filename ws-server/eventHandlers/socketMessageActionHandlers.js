'use-strict'

const { getGameById, updateGameById } = require('../../models/games')
const {
    createAndJoinNewGame,
    joinExistingGame,
} = require('../../controllers/factsGame')

module.exports = {
    CREATE_AND_JOIN_GAME({ data, sendData, broadcastData, socketId }) {
        if (data.gameId) {
            return console.warn(
                `Request for new game shouldn't already contain a "gameId".`,
                data
            )
        }

        const { displayName, fact, lie } = data.player

        const { gameId } = createAndJoinNewGame({
            creator: {
                displayName,
                fact,
                lie,
                socketId,
            },
            broadcastData,
        })

        sendData({ action: data.action, gameId })
    },

    JOIN_EXISTING_GAME(data, sendData, _, socketId) {
        // Check here if data is good.
        const { error, gameId } = joinExistingGame({
            gameId: data.gameId,
            player: {
                ...data.player,
                socketId,
            },
        })

        if (!error) {
            sendData({
                action: 'JOIN_EXISTING_GAME',
                gameId: gameId,
            })
        }
    },

    CHOSEN_PERSON(data, sendData, _, socketId) {
        const game = getGameById(data.gameId)

        if (!game) {
            return console.warn('No game for game id' + data.gameId)
        }

        if (game.currentTurnId !== data.turnId) {
            return
        }
        const foundIndex = game.players.findIndex(
            (p) => p.socketId === socketId
        )
        if (-1 === foundIndex) {
            return console.warn("Player doesn't appear to be in game.")
        }
        updateGameById(data.gameId, {
            players: [
                ...game.players.slice(0, foundIndex),
                {
                    ...game.players[foundIndex],
                    currentAnswer: data.choice,
                },
                ...game.players.slice(foundIndex + 1),
            ],
        })

        // Front end can update the button.
        sendData({
            action: 'CHOSEN_PERSON_CONFIRMATION',
            gameId: data.gameId,
            choice: data.choice,
        })
    },

    CHOSEN_FACT(data, sendData, _, socketId) {
        const game = getGameById(data.gameId)

        if (!game) {
            return console.warn('No game for game id' + data.gameId)
        }

        if (game.currentTurnId !== data.turnId) {
            return
        }
        const foundIndex = game.players.findIndex(
            (p) => p.socketId === socketId
        )
        if (-1 === foundIndex) {
            return console.warn("Player doesn't appear to be in game.")
        }
        updateGameById(data.gameId, {
            players: [
                ...game.players.slice(0, foundIndex),
                {
                    ...game.players[foundIndex],
                    currentAnswer: data.choice,
                },
                ...game.players.slice(foundIndex + 1),
            ],
        })

        // Front end can update the button.
        sendData({
            action: 'CHOSEN_FAKE_FACT_CONFIRMATION',
            gameId: data.gameId,
            choice: data.choice,
        })
    },

    $default(data, sendData, _) {
        console.error('Unexpected payload', data)
    },
}

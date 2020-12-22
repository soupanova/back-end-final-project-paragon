// Actions that the server wants to listen
// (and response accordingly) to.

const {
    createNewGame,
    getGameById,
    joinGame,
    updateGameById,
} = require('../../models/games')

module.exports = {
    START_GAME_REQUEST(data, sendData, broadcasterFunc, socketId) {
        // TODO: There should probably be a "game" reducer, so that game state
        // can only be manipulated in a finite number of ways.

        if (data.gameId) {
            return console.warn(
                'Ignoring duplicate START_GAME_REQUEST received.'
            )
        }

        const { gameId } = createNewGame({
            creatorSocketId: socketId,
            readyingSeconds: 5,
            broadcasterFunc,
        })

        if (!gameId) {
            throw new Error('Bad game id ' + gameId)
        }

        sendData({
            action: data.action,
            gameId,
        })
    },

    JOIN_GAME_REQUEST(data, sendData, _, socketId) {
        // Check here if data is good.
        const { error, gameId } = joinGame({
            gameId: data.gameId,
            player: {
                ...data.player,
                socketId,
            },
        })

        if (error) return

        sendData({
            action: 'JOIN_GAME',
            gameId: gameId,
        })
    },

    CHOSEN_PERSON(data, sendData, _, socketId) {
        const game = getGameById(data.gameId)

        if (!game) {
            return console.warn('No game for game id' + data.gameId)
        }

        console.log({ playersBeforeUpdate: game.players })

        if (game.currentTurnId !== data.turnId) {
            return
        }
        const foundIndex = game.players.findIndex(
            (p) => p.socketId === socketId
        )
        if (-1 === foundIndex) {
            return console.warn("Player doesn't appear to be in game.")
        }
        const updatedGame = updateGameById(data.gameId, {
            players: [
                ...game.players.slice(0, foundIndex),
                {
                    ...game.players[foundIndex],
                    currentAnswer: data.choice,
                },
                ...game.players.slice(foundIndex + 1),
            ],
        })

        console.log({ playersAfterUpdate: updatedGame.players })

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

// Actions that the server wants to listen
// (and response accordingly) to.

const { createNewGame, getGameById, joinGame } = require('../../models/games')

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
        })
    },

    $default(data, sendData, socket) {
        console.error('Unexpected payload', data)
    },
}

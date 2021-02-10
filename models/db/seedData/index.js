const { v4: uuidv4 } = require('uuid')
const { STATE } = require('../../../constants/game')

module.exports.seedItem = {
    gameId: uuidv4(),
    state: STATE.READYING,
    totalRound: 5,
    currentRound: null,
    players: {
        socketId: uuidv4(),
        connected: true,
        playerId: uuidv4(),
        displayName: 'Abe',
        score: 0,
        fact: "Some statement (that's really a fact)",
        lie: "Some statement (that's really a lie)",
        shuffledFactAndLie: [
            "Some statement (that's really a lie)",
            "Some statement (that's really a fact)",
        ],
        currentAnswer: null,
    },
}

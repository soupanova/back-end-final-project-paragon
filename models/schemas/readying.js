const Joi = require('joi')
const { STATE } = require('../../constants/game')

const schemas = require('./')

/**
 * Schema for player whilst game is in READYING state.
 */
const playerSchema = Joi.object({
    socketId: schemas.uuidv4,
    connected: Joi.bool().required().valid(true),
    playerId: schemas.uuidv4,
    displayName: schemas.displayName,
    score: Joi.number().required().valid(0),
    fact: schemas.factOrLie,
    lie: schemas.factOrLie,
    shuffledFactAndLie: schemas.shuffledFactAndLie,
    currentAnswer: Joi.any().required().valid(null),
})

/**
 * Schema for a game whilst it's in a READYING state.
 */
const gameSchema = Joi.object({
    gameId: schemas.gameId,
    createdAt: Joi.date().timestamp('javascript'),
    state: Joi.string().required().valid(STATE.READYING),
    totalRounds: schemas.totalRounds,
    currentRound: Joi.any().required().valid(null),
    players: Joi.object().min(1).pattern(schemas.uuidv4, playerSchema),
    currentTurnId: Joi.any().required().valid(null),
})

module.exports = {
    playerSchema,
    gameSchema,
}

// const r = gameSchema.validate({
//     gameId: v4(),
//     state: STATE.READYING,
//     totalRounds: 10,
//     currentRound: 0,
//     players: {
//         [v4()]: {
//             socketId: v4(),
//             connected: true,
//             playerId: v4(),
//             displayName: ' ',
//             score: 0,
//             fact: 'a',
//             lie: 'b',
//             shuffledFactAndLie: ['b', 'a'],
//             currentAnswer: null,
//         },
//     },
//     currentTurnId: null,
// })

// console.log(r.error.details)

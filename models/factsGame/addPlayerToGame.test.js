'use strict'

const { v4: uuidv4, validate: uuidValidate } = require('uuid')
const { STATE } = require('../../constants/game')
const { addPlayerToGame } = require('./addPlayerToGame')
const { createNewGame } = require('./createNewGame')
const { createNewPlayer } = require('../factsGamePlayer/createNewPlayer')

/**
 * See: https://jestjs.io/docs/en/getting-started
 */

describe('addPlayerToGame: validate object returned', () => {
    const creator = createNewPlayer({
        socketId: uuidv4(),
        displayName: 'Bernadette',
        playerId: uuidv4(),
        fact: 'creator F',
        lie: 'creator L',
    })

    const player = createNewPlayer({
        socketId: uuidv4(),
        displayName: 'Margaret',
        playerId: uuidv4(),
        fact: 'creator F',
        lie: 'creator L',
    })

    let game

    beforeAll(async () => {
        game = await createNewGame({
            creator,
            totalRounds: 10,
        })

        game = await addPlayerToGame({ gameId: game.gameId, player })
    })

    it('should add the player to the game', async () => {
        const newGame = await addPlayerToGame({ gameId: game.gameId, player })
        expect(game.players[player.playerId]).toEqual(
            expect.objectContaining(player)
        )
    })

    // it('should return a deep copy', () => {
    //     expect(newGame).not.toBe(joinedGame)
    //     expect(newGame.players).not.toBe(joinedGame.players)
    //     newGame.players.forEach((player, i) => {
    //         expect(player).not.toBe(joinedGame.players[i])
    //     })
    // })

    // it('should have a valid game id', () => {
    //     expect(uuidValidate(joinedGame.gameId)).toBe(true)
    // })

    // it('should be in a "readying" state', () => {
    //     expect(joinedGame.state).toBe(STATE.READYING)
    // })

    // it('should have a currentRound value initialised as null', () => {
    //     expect(joinedGame.currentRound).toBeNull()
    // })

    // it('should have a null currentTurnId to begin with', () => {
    //     expect(joinedGame.currentTurnId).toBeNull()
    // })

    // it('should have 1 more player', () => {
    //     expect(joinedGame.players).toEqual(expect.any(Array))
    //     expect(joinedGame.players.length).toBe(newGame.players.length + 1)
    // })

    // it('should add player to the end', () => {
    //     const playerWhoJoined =
    //         joinedGame.players[joinedGame.players.length - 1]

    //     Object.entries(playerArgs).forEach(([property, value]) => {
    //         expect(playerWhoJoined[property]).toStrictEqual(value)
    //     })
    // })
})

// describe('addPlayerToGame: should handle multiple players', () => {
//     const newGame = factsGame.createNewGame()

//     const manyPlayerArgs = Array.from({ length: 10 }, () => {
//         return {
//             socketId: uuidv4(),
//             displayName: uuidv4(),
//             fact: uuidv4(),
//             lie: uuidv4(),
//         }
//     })

//     const joinedGame = manyPlayerArgs.reduce((gameState, playerArgs, i) => {
//         const joinedGame = factsGame.addPlayerToGame(gameState, playerArgs)

//         it('should have 1 more player', () => {
//             expect(joinedGame.players).toEqual(expect.any(Array))
//             expect(joinedGame.players.length).toBe(gameState.players.length + 1)
//         })

//         it('should add player to the end', () => {
//             const playerWhoJoined = joinedGame.players[i]

//             expect(playerWhoJoined).toEqual({
//                 ...playerArgs,
//                 connected: true,
//                 score: 0,
//                 currentAnswer: null,
//                 shuffledFactAndLie: expect.arrayContaining([
//                     playerArgs.lie,
//                     playerArgs.fact,
//                 ]),
//                 playerId: expect.any(String),
//             })

//             expect(uuidValidate(playerWhoJoined.playerId)).toBe(true)
//         })

//         return joinedGame
//     }, newGame)

//     expect(joinedGame.players.length).toBe(manyPlayerArgs.length)
// })

// describe('addPlayerToGame: should throw an error for invalid input', () => {
//     const game = factsGame.createNewGame()

//     const playerArgs = {
//         socketId: uuidv4(),
//         displayName: 'Abe',
//         fact: 'SOME_FACT',
//         lie: 'SOME_LIE',
//     }

//     Object.keys(playerArgs).forEach((property) => {
//         it(`should throw an error when ${property} is undefined`, () => {
//             expect(() => {
//                 factsGame.addPlayerToGame(game, {
//                     ...playerArgs,
//                     [property]: undefined,
//                 })
//             }).toThrow()
//         })
//     })

//     it('should throw an error if game is not in readying state', () => {
//         expect(() => {
//             const game = {
//                 ...factsGame.createNewGame(),
//                 state: STATE.IN_PROGRESS,
//             }
//             createJoinedGame(game, playerArgs)
//         }).toThrow()
//     })
// })

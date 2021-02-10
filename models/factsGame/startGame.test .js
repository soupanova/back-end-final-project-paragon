'use strict'

const { v4: uuidv4, validate: uuidValidate } = require('uuid')
const { STATE } = require('../../constants/game')
const factsGame = require('./factsGame')

/**
 * See: https://jestjs.io/docs/en/getting-started
 */

describe('startExistingGame: validate object returned', () => {
    const newGame = factsGame.createNewGame()

    const manyPlayerArgs = Array.from({ length: 10 }, () => {
        // Use random, valid values for now.
        return {
            socketId: uuidv4(),
            displayName: uuidv4(),
            fact: uuidv4(),
            lie: uuidv4(),
        }
    })

    // Add players
    const joinedGame = manyPlayerArgs.reduce((game, playerArgs) => {
        return factsGame.addPlayerToGame(game, playerArgs)
    }, newGame)

    // Start the game
    const startedGame = factsGame.startExistingGame(joinedGame)

    it('should return a deep copy', () => {
        expect(joinedGame).not.toBe(startedGame)
        expect(joinedGame.players).not.toBe(startedGame.players)
        joinedGame.players.forEach((player) => {
            expect(startedGame.players.includes(player)).toBe(false)
        })
    })

    const propertiesWhichShouldntChange = Object.keys(joinedGame).filter(
        (property) => !['state', 'players'].includes(property)
    )
    propertiesWhichShouldntChange.forEach((property) => {
        it(`should not change the value for property "${property}"`, () => {
            expect(joinedGame[property]).toStrictEqual(startedGame[property])
        })
    })

    it('should have a valid game id', () => {
        expect(uuidValidate(startedGame.gameId)).toBe(true)
    })

    it('should be in a "in progress" state', () => {
        expect(startedGame.state).toBe(STATE.IN_PROGRESS)
    })

    it('should have a currentRound value initialised as null', () => {
        expect(startedGame.currentRound).toBeNull()
    })

    it('should have a null currentTurnId to begin with', () => {
        expect(startedGame.currentTurnId).toBeNull()
    })

    it('should not change the number of players', () => {
        expect(startedGame.players).toEqual(expect.any(Array))
        expect(startedGame.players.length).toBe(joinedGame.players.length)
    })

    // This test can throw false positives when the number of players
    // in the game is low. Shouldn't matter here because we're testing with enough
    // players. Should inject shuffleFunc to solve this?
    it('should shuffle up the players', () => {
        expect(
            startedGame.players.some(
                ({ playerId }, i) => playerId !== joinedGame.players[i].playerId
            )
        ).toBe(true)
    })
})

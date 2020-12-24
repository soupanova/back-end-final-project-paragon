'use-strict'

const { validate: uuidValidate } = require('uuid')
const { STATE } = require('../../constants/game')
const factsGame = require('./factsGame')

/**
 * See: https://jestjs.io/docs/en/getting-started
 */

describe('createNewGame: validate object returned', () => {
    const totalRounds = 8
    const newGame = factsGame.createNewGame({ totalRounds })

    it('should have a valid game id', () => {
        expect(uuidValidate(newGame.gameId)).toBe(true)
    })

    it('should be in a readying state to begin with', () => {
        expect(newGame.state).toBe(STATE.READYING)
    })

    it('should have a currentRound value initialised as null', () => {
        expect(newGame.currentRound).toBeNull()
    })

    it('should have a valid totalRounds value', () => {
        expect(newGame.totalRounds).toBe(totalRounds)
        expect(newGame.totalRounds).toEqual(expect.any(Number))
        expect(newGame.totalRounds).toBeGreaterThan(0)
    })

    it('should have a null currentTurnId to begin with', () => {
        expect(newGame.currentTurnId).toBeNull()
    })

    it('should have valid-ish createdAt timestamp', () => {
        const { createdAt } = factsGame.createNewGame()
        const now = Date.now()
        expect(now - createdAt).toBeGreaterThanOrEqual(0)
        expect(now - createdAt).toBeLessThan(10)
    })

    it('should have an empty players array to begin with', () => {
        expect(newGame.players).toEqual(expect.any(Array))
        expect(newGame.players.length).toBe(0)
    })
})

describe('createNewGame: validate input/argument validations', () => {
    it("should throw an error if totalRounds isn't a number", () => {
        expect(() => createNewGame({ totalRounds: 'a' })).toThrow()
    })

    it('should throw an error if totalRounds is 0', () => {
        expect(() => createNewGame({ totalRounds: 0 })).toThrow()
    })

    it('should throw an error if totalRounds is negative', () => {
        expect(() => createNewGame({ totalRounds: -1 })).toThrow()
    })

    it('should throw an error if totalRounds is a positive non-integer', () => {
        expect(() => createNewGame({ totalRounds: 10.1 })).toThrow()
    })
})

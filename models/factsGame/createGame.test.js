'use strict'

const { validate: uuidValidate, v4: uuidv4 } = require('uuid')
const { STATE } = require('../../constants/game')
const { createNewGame } = require('./createNewGame')
const { createNewPlayer } = require('../factsGamePlayer/createNewPlayer')

/**
 * See: https://jestjs.io/docs/en/getting-started
 */

describe('createNewGame: validate object returned', () => {
    let newGame
    const totalRounds = 8

    const creator = createNewPlayer({
        playerId: uuidv4(),
        socketId: uuidv4(),
        displayName: 'Martha',
        fact: 'a',
        lie: 'b',
    })

    const gameOptions = {
        totalRounds,
        creator,
    }

    beforeAll(async () => {
        newGame = await createNewGame(gameOptions)
    })

    expect()

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

    it('should have valid-ish createdAt timestamp', async () => {
        const now = Date.now()
        const { createdAt } = await createNewGame(gameOptions)
        expect(createdAt - now).toBeGreaterThanOrEqual(0)
        expect(createdAt - now).toBeLessThan(10)
    })

    it('should have just 1 player to begin with', () => {
        expect(newGame.players).toEqual(
            expect.objectContaining({
                [gameOptions.creator.playerId]: {
                    playerId: gameOptions.creator.playerId,
                    connected: true,
                    currentAnswer: null,
                    displayName: gameOptions.creator.displayName,
                    fact: gameOptions.creator.fact,
                    lie: gameOptions.creator.lie,
                    shuffledFactAndLie: expect.arrayContaining([
                        gameOptions.creator.fact,
                        gameOptions.creator.lie,
                    ]),
                    socketId: gameOptions.creator.socketId,
                    score: 0,
                },
            })
        )
        expect(Object.keys(newGame.players).length).toBe(1)
    })
})

describe('createNewGame: totalRounds input validation', () => {
    const creator = createNewPlayer({
        socketId: uuidv4(),
        fact: 'f',
        lie: 'l',
        playerId: uuidv4(),
        displayName: 'Arnold',
    })

    it("should throw an error if totalRounds isn't a number", async () => {
        await expect(
            createNewGame({ creator, totalRounds: 'a' })
        ).rejects.toThrowError(/"totalRounds" must be a number/)
    })

    it('should throw an error if totalRounds is 0', async () => {
        await expect(
            createNewGame({ creator, totalRounds: 0 })
        ).rejects.toThrowError(
            /"totalRounds" must be greater than or equal to 1/
        )
    })

    it('should throw an error if totalRounds is negative', async () => {
        await expect(
            createNewGame({ creator, totalRounds: -1 })
        ).rejects.toThrowError(
            /"totalRounds" must be greater than or equal to 1/
        )
    })

    it('should throw an error if totalRounds is a positive non-integer', async () => {
        await expect(
            createNewGame({ creator, totalRounds: 10.1 })
        ).rejects.toThrowError(/"totalRounds" must be an integer/)
    })

    it('should throw an error if totalRounds is undefined', async () => {
        await expect(
            createNewGame({ creator, totalRounds: undefined })
        ).rejects.toThrowError(/"totalRounds" is required/)
    })
})

describe('createNewGame: calls asyncSaveHandler with correct game options', () => {
    const creator = createNewPlayer({
        socketId: uuidv4(),
        fact: 'f',
        lie: 'l',
        playerId: uuidv4(),
        displayName: 'Abe',
    })

    it('should call asyncSaveHandler once with correct argument', async () => {
        const asyncSaveHandler = jest.fn((game) => Promise.resolve(game))
        const game = await createNewGame({
            creator,
            totalRounds: 10,
            asyncSaveHandler,
        })
        expect(asyncSaveHandler).toHaveBeenCalledTimes(1)
        expect(asyncSaveHandler).toHaveBeenCalledWith(game)
    })
})

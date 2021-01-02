'use strict'

const { v4: uuidv4, validate: uuidValidate } = require('uuid')
const { STATE } = require('../../constants/game')
const { addPlayerToGame } = require('./addPlayerToGame')
const { createNewGame } = require('./createNewGame')
const { startGame } = require('./startGame')
const { createNewPlayer } = require('./createNewPlayer')
const { deleteGame } = require('./deleteGame')

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
        fact: 'joiner F',
        lie: 'joiner L',
    })

    let game
    let joinedGame

    beforeAll(async () => {
        game = await createNewGame({
            creator,
            totalRounds: 10,
        })
        joinedGame = await addPlayerToGame({ gameId: game.gameId, player })
    })

    it('should add the player to the game', async () => {
        expect(joinedGame.players[player.playerId]).toEqual(
            expect.objectContaining(player)
        )
    })

    it('should have a valid game id', () => {
        expect(joinedGame.gameId).toBe(game.gameId)
        expect(uuidValidate(joinedGame.gameId)).toBe(true)
    })

    it('should have 1 more player', () => {
        const initialPlayerCount = Object.keys(game.players).length
        const currentPlayerCount = Object.keys(joinedGame.players).length
        expect(currentPlayerCount - initialPlayerCount).toBe(1)
    })

    afterAll(async () => {
        const { gameId } = game
        await deleteGame({ gameId })
    })
})

describe('addPlayerToGame: should handle multiple players', () => {
    const [creator, ...otherPlayers] = Array.from({ length: 10 }, () => {
        return createNewPlayer({
            socketId: uuidv4(),
            displayName: uuidv4(),
            fact: uuidv4(),
            lie: uuidv4(),
            playerId: uuidv4(),
        })
    })

    let game

    beforeAll(async () => {
        game = await createNewGame({ creator, totalRounds: 5 })
    })

    it('should handle multiple players', async () => {
        let previousState = game

        for (const player of otherPlayers) {
            const currentState = await addPlayerToGame({
                gameId: game.gameId,
                player,
            })

            const previousPlayerCount = Object.keys(previousState.players)
                .length
            const currentPlayerCount = Object.keys(currentState.players).length
            expect(currentPlayerCount - previousPlayerCount).toBe(1)

            expect(currentState.players[player.playerId]).toEqual(
                expect.objectContaining(player)
            )

            previousState = currentState
        }
    })

    afterAll(async () => {
        const { gameId } = game
        await deleteGame({ gameId })
    })
})

describe('addPlayerToGame: player should only be added if possible', () => {
    it('should throw an error if game is not in readying state', async () => {
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
            fact: 'joiner F',
            lie: 'joiner L',
        })

        await expect(async () => {
            const game = await createNewGame({ creator, totalRounds: 5 })
            await startGame({ gameId: game.gameId })
            await addPlayerToGame({ gameId: game.gameId, player })
        }).rejects.toThrow()
    })
})

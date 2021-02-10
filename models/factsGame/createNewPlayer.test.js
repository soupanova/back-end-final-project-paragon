const { v4: uuidv4, validate: uuidValidate } = require('uuid')

const { createNewPlayer } = require('./createNewPlayer')

describe('createNewPlayer: validate returned object', () => {
    const playerArgs = {
        fact: uuidv4(),
        lie: uuidv4(),
        displayName: uuidv4(),
        socketId: uuidv4(),
        playerId: uuidv4(),
    }

    const newPlayer = createNewPlayer(playerArgs)

    it('should add passed in properties to player', () => {
        expect(newPlayer).toEqual({
            ...playerArgs,
            connected: true,
            score: 0,
            currentAnswer: null,
            shuffledFactAndLie: expect.arrayContaining([
                playerArgs.lie,
                playerArgs.fact,
            ]),
        })

        expect(uuidValidate(newPlayer.playerId)).toBe(true)
    })

    Object.keys(playerArgs).forEach((property) => {
        it(`should throw an error when property ${property} is invalid/missing`, () => {
            expect(() => {
                createNewPlayer({ ...playerArgs, [property]: undefined })
            }).toThrow()
        })
    })
})

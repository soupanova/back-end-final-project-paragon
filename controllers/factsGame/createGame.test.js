'use strict'

const game = require('../../models/factsGame/createNewGame')
game.createNewGame = jest.fn()

const { createGame } = require('./createGame')

describe('a', () => {
    it('should invoke model functions with correct data', async () => {
        const creatorDetails = {
            displayName: 'Abe',
            fact: 'Some fact',
            lie: 'Some lie',
            playerId: 'eab757a8-5020-44dc-99f7-f3399e4b6975',
            socketId: '0a8f4c25-06d0-49cb-bdf1-fd50c629ba29',
        }
        const totalRounds = 10

        await createGame({ creatorDetails, totalRounds })

        expect(game.createNewGame).toHaveBeenCalledTimes(1)
        expect(game.createNewGame).toHaveBeenCalledWith(
            expect.objectContaining({
                creator: expect.objectContaining({
                    ...creatorDetails,
                    shuffledFactAndLie: expect.arrayContaining([
                        creatorDetails.fact,
                        creatorDetails.lie,
                    ]),
                }),
                totalRounds,
            })
        )
    })
})

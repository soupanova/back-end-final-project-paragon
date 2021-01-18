'use strict'

jest.mock('../../controllers/factsGame/joinGame')
const { joinGame } = require('../../controllers/factsGame/joinGame')

const Socket = require('ws')
const actions = require('../../constants/actions')

const { createHttpServer } = require('../../http-server')
const { HTTP_PORT } = require('../../config/http')

const url = `ws://localhost:${HTTP_PORT}`
let server
let client

beforeAll(async () => {
    /**
     * Create the server.
     */
    server = createHttpServer({
        authenticator: () => true,
    })

    /**
     * Wait for server to start listening.
     */
    await new Promise((resolve) => {
        server.listen(HTTP_PORT, resolve)
    })

    /**
     * Connect client.
     */
    await new Promise((resolve) => {
        client = new Socket(url, ['default', 'test'])
        client.on('open', resolve)
    })
})

afterAll(async () => {
    client.close()
    server.close()

    /**
     * Server logs to console on 'close' and this was breaking these tests, since
     * the logs happen after the test finishes and Jest thinks we've not awaited
     * everything that we should have.
     *
     * Temporary workaround is to pause briefly (for logging
     * to complete) and then end the test.
     *
     * In the future, we can make the logging conditional or consider
     * using something like Server.removeAllListeners('close').
     */
    await new Promise((resolve) => {
        setTimeout(resolve, 800)
    })
})

describe('Responses to client', () => {
    beforeEach(async () => {
        joinGame.mockReset()
    })

    it('should respond with game join success message', async () => {
        const clientMessage = {
            action: actions.JOIN_GAME,
            gameId: 'BBoXX4nYyL5pmPUWwlSqP',
            player: {
                displayName: 'Abe',
                fact: 'Some fact',
                lie: 'Some lie',
                playerId: 'eab757a8-5020-44dc-99f7-f3399e4b6975',
            },
        }

        joinGame.mockResolvedValueOnce({
            game: {
                gameId: clientMessage.gameId,
                players: {},
            },
        })

        const serverResponse = await new Promise((resolve) => {
            client.once('message', resolve)
            client.send(JSON.stringify(clientMessage))
        }).then(JSON.parse)

        expect(joinGame).toHaveBeenCalledTimes(1)
        expect(joinGame).toHaveBeenCalledWith(
            expect.objectContaining({
                playerDetails: expect.objectContaining({
                    ...clientMessage.player,
                    socketId: expect.any(String),
                }),
                gameId: clientMessage.gameId,
            })
        )

        expect(serverResponse).toMatchObject({
            action: actions.JOIN_GAME,
            gameId: clientMessage.gameId,
        })
    })

    it('should respond with a game join specific error', async () => {
        const clientMessage = {
            action: actions.JOIN_GAME,
            gameId: 'BBoXX4nYyL5pmPUWwlSqP',
            player: {
                displayName: 'Abe',
                fact: 'Some fact',
                lie: 'Some lie',
                playerId: 'eab757a8-5020-44dc-99f7-f3399e4b6975',
            },
        }

        const error = 'Some error message'
        joinGame.mockResolvedValueOnce({ error })

        const serverResponse = await new Promise((resolve) => {
            client.once('message', resolve)
            client.send(JSON.stringify(clientMessage))
        }).then(JSON.parse)

        expect(joinGame).toHaveBeenCalledTimes(1)
        expect(joinGame).toHaveBeenCalledWith(
            expect.objectContaining({
                playerDetails: expect.objectContaining({
                    ...clientMessage.player,
                    socketId: expect.any(String),
                }),
                gameId: clientMessage.gameId,
            })
        )

        expect(serverResponse).toMatchObject({
            action: actions.ERROR_GAME_NOT_JOINED,
            error,
        })
    })
})

const { Server: WebSocketServer, OPEN: READY_STATE_OPEN } = require('ws')

const { WEBSOCKET_SERVER_OPTIONS } = require('../config/websocket')
const { v4: uuidv4 } = require('uuid')
const serverEventHandlers = require('./eventHandlers/serverEventHandlers.js')
const socketEventHandlers = require('./eventHandlers/socketEventHandlers.js')
const socketMessageActionHandlers = require('./eventHandlers/socketActionHandlers')

const SOCKET_ID_PROPERTY = Symbol('socketId')

const createWebSocketServer = ({
    webSocketServerOptions,
    handlers: {
        serverEventHandlers = {},
        socketEventHandlers = {},
        socketMessageActionHandlers = {},
    },
}) => {
    const wsServer = new WebSocketServer(webSocketServerOptions)

    // Register event listeners for server events.
    Object.entries(serverEventHandlers).forEach(([event, handler]) => {
        wsServer.on(event, handler)
    })

    const broadcastData = (dataToSend, socketIdsToSendTo) => {
        /**
         * Filter for just the clients we want to broadcast to.
         *
         */
        const allClients = [...wsServer.clients.values()]
        const relevantClients = allClients.filter((client) =>
            socketIdsToSendTo.includes(client[SOCKET_ID_PROPERTY])
        )
        /**
         * Convert the data to string before broadcasting.
         */
        const serialised = JSON.stringify(dataToSend, null, 2)
        relevantClients.forEach((client) => {
            if (READY_STATE_OPEN === client.readyState) {
                client.send(serialised)
            }
        })
        console.log(
            `Broadcasted to ${relevantClients.length} clients`,
            serialised
        )
    }

    // Register event listeners for socket events.
    wsServer.on('connection', (socket) => {
        socket[SOCKET_ID_PROPERTY] = uuidv4()

        const sendData = (dataToSend) => {
            if (!dataToSend.gameId) {
                console.warn('gameId missing', dataToSend)
            }
            const serialised = JSON.stringify(dataToSend, null, 2)
            socket.send(serialised)
            console.log('Sent back', serialised)
        }

        Object.entries(socketEventHandlers).forEach(([event, handler]) => {
            socket.on(event, (...args) => {
                try {
                    handler(...args)
                } catch (err) {
                    console.log(err)
                }
            })
        })

        socket.on('message', (rawData) => {
            const { parsed, parsingError } = tryToParseJson(rawData)
            if (parsingError) {
                console.log('Malformed message', rawData)
                return sendData({ action: 'ERROR', error: parsingError })
            }
            console.log('Received', parsed)

            const messageDoesntHaveAGameIdButShould =
                !parsed.gameId && parsed.action !== 'CREATE_AND_JOIN_GAME'
            if (messageDoesntHaveAGameIdButShould) {
                console.warn('No game ID', parsed)
                return sendData({
                    action: 'ERROR',
                    error: 'gameId missing',
                    received: rawData,
                })
            }

            try {
                const handler =
                    socketMessageActionHandlers[parsed.action] ??
                    socketMessageActionHandlers.$default

                handler({
                    data: parsed,
                    sendData,
                    broadcastData,
                    socketId: socket[SOCKET_ID_PROPERTY],
                })
            } catch (err) {
                console.error(err)
            }
        })
    })

    return wsServer
}

const tryToParseJson = (json) => {
    try {
        return { parsed: JSON.parse(json) }
    } catch (err) {
        return { parsingError: err.message }
    }
}

const wsServer = createWebSocketServer({
    webSocketServerOptions: WEBSOCKET_SERVER_OPTIONS,
    handlers: {
        serverEventHandlers,
        socketEventHandlers,
        socketMessageActionHandlers,
    },
})

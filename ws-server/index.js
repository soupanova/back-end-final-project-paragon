const { Server: WebSocketServer, OPEN: READY_STATE_OPEN } = require('ws')

const { WEBSOCKET_SERVER_OPTIONS } = require('../config/websocket')
const { v4: uuidv4 } = require('uuid')
const serverEventHandlers = require('./eventHandlers/serverEventHandlers.js')
const socketEventHandlers = require('./eventHandlers/socketEventHandlers.js')
const socketMessageActionHandlers = require('./eventHandlers/socketMessageActionHandlers')

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
            const serialised = JSON.stringify(dataToSend, null, 2)
            socket.send(serialised)
            console.log('Sent back', serialised)
        }

        Object.entries(socketEventHandlers).forEach(([event, handler]) => {
            socket.on(event, handler)
        })

        socket.on('message', (rawData) => {
            const parsed = JSON.parse(rawData)
            console.log('Received', parsed)

            if (
                undefined === parsed.gameId &&
                parsed.action !== 'CREATE_AND_JOIN_GAME'
            ) {
                console.warn('No game ID', parsed)
            }

            const handler =
                socketMessageActionHandlers[parsed.action] ??
                socketMessageActionHandlers.$default

            handler({
                data: parsed,
                sendData,
                broadcastData,
                socketId: socket[SOCKET_ID_PROPERTY],
            })
        })
    })

    return wsServer
}

const wsServer = createWebSocketServer({
    webSocketServerOptions: WEBSOCKET_SERVER_OPTIONS,
    handlers: {
        serverEventHandlers,
        socketEventHandlers,
        socketMessageActionHandlers,
    },
})

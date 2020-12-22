const { Server: WebSocketServer, OPEN: READY_STATE_OPEN } = require('ws')

const { WEBSOCKET_SERVER_OPTIONS } = require('../config/websocket')
const { createRandomId } = require('../utils')
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

    // Register event listeners for socket events.
    wsServer.on('connection', (socket) => {
        socket[SOCKET_ID_PROPERTY] = createRandomId()

        Object.entries(socketEventHandlers).forEach(([event, handler]) => {
            socket.on(event, handler)
        })

        socket.on('message', (rawData) => {
            const parsed = JSON.parse(rawData)
            console.log('Received', parsed)

            const handler =
                socketMessageActionHandlers[parsed.action] ??
                socketMessageActionHandlers.$default

            handler(
                parsed,
                function sendData(dataToSend) {
                    const serialised = JSON.stringify(dataToSend, null, 2)

                    socket.send(serialised)
                    console.log('Sent back', serialised)
                },
                function broadcastData(dataToSend, ...sendTo) {
                    const serialised = JSON.stringify(dataToSend, null, 2)

                    const filtered = [...wsServer.clients.values()].filter(
                        (client) => {
                            return sendTo.includes(client[SOCKET_ID_PROPERTY])
                        }
                    )

                    filtered.forEach((client) => {
                        if (READY_STATE_OPEN === client.readyState) {
                            client.send(serialised)
                        }
                    })

                    console.log(
                        `Broadcasted to ${filtered.length} clients`,
                        serialised
                    )
                },
                socket[SOCKET_ID_PROPERTY]
            )
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

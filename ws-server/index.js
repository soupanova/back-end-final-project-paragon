const { Server: WebSocketServer } = require('ws')

const { WEBSOCKET_SERVER_OPTIONS } = require('../config/websocket')
const { v4: uuidv4 } = require('uuid')
const {
    registerServerEventHandlers,
} = require('./handlers/serverEventHandlers')
const {
    registerSocketEventHandlers,
} = require('./handlers/socketEventHandlers')
const { registerActionHandlers } = require('./handlers/socketActionHandlers')
const { createBroadcastFunction } = require('./broadcast')

const { SOCKET_ID_PROPERTY } = require('../constants/websocket')

const createWebSocketServer = ({ webSocketServerOptions }) => {
    const webSocketServer = new WebSocketServer({
        ...webSocketServerOptions,
        noServer: true,
    })

    registerServerEventHandlers(webSocketServer)

    const broadcastData = createBroadcastFunction(
        webSocketServer,
        SOCKET_ID_PROPERTY
    )

    webSocketServer.on('connection', (socket) => {
        socket[SOCKET_ID_PROPERTY] = uuidv4()
        registerSocketEventHandlers(socket)
        registerActionHandlers(socket, broadcastData)
    })

    return webSocketServer
}

const webSocketServer = createWebSocketServer({
    webSocketServerOptions: WEBSOCKET_SERVER_OPTIONS,
})

module.exports = {
    webSocketServer,
}

const {
    WEBSOCKET_SERVER_OPTIONS: { port: PORT },
} = require('../../config/websocket')

const serverEventHandlers = {
    listening() {
        console.log(`WebSocket server listening on ${PORT}`)
    },
    close() {
        console.log(`WebSocket server closing at ${PORT}`)
    },
    error(err) {
        console.error(err)
    },
}

/**
 * Should add event handlers to the websocket server.
 */
module.exports.registerServerEventHandlers = (websocketServer) => {
    Object.entries(serverEventHandlers).forEach(([event, handler]) => {
        websocketServer.on(event, handler)
    })
}

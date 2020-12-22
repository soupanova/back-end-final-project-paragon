const {
    WEBSOCKET_SERVER_OPTIONS: { port: PORT },
} = require('../../config/websocket')

module.exports = {
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

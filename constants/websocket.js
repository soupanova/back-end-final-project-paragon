// Maybe useful for testing.
const WEBSOCKET_SERVER_EVENTS = {
    CONNECTION: 'connection',
    ERROR: 'error',
    LISTENING: 'listening',
    CLOSE: 'close',
}

// Maybe useful for testing.
const WEBSOCKET_CLIENT_EVENTS = {
    UPGRADE: 'upgrade',
    OPEN: 'open',
    ERROR: 'error',
    UNEXPECTED_RESPONSE: 'unexpected-response',
    MESSAGE: 'message',
    PING: 'ping',
    CLOSE: 'close',
}

/**
 * Use to avoid namespace collision or overwriting an existing property.
 */
const SOCKET_ID_PROPERTY = Symbol('socketId')

module.exports = {
    WEBSOCKET_SERVER_EVENTS,
    WEBSOCKET_CLIENT_EVENTS,
    SOCKET_ID_PROPERTY,
}

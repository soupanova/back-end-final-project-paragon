const WEBSOCKET_SERVER_OPTIONS = {
    port: process.env.WEBSOCKET_SERVER_PORT ?? 8080,
    clientTracking: true,
}

module.exports = {
    WEBSOCKET_SERVER_OPTIONS,
}

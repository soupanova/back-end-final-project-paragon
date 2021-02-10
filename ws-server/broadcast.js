const { OPEN: READY_STATE_OPEN } = require('ws')

/**
 * Should return a function that allows the caller to broadcast
 */
module.exports.createBroadcastFunction = (
    webSocketServer,
    socketIdProperty
) => {
    return function broadcastData(dataToSend, socketIdsToSendTo) {
        /**
         * Filter for just the clients that need to be broadcasted to.
         */
        const allClients = [...webSocketServer.clients.values()]
        const relevantClients = allClients.filter((client) =>
            socketIdsToSendTo.includes(client[socketIdProperty])
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
}

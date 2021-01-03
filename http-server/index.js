// @ts-check
'use strict'

const http = require('http')
const { webSocketServer } = require('../ws-server')

/**
 * @type {http.RequestListener}
 */
const requestHandler = (req, res) => {
    console.log(`${new Date().toISOString()} Handling request at ${req.url}`)

    if (req.url === '/') {
        const body = JSON.stringify({ status: 'ok' })
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.write(body)
        res.end()
    }

    res.statusCode = 404
    res.end()
}

const httpServer = http.createServer(requestHandler)

httpServer.on('upgrade', (req, socket, head) => {
    console.log('Upgrade request', req.headers)

    if (false) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
    }

    webSocketServer.handleUpgrade(req, socket, head, (webSocket, req) => {
        // Could potentially stick another arg here (that "connection" can listen for).
        webSocketServer.emit('connection', webSocket, req)
    })
})

module.exports = httpServer

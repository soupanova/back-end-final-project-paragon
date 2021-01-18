// @ts-check
'use strict'

const http = require('http')
const { webSocketServer } = require('../ws-server')
const { authenticateRequest } = require('./authenticate')

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

const createHttpServer = ({ authenticator = authenticateRequest } = {}) => {
    const httpServer = http.createServer(requestHandler)
    httpServer.on('upgrade', (req, socket, head) => {
        console.log('Upgrade request', {
            ...req.headers,
            'sec-websocket-protocol':
                req.headers['sec-websocket-protocol'] && 'ws',
        })

        const shouldRejectRequest =
            'websocket' !== req.headers.upgrade ||
            !req.headers['sec-websocket-protocol'] ||
            !authenticator(req)

        if (shouldRejectRequest) {
            socket.write('HTTP/1.1 403 Unauthorized\r\n\r\n')
            socket.destroy()
            return console.log('Rejected request')
        }

        webSocketServer.handleUpgrade(req, socket, head, (webSocket, req) => {
            // Could potentially stick another arg here (that "connection" can listen for).
            webSocketServer.emit('connection', webSocket, req)
        })
    })
    return httpServer
}

module.exports = { createHttpServer }

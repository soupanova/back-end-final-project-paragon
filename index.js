// @ts-check
'use strict'

const { HTTP_PORT } = require('./config/http')

const { createHttpServer } = require('./http-server')

const httpServer = createHttpServer()

httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on ${HTTP_PORT}.`)
})

// @ts-check
'use strict'

const { HTTP_PORT } = require('./config/http')

const httpServer = require('./http-server')

httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on ${HTTP_PORT}.`)
})

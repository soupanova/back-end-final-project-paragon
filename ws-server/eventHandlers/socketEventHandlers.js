const messageActionHandlers = require('./socketMessageActionHandlers')

module.exports = {
    error(err) {
        console.error(err)
    },
    open(socket) {
        // Add
    },
    close(code, reason) {
        console.log(`Socket closing, reason: ${reason}`)
    },
}

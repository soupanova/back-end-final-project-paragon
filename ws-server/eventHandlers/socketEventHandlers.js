module.exports = {
    error(err) {
        console.error(err)
    },
    open(socket) {
        console.log('Socket connected', socket)
    },
    close(code, reason) {
        console.log(`Socket closing, reason: ${reason}`, code)
    },
}

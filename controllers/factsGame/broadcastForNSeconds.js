// @ts-check
'use strict'

const { delay } = require('./delay')

/**
 * Broadcasts a message for N seconds.
 */
module.exports.broadcastForNSeconds = async ({
    broadcastFunc,
    totalSeconds,
}) => {
    for (let secondsLeft = totalSeconds; secondsLeft >= 0; --secondsLeft) {
        broadcastFunc(secondsLeft)
        await delay(1)
    }
}

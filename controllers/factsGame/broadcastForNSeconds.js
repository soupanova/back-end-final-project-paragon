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
        /**
         * Wait a minimum of 1 second.
         */
        await Promise.all([broadcastFunc(secondsLeft), delay(1)])
    }
}

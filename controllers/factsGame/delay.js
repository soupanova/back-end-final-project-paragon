// @ts-check
'use strict'

/**
 * Returns a promise which automatically resolves after N seconds.
 * Can be used for introducing artificial delays.
 */
module.exports.delay = (seconds) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

module.exports.STATE = {
    READYING: 'READYING',
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'IN_FINISHED',
}

module.exports.secondsToWait = {
    afterGameStarted: 3,
    forRevealWhoAnswer: 30,
    forRevealFactAnswer: 15,
    forAnswerBuffer: 1,
    beforeReveal: 3,
    afterReveal: 5,
}

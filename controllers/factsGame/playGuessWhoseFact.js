// @ts-check
'use strict'

const actions = require('../../constants/actions')
const { secondsToWait } = require('../../constants/game')
const { getGame } = require('../../models/factsGame/getGame')
const {
    incrementPlayersScores,
} = require('../../models/factsGame/incrementPlayersScores')
// const { initialiseTurn } = require('../models/factsGame/initialiseTurn')
// const { lockAnswers } = require('../models/factsGame/lockAnswers')
// const { unlockAnswers } = require('../models/factsGame/unlockAnswers')

const { broadcastForNSeconds } = require('./broadcastForNSeconds')
const { createLeaderboard } = require('./createLeaderboard')
const { delay } = require('./delay')

/**
 * Handles the first question: "guess whose fact".
 */
module.exports.playGuessWhoseFact = async ({
    gameId,
    roundNumber,
    broadcastToGame,
}) => {
    {
        const game = await getGame({ gameId })
        const { whoseFact: question } = game.rounds[roundNumber - 1]
        const participants = game.cachedChoices
        const leaderboard = createLeaderboard(Object.values(game.players))

        await broadcastForNSeconds({
            totalSeconds: secondsToWait.forRevealWhoAnswer,
            broadcastFunc(secondsLeft) {
                broadcastToGame({
                    gameId,
                    roundNumber,
                    action: actions.GUESS_WHO_TIMER,
                    facts: question.facts,
                    participants,
                    leaderboard,
                    secondsLeft,
                    turnId: game.currentTurnId,
                })
            },
        })
    }

    {
        // Give it a second in case of network congestion.
        await delay(secondsToWait.forAnswerBuffer)
    }

    // Players' current answers have been updated
    // (asynchronously in the background).

    {
        // Check + award players point where appropriate
        const game = await getGame({ gameId })
        const { whoseFact: question } = game.rounds[roundNumber - 1]

        // Increment players' scores if they got the answer right.
        console.log("About to increment players' scores")

        const allPlayers = Object.values(game.players)
        const playerIdsWhichAnsweredCorrectly = allPlayers
            .filter(
                (player) =>
                    player.currentAnswer.choiceId === question.correctChoiceId
            )
            .map(({ playerId }) => playerId)

        await incrementPlayersScores({
            gameId,
            playerIds: playerIdsWhichAnsweredCorrectly,
        })
        console.log("Incremented players' scores")

        await broadcastForNSeconds({
            totalSeconds: secondsToWait.beforeReveal,
            broadcastFunc(secondsLeft) {
                broadcastToGame({
                    gameId,
                    roundNumber,
                    action: actions.REVEAL_WHO_TIMER,
                    secondsLeft,
                })
            },
        })

        await broadcastToGame({
            gameId,
            action: actions.REVEAL_WHO,
            roundNumber,
            displayName: question.displayName,
        })

        await delay(secondsToWait.afterReveal)
    }
}

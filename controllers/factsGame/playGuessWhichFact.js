// @ts-check
'use strict'

const actions = require('../../constants/actions')
const { secondsToWait } = require('../../constants/game')
const {
    incrementPlayersScores,
} = require('../../models/factsGame/incrementPlayersScores')
// const { initialiseTurn } = require('../models/factsGame/initialiseTurn')
// const { lockAnswers } = require('../models/factsGame/lockAnswers')
// const { unlockAnswers } = require('../models/factsGame/unlockAnswers')
const { getGame } = require('../../models/factsGame/getGame')

const { broadcastForNSeconds } = require('./broadcastForNSeconds')
const { delay } = require('./delay')

/**
 * Handles second question: "guess which fact is true"
 */
module.exports.playGuessWhichFact = async ({
    gameId,
    roundNumber,
    broadcastToGame,
}) => {
    {
        const game = await getGame({ gameId })
        const { whichFact: question } = game.rounds[roundNumber - 1]

        await broadcastForNSeconds({
            totalSeconds: secondsToWait.forRevealFactAnswer,
            broadcastFunc(secondsLeft) {
                broadcastToGame({
                    gameId,
                    roundNumber,
                    action: actions.GUESS_WHICH_FACT_TIMER,
                    facts: question.facts,
                    secondsLeft,
                    displayName: question.displayName,
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
        const { whichFact: question } = game.rounds[roundNumber - 1]

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
                    action: actions.REVEAL_WHICH_FACT_TIMER,
                    secondsLeft,
                    displayName: question.displayName,
                })
            },
        })

        await broadcastToGame({
            gameId,
            action: actions.REVEAL_WHICH_FACT,
            roundNumber,
            fact: question.fact,
            displayName: question.displayName,
        })

        await delay(secondsToWait.afterReveal)
    }
}

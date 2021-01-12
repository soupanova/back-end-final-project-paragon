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
            async broadcastFunc(secondsLeft) {
                broadcastToGame({
                    gameId,
                    roundNumber,
                    action: actions.GUESS_WHO_TIMER,
                    facts: question.facts,
                    participants,
                    leaderboard,
                    secondsLeft,
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

        /**
         * Receiving array of players objects
         * Transforming into:
         * {
         *      playerId: {
         *          displayName: string,
         *              votesCount: number,
         *      }
         * }
         * Sorting values (of object) descendingly
         * Slicing top 3
         * Returning array of objects with properties:
         *      displayName
         *      percentage
         */
        const votesPerPlayer = allPlayers.reduce((accum, player) => {
            const playerIdToLookUp = player.currentAnswer?.choiceId
            const votedFor = game.players[playerIdToLookUp]

            if (undefined === votedFor) {
                return accum
            }

            const updates = {
                [playerIdToLookUp]: {
                    displayName: votedFor.displayName,
                    votesCount: 1 + (accum[playerIdToLookUp] ?? 0),
                },
            }

            return { ...accum, ...updates }
        }, {})

        const votePercentages = Object.values(votesPerPlayer)
            .sort((a, b) => b.votesCount - a.votesCount)
            .slice(0, 3)
            .map(({ displayName, votesCount }) => {
                const unroundedPercentage =
                    (votesCount / allPlayers.length) * 100
                const roundedPercentage = Math.round(unroundedPercentage)
                return {
                    displayName,
                    displayPercentage: `${roundedPercentage}%`,
                }
            })

        await broadcastForNSeconds({
            totalSeconds: secondsToWait.beforeReveal,
            async broadcastFunc(secondsLeft) {
                broadcastToGame({
                    gameId,
                    roundNumber,
                    action: actions.REVEAL_WHO_TIMER,
                    votePercentages,
                    secondsLeft,
                })
            },
        })

        broadcastToGame({
            gameId,
            action: actions.REVEAL_WHO,
            roundNumber,
            displayName: question.displayName,
        })

        await delay(secondsToWait.afterReveal)
    }
}

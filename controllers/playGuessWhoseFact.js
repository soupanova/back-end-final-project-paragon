// @ts-check
'use strict'

const actions = require('../constants/actions')
const { secondsToWait } = require('../constants/game')
const { getGame } = require('../models/factsGame/getGame')
const {
    incrementPlayersScores,
} = require('../models/factsGame/incrementPlayersScores')
// const { initialiseTurn } = require('../models/factsGame/initialiseTurn')
// const { lockAnswers } = require('../models/factsGame/lockAnswers')
// const { unlockAnswers } = require('../models/factsGame/unlockAnswers')

const { broadcastForNSeconds } = require('./broadcastForNSeconds')
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
        // const game = await initialiseTurn({ gameId })
        const [question] = game.rounds[roundNumber - 1]
        const participants = game.cachedChoices

        const leaderboard = Object.values(game.players)
            .map(({ displayName, score }) => {
                return {
                    displayName,
                    score,
                }
            })
            .sort((a, b) => a.score - b.score)

        await broadcastForNSeconds({
            totalSeconds: secondsToWait.forAnswer,
            broadcastFunc(secondsLeft) {
                broadcastToGame({
                    gameId,
                    roundNumber,
                    action: actions.GUESS_WHO_TIMER,
                    facts: question.statements,
                    participants,
                    leaderboard,
                    secondsLeft,
                    turnId: game.currentTurnId,
                })
            },
        })

        // Prompt clients for answers.
        // broadcastToGame({
        //     gameId,
        //     action: actions.GUESS_WHO_CHOICE,
        //     roundNumber,
        //     turnId: game.currentTurnId,
        //     participants,
        // })
    }

    {
        // Give it a second in case of network congestion.
        await delay(secondsToWait.forAnswerBuffer)
    }

    // Players' current answers have been updated
    // (asynchronously in the background).

    {
        // Check + award players point where appropriate
        // TODO: GAME INCREMENT_SCORES
        // TODO: PLAYER INCREMENT_SCORE

        // console.log('About to lock answers')
        // const game = await lockAnswers({ gameId })
        // console.log('Locked answers')
        const game = await getGame({ gameId })

        const [question] = game.rounds[roundNumber - 1]

        // Increment players' scores if they got the answer right.
        console.log("About to increment players' scores")
        const playerIdsWhoAnsweredCorrectly = Object.values(game.players)
            .filter(
                ({ currentAnswer }) =>
                    currentAnswer === question.correctAnswer.choiceId
            )
            .map(({ playerId }) => playerId)

        await incrementPlayersScores({
            gameId,
            playerIds: playerIdsWhoAnsweredCorrectly,
        })
        console.log("Incremented players' scores")

        // These things are unrelated and can be done at the same time.
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
            displayName: question.correctAnswer.text,
            // turnId: game.currentTurnId,
        })

        await delay(secondsToWait.afterReveal)
    }
}

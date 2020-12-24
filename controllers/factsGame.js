const {
    setGameById,
    deleteGameById,
    getGameById,
    updateGameById,
} = require('../models/games')
const factsGame = require('../models/factsGame/factsGame')
const { STATE } = require('../constants/game')
const { v4: uuidv4 } = require('uuid')

const shouldGameBeCancelled = (gameToCheck) => {
    let reason
    if (STATE.READYING !== gameToCheck.state) {
        reason = 'Game is not ready to be played'
    } else if (gameToCheck.players.length < gameToCheck.totalRounds) {
        reason = 'Not enough players to start the game'
    }
    return { reason, shouldCancel: Boolean(reason) }
}

/**
 * Request handler.
 */
module.exports.createAndJoinNewGame = ({
    creator: { displayName, fact, lie, socketId },
    readyingDurationInSeconds = 10,
    totalRounds = 1,
    broadcastData,
} = {}) => {
    // Create game and save its current state.
    const emptyGame = factsGame.createNewGame({ totalRounds })
    const game = factsGame.addPlayerToGame(emptyGame, {
        displayName,
        fact,
        lie,
        socketId,
    })
    setGameById(game.gameId, game)

    setTimeout(() => {
        // Players have likely joined the game since it started.
        // So it's necessary to get a fresh reference to the game.
        const gameToStart = getGameById(game.gameId)
        const socketIds = gameToStart.players.map(({ socketId }) => socketId)

        // Don't start/play the game if necessary conditions aren't true.
        const { shouldCancel, reason } = shouldGameBeCancelled(game)

        if (shouldCancel) {
            broadcastData(
                {
                    action: 'START_GAME_ERROR',
                    gameId: gameToStart.gameId,
                    error: `${reason}. This game has been cancelled. Please try again.`,
                },
                ...socketIds
            )
            deleteGameById(game.gameId)
            return console.warn(`${gameToStart.gameId} ${reasonForCancelling}`)
        }

        playGame(gameToStart.gameId, broadcastData)
    }, readyingDurationInSeconds * 1000)

    return game
}

module.exports.joinExistingGame = ({ gameId, player }) => {
    // If using a DB that allows conditional updates,
    // then use conditional expressions.
    // The problem with the approach below is that the database can change
    // between the read and write.
    // So we may be acting on stale information.
    const game = getGameById(gameId)

    let error
    if (undefined === game) {
        error = `No game found with an id "${gameId}"`
    } else if (game.state !== STATE.READYING) {
        error = 'Game can no longer be joined.'
    }
    if (error) {
        return { error, gameId }
    }

    const joinedGame = factsGame.addPlayerToGame(game, player)
    setGameById(gameId, joinedGame)

    return { gameId }
}

const delay = (seconds) => {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000)
    })
}

const playGame = async (gameId, broadcastData) => {
    const secondsToWait = {
        afterGameStarted: 2,
        forAnswer: 5,
        forAnswerBuffer: 1,
        forReveal: 5,
    }

    let game = getGameById(gameId)
    game = factsGame.startExistingGame(game)
    setGameById(gameId, game)

    broadcastData(
        {
            gameId: game.gameId,
            action: 'GAME_STARTED',
        },
        game.players.map(({ socketId }) => socketId)
    )

    await delay(secondsToWait.afterGameStarted)

    for (let roundNumber = 1; roundNumber <= game.totalRounds; ++roundNumber) {
        // TODO: GAME NEW_CURRENT_TURN_ID
        game.currentTurnId = uuidv4()
        // TODO: PLAYER::RESET_CURRENT_ANSWER action
        game.players.forEach((player) => {
            player.currentAnswer = null
        })

        const factOwner = game.players[roundNumber - 1]
        const participants = game.players.map(({ playerId, displayName }) => {
            return {
                choiceId: playerId,
                displayName,
            }
        })

        const leaderboard = game.players
            .map(({ displayName, score }) => {
                return {
                    displayName,
                    score,
                }
            })
            .sort((a, b) => a.score - b.score)

        // Wait for players to answer.
        for (
            let secondsLeft = secondsToWait.forAnswer;
            secondsLeft > 0;
            --secondsLeft
        ) {
            // Question 1: Whose fact is it?
            broadcastData(
                {
                    gameId,
                    roundNumber,
                    action: 'GUESS_WHO_TIMER',
                    facts: factOwner.shuffledFactAndLie,
                    participants,
                    leaderboard,
                    secondsLeft,
                    turnId: game.currentTurnId,
                },
                game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }
        // Get answers from clients, give it a second in case of
        // network congestion.
        broadcastData(
            {
                gameId,
                action: 'GUESS_WHO_CHOICE',
                roundNumber,
                turnId: game.currentTurnId,
                participants,
            },
            game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forAnswerBuffer)

        // Players' current answers have been updated
        // (asynchronously in the background).

        // Check + award players point where appropriate
        // TODO: GAME INCREMENT_SCORES
        // TODO: PLAYER INCREMENT_SCORE
        game = updateGameById(gameId, {
            currentTurnId: null,
            players: game.players.map((player) => {
                const answerIsCorrect =
                    player.currentAnswer === factOwner.playerId
                return {
                    ...player,
                    score: player.score + (answerIsCorrect ? 1 : 0),
                }
            }),
        })

        for (
            let secondsLeft = secondsToWait.forAnswer;
            secondsLeft > 0;
            --secondsLeft
        ) {
            broadcastData(
                {
                    gameId,
                    roundNumber,
                    action: 'REVEAL_WHO_TIMER',
                    secondsLeft,
                },
                game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }

        // Broadcast whose fact it was
        broadcastData(
            {
                gameId,
                action: 'REVEAL_WHO',
                roundNumber,
                displayName: factOwner.displayName,
                turnId: game.currentTurnId,
            },
            game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forReveal)

        // Question 2: Which fact was fake?
        // TODO: GAME NEW_CURRENT_TURN_ID
        game.currentTurnId = uuidv4()
        // TODO: PLAYER::RESET_CURRENT_ANSWER action
        game.players.forEach((player) => {
            player.currentAnswer = null
        })

        // Wait for players to answer.
        for (
            let secondsLeft = secondsToWait.forAnswer;
            secondsLeft > 0;
            --secondsLeft
        ) {
            // Question 2: Which fact was fake?
            broadcastData(
                {
                    gameId,
                    roundNumber,
                    action: 'GUESS_FAKE_FACT_TIMER',
                    facts: factOwner.shuffledFactAndLie,
                    secondsLeft,
                    turnId: game.currentTurnId,
                },
                game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }
        // Get answers from clients, give it a second in case of
        // network congestion.
        broadcastData(
            {
                gameId,
                roundNumber,
                action: 'GUESS_FAKE_FACT_CHOICE',
                turnId: game.currentTurnId,
                // Maybe
                participants,
            },
            game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forAnswerBuffer)

        // Players' current answers have been updated
        // (asynchronously in the background).

        // Check + award players point where appropriate
        // TODO: GAME INCREMENT_SCORES
        // TODO: PLAYER INCREMENT_SCORE
        game = updateGameById(gameId, {
            currentTurnId: null,
            players: game.players.map((player) => {
                const answerIsCorrect = player.currentAnswer === factOwner.lie
                return {
                    ...player,
                    score: player.score + (answerIsCorrect ? 1 : 0),
                }
            }),
        })

        for (let secondsLeft = 5; secondsLeft > 0; --secondsLeft) {
            broadcastData(
                {
                    gameId,
                    roundNumber,
                    action: 'REVEAL_FAKE_FACT_TIMER',
                    secondsLeft,
                },
                game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }

        // Broadcast whose fact it was
        broadcastData(
            {
                gameId,
                roundNumber,
                action: 'REVEAL_FAKE_FACT',
                turnId: game.currentTurnId,
                displayName: factOwner.displayName,
                fact: factOwner.fact,
                lie: factOwner.lie,
            },
            game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forReveal)
    }

    game = getGameById(gameId)
    const leaderboard = game.players
        .map(({ displayName, score }) => {
            return {
                displayName,
                score,
            }
        })
        .sort((a, b) => a.score - b.score)

    // All rounds have been played.

    broadcastData(
        {
            gameId,
            action: 'PODIUM',
            turnId: game.currentTurnId,
            leaderboard,
            top3: leaderboard.slice(0, 3),
        },
        game.players.map(({ socketId }) => socketId)
    )

    await delay(2)

    deleteGameById(gameId)
    console.log('Deleted ' + gameId)
}

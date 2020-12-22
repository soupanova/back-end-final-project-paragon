const { createRandomId } = require('../utils')

const gameState = {
    READYING: 'READYING',
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'IN_FINISHED',
}

const gamesCache = {}

const getNewGameId = () => {
    while (true) {
        const gameId = createRandomId()
        if (!doesIdExist(gameId)) {
            return gameId
        }
    }
}

const doesIdExist = (gameId) => Boolean(gamesCache[gameId])

const getGameById = (gameId) => {
    return gamesCache[gameId]
}

const setGameById = (gameId, game) => {
    return (gamesCache[gameId] = game)
}

const updateGameById = (gameId, updates) => {
    return (gamesCache[gameId] = {
        ...gamesCache[gameId],
        ...updates,
    })
}

const deleteGameById = (gameId) => {
    return (gamesCache[gameId] = undefined)
}

const createNewGame = ({
    readyingSeconds = 10,
    totalRounds = 2,
    broadcasterFunc,
} = {}) => {
    const game = {
        gameId: getNewGameId(),
        createdAt: new Date().getTime(),
        updatedAt: null,
        endedAt: null,
        state: gameState.READYING,
        totalRounds,
        currentRound: 0,
        players: [],
        currentTurnId: null,
    }
    // Update cache
    setGameById(game.gameId, game)

    setTimeout(() => {
        const gameToStart = getGameById(game.gameId)

        const socketIds = gameToStart.players.map(({ socketId }) => socketId)

        // TODO: Should check here if game is valid (as per plan).
        if (
            gameToStart.state !== gameState.READYING ||
            gameToStart.players.length < gameToStart.totalRounds
        ) {
            broadcasterFunc(
                {
                    action: 'START_GAME_ERROR',
                },
                ...socketIds
            )
            // TODO: Delete the game here.
            return
        }

        const startedGame = startGame(gameToStart)
        gamesCache[startedGame.gameId] = startedGame

        playGame(startedGame.gameId, broadcasterFunc)
    }, readyingSeconds * 1000)

    return game
}

const startGame = (game) => {
    console.log('Starting game', game)
    return {
        ...game,
        updatedAt: new Date().getTime(),
        state: gameState.IN_PROGRESS,
        // Shuffle players array once
        players: game.players
            .map((value) => ({ value, sortBy: Math.random() }))
            .sort((a, b) => a.sortBy - b.sortBy)
            .map(({ value }) => value),
    }
}

const joinGame = ({ gameId, player: { socketId, displayName, fact, lie } }) => {
    // If using a DB that allows conditional updates,
    // then use conditional expressions.
    // The problem with the approach below is that the database can change
    // between the read and write.
    // So we may be acting on stale information.
    const game = getGameById(gameId)

    if (game?.state !== gameState.READYING) {
        return {
            error: 'Game can no longer be joined.',
            gameId,
        }
    }

    const newPlayer = {
        socketId,
        connected: true,
        playerId: createRandomId(),
        score: 0,
        displayName,
        fact,
        lie,
        shuffledFactAndLie: Math.random() < 0.5 ? [fact, lie] : [lie, fact],
        currentAnswer: null,
    }

    const updatedGame = {
        ...game,
        players: [...game.players, newPlayer],
    }

    gamesCache[gameId] = updatedGame

    return {
        error: null,
        gameId,
    }
}

const delay = (seconds) =>
    new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000)
    })

const playGame = async (gameId, broadcasterFunc) => {
    const secondsToWait = {
        afterGameStarted: 2,
        forAnswer: 2,
        forAnswerBuffer: 1,
        forReveal: 2,
    }

    let game = getGameById(gameId)

    broadcasterFunc(
        {
            gameId: game.gameId,
            action: 'GAME_STARTED',
        },
        ...game.players.map(({ socketId }) => socketId)
    )

    await delay(secondsToWait.afterGameStarted)

    for (let roundNumber = 1; roundNumber <= game.totalRounds; ++roundNumber) {
        game.currentTurnId = createRandomId()
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
            broadcasterFunc(
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
                ...game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }
        // Get answers from clients, give it a second in case of
        // network congestion.
        broadcasterFunc(
            {
                gameId,
                action: 'GUESS_WHO_CHOICE',
                roundNumber,
                turnId: game.currentTurnId,
                participants,
            },
            ...game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forAnswerBuffer)

        // Players' current answers have been updated
        // (asynchronously in the background).

        // Check + award players point where appropriate
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
            broadcasterFunc(
                {
                    gameId,
                    roundNumber,
                    action: 'REVEAL_WHO_TIMER',
                    secondsLeft,
                },
                ...game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }

        // Broadcast whose fact it was
        broadcasterFunc(
            {
                gameId,
                action: 'REVEAL_WHO',
                roundNumber,
                displayName: factOwner.displayName,
                turnId: game.currentTurnId,
            },
            ...game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forReveal)

        // Question 2: Which fact was fake?
        game.currentTurnId = createRandomId()
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
            broadcasterFunc(
                {
                    gameId,
                    roundNumber,
                    action: 'GUESS_FAKE_FACT_TIMER',
                    facts: factOwner.shuffledFactAndLie,
                    secondsLeft,
                    turnId: game.currentTurnId,
                },
                ...game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }
        // Get answers from clients, give it a second in case of
        // network congestion.
        broadcasterFunc(
            {
                gameId,
                roundNumber,
                action: 'GUESS_FAKE_FACT_CHOICE',
                turnId: game.currentTurnId,
                // Maybe
                participants,
            },
            ...game.players.map(({ socketId }) => socketId)
        )
        await delay(secondsToWait.forAnswerBuffer)

        // Players' current answers have been updated
        // (asynchronously in the background).

        // Check + award players point where appropriate
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
            broadcasterFunc(
                {
                    gameId,
                    roundNumber,
                    action: 'REVEAL_FAKE_FACT_TIMER',
                    secondsLeft,
                },
                ...game.players.map(({ socketId }) => socketId)
            )
            await delay(1)
        }

        // Broadcast whose fact it was
        broadcasterFunc(
            {
                gameId,
                roundNumber,
                action: 'REVEAL_FAKE_FACT',
                turnId: game.currentTurnId,
                displayName: factOwner.displayName,
                fact: factOwner.fact,
                lie: factOwner.lie,
            },
            ...game.players.map(({ socketId }) => socketId)
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

    broadcasterFunc(
        {
            gameId,
            action: 'PODIUM',
            turnId: game.currentTurnId,
            leaderboard,
            top3: leaderboard.slice(0, 3),
        },
        ...game.players.map(({ socketId }) => socketId)
    )

    await delay(2)

    deleteGameById(gameId)
    console.log('Deleted ' + gameId)
}

module.exports = {
    createNewGame,
    getGameById,
    doesIdExist,
    joinGame,
    updateGameById,
}

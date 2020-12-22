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

const createNewGame = ({
    readyingSeconds = 10,
    totalRounds = 5,
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
    // Need to know who's still in the game.
    const game = getGameById(gameId)

    broadcasterFunc(
        { action: 'GAME_STARTED' },
        game.players.map(({ socketId }) => socketId)
    )

    await delay(3)

    for (let i = 0; i < Math.min(game.players.length, game.totalRounds); ++i) {
        game.currentTurnId = createRandomId()
        game.players.forEach((player) => {
            player.currentAnswer = null
        })

        const factOwner = game.players[i]

        // Question 1: Whose fact is it?
        broadcasterFunc({
            action: 'GUESS_WHO',
            facts: factOwner.shuffledFactAndLie,
        })

        await delay(3)
    }
}

module.exports = {
    createNewGame,
    getGameById,
    doesIdExist,
    joinGame,
}

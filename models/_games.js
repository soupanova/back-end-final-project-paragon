'use strict'

const gamesCache = {}

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

module.exports = {
    getGameById,
    setGameById,
    doesIdExist,
    updateGameById,
    deleteGameById,
}

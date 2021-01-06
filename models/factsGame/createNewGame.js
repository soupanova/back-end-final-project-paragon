// @ts-check
'use strict'

const { v4: uuidv4 } = require('uuid')
const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')
const { STATE } = require('../../constants/game')

const { gameSchema } = require('../schemas/readying')

/**
 * Stores game object in database.
 */
const defaultHandler = (game) => {
    return dynamoDbClient
        .put({
            TableName: FACTS_TABLE_NAME,
            Item: game,
            ConditionExpression: 'attribute_not_exists(gameId)',
        })
        .promise()
}

/**
 * Returns a game object in its "initial" state (with just the player
 * who created it).
 */
module.exports.createNewGame = async (options = {}) => {
    const { creator, totalRounds, asyncSaveHandler = defaultHandler } = options

    const newGame = {
        gameId: uuidv4(),
        createdAt: Date.now(),
        state: STATE.READYING,
        totalRounds,
        currentRound: null,
        players: {
            [creator.playerId]: creator,
        },
        currentTurnId: null,
    }

    console.log('Game created', newGame)

    /**
     * Runtime validation of the game object before sticking it in the
     * database. Making sure its values and types are "correct".
     */
    const { error } = gameSchema.validate(newGame)
    if (error) {
        throw error
    }

    /**
     * Add game to database.
     */
    await asyncSaveHandler(newGame)

    return newGame
}

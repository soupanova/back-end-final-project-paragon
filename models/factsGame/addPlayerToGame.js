'use strict'

const { STATE } = require('../../constants/game')
const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')
const { playerSchema } = require('../schemas/readying')

/**
 * Store player in database.
 */
const defaultHandler = ({ gameId, player }) => {
    return dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            UpdateExpression: 'SET players.#playerId = :newPlayer',
            ConditionExpression:
                '(#state = :readying) AND attribute_not_exists(players.#playerId)',
            ExpressionAttributeValues: {
                ':readying': STATE.READYING,
                ':newPlayer': player,
            },
            ExpressionAttributeNames: {
                '#state': 'state',
                '#playerId': player.playerId,
            },
            ReturnValues: 'ALL_NEW',
        })
        .promise()
}

/**
 * Takes in a gameId and a player object and returns a copy of the game
 * with the player added to it.
 */
module.exports.addPlayerToGame = async (options = {}) => {
    const { gameId, player, asyncSaveHandler = defaultHandler } = options
    /**
     * Check the player object before sticking it in the
     * database. Making sure its values and types are "correct".
     */
    const { error } = playerSchema.validate(player)
    if (error) {
        throw error
    }
    const { Attributes: table } = await asyncSaveHandler({ gameId, player })
    return table
}

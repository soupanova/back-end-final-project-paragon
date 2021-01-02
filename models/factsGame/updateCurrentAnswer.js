// @ts-check
'use strict'

const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

module.exports.updateCurrentAnswer = async ({ gameId, playerId, choice }) => {
    const { Attributes: game } = await dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            UpdateExpression: 'SET #players.#playerId.#currentAnswer = :choice',
            ExpressionAttributeNames: {
                '#players': 'players',
                '#playerId': playerId,
                '#currentAnswer': 'currentAnswer',
            },
            ExpressionAttributeValues: {
                ':choice': choice,
            },
            ReturnValues: 'ALL_NEW',
        })
        .promise()

    return game
}

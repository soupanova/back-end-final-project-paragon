// @ts-check
'use strict'

const { STATE } = require('../../constants/game')
const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

/**
 * Takes in a game ID and tries to start the game.
 */
module.exports.startGame = async ({ gameId }) => {
    const { Attributes } = await dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            UpdateExpression: 'SET #state = :inProgress',
            ExpressionAttributeNames: {
                '#state': 'state',
                '#players': 'players',
                '#totalRounds': 'totalRounds',
            },
            ExpressionAttributeValues: {
                ':readying': STATE.READYING,
                ':inProgress': STATE.IN_PROGRESS,
            },
            ConditionExpression:
                '#state = :readying AND size(#players) >= #totalRounds',
            ReturnValues: 'ALL_NEW',
        })
        .promise()
    return Attributes
}

// @ts-check
'use strict'

const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')
const { v4: uuidv4 } = require('uuid')

module.exports.unlockAnswers = async ({ gameId }) => {
    const { Attributes: game } = await dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            UpdateExpression:
                'SET #currentTurnId = :uuid, #acceptAnswers = :acceptAnswers',
            ExpressionAttributeNames: {
                '#currentTurnId': 'currentTurnId',
                '#acceptAnswers': 'acceptAnswers',
            },
            ExpressionAttributeValues: {
                ':uuid': uuidv4(),
                ':acceptAnswers': true,
            },
            ReturnValues: 'ALL_NEW',
        })
        .promise()

    return game
}

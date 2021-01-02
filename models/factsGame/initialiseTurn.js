// @ts-check
'use strict'

const { v4: uuidv4 } = require('uuid')
const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

module.exports.initialiseTurn = async ({ gameId }) => {
    /**
     * Get a fresh reference for players.
     */
    const {
        Item: { players },
    } = await dynamoDbClient
        .get({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            ProjectionExpression: '#players',
            ExpressionAttributeNames: {
                '#players': 'players',
            },
        })
        .promise()

    /**
     * Build "update expression" dynamically based on the
     * players we fetched above.
     */
    const updateParams = Object.keys(players).reduce(
        (acc, playerId, i) => {
            return {
                ...acc,
                updateExpressions: [
                    ...acc.updateExpressions,
                    `#players.#p${i}.#currentAnswer = :null`,
                ],
                expressionAttributeNames: {
                    ...acc.expressionAttributeNames,
                    [`#p${i}`]: playerId,
                },
            }
        },
        {
            updateExpressions: ['SET #currentTurnId = :uuid'],
            expressionAttributeNames: {
                '#currentTurnId': 'currentTurnId',
                '#players': 'players',
                '#currentAnswer': 'currentAnswer',
            },
            expressionAttributeValues: {
                ':null': null,
                ':uuid': uuidv4(),
            },
        }
    )

    /**
     * Pass "update expression" back to database, so that it can do the update.
     */
    const updates = await dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            UpdateExpression: updateParams.updateExpressions.join(', '),
            ExpressionAttributeNames: updateParams.expressionAttributeNames,
            ExpressionAttributeValues: updateParams.expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        })
        .promise()

    /**
     * Return the updated game.
     */
    return updates.Attributes
}

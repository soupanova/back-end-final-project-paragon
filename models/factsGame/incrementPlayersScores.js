// @ts-check
'use strict'

const { v4: uuidv4 } = require('uuid')
const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

module.exports.incrementPlayersScores = async ({
    gameId,
    playerIds,
    incrementBy = 1,
}) => {
    /**
     * Build "update expression" dynamically based on the
     * players passed in.
     */
    const updateParams = playerIds.reduce(
        (acc, playerId, i) => {
            return {
                ...acc,
                updateExpressions: [
                    ...acc.updateExpressions,
                    `#players.#p${i}.#score = #players.#p${i}.#score + :incrementBy`,
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
                '#players': playerIds.length > 0 ? 'players' : undefined,
                '#score': playerIds.length > 0 ? 'score' : undefined,
            },
            expressionAttributeValues: {
                ':uuid': uuidv4(),
                ':incrementBy': playerIds.length > 0 ? incrementBy : undefined,
            },
        }
    )

    /**
     * Pass "update expression" back to database, so that it can do the update.
     */
    await dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
            UpdateExpression: updateParams.updateExpressions.join(', '),
            ExpressionAttributeNames: updateParams.expressionAttributeNames,
            ExpressionAttributeValues: updateParams.expressionAttributeValues,
        })
        .promise()
}

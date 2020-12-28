// @ts-check
'use strict'

const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

module.exports.getGame = async ({ gameId }) => {
    const { Item } = await dynamoDbClient
        .get({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
        })
        .promise()

    return Item
}

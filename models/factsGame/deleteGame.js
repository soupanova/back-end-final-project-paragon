// @ts-check
'use strict'

const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

module.exports.deleteGame = ({ gameId }) => {
    return dynamoDbClient
        .delete({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId },
        })
        .promise()
}

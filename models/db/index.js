const AWS = require('aws-sdk')

/**
 * Can be used to perform any operation in DynamoDB.
 */
const dynamoDb = new AWS.DynamoDB({
    region: 'eu-west-1',
    apiVersion: '2012-08-10',
})

/**
 * Makes a few DB operations (e.g. adding an item, getting an item, etc.) easier
 * (by allowing us to use JavaScript types instead of "DynamoDB JSON").
 *
 * Doesn't support all operations (e.g. creating a table (use the service instead)),
 * but still useful/convenient.
 */
const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
    service: dynamoDb,
})

const { FACTS_TABLE_NAME } = process.env

const FACTS_TABLE_CREATION_CONFIG = {
    TableName: FACTS_TABLE_NAME,
    AttributeDefinitions: [
        {
            AttributeName: 'gameId',
            AttributeType: 'S',
        },
    ],
    KeySchema: [
        {
            AttributeName: 'gameId',
            KeyType: 'HASH',
        },
    ],
    BillingMode: 'PAY_PER_REQUEST',
}

module.exports = {
    dynamoDb,
    dynamoDbClient,
    FACTS_TABLE_NAME,
    FACTS_TABLE_CREATION_CONFIG,
}

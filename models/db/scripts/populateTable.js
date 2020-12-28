const { dynamoDbClient, FACTS_TABLE_NAME } = require('../')
const { seedItem } = require('../seedData')

const populateFactsTable = async () => {
    await dynamoDbClient
        .put({ TableName: FACTS_TABLE_NAME, Item: seedItem })
        .promise()

    console.log('Table should now be populated')
}

module.exports = { populateFactsTable }

if (require.main === module) {
    populateFactsTable()
}

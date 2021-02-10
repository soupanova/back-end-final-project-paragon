const {
    dynamoDb,
    FACTS_TABLE_CREATION_CONFIG,
    FACTS_TABLE_NAME,
} = require('../')

const createFactsTable = async () => {
    /**
     * Request for table to be created.
     */
    await dynamoDb.createTable(FACTS_TABLE_CREATION_CONFIG).promise()
    /**
     * Polling to check if table has been created and if it's ready to be used.
     */
    for (let i = 0; i < 10; ++i) {
        const { TableNames: tableNames } = await dynamoDb.listTables().promise()
        if (tableNames.includes(FACTS_TABLE_NAME)) {
            /**
             * Polling to check if table status has changed from CREATING to ACTIVE.
             */
            for (let a = 0; a < 10; ++a) {
                const description = await dynamoDb
                    .describeTable({ TableName: FACTS_TABLE_NAME })
                    .promise()
                if (description.Table.TableStatus === 'ACTIVE') {
                    return console.log('Table should now be created')
                }
                await new Promise((r) => setTimeout(r, 1000))
            }
        }
        await new Promise((r) => setTimeout(r, 1000))
    }
    console.log("Weird, table doesn't appear to have been created?")
}

module.exports = {
    createFactsTable,
}

if (require.main === module) {
    createFactsTable()
}

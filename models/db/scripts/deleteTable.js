const { dynamoDb, FACTS_TABLE_NAME } = require('../')

const deleteFactsTable = async () => {
    try {
        /**
         * Request for table to be deleted.
         */
        await dynamoDb.deleteTable({ TableName: FACTS_TABLE_NAME }).promise()

        /**
         * Polling to check if table has been deleted.
         */
        for (let i = 0; i < 10; ++i) {
            const {
                TableNames: tableNames,
            } = await dynamoDb.listTables().promise()
            if (!tableNames.includes(FACTS_TABLE_NAME)) {
                return console.log('Table should now be deleted')
            }
            await new Promise((r) => setTimeout(r, 1000))
        }
        console.log("Weird, table doesn't appear to have been deleted?")
    } catch (err) {
        if ('ResourceNotFoundException' === err.name) {
            return console.log('Table should now be deleted')
        }
        console.error('Failed to delete table')
        throw err
    }
}

module.exports = {
    deleteFactsTable,
}

if (require.main === module) {
    deleteFactsTable()
}

const { createFactsTable } = require('./createTable')
const { deleteFactsTable } = require('./deleteTable')
const { populateFactsTable } = require('./populateTable')

const reinitialiseFactsTable = () => {
    return deleteFactsTable()
        .then(createFactsTable)
        .then(populateFactsTable)
        .then(() => console.log('Table should now be reinitialised'))
}

if (require.main === module) {
    reinitialiseFactsTable()
}

const { createFactsTable } = require('./createTable')
const { deleteFactsTable } = require('./deleteTable')

const reinitialiseFactsTable = () => {
    return deleteFactsTable()
        .then(createFactsTable)
        .then(() => console.log('Table should now be reinitialised'))
}

if (require.main === module) {
    reinitialiseFactsTable()
}

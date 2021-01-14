const Joi = require('joi')

/**
 * Some schemas that will probably be used in several different files
 * and are unlikely to change throughout the game.
 *
 * Created/exported here once to avoid duplicate code.
 */
module.exports = {
    uuidv4: Joi.string().required().guid({ version: 'uuidv4' }),
    gameId: Joi.string().required().length(21),
    displayName: Joi.string().required().pattern(/\S+/).min(1).max(100),
    factOrLie: Joi.string().required().max(150).regex(/\S+/),
    shuffledFactAndLie: Joi.array()
        .items(Joi.ref('...fact'), Joi.ref('...lie'))
        .length(2),
    totalRounds: Joi.number().required().min(1).max(10).integer(),
}

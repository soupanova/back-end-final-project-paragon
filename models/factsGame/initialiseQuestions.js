// @ts-check
'use strict'

const { v4: uuidv4 } = require('uuid')
const { dynamoDbClient, FACTS_TABLE_NAME } = require('../db')

module.exports.initialiseQuestions = (game) => {
    const { gameId, players, totalRounds } = game
    /**
     * Create the choices. These won't change, so makes sense to do it only once.
     */
    const choicesForQuestion1 = Object.values(players).map(
        ({ displayName, playerId }) => {
            return {
                choiceId: playerId,
                text: displayName,
            }
        }
    )

    /**
     * Choose which players the questions will be about.
     */
    const randomlySelectedPlayers = Object.values(players)
        .map((player) => {
            return {
                player,
                sortBy: Math.random(),
            }
        })
        .sort((a, b) => a.sortBy - b.sortBy)
        .map(({ player }) => player)
        .slice(0, totalRounds)

    /**
     * Create an array of "rounds", where each round has 2 questions.
     */
    const rounds = randomlySelectedPlayers.map((player) => {
        /**
         * Question 1: Whose fact is it?
         */
        const firstQuestion = {
            statements: player.shuffledFactAndLie,
            correctAnswer: {
                choiceId: player.playerId,
                text: player.displayName,
            },
        }

        /**
         * Question 2: Which fact was fake?
         */
        const secondQuestion = {
            statements: player.shuffledFactAndLie,
            choices: player.shuffledFactAndLie.map((statement) => {
                return {
                    choiceId: statement,
                    text: statement,
                }
            }),
            correctAnswer: {
                choiceId: player.lie,
                text: player.lie,
            },
        }

        return [firstQuestion, secondQuestion]
    })

    /**
     * Add a "rounds" array representing the questions that will be asked.
     */
    return dynamoDbClient
        .update({
            TableName: FACTS_TABLE_NAME,
            Key: { gameId: gameId },
            UpdateExpression:
                'SET #rounds = :rounds, #cachedChoices = :cachedChoices',
            ExpressionAttributeNames: {
                '#rounds': 'rounds',
                '#cachedChoices': 'cachedChoices',
            },
            ExpressionAttributeValues: {
                ':rounds': rounds,
                ':cachedChoices': choicesForQuestion1,
            },
        })
        .promise()
}

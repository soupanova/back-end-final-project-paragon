// // @ts-check
// 'use strict'

// const { dynamoDbClient, FACTS_TABLE_NAME } = require('../models/db')

// const { STATE } = require('../constants/game')
// const { v4: uuidv4 } = require('uuid')
// const { createNewGame } = require('../models/factsGame/createGame')
// const { createNewPlayer } = require('../models/factsGamePlayer/createNewPlayer')

// const {
//     initialiseQuestions,
// } = require('../models/factsGame/initialiseQuestions')
// const { startGame } = require('./startGame')

// // const shouldGameBeCancelled = (gameToCheck) => {
// //     let reason
// //     if (STATE.READYING !== gameToCheck.state) {
// //         reason = 'Game is not ready to be played'
// //     } else if (gameToCheck.players.length < gameToCheck.totalRounds) {
// //         reason = 'Not enough players to start the game'
// //     }
// //     return { reason, shouldCancel: Boolean(reason) }
// // }

// module.exports.createAndJoinNewGame = async ({
//     creatorDetails,
//     readyingDurationInSeconds = 10,
//     totalRounds = 1,
//     broadcastData,
// }) => {
//     // Create the game (with creator) and persist to state.
//     const [gameCreationError, createdGame] = await (async () => {
//         try {
//             const creator = createNewPlayer(creatorDetails)
//             const game = await createNewGame({ creator, totalRounds })
//             return [null, game]
//         } catch (err) {
//             console.error('Failed to create game', err)
//             return [err, null]
//         }
//     })()

//     if (gameCreationError) {
//         return [new Error('Failed to create the game.'), null]
//     }

//     const { gameId } = createdGame

//     const log = (...args) => {
//         console.log(`[${new Date().toISOString()} GAME ${gameId}]`, ...args)
//     }

//     // Readying period. Players will be joining, game's state will
//     // changing.
//     {
//         // await delay(readyingDurationInSeconds)
//     }

//     // Should be a "startGame" function.

//     // Readying period over. Try to start game.
//     try {
//     } catch (err) {
//         log('Failed to start game', err)

//         // Get socket IDs.
//         const { Item } = await dynamoDbClient
//             .get({
//                 TableName: FACTS_TABLE_NAME,
//                 Key: { gameId },
//                 ProjectionExpression: '#players',
//                 ExpressionAttributeNames: {
//                     '#players': 'players',
//                 },
//                 ConsistentRead: true,
//             })
//             .promise()

//         const socketIds = Object.values(Item.players).map(
//             ({ socketId }) => socketId
//         )

//         // Do a second request to find the exact reason?
//         // reason = 'Game is not ready to be played'
//         // reason = 'Not enough players to start the game'
//         broadcastData(
//             {
//                 action: 'START_GAME_ERROR',
//                 gameId,
//                 error:
//                     'This game could not be started. Sorry, please try again!',
//             },
//             socketIds
//         )

//         log('Deleted game', err)
//         return
//     }

//     await playGame({ gameId, broadcastData, totalRounds })
// }

// // module.exports.joinExistingGame = ({ gameId, player }) => {
// //     // If using a DB that allows conditional updates,
// //     // then use conditional expressions.
// //     // The problem with the approach below is that the database can change
// //     // between the read and write.
// //     // So we may be acting on stale information.
// //     const game = getGameById(gameId)

// //     let error
// //     if (undefined === game) {
// //         error = `No game found with an id "${gameId}"`
// //     } else if (game.state !== STATE.READYING) {
// //         error = 'Game can no longer be joined.'
// //     }
// //     if (error) {
// //         return { error, gameId }
// //     }

// //     const joinedGame = factsGame.addPlayerToGame(game, player)
// //     setGameById(gameId, joinedGame)

// //     return { gameId }
// // }

// const delay = (seconds) => {
//     return new Promise((resolve) => {
//         setTimeout(resolve, seconds * 1000)
//     })
// }

// const playGame = async ({ gameId, broadcastData, totalRounds }) => {
//     const secondsToWait = {
//         afterGameStarted: 2,
//         forAnswer: 5,
//         forAnswerBuffer: 1,
//         beforeReveal: 5,
//         afterReveal: 5,
//     }

//     // Have already broadcasted to everyone that the game has started.
//     // Wait briefly. What was the point? Take this out?
//     {
//         await delay(secondsToWait.afterGameStarted)
//     }

//     // Start the game loop
//     for (let roundNumber = 1; roundNumber <= totalRounds; ++roundNumber) {
//         /**
//          * Stuff that can be considered "constant" for the duration of the turn:
//          *  • `currentTurnId`
//          *  • `factOwner`
//          */
//         // Set currentTurnId to uuid and all players' current answers to null.
//         // This stuff happens once before each question.
//         {
//             const game = await initialiseTurn({ gameId })

//             console.log('Playing the game', { game })

//             const factOwnerId = game.shuffledPlayers[roundNumber - 1]
//             const factOwner = game.players[factOwnerId]

//             const participants = Object.entries(game.players).map(
//                 ([playerId, { displayName }]) => {
//                     return {
//                         choiceId: playerId,
//                         displayName,
//                     }
//                 }
//             )

//             const leaderboard = Object.entries(game.players)
//                 .map(([displayName, { score }]) => {
//                     return {
//                         displayName,
//                         score,
//                     }
//                 })
//                 .sort((a, b) => a.score - b.score)

//             const socketIds = Object.values(game.players).map(
//                 ({ socketId }) => socketId
//             )

//             await broadcastForNSeconds({
//                 totalSeconds: secondsToWait.forAnswer,
//                 broadcastFunc(secondsLeft) {
//                     broadcastData(
//                         {
//                             gameId,
//                             roundNumber,
//                             action: 'GUESS_WHO_TIMER',
//                             facts: factOwner.shuffledFactAndLie,
//                             participants,
//                             leaderboard,
//                             secondsLeft,
//                             turnId: game.currentTurnId,
//                         },
//                         socketIds
//                     )
//                 },
//             })

//             // Prompt answers from clients.
//             broadcastData(
//                 {
//                     gameId,
//                     action: 'GUESS_WHO_CHOICE',
//                     roundNumber,
//                     turnId: game.currentTurnId,
//                     participants,
//                 },
//                 socketIds
//             )
//             // Give it a second in case of network congestion.
//             await delay(secondsToWait.forAnswerBuffer)
//         }

//         // Players' current answers have been updated
//         // (asynchronously in the background).

//         {
//             // Check + award players point where appropriate
//             // TODO: GAME INCREMENT_SCORES
//             // TODO: PLAYER INCREMENT_SCORE

//             console.log('About to lock answers')

//             // This should "lock" everyone's answers for this particular question.
//             const { Attributes: game } = await dynamoDbClient
//                 .update({
//                     TableName: FACTS_TABLE_NAME,
//                     Key: { gameId },
//                     UpdateExpression:
//                         'SET #currentTurnId = :uuid, #acceptAnswers = :acceptAnswers',
//                     ExpressionAttributeNames: {
//                         '#currentTurnId': 'currentTurnId',
//                         '#acceptAnswers': 'acceptAnswers',
//                     },
//                     ExpressionAttributeValues: {
//                         ':uuid': uuidv4(),
//                         ':acceptAnswers': false,
//                     },
//                     ReturnValues: 'ALL_NEW',
//                 })
//                 .promise()

//             console.log('Locked answers')

//             const factOwnerId = game.shuffledPlayers[roundNumber - 1]
//             const factOwner = game.players[factOwnerId]

//             console.log("About to increment players' scores")

//             // Increment players' scores if they got the answer right.
//             const playerIdsWhoAnsweredCorrectly = Object.keys(
//                 game.players
//             ).filter(({ currentAnswer }) => currentAnswer === factOwnerId)

//             const updateParams = playerIdsWhoAnsweredCorrectly.reduce(
//                 (acc, playerId, i) => {
//                     return {
//                         ...acc,
//                         updateExpressions: [
//                             ...acc.updateExpressions,
//                             `#players.#p${i}.#score = #players.#p${i}.#score + 1`,
//                         ],
//                         expressionAttributeNames: {
//                             ...acc.expressionAttributeNames,
//                             [`#p${i}`]: playerId,
//                         },
//                     }
//                 },
//                 {
//                     updateExpressions: ['SET #currentTurnId = :uuid'],
//                     expressionAttributeNames: {
//                         '#currentTurnId': 'currentTurnId',
//                         '#players':
//                             playerIdsWhoAnsweredCorrectly.length > 0
//                                 ? 'players'
//                                 : undefined,
//                     },
//                     expressionAttributeValues: {
//                         ':uuid': uuidv4(),
//                     },
//                 }
//             )

//             await dynamoDbClient
//                 .update({
//                     TableName: FACTS_TABLE_NAME,
//                     Key: { gameId },
//                     UpdateExpression: updateParams.updateExpressions.join(', '),
//                     ExpressionAttributeNames:
//                         updateParams.expressionAttributeNames,
//                     ExpressionAttributeValues:
//                         updateParams.expressionAttributeValues,
//                 })
//                 .promise()

//             console.log("Incremented players' scores")

//             const socketIds = Object.values(game.players).map(
//                 ({ socketId }) => socketId
//             )

//             // Build suspense.
//             await broadcastForNSeconds({
//                 totalSeconds: secondsToWait.beforeReveal,
//                 broadcastFunc(secondsLeft) {
//                     broadcastData(
//                         {
//                             gameId,
//                             roundNumber,
//                             action: 'REVEAL_WHO_TIMER',
//                             secondsLeft,
//                         },
//                         socketIds
//                     )
//                 },
//             })

//             broadcastData(
//                 {
//                     gameId,
//                     action: 'REVEAL_WHO',
//                     roundNumber,
//                     displayName: factOwner.displayName,
//                     turnId: game.currentTurnId,
//                 },
//                 socketIds
//             )
//             await delay(secondsToWait.afterReveal)
//         }

//         // Question 2: whose fact was it?
//         {
//             const game = await initialiseTurn({ gameId })

//             const factOwnerId = game.shuffledPlayers[roundNumber - 1]
//             const factOwner = game.players[factOwnerId]

//             const participants = Object.entries(game.players).map(
//                 ([playerId, { displayName }]) => {
//                     return {
//                         choiceId: playerId,
//                         displayName,
//                     }
//                 }
//             )

//             const leaderboard = Object.values(game.players)
//                 .map(({ displayName, score }) => {
//                     return {
//                         displayName,
//                         score,
//                     }
//                 })
//                 .sort((a, b) => a.score - b.score)

//             const socketIds = Object.values(game.players).map(
//                 ({ socketId }) => socketId
//             )

//             await broadcastForNSeconds({
//                 totalSeconds: secondsToWait.forAnswer,
//                 broadcastFunc(secondsLeft) {
//                     broadcastData(
//                         {
//                             gameId,
//                             roundNumber,
//                             action: 'GUESS_FAKE_FACT_TIMER',
//                             facts: factOwner.shuffledFactAndLie,
//                             secondsLeft,
//                             turnId: game.currentTurnId,
//                         },
//                         socketIds
//                     )
//                 },
//             })

//             // Get answers from clients,
//             broadcastData(
//                 {
//                     gameId,
//                     roundNumber,
//                     action: 'GUESS_FAKE_FACT_CHOICE',
//                     turnId: game.currentTurnId,
//                     // Maybe
//                     participants,
//                 },
//                 socketIds
//             )
//             // give it a second in case of
//             // network congestion.
//             await delay(secondsToWait.forAnswerBuffer)
//         }

//         // Players' current answers have been updated
//         // (asynchronously in the background).

//         {
//             // Check + award players point where appropriate
//             // TODO: GAME INCREMENT_SCORES
//             // TODO: PLAYER INCREMENT_SCORE

//             // This should "lock" everyone's answers for this particular question.
//             const { Attributes: game } = await dynamoDbClient
//                 .update({
//                     TableName: FACTS_TABLE_NAME,
//                     Key: { gameId },
//                     UpdateExpression:
//                         'SET #currentTurnId = :uuid, #acceptAnswers = :acceptAnswers',
//                     ExpressionAttributeNames: {
//                         '#currentTurnId': 'currentTurnId',
//                         '#acceptAnswers': 'acceptAnswers',
//                     },
//                     ExpressionAttributeValues: {
//                         ':uuid': uuidv4(),
//                         ':acceptAnswers': false,
//                     },
//                     ReturnValues: 'ALL_NEW',
//                 })
//                 .promise()

//             const factOwnerId = game.shuffledPlayers[roundNumber - 1]
//             const factOwner = game.players[factOwnerId]

//             // Increment players' scores if they got the answer right.
//             const playerIdsWhoAnsweredCorrectly = Object.keys(
//                 game.players
//             ).filter(({ currentAnswer }) => currentAnswer === factOwner.lie)

//             const updateParams = playerIdsWhoAnsweredCorrectly.reduce(
//                 (acc, playerId, i) => {
//                     return {
//                         ...acc,
//                         updateExpressions: [
//                             ...acc.updateExpressions,
//                             `#players.#p${i}.#score = #players.#p${i}.#score + 1`,
//                         ],
//                         expressionAttributeNames: {
//                             ...acc.expressionAttributeNames,
//                             [`#p${i}`]: playerId,
//                         },
//                     }
//                 },
//                 {
//                     updateExpressions: ['SET #currentTurnId = :uuid'],
//                     expressionAttributeNames: {
//                         '#currentTurnId': 'currentTurnId',
//                         '#players':
//                             playerIdsWhoAnsweredCorrectly.length > 0
//                                 ? 'players'
//                                 : undefined,
//                     },
//                     expressionAttributeValues: {
//                         ':uuid': uuidv4(),
//                     },
//                 }
//             )

//             await dynamoDbClient
//                 .update({
//                     TableName: FACTS_TABLE_NAME,
//                     Key: { gameId },
//                     UpdateExpression: updateParams.updateExpressions.join(', '),
//                     ExpressionAttributeNames:
//                         updateParams.expressionAttributeNames,
//                     ExpressionAttributeValues:
//                         updateParams.expressionAttributeValues,
//                 })
//                 .promise()

//             const socketIds = Object.values(game.players).map(
//                 ({ socketId }) => socketId
//             )

//             // Build suspense.
//             await broadcastForNSeconds({
//                 totalSeconds: secondsToWait.beforeReveal,
//                 broadcastFunc(secondsLeft) {
//                     broadcastData(
//                         {
//                             gameId,
//                             roundNumber,
//                             action: 'REVEAL_FAKE_FACT_TIMER',
//                             secondsLeft,
//                         },
//                         socketIds
//                     )
//                 },
//             })

//             // Broadcast whose fact it was.
//             broadcastData(
//                 {
//                     gameId,
//                     action: 'REVEAL_FAKE_FACT',
//                     roundNumber,
//                     displayName: factOwner.displayName,
//                     turnId: game.currentTurnId,
//                 },
//                 socketIds
//             )
//             await delay(secondsToWait.afterReveal)
//         }
//     }

//     // All rounds have been played.
//     {
//         const { Item: game } = await dynamoDbClient
//             .get({
//                 TableName: FACTS_TABLE_NAME,
//                 Key: { gameId },
//             })
//             .promise()

//         const leaderboard = Object.values(game.players)
//             .map(({ displayName, score }) => {
//                 return {
//                     displayName,
//                     score,
//                 }
//             })
//             .sort((a, b) => a.score - b.score)

//         const socketIds = Object.values(game.players).map(
//             ({ socketId }) => socketId
//         )

//         broadcastData(
//             {
//                 gameId,
//                 action: 'PODIUM',
//                 turnId: game.currentTurnId,
//                 leaderboard,
//                 top3: leaderboard.slice(0, 3),
//             },
//             socketIds
//         )

//         await delay(2)
//         await dynamoDbClient
//             .delete({
//                 TableName: FACTS_TABLE_NAME,
//                 Key: { gameId },
//             })
//             .promise()

//         console.log('Deleted ' + gameId)
//     }

//     /**
//      *  =================================================================================
//      */

//     // let game = getGameById(gameId)
//     // game = factsGame.startExistingGame(game)
//     // setGameById(gameId, game)

//     // broadcastData(
//     //     {
//     //         gameId: game.gameId,
//     //         action: 'GAME_STARTED',
//     //     },
//     //     game.players.map(({ socketId }) => socketId)
//     // )

//     // await delay(secondsToWait.afterGameStarted)

//     // for (let roundNumber = 1; roundNumber <= game.totalRounds; ++roundNumber) {
//     // // TODO: GAME NEW_CURRENT_TURN_ID
//     // game.currentTurnId = uuidv4()
//     // // TODO: PLAYER::RESET_CURRENT_ANSWER action
//     // game.players.forEach((player) => {
//     //     player.currentAnswer = null
//     // })
//     // const factOwner = game.players[roundNumber - 1]
//     // const participants = game.players.map(({ playerId, displayName }) => {
//     //     return {
//     //         choiceId: playerId,
//     //         displayName,
//     //     }
//     // })
//     // const leaderboard = game.players
//     //     .map(({ displayName, score }) => {
//     //         return {
//     //             displayName,
//     //             score,
//     //         }
//     //     })
//     //     .sort((a, b) => a.score - b.score)
//     // Wait for players to answer.
//     // for (
//     //     let secondsLeft = secondsToWait.forAnswer;
//     //     secondsLeft > 0;
//     //     --secondsLeft
//     // ) {
//     //     // Question 1: Whose fact is it?
//     //     broadcastData(
//     //         {
//     //             gameId,
//     //             roundNumber,
//     //             action: 'GUESS_WHO_TIMER',
//     //             facts: factOwner.shuffledFactAndLie,
//     //             participants,
//     //             leaderboard,
//     //             secondsLeft,
//     //             turnId: game.currentTurnId,
//     //         },
//     //         game.players.map(({ socketId }) => socketId)
//     //     )
//     //     await delay(1)
//     // }
//     // Get answers from clients, give it a second in case of
//     // network congestion.
//     // broadcastData(
//     //     {
//     //         gameId,
//     //         action: 'GUESS_WHO_CHOICE',
//     //         roundNumber,
//     //         turnId: game.currentTurnId,
//     //         participants,
//     //     },
//     //     game.players.map(({ socketId }) => socketId)
//     // )
//     // await delay(secondsToWait.forAnswerBuffer)
//     // Players' current answers have been updated
//     // (asynchronously in the background).
//     // Check + award players point where appropriate
//     // TODO: GAME INCREMENT_SCORES
//     // TODO: PLAYER INCREMENT_SCORE
//     // game = updateGameById(gameId, {
//     //     currentTurnId: null,
//     //     players: game.players.map((player) => {
//     //         const answerIsCorrect =
//     //             player.currentAnswer === factOwner.playerId
//     //         return {
//     //             ...player,
//     //             score: player.score + (answerIsCorrect ? 1 : 0),
//     //         }
//     //     }),
//     // })
//     // for (
//     //     let secondsLeft = secondsToWait.forAnswer;
//     //     secondsLeft > 0;
//     //     --secondsLeft
//     // ) {
//     //     broadcastData(
//     //         {
//     //             gameId,
//     //             roundNumber,
//     //             action: 'REVEAL_WHO_TIMER',
//     //             secondsLeft,
//     //         },
//     //         game.players.map(({ socketId }) => socketId)
//     //     )
//     //     await delay(1)
//     // }
//     // Broadcast whose fact it was
//     // broadcastData(
//     //     {
//     //         gameId,
//     //         action: 'REVEAL_WHO',
//     //         roundNumber,
//     //         displayName: factOwner.displayName,
//     //         turnId: game.currentTurnId,
//     //     },
//     //     game.players.map(({ socketId }) => socketId)
//     // )
//     // await delay(secondsToWait.forReveal)
//     // Question 2: Which fact was fake?
//     // TODO: GAME NEW_CURRENT_TURN_ID
//     // game.currentTurnId = uuidv4()
//     // // TODO: PLAYER::RESET_CURRENT_ANSWER action
//     // game.players.forEach((player) => {
//     //     player.currentAnswer = null
//     // })
//     // // Wait for players to answer.
//     // for (
//     //     let secondsLeft = secondsToWait.forAnswer;
//     //     secondsLeft > 0;
//     //     --secondsLeft
//     // ) {
//     //     // Question 2: Which fact was fake?
//     //     broadcastData(
//     //         {
//     //             gameId,
//     //             roundNumber,
//     //             action: 'GUESS_FAKE_FACT_TIMER',
//     //             facts: factOwner.shuffledFactAndLie,
//     //             secondsLeft,
//     //             turnId: game.currentTurnId,
//     //         },
//     //         game.players.map(({ socketId }) => socketId)
//     //     )
//     //     await delay(1)
//     // }
//     // // Get answers from clients, give it a second in case of
//     // // network congestion.
//     // broadcastData(
//     //     {
//     //         gameId,
//     //         roundNumber,
//     //         action: 'GUESS_FAKE_FACT_CHOICE',
//     //         turnId: game.currentTurnId,
//     //         // Maybe
//     //         participants,
//     //     },
//     //     game.players.map(({ socketId }) => socketId)
//     // )
//     // await delay(secondsToWait.forAnswerBuffer)
//     // Players' current answers have been updated
//     // (asynchronously in the background).
//     // Check + award players point where appropriate
//     // TODO: GAME INCREMENT_SCORES
//     // TODO: PLAYER INCREMENT_SCORE
//     //     game = updateGameById(gameId, {
//     //         currentTurnId: null,
//     //         players: game.players.map((player) => {
//     //             const answerIsCorrect = player.currentAnswer === factOwner.lie
//     //             return {
//     //                 ...player,
//     //                 score: player.score + (answerIsCorrect ? 1 : 0),
//     //             }
//     //         }),
//     //     })
//     //     for (let secondsLeft = 5; secondsLeft > 0; --secondsLeft) {
//     //         broadcastData(
//     //             {
//     //                 gameId,
//     //                 roundNumber,
//     //                 action: 'REVEAL_FAKE_FACT_TIMER',
//     //                 secondsLeft,
//     //             },
//     //             game.players.map(({ socketId }) => socketId)
//     //         )
//     //         await delay(1)
//     //     }
//     //     // Broadcast whose fact it was
//     //     broadcastData(
//     //         {
//     //             gameId,
//     //             roundNumber,
//     //             action: 'REVEAL_FAKE_FACT',
//     //             turnId: game.currentTurnId,
//     //             displayName: factOwner.displayName,
//     //             fact: factOwner.fact,
//     //             lie: factOwner.lie,
//     //         },
//     //         game.players.map(({ socketId }) => socketId)
//     //     )
//     //     await delay(secondsToWait.forReveal)
//     // }

//     // game = getGameById(gameId)
//     // const leaderboard = game.players
//     //     .map(({ displayName, score }) => {
//     //         return {
//     //             displayName,
//     //             score,
//     //         }
//     //     })
//     //     .sort((a, b) => a.score - b.score)

//     // // All rounds have been played.

//     // broadcastData(
//     //     {
//     //         gameId,
//     //         action: 'PODIUM',
//     //         turnId: game.currentTurnId,
//     //         leaderboard,
//     //         top3: leaderboard.slice(0, 3),
//     //     },
//     //     game.players.map(({ socketId }) => socketId)
//     // )

//     // await delay(2)

//     // deleteGameById(gameId)
//     // console.log('Deleted ' + gameId)
// }

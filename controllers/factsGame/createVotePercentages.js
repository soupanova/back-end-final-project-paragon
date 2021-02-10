// @ts-check
'use strict'

/**
 * Receiving array of players objects
 * Transforming into:
 * {
 *      playerId: {
 *          displayName: string,
 *              votesCount: number,
 *      }
 * }
 * Sorting values (of object) descendingly
 * Slicing top 3
 * Returning array of objects with properties:
 *      displayName
 *      percentage
 */

module.exports.createVotePercentages = (players) => {
    const allPlayers = Object.values(players)

    const votesPerPlayer = allPlayers.reduce((accum, player) => {
        const playerIdToLookUp = player.currentAnswer?.choiceId
        const votedFor = players[playerIdToLookUp]

        if (!playerIdToLookUp || !votedFor) {
            return accum
        }

        const updates = {
            [playerIdToLookUp]: {
                displayName: votedFor.displayName,
                votesCount: 1 + (accum[playerIdToLookUp]?.votesCount ?? 0),
            },
        }

        return { ...accum, ...updates }
    }, {})

    const votePercentages = Object.values(votesPerPlayer)
        .sort((a, b) => b.votesCount - a.votesCount)
        .map(({ displayName, votesCount }) => {
            const unroundedPercentage = (votesCount / allPlayers.length) * 100
            const roundedPercentage = Math.round(unroundedPercentage)
            return {
                displayName,
                unroundedPercentage,
                displayPercentage: `${roundedPercentage}%`,
            }
        })

    return votePercentages
}

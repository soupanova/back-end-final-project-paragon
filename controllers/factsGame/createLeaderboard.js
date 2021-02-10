// @ts-check
'use strict'

module.exports.createLeaderboard = (players) => {
    return players
        .sort((a, b) => b.score - a.score)
        .reduce((acc, { displayName, score }, i, arr) => {
            let position
            if (i > 0) {
                const previousPlayer = arr[i - 1]
                const currentPlayerScoreIsSameAsPreviousPlayer =
                    score === previousPlayer.score
                const previousLeaderboardEntry = acc[i - 1]

                position = currentPlayerScoreIsSameAsPreviousPlayer
                    ? previousLeaderboardEntry.position
                    : previousLeaderboardEntry.position + 1
            } else {
                position = 1
            }

            const newLeaderboardEntry = {
                displayName,
                score,
                position,
            }

            return [...acc, newLeaderboardEntry]
        }, [])
}

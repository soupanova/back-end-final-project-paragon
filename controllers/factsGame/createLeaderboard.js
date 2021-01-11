// @ts-check
'use strict'

module.exports.createLeaderboard = (players) => {
    return players
        .sort((a, b) => b.score - a.score)
        .map(({ displayName, score }, i, arr) => {
            let position
            if (i > 0) {
                const previousPlayer = arr[i - 1]
                const currentPlayerScoreIsSameAsPreviousPlayer =
                    score === previousPlayer.score

                position = currentPlayerScoreIsSameAsPreviousPlayer
                    ? previousPlayer.position
                    : previousPlayer.position + 1
            } else {
                position = 1
            }
            return {
                displayName,
                score,
                position,
            }
        })
}

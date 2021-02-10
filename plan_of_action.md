1. Create a game
   1. Game has a `rounds` property.
   2. Game has a `READYING` state.

```js
{
    gameId: string, // randomly generated string uuid4
    state: "READYING",o
    totalRounds: number, // min 1, max 5
    players: [
        // TODO: Review this.
        {
            socketId: string,
            connected: boolean,
            playerId: string, // Might come from authentication
            displayName: string, // Might come from authentication
            score: number, // Initialise as 0
            fact: string,
            lie: string,
            shuffledFactsAndLies: [
                string,
                string,
            ],
            currentAnswer: string,
        }
    ],
    currentRound: number,
    currentTurnId: string,
}
```

# Lambda starts here for the spike.

1. Join a game
   1. Player sends their facts
   2. Player gets added to the game
   3. Player's score in game is initialised as 0
2. Wait to receive all the facts (2 minutes?)
3. Server checks if:
   1. there another enough players in the game.
   2. there are at least the same number of players as rounds.
4. If true, server starts the game (players can no longer join)
   1. Server shuffles the players array.
   2. Set game state to `IN_PROGRESS`
5. If not enough, server cancels/discards the game.

---

## START OF ROUNDS LOOP:

### Loop from 0 < `game.rounds`

1. START OF TURN:
   1. Server initialises `currentTurnId`
   2. Server initialise each player's `currentAnswer` as `null`

### Question 1: Whose fact is it?

2. Server broadcasts via ws to all connected clients:
   1. 2 facts
      1. Just sends the `shuffledFactsAndLies` property.
   2. List of all participants
      1. Display name
      2. Unique user id
      3. Map over `players` array and send just `playerId` and `displayName`, `score` properties.
      4. Front end creates leaderboard for itself (using `score`).
   3. Possibly the timer
   4. Leaderboard (see above)
3. Server waits for 30 seconds?
4. After 30 seconds, client sends:
   1. `turnId`, `playerId`
5. Server updates user's choice
   1. If `turnId` matches `currentTurnId`:
      1. Find user in array.
      2. Updating their answer `currentAnswer` with received `playerId`
6. At the end of the 30 seconds, server computes score for that turn.
   1. Server increments players' scores by 1 if their answer is correct.
   2. Answer is correct if:
      1. `currentAnswer` === `players[currentRound].playerId`
7. Server broadcasts via ws to all connected clients
   1. Display name/answer (whose fact was it): `players[currentRound].displayName`
   2. MAYBE: You scored a point!
   3. Server waits for 5 seconds.

## Question 2: Which fact is fake?

8. START OF TURN: Server initialises new turn id
9. Server broadcasts question 2 (which fact is true) to all clients:
   1. 2 facts
      1. Just send the `shuffledFactsAndLies` property.
   2. Timer (possibly)
10. Server waits for 30 seconds?
11. After 30 seconds, client sends:
    1. `turnId`, statement that was clicked
12. Server updates user's choice
    1. If `turnId` matches `currentTurnId`:
       1. Find user in array.
       2. Update their answer `currentAnswer` with received statement
13. At the end of the 30 seconds, server computes score for that turn.
    1. Server increments players' scores by 1 if their answer is correct.
    2. Answer is correct if:
       1. `currentAnswer` === `players[currentRound].lie`
14. Server broadcasts via ws to all connected clients
    1. Display fake fact: `players[currentRound].lie`
    2. MAYBE: You scored a point!
    3. Server waits for 5 seconds.
15. Increment rounds counter by 1.
16. If rounds counter less than or equal to total rounds, continue to next question.
17. If not, break from loop.

## END OF ROUNDS LOOP

17. Server broadcasts top 3 players to all clients:
    1.  Display name
    2.  Game state changes to `FINISHED`.
    3.  Should delete the game from the database.

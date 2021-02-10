'use strict'

const { createVotePercentages } = require('./createVotePercentages')

const playerObj = {
    AAA: {
        playerId: 'ID AAA',
        displayName: 'Name AAA',
        currentAnswer: {
            choiceId: 'BBB',
        },
    },
    BBB: {
        playerId: 'ID BBB',
        displayName: 'Name BBB',
        currentAnswer: {
            choiceId: 'CCC',
        },
    },
    CCC: {
        playerId: 'ID CCC',
        displayName: 'Name CCC',
        currentAnswer: {
            choiceId: 'AAA',
        },
    },
    DDD: {
        playerId: 'ID DDD',
        displayName: 'Name DDD',
        currentAnswer: {
            choiceId: 'AAA',
        },
    },
    EEE: {
        playerId: 'ID EEE',
        displayName: 'Name EEE',
        currentAnswer: {
            choiceId: 'AAA',
        },
    },
    FFF: {
        playerId: 'ID FFF',
        displayName: 'Name FFF',
        currentAnswer: {
            choiceId: 'AAA',
        },
    },
    GGG: {
        playerId: 'ID GGG',
        displayName: 'Name GGG',
        currentAnswer: {
            choiceId: 'BBB',
        },
    },
}

describe('createVotePercentage should summarise votes accurately for given input', () => {
    const votePercentages = createVotePercentages(playerObj)

    it('should return an array of objects', () => {
        expect(votePercentages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    displayName: expect.any(String),
                    unroundedPercentage: expect.any(Number),
                    displayPercentage: expect.stringMatching(/^\d+%$/),
                }),
            ])
        )
    })

    it('should not contain any NaN values', () => {
        expect(
            votePercentages.every(
                ({ unroundedPercentage }) => !isNaN(unroundedPercentage)
            )
        ).toBe(true)
    })

    it('should contain percentages between 0 and 100 inclusively', () => {
        expect(
            votePercentages.every(
                ({ unroundedPercentage }) =>
                    unroundedPercentage >= 0 && unroundedPercentage <= 100
            )
        ).toBe(true)
    })

    it('should contain percentages that add up to ~100', () => {
        const total = votePercentages.reduce(
            (acc, { unroundedPercentage }) => acc + unroundedPercentage,
            0
        )
        expect(Math.abs(total - 100)).toBeLessThan(2)
    })

    it('should match expected output', () => {
        expect(votePercentages).toStrictEqual([
            expect.objectContaining({
                displayName: 'Name AAA',
                displayPercentage: '57%',
            }),
            expect.objectContaining({
                displayName: 'Name BBB',
                displayPercentage: '29%',
            }),
            expect.objectContaining({
                displayName: 'Name CCC',
                displayPercentage: '14%',
            }),
        ])
    })
})

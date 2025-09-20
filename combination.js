const combinations = [
    {
        ingredients: ['물', '불'],
        outcomes: [
            { card: '증기', probability: 0.5 },
            { card: '돌', probability: 0.5 }
        ]
    },
    {
        ingredients: ['물', '생명'],
        outcomes: [
            { card: '플랑크톤', probability: 0.8 },
            { card: '이끼', probability: 0.2 }
        ]
    },
    {
        ingredients: ['불', '불'],
        outcomes: [ { card: '용암', probability: 1 } ]
    },
    {
        ingredients: ['용암', '물'],
        outcomes: [ { card: '흑요석', probability: 1 } ]
    },
    {
        ingredients: ['불', '돌'],
        outcomes: [ { card: '금속', probability: 1 } ]
    },
    {
        ingredients: ['생명', '돌'],
        outcomes: [ { card: '알', probability: 1 } ]
    },
    {
        ingredients: ['증기', '생명'],
        outcomes: [ { card: '구름', probability: 1 } ]
    },
    {
        ingredients: ['플랑크톤', '플랑크톤'],
        outcomes: [
            { card: '물고기', probability: 0.7 },
            { card: '바이러스', probability: 0.3 }
        ]
    },
    {
        ingredients: ['물', '돌'],
        outcomes: [ { card: '모래', probability: 1 } ]
    },
    {
        ingredients: ['알', '불'],
        outcomes: [ { card: '도마뱀', probability: 1 } ]
    },
    {
        ingredients: ['구름', '불'],
        outcomes: [ { card: '번개', probability: 1 } ]
    },
    {
        ingredients: ['금속', '생명'],
        outcomes: [ { card: '로봇', probability: 1 } ]
    },
    {
        ingredients: ['물고기', '생명'],
        outcomes: [ { card: '인어', probability: 1 } ]
    },
    {
        ingredients: ['모래', '불'],
        outcomes: [ { card: '유리', probability: 1 } ]
    },
    {
        ingredients: ['바이러스', '생명'],
        outcomes: [ { card: '좀비', probability: 1 } ]
    },
    {
        ingredients: ['돌', '돌'],
        outcomes: [ { card: '벽', probability: 1 } ]
    },
    {
        ingredients: ['물', '번개'],
        outcomes: [ { card: '폭풍', probability: 1 } ]
    },
    {
        ingredients: ['도마뱀', '생명'],
        outcomes: [ { card: '용', probability: 1 } ]
    },
    {
        ingredients: ['금속', '번개'],
        outcomes: [ { card: '전기', probability: 1 } ]
    },
    // New Recipes
    {
        ingredients: ['열기', '반전'],
        outcomes: [ { card: '한기', probability: 1 } ]
    },
    {
        ingredients: ['한기', '물'],
        outcomes: [ { card: '얼음', probability: 1 } ]
    },
    {
        ingredients: ['반전', '빛'],
        outcomes: [ { card: '어둠', probability: 1 } ]
    },
    {
        ingredients: ['어둠', '어둠'],
        outcomes: [ { card: '암전', probability: 1 } ]
    },
    // New Combination: 생명 + 반전 = 죽음
    {
        ingredients: ['생명', '반전'],
        outcomes: [ { card: '죽음', probability: 1 } ]
    },
    // New Combination: 죽음 + 생명 = 사신
    {
        ingredients: ['죽음', '암전'],
        outcomes: [ { card: '사신', probability: 1 } ]
    }
];

const splits = [
    { source: '폭풍', results: ['바람', '바람'] },
    { source: '용', results: ['비늘', '비늘'] },
    { source: '얼음', results: ['눈', '한기'] },
    {
        source: '전기',
        outcomes: [
            { results: ['속도', '빛'], probability: 0.5 },
            { results: ['열기', '빛'], probability: 0.5 }
        ]
    }
];

function getCombinationResult(card1, card2) {
    const combination = combinations.find(c => {
        if (card1 === card2) {
            return c.ingredients.length === 2 && c.ingredients[0] === card1 && c.ingredients[1] === card1;
        } else {
            return c.ingredients.includes(card1) && c.ingredients.includes(card2);
        }
    });

    if (!combination) {
        return null;
    }

    const rand = Math.random();
    let cumulativeProbability = 0;

    for (const outcome of combination.outcomes) {
        cumulativeProbability += outcome.probability;
        if (rand < cumulativeProbability) {
            return outcome.card;
        }
    }

    return null;
}

// 도감 생성을 위해 모든 카드 이름 목록을 가져오는 함수
function getAllCardNames() {
    const cardNames = new Set();

    // 조합 규칙 처리
    combinations.forEach(c => {
        c.ingredients.forEach(i => cardNames.add(i));
        c.outcomes.forEach(o => cardNames.add(o.card));
    });

    // 분리 규칙 처리
    splits.forEach(s => {
        cardNames.add(s.source);
        if (s.results) { // 일반 분리 규칙
            s.results.forEach(r => cardNames.add(r));
        } else if (s.outcomes) { // 확률적 분리 규칙
            s.outcomes.forEach(o => {
                o.results.forEach(r => cardNames.add(r));
            });
        }
    });
    return [...cardNames];
}
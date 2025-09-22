console.log('game.js started!');

console.log('Attaching reset button listener...');
document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
        hintButton.addEventListener('click', useHint);
    }
});

const baseCards = ['물', '불', '생명', '반전'];
let playerCards = [];
let selectedCards = [];
let nextCardId = 0;
let lastClick = { id: null, time: 0 };

// --- 도감 데이터 ---
let unlockedCards = new Set();
let cardGrades = {};        // 카드의 합성 등급 (깊이)
// 생명 도감에 들어갈 카드 목록 정의
const lifeDogamCards = ['도마뱀', '용', '플랑크톤', '물고기', '인어', '좀비', '사신'];
// ------------------

// --- 힌트 시스템 데이터 ---
let hints = 0;
// ----------------------

// 힌트 횟수 화면 업데이트 함수 (game.js로 이동)
function updateHintDisplay() {
    const hintCountSpan = document.getElementById('hint-count');
    if (hintCountSpan) {
        hintCountSpan.textContent = hints;
    }
}

// 힌트 사용 함수
function useHint() {
    console.log('useHint() called!'); // 추가된 로그
    if (hints <= 0) {
        alert("힌트가 부족합니다!");
        return;
    }

    hints--;
    updateHintDisplay(); // 힌트 횟수 화면 업데이트

    let bestHint = null; // { ing1: 카드이름1, ing2: 카드이름2, result: 결과카드이름, grade: 결과카드등급 }

    const availableCardNames = new Set(playerCards.map(c => c.name));

    // 1. 우선순위 1: 현재 만들 수 있는 조합 중 아직 발견하지 못한 조합 찾기
    for (const combo of combinations) {
        const [ing1, ing2] = combo.ingredients;

        // 재료 카드가 모두 플레이어에게 있는지 확인
        if (availableCardNames.has(ing1) && availableCardNames.has(ing2)) {
            // 같은 카드끼리 조합하는 경우 (예: 불+불)
            if (ing1 === ing2) {
                const count = playerCards.filter(c => c.name === ing1).length;
                if (count < 2) continue; // 해당 카드가 2개 미만이면 조합 불가
            }

            // 결과 카드 중 아직 발견하지 못한 카드가 있는지 확인
            for (const outcome of combo.outcomes) {
                if (!unlockedCards.has(outcome.card)) {
                    bestHint = { ing1: ing1, ing2: ing2, result: outcome.card, grade: cardGrades[outcome.card] || 0 };
                    break; // 발견하면 검색 중단
                }
            }
        }
        if (bestHint) break; // 발견하면 외부 루프 중단
    }

    // 2. 우선순위 2: 모든 조합을 발견했다면, 가장 등급이 높은 조합 찾기
    if (!bestHint) {
        let maxGrade = -1;
        for (const combo of combinations) {
            const [ing1, ing2] = combo.ingredients;

            if (availableCardNames.has(ing1) && availableCardNames.has(ing2)) {
                if (ing1 === ing2) {
                    const count = playerCards.filter(c => c.name === ing1).length;
                    if (count < 2) continue;
                }

                for (const outcome of combo.outcomes) {
                    const resultGrade = cardGrades[outcome.card] || 0;
                    if (resultGrade > maxGrade) {
                        maxGrade = resultGrade;
                        bestHint = { ing1: ing1, ing2: ing2, result: outcome.card, grade: resultGrade };
                    }
                }
            }
        }
    }

    if (bestHint) {
        // alert(`힌트: ${bestHint.ing1} + ${bestHint.ing2} = ${bestHint.result} (등급: ${bestHint.grade})`); // 페이지 메시지 비활성화
        playSound('sound-hint'); // 힌트 사용 사운드 재생
        // 시각적 강조 (ui.js에서 구현)
        highlightHint(bestHint.ing1, bestHint.ing2);
        setTimeout(clearHint, 3000); // 3초 후 강조 해제
    } else {
        alert("현재 만들 수 있는 힌트가 없습니다.");
    }
    saveGame(); // 힌트 사용 후 게임 저장
}

// 모든 카드의 합성 등급을 계산하는 함수
function calculateCardGrades() {
    const allCardNames = getAllCardNames();
    let changed = true;
    let iteration = 0;

    // 초기화: 기본 카드는 1등급
    baseCards.forEach(name => {
        cardGrades[name] = 1;
    });

    // 반복적으로 등급 계산 (최대 10번 반복하여 모든 깊이 커버)
    while (changed && iteration < 10) {
        changed = false;
        iteration++;

        // 조합 규칙을 통해 등급 계산
        combinations.forEach(combo => {
            const ingredientGrades = [];
            let allIngredientsGraded = true;

            combo.ingredients.forEach(ingredient => {
                if (cardGrades[ingredient] === undefined) {
                    allIngredientsGraded = false;
                } else {
                    ingredientGrades.push(cardGrades[ingredient]);
                }
            });

            if (allIngredientsGraded) {
                const maxIngredientGrade = Math.max(...ingredientGrades);
                const newGrade = maxIngredientGrade + 1;

                combo.outcomes.forEach(outcome => {
                    const resultCard = outcome.card;
                    if (cardGrades[resultCard] === undefined || newGrade > cardGrades[resultCard]) {
                        cardGrades[resultCard] = newGrade;
                        changed = true;
                    }
                });
            }
        });

        // 분리 규칙을 통해 등급 계산 (원본 카드의 등급 상속)
        splits.forEach(splitRule => {
            const sourceCard = splitRule.source;
            if (cardGrades[sourceCard] !== undefined) {
                const newGrade = cardGrades[sourceCard];
                let resultCardNames = [];
                if (splitRule.results) {
                    resultCardNames = splitRule.results;
                } else if (splitRule.outcomes) {
                    splitRule.outcomes.forEach(o => resultCardNames.push(...o.results));
                }

                resultCardNames.forEach(resultCard => {
                    if (cardGrades[resultCard] === undefined || newGrade > cardGrades[resultCard]) {
                        cardGrades[resultCard] = newGrade;
                        changed = true;
                    }
                });
            }
        });
    }
}

// 게임 저장 함수
function saveGame() {
    const gameData = {
        playerCards: playerCards,
        nextCardId: nextCardId,
        unlockedCards: Array.from(unlockedCards), // Set을 Array로 변환
        // combinationCounts: combinationCounts, // Removed as per user request
        hints: hints // 힌트 횟수 저장
    };
    localStorage.setItem('margeAndCardSave', JSON.stringify(gameData));
    console.log('Game saved!');
}

// 게임 불러오기 함수
function loadGame() {
    const savedData = localStorage.getItem('margeAndCardSave');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        playerCards = gameData.playerCards;
        nextCardId = gameData.nextCardId;
        unlockedCards = new Set(gameData.unlockedCards); // Array를 Set으로 변환
        // combinationCounts = gameData.combinationCounts; // Removed as per user request
        hints = gameData.hints; // 힌트 횟수 불러오기
        console.log('Game loaded!');
        renderCards(playerCards); // 불러온 카드 렌더링
        return true; // 불러오기 성공
    }
    return false; // 저장된 데이터 없음
}

function initGame() {
    calculateCardGrades(); // 게임 시작 시 등급 계산

    if (!loadGame()) { // 저장된 게임이 없으면 새로 시작
        const startingCardNames = ['물', '불', '불', '생명', '반전'];
        startingCardNames.forEach(name => {
            playerCards.push({ id: nextCardId++, name: name });
            unlockedCards.add(name);
        });
        renderCards(playerCards);
    }
    updateHintDisplay(); // 초기 로드 시 힌트 횟수 업데이트
}

function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) { sound.currentTime = 0; sound.play(); }
}

function handleCardDiscard(cardId) {
    const card = playerCards.find(c => c.id === cardId);
    if (!card) return;
    if (baseCards.includes(card.name)) {
        alert('기본 카드는 버릴 수 없습니다.');
        return;
    }
    playerCards = playerCards.filter(c => c.id !== cardId);
    renderCards(playerCards);
    selectedCards = [];
    updateSelectionVisuals(selectedCards);
    if (!dogamContainer.classList.contains('hidden')) {
        renderDogam();
    }
    saveGame(); // 게임 상태 저장
    updateHintDisplay(); // 힌트 횟수 업데이트
}

function handleCardSelection(cardId) {
    const now = Date.now();
    const card = playerCards.find(c => c.id === cardId);
    if (!card) return;

    if (lastClick.id === cardId && (now - lastClick.time) < 300) {
        const splitRule = splits.find(s => s.source === card.name);
        if (splitRule) {
            let resultsToSplit = [];
            if (splitRule.outcomes) {
                const rand = Math.random();
                let cumulativeProbability = 0;
                for (const outcome of splitRule.outcomes) {
                    cumulativeProbability += outcome.probability;
                    if (rand < cumulativeProbability) {
                        resultsToSplit = outcome.results;
                        break;
                    }
                }
            } else {
                resultsToSplit = splitRule.results;
            }

            if (resultsToSplit.length > 0) {
                if (!baseCards.includes(card.name)) {
                    playerCards = playerCards.filter(c => c.id !== cardId);
                }
                resultsToSplit.forEach(resultName => {
                    const newCard = { id: nextCardId++, name: resultName };
                    playerCards.push(newCard);
                    unlockedCards.add(resultName);
                    // 힌트 획득 로직
                    if (unlockedCards.size % 5 === 0) { // 5개마다 힌트 획득
                        hints++;
                        console.log(`New hint gained! Total hints: ${hints}`);
                    }
                });
                playSound('sound-split'); // 카드 분해 사운드 재생
                renderCards(playerCards);
                selectedCards = [];
                updateSelectionVisuals(selectedCards);
                if (!dogamContainer.classList.contains('hidden')) {
                    renderDogam();
                }
                saveGame(); // 게임 상태 저장
                updateHintDisplay(); // 힌트 횟수 업데이트
            }
        }
        lastClick = { id: null, time: 0 };
        return;
    }

    lastClick = { id: cardId, time: now };

    if (selectedCards.includes(cardId)) {
        selectedCards = selectedCards.filter(id => id !== cardId);
    } else if (selectedCards.length === 0) { // 첫 번째 카드 선택 시
        selectedCards.push(cardId);
        playSound('sound-select');
    } else if (selectedCards.length === 1) { // 두 번째 카드 선택 시
        selectedCards.push(cardId);
        // 두 번째 카드 선택 시에는 사운드 재생 안 함 (바로 조합으로 이어지므로)
    }

    updateSelectionVisuals(selectedCards);

    if (selectedCards.length === 2) {
        processCombination();
    }
}

function processCombination() {
    if (selectedCards.length !== 2) return;

    const card1 = playerCards.find(c => c.id === selectedCards[0]);
    const card2 = playerCards.find(c => c.id === selectedCards[1]);
    if (!card1 || !card2) return;

    const resultName = getCombinationResult(card1.name, card2.name);

    if (resultName) {
        // [card1.name, card2.name].forEach(name => {
        //     combinationCounts[name] = (combinationCounts[name] || 0) + 1; // Removed as per user request
        // });

        playSound('sound-combine');
        const cardElements = document.querySelectorAll('.card-container');
        cardElements.forEach(el => {
            if (selectedCards.includes(parseInt(el.dataset.cardId))) {
                el.classList.add('fading-out');
            }
        });

        setTimeout(() => {
            selectedCards.forEach(ingredientId => {
                const ingredient = playerCards.find(c => c.id === ingredientId);
                if (ingredient && !baseCards.includes(ingredient.name)) {
                    playerCards = playerCards.filter(c => c.id !== ingredientId);
                }
            });

            const newCard = { id: nextCardId++, name: resultName };
            playerCards.push(newCard);
            unlockedCards.add(resultName);
            // 힌트 획득 로직
            if (unlockedCards.size % 3 === 0) {
                hints++;
                console.log(`New hint gained! Total hints: ${hints}`);
            }
            selectedCards = [];
            renderCards(playerCards, newCard.id);
            updateSelectionVisuals(selectedCards);
            if (!dogamContainer.classList.contains('hidden')) {
                renderDogam();
            }
            saveGame(); // 게임 상태 저장
            updateHintDisplay(); // 힌트 횟수 업데이트
        }, 500);
    } else {
        setTimeout(() => {
            selectedCards = [];
            updateSelectionVisuals(selectedCards);
            if (!dogamContainer.classList.contains('hidden')) {
                renderDogam();
            }
            saveGame(); // 게임 상태 저장
            updateHintDisplay(); // 힌트 횟수 업데이트
        }, 500);
    }
}

// 게임 초기화 함수
function resetGame() {
    console.log('Reset button clicked!'); // 추가된 로그
    const confirmation = confirm("정말로 게임 데이터를 초기화 하시겠습니까?\n한번 삭제된 데이터는 복구 할 수 없습니다.");
    if (confirmation) {
        localStorage.removeItem('margeAndCardSave');
        // 모든 게임 상태 변수 초기화
        playerCards = [];
        selectedCards = [];
        nextCardId = 0;
        unlockedCards = new Set();
        // combinationCounts = {}; // Removed as per user request
        hints = 0; // 힌트 초기화
        // 게임 다시 시작
        initGame();
        console.log('Game data reset!');
    }
}

initGame();
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
        combinationCounts: combinationCounts
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
        combinationCounts = gameData.combinationCounts;
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
                });
                playSound('sound-combine');
                renderCards(playerCards);
                selectedCards = [];
                updateSelectionVisuals(selectedCards);
                if (!dogamContainer.classList.contains('hidden')) {
                    renderDogam();
                }
                saveGame(); // 게임 상태 저장
            }
        }
        lastClick = { id: null, time: 0 };
        return;
    }

    lastClick = { id: cardId, time: now };

    if (selectedCards.includes(cardId)) {
        selectedCards = selectedCards.filter(id => id !== cardId);
    } else if (selectedCards.length < 2) {
        selectedCards.push(cardId);
        playSound('sound-select');
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
            selectedCards = [];
            renderCards(playerCards, newCard.id);
            updateSelectionVisuals(selectedCards);
            if (!dogamContainer.classList.contains('hidden')) {
                renderDogam();
            }
            saveGame(); // 게임 상태 저장
        }, 500);
    } else {
        setTimeout(() => {
            selectedCards = [];
            updateSelectionVisuals(selectedCards);
            if (!dogamContainer.classList.contains('hidden')) {
                renderDogam();
            }
        }, 500);
    }
}

// 게임 초기화 함수
function resetGame() {
    const confirmation = confirm("정말로 게임 데이터를 초기화 하시겠습니까?\n한번 삭제된 데이터는 복구 할 수 없습니다.");
    if (confirmation) {
        localStorage.removeItem('margeAndCardSave');
        // 모든 게임 상태 변수 초기화
        playerCards = [];
        selectedCards = [];
        nextCardId = 0;
        unlockedCards = new Set();
        combinationCounts = {};
        // 게임 다시 시작
        initGame();
        console.log('Game data reset!');
    }
}

initGame();
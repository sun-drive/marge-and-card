const gameBoard = document.getElementById('game-board');
const dogamContainer = document.getElementById('dogam-container');
const dogamToggleButton = document.getElementById('dogam-toggle');
const hintButton = document.getElementById('hint-button');
const hintCountSpan = document.getElementById('hint-count');

// 전역 플래그: 롱프레스 후 클릭 방지
let preventClick = false;

dogamToggleButton.addEventListener('click', () => {
    const isHidden = dogamContainer.classList.toggle('hidden');
    if (!isHidden) {
        renderDogam();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
        hintButton.addEventListener('click', useHint);
    }
});

function renderCards(cards, newCardId) {
    gameBoard.innerHTML = '';
    cards.forEach(card => {
        const cardContainer = document.createElement('div');
        cardContainer.classList.add('card-container');
        cardContainer.dataset.cardId = card.id;
        cardContainer.dataset.cardName = card.name; // 추가: 카드 이름을 dataset에 저장

        let pressTimer;
        let isLongPress = false; // 플래그: 롱프레스가 감지되었는지

        cardContainer.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 기본 브라우저 동작(확대, 컨텍스트 메뉴 등) 방지
            pressTimer = setTimeout(() => {
                isLongPress = true;
                handleCardDiscard(card.id);
                // 선택 상태 초기화 및 UI 업데이트 (삭제 후)
                selectedCards = [];
                updateSelectionVisuals(selectedCards);
                if (!dogamContainer.classList.contains('hidden')) {
                    renderDogam();
                }
                saveGame();
            }, 2000); // 2초
        });

        cardContainer.addEventListener('touchend', (e) => {
            clearTimeout(pressTimer);
            if (isLongPress) {
                isLongPress = false;
                preventClick = true; // 롱프레스 후 클릭 이벤트 방지 플래그 설정
            }
        });

        cardContainer.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
            isLongPress = false; // 손가락이 움직이면 롱프레스 아님
        });

        cardContainer.addEventListener('click', (e) => {
            if (preventClick) {
                preventClick = false; // 플래그 초기화
                return; // 롱프레스 후 클릭 이벤트 방지
            }
            handleCardSelection(card.id);
        });

        cardContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleCardDiscard(card.id);
            // 선택 상태 초기화 및 UI 업데이트 (삭제 후)
            selectedCards = [];
            updateSelectionVisuals(selectedCards);
            if (!dogamContainer.classList.contains('hidden')) {
                renderDogam();
            }
            saveGame();
        });

        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        const img = document.createElement('img');
        img.src = `CardImageAssets/${card.name}.png`;
        img.alt = card.name;

        img.onerror = function() {
            const errorDiv = document.createElement('div');
            errorDiv.textContent = '이미지 없음';
            errorDiv.classList.add('card-error-text');
            if (img.parentNode) {
                img.parentNode.replaceChild(errorDiv, img);
            }
        };

        cardElement.appendChild(img);

        const cardNameElement = document.createElement('div');
        cardNameElement.classList.add('card-name');
        cardNameElement.textContent = card.name;

        cardContainer.appendChild(cardElement);
        cardContainer.appendChild(cardNameElement);
        gameBoard.appendChild(cardContainer);
    });
}

function updateSelectionVisuals(selectedCardIds) {
    const allCards = document.querySelectorAll('.card-container');
    gameBoard.classList.toggle('selection-active', selectedCardIds.length > 0);
    allCards.forEach(cardEl => {
        cardEl.classList.toggle('selected', selectedCardIds.includes(parseInt(cardEl.dataset.cardId)));
    });
}

// 힌트 강조 함수
function highlightHint(ing1Name, ing2Name) {
    const allCards = document.querySelectorAll('.card-container');
    allCards.forEach(cardEl => {
        const cardName = cardEl.dataset.cardName;
        if (cardName === ing1Name || cardName === ing2Name) {
            cardEl.classList.add('hint-highlight');
        }
    });
}

// 힌트 강조 해제 함수
function clearHint() {
    const highlightedCards = document.querySelectorAll('.card-container.hint-highlight');
    highlightedCards.forEach(cardEl => {
        cardEl.classList.remove('hint-highlight');
    });
}

function renderDogam() {
    dogamContainer.innerHTML = '';
    const allCardNames = getAllCardNames();
    
    const generalCards = [];
    const lifeCards = [];

    allCardNames.forEach(name => {
        if (lifeDogamCards.includes(name)) {
            lifeCards.push(name);
        } else {
            generalCards.push(name);
        }
    });

    // --- 일반 도감 렌더링 ---
    renderDogamSection(generalCards, '일반 도감', dogamContainer, false);

    // --- 생명 도감 렌더링 ---
    renderDogamSection(lifeCards, '생명 도감', dogamContainer, true);
}

function renderDogamSection(cardsToRender, titleText, parentElement, isLifeDogam) {
    const groupedByGrade = {};

    cardsToRender.forEach(name => {
        const grade = cardGrades[name] || 0; // cardGrades 사용
        if (!groupedByGrade[grade]) {
            groupedByGrade[grade] = [];
        }
        groupedByGrade[grade].push(name);
    });

    Object.keys(groupedByGrade).sort((a, b) => a - b).forEach(grade => { // 등급 오름차순 정렬
        const section = document.createElement('div');
        section.classList.add('dogam-grade-section');

        const title = document.createElement('div');
        title.classList.add('dogam-grade-title');
        title.textContent = `${titleText} - 합성 등급: ${grade}`;
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.classList.add('dogam-grid');

        groupedByGrade[grade].forEach(name => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('dogam-card');

            const visualDiv = document.createElement('div');
            visualDiv.classList.add('dogam-card-visual');

            const nameDiv = document.createElement('div');
            nameDiv.classList.add('dogam-card-name');

            if (unlockedCards.has(name)) {
                const img = document.createElement('img');
                img.src = `CardImageAsset/${name}.png`;
                img.alt = name;
                visualDiv.appendChild(img);

                let starsText = '';
                let gradeDisplay = grade;

                if (grade > 12) {
                    starsText = ''; // 별 없음
                    gradeDisplay = 12; // 12등급으로 표시
                } else {
                    starsText = '⭐'.repeat(Math.max(1, grade));
                }
                nameDiv.textContent = `${name} (등급 ${gradeDisplay}) ${starsText}`;
            } else {
                visualDiv.classList.add('locked');
                visualDiv.textContent = '???';
                if (isLifeDogam) {
                    nameDiv.textContent = '?'.repeat(name.length);
                } else {
                    nameDiv.textContent = '???';
                }
            }

            cardDiv.appendChild(visualDiv);
            cardDiv.appendChild(nameDiv);
            grid.appendChild(cardDiv);
        });

        section.appendChild(grid);
        parentElement.appendChild(section);
    });
}

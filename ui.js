
const gameBoard = document.getElementById('game-board');
const dogamContainer = document.getElementById('dogam-container');
const dogamToggleButton = document.getElementById('dogam-toggle');
const resetButton = document.getElementById('reset-button');

dogamToggleButton.addEventListener('click', () => {
    const isHidden = dogamContainer.classList.toggle('hidden');
    if (!isHidden) {
        renderDogam();
    }
});

resetButton.addEventListener('click', resetGame);

function renderCards(cards, newCardId) {
    gameBoard.innerHTML = '';
    cards.forEach(card => {
        const cardContainer = document.createElement('div');
        cardContainer.classList.add('card-container');
        cardContainer.dataset.cardId = card.id;

        cardContainer.addEventListener('click', () => handleCardSelection(card.id));
        cardContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleCardDiscard(card.id);
        });

        if (card.id === newCardId) {
            cardContainer.classList.add('new-card');
        }

        if (splits.some(s => s.source === card.name)) {
            cardContainer.classList.add('splittable');
        }

        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        const img = document.createElement('img');
        img.src = `Card Image Asset/${card.name}.png`;
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
                img.src = `Card Image Asset/${name}.png`;
                img.alt = name;
                visualDiv.appendChild(img);
                const stars = '⭐'.repeat(Math.max(1, combinationCounts[name] || 0)); // 별은 combinationCounts 사용
                nameDiv.textContent = `${name} (등급 ${grade}) ${stars}`;
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

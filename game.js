// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем на весь экран
tg.enableClosingConfirmation(); // Подтверждение при закрытии

// Состояние игры
let gameState = {
    tobacco: 0,
    tobaccoPerTap: 1,
    tobaccoPerSecond: 0,
    upgrades: [
        {
            id: 1,
            name: "Уголь 'Таблетка'",
            desc: "Начинающий уровень",
            price: 10,
            profit: 0.1,
            type: "passive",
            icon: "🔥",
            emoji: "🔥"
        },
        {
            id: 2,
            name: "Нарды на коленке",
            desc: "Клиенты любят подождать",
            price: 50,
            profit: 0.5,
            type: "passive",
            icon: "🎲",
            emoji: "🎲"
        },
        {
            id: 3,
            name: "Первый настоящий кальян",
            desc: "Khalil Mamoon",
            price: 200,
            profit: 2.0,
            type: "passive",
            icon: "💨",
            emoji: "💨"
        },
        {
            id: 4,
            name: "Помощник",
            desc: "+1 табак за тап",
            price: 500,
            profit: 1.0,
            type: "tap",
            icon: "👨‍🍳",
            emoji: "👨‍🍳"
        },
        {
            id: 5,
            name: "Свой фрукт",
            desc: "Лимоны и апельсины",
            price: 1500,
            profit: 5.0,
            type: "tap",
            icon: "🍋",
            emoji: "🍋"
        },
        {
            id: 6,
            name: "Вторая точка",
            desc: "Открываем филиал на Патриках",
            price: 5000,
            profit: 15.0,
            type: "passive",
            icon: "🏢",
            emoji: "🏢"
        },
        {
            id: 7,
            name: "Сеть кальянных",
            desc: "Bali Lounge Империя",
            price: 20000,
            profit: 50.0,
            type: "passive",
            icon: "🌍",
            emoji: "🌍"
        }
    ]
};

// Загрузка сохранения
function loadGame() {
    const saved = localStorage.getItem('baliLoungeGame');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            gameState.tobacco = loaded.tobacco || 0;
            gameState.tobaccoPerTap = loaded.tobaccoPerTap || 1;
            gameState.tobaccoPerSecond = loaded.tobaccoPerSecond || 0;
            
            // Восстанавливаем цены улучшений
            if (loaded.upgrades) {
                loaded.upgrades.forEach((loadedUpgrade, index) => {
                    if (gameState.upgrades[index]) {
                        gameState.upgrades[index].price = loadedUpgrade.price;
                    }
                });
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
}

// Сохранение игры
function saveGame() {
    const saveData = {
        tobacco: gameState.tobacco,
        tobaccoPerTap: gameState.tobaccoPerTap,
        tobaccoPerSecond: gameState.tobaccoPerSecond,
        upgrades: gameState.upgrades.map(u => ({ price: u.price }))
    };
    localStorage.setItem('baliLoungeGame', JSON.stringify(saveData));
}

// Получение ранга
function getRank(tobacco) {
    if (tobacco < 50) return "Стажёр";
    if (tobacco < 500) return "Мастер забивки";
    if (tobacco < 2000) return "Владелец одной чаши";
    if (tobacco < 10000) return "Кальянный барон";
    return "Владелец Bali Lounge";
}

// Обновление UI
function updateUI() {
    // Счетчик
    document.getElementById('tobaccoCount').textContent = Math.floor(gameState.tobacco);
    
    // Доход
    document.getElementById('perTap').innerHTML = `+${gameState.tobaccoPerTap.toFixed(0)}`;
    document.getElementById('perSecond').innerHTML = `+${gameState.tobaccoPerSecond.toFixed(1)}/сек`;
    
    // Ранг
    const rank = getRank(gameState.tobacco);
    document.getElementById('rank').textContent = rank;
    
    // Прогресс
    const progress = Math.min((gameState.tobacco / 500) * 100, 100);
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressCount').textContent = `${Math.floor(gameState.tobacco)}/500`;
    
    // Обновление магазина
    renderUpgrades();
    
    // Сохраняем игру
    saveGame();
    
    // Обновляем цветовую схему Telegram
    tg.setHeaderColor('#0c1f1a');
    tg.setBackgroundColor('#0c1f1a');
}

// Покупка улучшения
function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    if (gameState.tobacco >= upgrade.price) {
        gameState.tobacco -= upgrade.price;
        
        if (upgrade.type === 'tap') {
            gameState.tobaccoPerTap += upgrade.profit;
        } else {
            gameState.tobaccoPerSecond += upgrade.profit;
        }
        
        // Увеличиваем цену
        upgrade.price = Math.floor(upgrade.price * 1.5);
        
        // Анимация покупки
        tg.HapticFeedback.impactOccurred('medium');
        
        updateUI();
    }
}

// Рендер улучшений
function renderUpgrades() {
    const container = document.getElementById('upgradesList');
    container.innerHTML = '';
    
    gameState.upgrades.forEach(upgrade => {
        const canBuy = gameState.tobacco >= upgrade.price;
        const profitText = upgrade.type === 'tap' ? 'за тап' : 'в сек';
        
        const card = document.createElement('div');
        card.className = `upgrade-card ${canBuy ? 'can-buy' : ''}`;
        
        card.innerHTML = `
            <div class="upgrade-icon">${upgrade.emoji}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.desc}</div>
                <span class="upgrade-profit">+${upgrade.profit.toFixed(1)} ${profitText}</span>
            </div>
            <div class="upgrade-price">
                <span class="price-amount">${upgrade.price}</span>
                <span class="price-label">🍃 табака</span>
                <button class="buy-button" ${!canBuy ? 'disabled' : ''} onclick="buyUpgrade(${upgrade.id})">
                    Купить
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Обработчик клика
document.getElementById('clickButton').addEventListener('click', function(e) {
    // Вибрация (если поддерживается)
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
    
    // Добавляем табак
    gameState.tobacco += gameState.tobaccoPerTap;
    
    // Анимация логотипа
    const logo = document.getElementById('logoCircle');
    logo.classList.add('pulse');
    setTimeout(() => {
        logo.classList.remove('pulse');
    }, 200);
    
    // Анимация листьев
    const leaves = document.querySelectorAll('.leaf');
    leaves.forEach((leaf, index) => {
        leaf.style.transform = `translateY(-5px) rotate(${index * 15 - 20}deg)`;
        setTimeout(() => {
            leaf.style.transform = '';
        }, 200);
    });
    
    updateUI();
});

// Пассивный доход
setInterval(() => {
    gameState.tobacco += gameState.tobaccoPerSecond;
    updateUI();
}, 1000);

// Сохраняем при закрытии
window.addEventListener('beforeunload', () => {
    saveGame();
});

// Инициализация
loadGame();
updateUI();

// Настройка Telegram темы
tg.onEvent('themeChanged', function() {
    // Можно обновить цвета под тему Telegram
    document.body.style.backgroundColor = tg.themeParams.bg_color || '#0c1f1a';
});

// Показываем, что приложение готово
tg.ready();
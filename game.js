// ============================================
// BALI LOUNGE — ИМПЕРИЯ v4.0
// Три вкладки, бустеры, пассивная прокачка
// ============================================

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// ============================================
// СОСТОЯНИЕ ИГРЫ
// ============================================
let gameState = {
    // Ресурсы
    tobacco: 0,
    
    // ⚡ ЭНЕРГИЯ
    energy: 500,
    maxEnergy: 500,
    energyRegenPerHour: 500, // Восстановление за час
    energyRegenPerSecond: 500 / 3600, // ~0.1389 в секунду
    
    // 📊 СТАТИСТИКА
    totalClicks: 0,
    
    // 👆 ДОХОД
    tobaccoPerTap: 1,
    tobaccoPerSecond: 0,
    
    // 🚀 БУСТЕРЫ
    boosterPrices: {
        energy: 50,      // Восстановить энергию
        tap: 100,        // +1 к тапу навсегда
        energyCap: 200   // +500 к макс энергии
    },
    
    // 📈 ПАССИВНЫЕ УЛУЧШЕНИЯ (покупаются последовательно)
    passiveUpgrades: [
        { level: 1, name: "Уголь \"Таблетка\"", profit: 0.1, price: 10, purchased: false },
        { level: 2, name: "Нарды на коленке", profit: 0.2, price: 25, purchased: false },
        { level: 3, name: "Самогонный аппарат", profit: 0.3, price: 50, purchased: false },
        { level: 4, name: "Первый кальян", profit: 0.5, price: 100, purchased: false },
        { level: 5, name: "Премиум уголь", profit: 0.8, price: 200, purchased: false },
        { level: 6, name: "Помощник", profit: 1.2, price: 350, purchased: false },
        { level: 7, name: "Фруктовая нарезка", profit: 1.8, price: 600, purchased: false },
        { level: 8, name: "Вторая чаша", profit: 2.5, price: 1000, purchased: false },
        { level: 9, name: "Кальянный мастер", profit: 3.5, price: 1500, purchased: false },
        { level: 10, name: "Филиал на Патриках", profit: 5.0, price: 2500, purchased: false },
        { level: 11, name: "VIP-комната", profit: 7.0, price: 4000, purchased: false },
        { level: 12, name: "Импортный табак", profit: 10.0, price: 6000, purchased: false },
        { level: 13, name: "Кальянный сомелье", profit: 15.0, price: 9000, purchased: false },
        { level: 14, name: "Сеть заведений", profit: 22.0, price: 15000, purchased: false },
        { level: 15, name: "Bali Lounge Империя", profit: 35.0, price: 25000, purchased: false }
    ],
    
    // Время последнего обновления
    lastEnergyUpdate: Date.now(),
    lastSaveTime: Date.now()
};

// ============================================
// ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadGame() {
    const saved = localStorage.getItem('bali_lounge_v4');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // Ресурсы
            gameState.tobacco = data.tobacco || 0;
            
            // Энергия
            gameState.energy = data.energy || 500;
            gameState.maxEnergy = data.maxEnergy || 500;
            
            // Статистика
            gameState.totalClicks = data.totalClicks || 0;
            
            // Доход
            gameState.tobaccoPerTap = data.tobaccoPerTap || 1;
            gameState.tobaccoPerSecond = data.tobaccoPerSecond || 0;
            
            // Бустеры (цены могут расти, но пока фиксированные)
            if (data.boosterPrices) {
                gameState.boosterPrices = data.boosterPrices;
            }
            
            // Пассивные улучшения
            if (data.passiveUpgrades) {
                data.passiveUpgrades.forEach((savedUpgrade, index) => {
                    if (gameState.passiveUpgrades[index]) {
                        gameState.passiveUpgrades[index].purchased = savedUpgrade.purchased || false;
                    }
                });
            }
            
            gameState.lastEnergyUpdate = Date.now();
            gameState.lastSaveTime = Date.now();
            
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
    
    // Пересчитываем пассивный доход после загрузки
    recalcPassiveIncome();
}

function saveGame() {
    const saveData = {
        tobacco: gameState.tobacco,
        energy: gameState.energy,
        maxEnergy: gameState.maxEnergy,
        totalClicks: gameState.totalClicks,
        tobaccoPerTap: gameState.tobaccoPerTap,
        tobaccoPerSecond: gameState.tobaccoPerSecond,
        boosterPrices: gameState.boosterPrices,
        passiveUpgrades: gameState.passiveUpgrades.map(u => ({ 
            purchased: u.purchased 
        }))
    };
    localStorage.setItem('bali_lounge_v4', JSON.stringify(saveData));
    gameState.lastSaveTime = Date.now();
}

// ============================================
// ЭНЕРГИЯ (ПОСТЕПЕННОЕ ВОССТАНОВЛЕНИЕ)
// ============================================
function updateEnergy() {
    const now = Date.now();
    const secondsPassed = (now - gameState.lastEnergyUpdate) / 1000;
    
    if (secondsPassed > 0) {
        // Восстанавливаем энергию постепенно (500 в час = ~0.1389 в секунду)
        const energyToAdd = secondsPassed * gameState.energyRegenPerSecond;
        gameState.energy = Math.min(gameState.energy + energyToAdd, gameState.maxEnergy);
        gameState.lastEnergyUpdate = now;
        
        // Обновляем UI
        updateEnergyUI();
    }
}

// ============================================
// ПЕРЕСЧЕТ ПАССИВНОГО ДОХОДА
// ============================================
function recalcPassiveIncome() {
    let total = 0;
    gameState.passiveUpgrades.forEach(upgrade => {
        if (upgrade.purchased) {
            total += upgrade.profit;
        }
    });
    gameState.tobaccoPerSecond = total;
    return total;
}

// ============================================
// ПОЛУЧЕНИЕ ТЕКУЩЕГО УРОВНЯ
// ============================================
function getCurrentLevel() {
    let count = 0;
    gameState.passiveUpgrades.forEach(upgrade => {
        if (upgrade.purchased) count++;
    });
    return count;
}

// ============================================
// ПОЛУЧЕНИЕ СЛЕДУЮЩЕГО УЛУЧШЕНИЯ
// ============================================
function getNextUpgrade() {
    for (let i = 0; i < gameState.passiveUpgrades.length; i++) {
        if (!gameState.passiveUpgrades[i].purchased) {
            return gameState.passiveUpgrades[i];
        }
    }
    return null; // Все куплено
}

// ============================================
// ПОКУПКА СЛЕДУЮЩЕГО ПАССИВНОГО УЛУЧШЕНИЯ
// ============================================
function buyNextPassiveUpgrade() {
    const nextUpgrade = getNextUpgrade();
    
    if (!nextUpgrade) {
        tg.showPopup({
            title: '🏆 Поздравляем!',
            message: 'Вы купили все улучшения! Вы настоящий магнат!',
            buttons: [{type: 'ok'}]
        });
        return false;
    }
    
    if (gameState.tobacco < nextUpgrade.price) {
        tg.HapticFeedback.notificationOccurred('error');
        tg.showPopup({
            title: '❌ Недостаточно табака',
            message: `Нужно ${nextUpgrade.price} 🍃 табака`,
            buttons: [{type: 'ok'}]
        });
        return false;
    }
    
    // Покупаем
    gameState.tobacco -= nextUpgrade.price;
    nextUpgrade.purchased = true;
    
    // Пересчитываем пассивный доход
    const newIncome = recalcPassiveIncome();
    
    // Хаптик
    tg.HapticFeedback.impactOccurred('medium');
    
    // Уведомление
    tg.showPopup({
        title: '✅ Улучшение куплено!',
        message: `${nextUpgrade.name}\n+${nextUpgrade.profit} табака/сек`,
        buttons: [{type: 'ok'}]
    });
    
    // Обновляем UI
    updateUI();
    renderPassiveUpgrades();
    saveGame();
    
    return true;
}

// ============================================
// ПОКУПКА БУСТЕРОВ
// ============================================
function buyBooster(type) {
    if (type === 'energy') {
        const price = gameState.boosterPrices.energy;
        
        if (gameState.tobacco < price) {
            tg.HapticFeedback.notificationOccurred('error');
            return false;
        }
        
        if (gameState.energy >= gameState.maxEnergy) {
            tg.showPopup({
                title: '⚡ Энергия полная',
                message: 'У вас уже полная энергия!',
                buttons: [{type: 'ok'}]
            });
            return false;
        }
        
        gameState.tobacco -= price;
        gameState.energy = gameState.maxEnergy;
        
        tg.HapticFeedback.notificationOccurred('success');
        
        updateUI();
        saveGame();
        
        return true;
    }
    
    else if (type === 'tap') {
        const price = gameState.boosterPrices.tap;
        
        if (gameState.tobacco < price) {
            tg.HapticFeedback.notificationOccurred('error');
            return false;
        }
        
        gameState.tobacco -= price;
        gameState.tobaccoPerTap += 1;
        gameState.boosterPrices.tap = Math.floor(gameState.boosterPrices.tap * 1.5); // Цена растет
        
        tg.HapticFeedback.impactOccurred('heavy');
        
        tg.showPopup({
            title: '👆 Улучшение тапа!',
            message: `Теперь вы получаете +${gameState.tobaccoPerTap} табака за клик`,
            buttons: [{type: 'ok'}]
        });
        
        updateUI();
        saveGame();
        
        return true;
    }
    
    else if (type === 'energyCap') {
        const price = gameState.boosterPrices.energyCap;
        
        if (gameState.tobacco < price) {
            tg.HapticFeedback.notificationOccurred('error');
            return false;
        }
        
        gameState.tobacco -= price;
        gameState.maxEnergy += 500;
        gameState.boosterPrices.energyCap = Math.floor(gameState.boosterPrices.energyCap * 1.6); // Цена растет
        
        tg.HapticFeedback.impactOccurred('heavy');
        
        tg.showPopup({
            title: '🔋 Запас энергии увеличен!',
            message: `Теперь максимум: ${gameState.maxEnergy} ⚡`,
            buttons: [{type: 'ok'}]
        });
        
        updateUI();
        saveGame();
        
        return true;
    }
}

// ============================================
// КЛИК ПО ЛОГОТИПУ
// ============================================
function clickLogo() {
    // Проверяем энергию
    if (gameState.energy < 1) {
        tg.HapticFeedback.notificationOccurred('error');
        return false;
    }
    
    // Тратим энергию
    gameState.energy -= 1;
    
    // Зарабатываем табак
    gameState.tobacco += gameState.tobaccoPerTap;
    
    // Статистика
    gameState.totalClicks++;
    
    // Анимация
    const logo = document.getElementById('clickerLogo');
    logo.style.transform = 'scale(0.95)';
    setTimeout(() => { logo.style.transform = 'scale(1)'; }, 100);
    
    // Хаптик
    tg.HapticFeedback.impactOccurred('light');
    
    // Обновляем UI
    updateUI();
    saveGame();
    
    return true;
}

// ============================================
// ПОЛУЧЕНИЕ РАНГА
// ============================================
function getRank() {
    const level = getCurrentLevel();
    
    if (level < 3) return "Стажёр";
    if (level < 6) return "Мастер забивки";
    if (level < 9) return "Владелец чаши";
    if (level < 12) return "Кальянный барон";
    if (level < 15) return "Владелец сети";
    return "Легенда Bali Lounge";
}

// ============================================
// ОБНОВЛЕНИЕ UI
// ============================================
function updateEnergyUI() {
    const energyDisplay = document.getElementById('energyDisplay');
    const energyFill = document.getElementById('energyFill');
    const energyRegenSpan = document.getElementById('energyRegenPerSecond');
    
    if (energyDisplay) {
        energyDisplay.innerHTML = `${Math.floor(gameState.energy)}/${gameState.maxEnergy}`;
    }
    
    if (energyFill) {
        const percent = (gameState.energy / gameState.maxEnergy) * 100;
        energyFill.style.width = `${percent}%`;
    }
    
    if (energyRegenSpan) {
        const regenPerSecond = (gameState.maxEnergy / 3600).toFixed(2);
        energyRegenSpan.innerHTML = `+${regenPerSecond}`;
    }
    
    // Блокировка кликера
    const logo = document.getElementById('clickerLogo');
    if (logo) {
        if (gameState.energy < 1) {
            logo.classList.add('disabled');
        } else {
            logo.classList.remove('disabled');
        }
    }
}

function updateBoostersUI() {
    // Обновляем цены бустеров
    const energyPriceEl = document.getElementById('boosterEnergyPrice');
    const tapPriceEl = document.getElementById('boosterTapPrice');
    const energyCapPriceEl = document.getElementById('boosterEnergyCapPrice');
    
    if (energyPriceEl) energyPriceEl.innerHTML = gameState.boosterPrices.energy;
    if (tapPriceEl) tapPriceEl.innerHTML = gameState.boosterPrices.tap;
    if (energyCapPriceEl) energyCapPriceEl.innerHTML = gameState.boosterPrices.energyCap;
    
    // Проверяем возможность покупки
    const energyBtn = document.getElementById('boosterEnergyBtn');
    const tapBtn = document.getElementById('boosterTapBtn');
    const energyCapBtn = document.getElementById('boosterEnergyCapBtn');
    
    if (energyBtn) {
        energyBtn.disabled = gameState.tobacco < gameState.boosterPrices.energy || gameState.energy >= gameState.maxEnergy;
    }
    
    if (tapBtn) {
        tapBtn.disabled = gameState.tobacco < gameState.boosterPrices.tap;
    }
    
    if (energyCapBtn) {
        energyCapBtn.disabled = gameState.tobacco < gameState.boosterPrices.energyCap;
    }
}

function renderPassiveUpgrades() {
    const container = document.getElementById('upgradesTimeline');
    if (!container) return;
    
    container.innerHTML = '';
    
    const currentLevel = getCurrentLevel();
    const nextUpgrade = getNextUpgrade();
    
    gameState.passiveUpgrades.forEach((upgrade, index) => {
        const isPurchased = upgrade.purchased;
        const isNext = nextUpgrade && upgrade.level === nextUpgrade.level;
        
        const card = document.createElement('div');
        card.className = `passive-upgrade-card ${isPurchased ? 'completed' : ''} ${isNext ? 'next' : ''}`;
        
        card.innerHTML = `
            <div class="upgrade-level-icon">${upgrade.level}</div>
            <div class="upgrade-level-info">
                <div class="upgrade-level-name">${upgrade.name}</div>
                <div class="upgrade-level-profit">+${upgrade.profit.toFixed(1)} табака/сек</div>
            </div>
            <div class="upgrade-level-price">
                ${isPurchased ? 
                    '<span class="checkmark">✓</span>' : 
                    `<span class="upgrade-level-amount">${upgrade.price}</span>
                     <span class="price-label">🍃</span>`
                }
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Обновляем информацию о следующем улучшении
    const nextUpgradeInfo = document.getElementById('nextUpgradeInfo');
    const nextBtn = document.getElementById('nextUpgradeBtn');
    
    if (nextUpgrade) {
        nextUpgradeInfo.innerHTML = `Следующее: ${nextUpgrade.name} · +${nextUpgrade.profit.toFixed(1)}/сек · Цена: ${nextUpgrade.price} 🍃`;
        nextBtn.disabled = gameState.tobacco < nextUpgrade.price;
    } else {
        nextUpgradeInfo.innerHTML = '🎉 Все улучшения куплены! Вы великий магнат!';
        nextBtn.disabled = true;
    }
    
    // Обновляем текущий уровень
    const levelEl = document.getElementById('passiveLevel');
    if (levelEl) levelEl.innerHTML = currentLevel;
    
    // Обновляем текущий пассивный доход
    const incomeEl = document.getElementById('currentPassiveIncome');
    if (incomeEl) incomeEl.innerHTML = `${gameState.tobaccoPerSecond.toFixed(1)}/сек`;
}

function updateUI() {
    // Обновляем табак
    const tobaccoCount = document.getElementById('tobaccoCount');
    if (tobaccoCount) {
        tobaccoCount.innerHTML = Math.floor(gameState.tobacco);
    }
    
    // Обновляем доход
    const perTap = document.getElementById('perTap');
    const perSecond = document.getElementById('perSecond');
    const totalClicks = document.getElementById('totalClicks');
    
    if (perTap) perTap.innerHTML = `+${gameState.tobaccoPerTap}`;
    if (perSecond) perSecond.innerHTML = `+${gameState.tobaccoPerSecond.toFixed(1)}/сек`;
    
    // Обновляем ранг
    const rankDisplay = document.getElementById('rankDisplay');
    if (rankDisplay) rankDisplay.innerHTML = getRank();
    
    // Обновляем энергию
    updateEnergyUI();
    
    // Обновляем бустеры
    updateBoostersUI();
    
    // Обновляем пассивные улучшения
    renderPassiveUpgrades();
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================
window.switchTab = function(tab) {
    const tabMain = document.getElementById('tabMain');
    const tabBoosters = document.getElementById('tabBoosters');
    const tabUpgrades = document.getElementById('tabUpgrades');
    const btnMain = document.getElementById('tabMainBtn');
    const btnBoosters = document.getElementById('tabBoostersBtn');
    const btnUpgrades = document.getElementById('tabUpgradesBtn');
    
    // Скрываем все
    tabMain.classList.remove('active');
    tabBoosters.classList.remove('active');
    tabUpgrades.classList.remove('active');
    btnMain.classList.remove('active');
    btnBoosters.classList.remove('active');
    btnUpgrades.classList.remove('active');
    
    // Показываем выбранное
    if (tab === 'main') {
        tabMain.classList.add('active');
        btnMain.classList.add('active');
    } else if (tab === 'boosters') {
        tabBoosters.classList.add('active');
        btnBoosters.classList.add('active');
        updateBoostersUI();
    } else if (tab === 'upgrades') {
        tabUpgrades.classList.add('active');
        btnUpgrades.classList.add('active');
        renderPassiveUpgrades();
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем игру
    loadGame();
    
    // Назначаем обработчик клика
    const logo = document.getElementById('clickerLogo');
    if (logo) {
        logo.addEventListener('click', clickLogo);
    }
    
    // Обновление энергии каждую секунду
    setInterval(updateEnergy, 1000);
    
    // Пассивный доход каждую секунду
    setInterval(() => {
        gameState.tobacco += gameState.tobaccoPerSecond;
        updateUI();
        saveGame();
    }, 1000);
    
    // Автосохранение каждые 30 секунд
    setInterval(saveGame, 30000);
    
    // Обновляем UI
    updateUI();
    renderPassiveUpgrades();
});

// Глобальные функции для onclick
window.buyBooster = buyBooster;
window.buyNextPassiveUpgrade = buyNextPassiveUpgrade;
window.switchTab = switchTab;
window.clickLogo = clickLogo;

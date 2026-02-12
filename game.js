// ============================================
// BALI LOUNGE — ЭНЕРГИЯ И БУСТЕРЫ v3.1
// ПОЛНОЕ ВОССТАНОВЛЕНИЕ 500 ЗА ЧАС
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
    crystals: 0,
    
    // ⚡ ЭНЕРГИЯ - ПОЛНОЕ ВОССТАНОВЛЕНИЕ 500/ЧАС
    energy: 500,
    maxEnergy: 500,
    energyPerHour: 500, // +500 в час (ПОЛНАЯ ЗАРЯДКА)
    
    // 🚀 БУСТЕРЫ
    boostersUsed: 0,
    maxBoostersPerDay: 3,
    lastBoosterReset: Date.now(),
    
    // Доход
    tobaccoPerTap: 1,
    tobaccoPerSecond: 0,
    
    // Статистика
    totalClicks: 0,
    
    // Улучшения
    upgrades: [
        { id: 1, name: "Уголь 'Таблетка'", desc: "Начинающий уровень", price: 10, profit: 0.1, type: "passive", icon: "🔥", emoji: "🔥", purchased: false },
        { id: 2, name: "Нарды на коленке", desc: "Клиенты любят подождать", price: 50, profit: 0.5, type: "passive", icon: "🎲", emoji: "🎲", purchased: false },
        { id: 3, name: "Первый кальян", desc: "Khalil Mamoon", price: 200, profit: 2, type: "passive", icon: "💨", emoji: "💨", purchased: false },
        { id: 4, name: "Помощник", desc: "+1 табак за тап", price: 500, profit: 1, type: "tap", icon: "👨‍🍳", emoji: "👨‍🍳", purchased: false },
        { id: 5, name: "Свой фрукт", desc: "+5 табака за тап", price: 1500, profit: 5, type: "tap", icon: "🍋", emoji: "🍋", purchased: false },
        { id: 6, name: "Вторая точка", desc: "Открываем филиал", price: 5000, profit: 15, type: "passive", icon: "🏢", emoji: "🏢", purchased: false },
        { id: 7, name: "Сеть кальянных", desc: "Империя Bali Lounge", price: 20000, profit: 50, type: "passive", icon: "🌍", emoji: "🌍", purchased: false }
    ],
    
    // Время последнего обновления энергии
    lastEnergyUpdate: Date.now()
};

// ============================================
// ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadGame() {
    const saved = localStorage.getItem('bali_lounge_v3');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // Основные ресурсы
            gameState.tobacco = data.tobacco || 0;
            gameState.crystals = data.crystals || 0;
            
            // ⚡ Энергия
            gameState.energy = data.energy || 500;
            gameState.maxEnergy = data.maxEnergy || 500;
            
            // 🚀 Бустеры
            gameState.boostersUsed = data.boostersUsed || 0;
            gameState.lastBoosterReset = data.lastBoosterReset || Date.now();
            
            // Доход
            gameState.tobaccoPerTap = data.tobaccoPerTap || 1;
            gameState.tobaccoPerSecond = data.tobaccoPerSecond || 0;
            
            // Статистика
            gameState.totalClicks = data.totalClicks || 0;
            
            // Улучшения (цены)
            if (data.upgrades) {
                data.upgrades.forEach((savedUpgrade, index) => {
                    if (gameState.upgrades[index]) {
                        gameState.upgrades[index].price = savedUpgrade.price || gameState.upgrades[index].price;
                        gameState.upgrades[index].purchased = savedUpgrade.purchased || false;
                    }
                });
            }
            
            gameState.lastEnergyUpdate = Date.now();
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
    
    // Сброс бустеров в новый день
    resetBoostersIfNeeded();
}

function saveGame() {
    const saveData = {
        tobacco: gameState.tobacco,
        crystals: gameState.crystals,
        energy: gameState.energy,
        maxEnergy: gameState.maxEnergy,
        boostersUsed: gameState.boostersUsed,
        lastBoosterReset: gameState.lastBoosterReset,
        tobaccoPerTap: gameState.tobaccoPerTap,
        tobaccoPerSecond: gameState.tobaccoPerSecond,
        totalClicks: gameState.totalClicks,
        upgrades: gameState.upgrades.map(u => ({ 
            price: u.price, 
            purchased: u.purchased 
        }))
    };
    localStorage.setItem('bali_lounge_v3', JSON.stringify(saveData));
}

// ============================================
// ЭНЕРГИЯ (ПОПОЛНЕНИЕ 500 В ЧАС - ПОЛНАЯ ЗАРЯДКА)
// ============================================
function updateEnergy() {
    const now = Date.now();
    const hoursPassed = (now - gameState.lastEnergyUpdate) / (1000 * 60 * 60); // часы
    
    if (hoursPassed >= 1) {
        // ПОЛНОЕ восстановление до максимума (500)
        const oldEnergy = gameState.energy;
        gameState.energy = gameState.maxEnergy;
        gameState.lastEnergyUpdate = now;
        
        // Уведомление если энергия была не полная
        if (oldEnergy < gameState.maxEnergy) {
            tg.HapticFeedback.notificationOccurred('success');
            
            // Показываем уведомление только если игра открыта
            if (document.visibilityState === 'visible') {
                tg.showPopup({
                    title: '⚡ Энергия восстановлена!',
                    message: 'Ваша энергия полностью восстановлена. Можно снова кликать!',
                    buttons: [{type: 'ok'}]
                });
            }
        }
        
        // Обновляем UI
        updateEnergyUI();
        saveGame();
    }
}

// ============================================
// БУСТЕРЫ (3 РАЗА В ДЕНЬ)
// ============================================
function resetBoostersIfNeeded() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - gameState.lastBoosterReset > oneDay) {
        gameState.boostersUsed = 0;
        gameState.lastBoosterReset = now;
        saveGame();
    }
}

function useBooster(type) {
    // Проверяем, не пора ли сбросить бустеры
    resetBoostersIfNeeded();
    
    // Проверяем, остались ли бустеры
    if (gameState.boostersUsed >= gameState.maxBoostersPerDay) {
        tg.showPopup({
            title: '❌ Лимит бустеров',
            message: 'Вы использовали все бустеры на сегодня. Завтра будет новый лимит!',
            buttons: [{type: 'ok'}]
        });
        return false;
    }
    
    if (type === 'full') {
        // Полное восстановление энергии
        if (gameState.energy === gameState.maxEnergy) {
            tg.showPopup({
                title: '⚡ Энергия полная',
                message: 'У вас уже полная энергия. Используйте бустер, когда энергия потратится!',
                buttons: [{type: 'ok'}]
            });
            return false;
        }
        
        gameState.energy = gameState.maxEnergy;
        gameState.boostersUsed++;
        
        // Хаптик
        tg.HapticFeedback.notificationOccurred('success');
        
        // Уведомление
        tg.showPopup({
            title: '🚀 Бустер активирован!',
            message: `Энергия полностью восстановлена!\nОсталось бустеров: ${gameState.maxBoostersPerDay - gameState.boostersUsed}`,
            buttons: [{type: 'ok'}]
        });
        
        updateEnergyUI();
        updateBoostersUI();
        saveGame();
        return true;
    }
}

// ============================================
// КЛИК (ТРАТИТ ЭНЕРГИЮ)
// ============================================
function clickLogo() {
    // Проверяем энергию
    if (gameState.energy < 1) {
        tg.HapticFeedback.notificationOccurred('error');
        tg.showPopup({
            title: '⚡ Нет энергии',
            message: 'Энергия полностью восстановится через час.\nИспользуйте бустер для мгновенной зарядки!',
            buttons: [{type: 'ok'}]
        });
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
// ПОКУПКА УЛУЧШЕНИЙ
// ============================================
function buyUpgrade(id) {
    const upgrade = gameState.upgrades.find(u => u.id === id);
    if (!upgrade) return false;
    
    if (gameState.tobacco < upgrade.price) {
        tg.HapticFeedback.notificationOccurred('error');
        return false;
    }
    
    // Списываем табак
    gameState.tobacco -= upgrade.price;
    
    // Применяем эффект
    if (upgrade.type === 'tap') {
        gameState.tobaccoPerTap += upgrade.profit;
    } else {
        gameState.tobaccoPerSecond += upgrade.profit;
    }
    
    // Отмечаем как купленное и увеличиваем цену
    upgrade.purchased = true;
    upgrade.price = Math.floor(upgrade.price * 1.7);
    
    // Хаптик
    tg.HapticFeedback.impactOccurred('medium');
    
    // Обновляем UI
    updateUI();
    renderUpgrades();
    saveGame();
    
    return true;
}

// ============================================
// РЕНДЕР УЛУЧШЕНИЙ
// ============================================
function renderUpgrades() {
    const container = document.getElementById('upgradesContainer');
    if (!container) return;
    
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
                <span class="upgrade-profit">+${upgrade.profit} ${profitText}</span>
            </div>
            <div class="upgrade-price">
                <span class="price-amount">${upgrade.price}</span>
                <span class="price-label">🍃</span>
                <button class="buy-btn" 
                    onclick="buyUpgrade(${upgrade.id})"
                    ${!canBuy ? 'disabled' : ''}>
                    Купить
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ============================================
// ПОЛУЧЕНИЕ РАНГА
// ============================================
function getRank(tobacco) {
    if (tobacco < 100) return "Стажёр";
    if (tobacco < 1000) return "Мастер забивки";
    if (tobacco < 5000) return "Владелец чаши";
    if (tobacco < 20000) return "Кальянный барон";
    return "Владелец Bali Lounge";
}

// ============================================
// ОБНОВЛЕНИЕ UI
// ============================================
function updateEnergyUI() {
    const energyDisplay = document.getElementById('energyDisplay');
    const energyFill = document.getElementById('energyFill');
    
    if (energyDisplay) {
        energyDisplay.innerHTML = `${Math.floor(gameState.energy)}/${gameState.maxEnergy}`;
    }
    
    if (energyFill) {
        const percent = (gameState.energy / gameState.maxEnergy) * 100;
        energyFill.style.width = `${percent}%`;
    }
    
    // Блокировка кликера если нет энергии
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
    const boostersLeft = document.getElementById('boostersLeft');
    const boosterBtn = document.getElementById('boosterFullBtn');
    
    if (boostersLeft) {
        const left = gameState.maxBoostersPerDay - gameState.boostersUsed;
        boostersLeft.innerHTML = `${left}/${gameState.maxBoostersPerDay} в день`;
    }
    
    if (boosterBtn) {
        if (gameState.boostersUsed >= gameState.maxBoostersPerDay) {
            boosterBtn.disabled = true;
            boosterBtn.innerHTML = '❌ Лимит на сегодня';
        } else {
            boosterBtn.disabled = false;
            boosterBtn.innerHTML = '🔋 Активировать';
        }
    }
}

function updateUI() {
    // Обновляем энергию
    updateEnergyUI();
    
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
    if (totalClicks) totalClicks.innerHTML = gameState.totalClicks;
    
    // Обновляем ранг и прогресс
    const rank = getRank(gameState.tobacco);
    const rankDisplay = document.getElementById('rankDisplay');
    if (rankDisplay) rankDisplay.innerHTML = rank;
    
    const progressPercent = Math.min((gameState.tobacco / 20000) * 100, 100);
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    
    // Обновляем бустеры
    updateBoostersUI();
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================
window.switchTab = function(tab) {
    const tabMain = document.getElementById('tabMain');
    const tabShop = document.getElementById('tabShop');
    const btnMain = document.getElementById('tabMainBtn');
    const btnShop = document.getElementById('tabShopBtn');
    
    if (tab === 'main') {
        tabMain.classList.add('active');
        tabShop.classList.remove('active');
        btnMain.classList.add('active');
        btnShop.classList.remove('active');
    } else {
        tabShop.classList.add('active');
        tabMain.classList.remove('active');
        btnShop.classList.add('active');
        btnMain.classList.remove('active');
        // Рендерим улучшения при открытии вкладки
        renderUpgrades();
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
    
    // Запускаем обновление энергии КАЖДУЮ МИНУТУ
    // Проверяем, не прошел ли час
    setInterval(updateEnergy, 60000);
    
    // Пассивный доход каждую секунду
    setInterval(() => {
        gameState.tobacco += gameState.tobaccoPerSecond;
        updateUI();
        saveGame();
    }, 1000);
    
    // Обновляем UI
    updateUI();
    updateBoostersUI();
    
    // Рендерим улучшения (для вкладки магазина)
    renderUpgrades();
});

// Глобальные функции для onclick
window.useBooster = useBooster;
window.buyUpgrade = buyUpgrade;

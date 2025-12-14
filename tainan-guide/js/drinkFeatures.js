/**
 * 飲品甜點進階功能頁面控制器
 * 載入並渲染各種進階功能的資料
 */

const DrinkFeatures = {
    // 資料存儲
    data: {
        seasonal: null,
        pairings: null,
        timing: null,
        exclusive: null,
        experience: null,
        reservation: null,
        carry: null,
        limited: null,
        pet: null,
        latenight: null,
        cp: null,
        dietary: null
    },

    // 初始化
    init: async function() {
        await this.loadAllData();
        this.renderAll();
        this.setupEventListeners();
    },

    // 載入所有資料
    loadAllData: async function() {
        const dataFiles = [
            { key: 'seasonal', file: 'seasonalDrinks.json' },
            { key: 'pairings', file: 'drinkPairings.json' },
            { key: 'timing', file: 'iceTiming.json' },
            { key: 'exclusive', file: 'tainanExclusiveDrinks.json' },
            { key: 'experience', file: 'specialExperience.json' },
            { key: 'reservation', file: 'dessertReservation.json' },
            { key: 'carry', file: 'dessertCarryGuide.json' },
            { key: 'limited', file: 'limitedDesserts.json' },
            { key: 'pet', file: 'petFriendlyDesserts.json' },
            { key: 'latenight', file: 'lateNightDesserts.json' },
            { key: 'cp', file: 'cpRanking.json' },
            { key: 'dietary', file: 'dietaryFilters.json' }
        ];

        const promises = dataFiles.map(async ({ key, file }) => {
            try {
                const response = await fetch(`data/${file}`);
                this.data[key] = await response.json();
            } catch (error) {
                console.error(`Error loading ${file}:`, error);
            }
        });

        await Promise.all(promises);
    },

    // 渲染所有區塊
    renderAll: function() {
        this.renderSeasonal();
        this.renderPairings();
        this.renderTiming();
        this.renderExclusive();
        this.renderExperience();
        this.renderReservation();
        this.renderCarry();
        this.renderLimited();
        this.renderPet();
        this.renderLatenight();
        this.renderCP();
        this.renderDietary();
    },

    // 渲染季節限定
    renderSeasonal: function() {
        const container = document.getElementById('season-grid');
        if (!container || !this.data.seasonal) return;

        const currentMonth = new Date().getMonth() + 1;

        container.innerHTML = this.data.seasonal.seasons.map(season => {
            const isCurrentSeason = season.months.includes(currentMonth);
            return `
                <div class="season-card" style="${isCurrentSeason ? 'border: 2px solid #FF6B6B' : ''}">
                    <div class="season-icon">${season.icon}</div>
                    <div class="season-name">${season.name}</div>
                    <div class="season-months">${season.months.map(m => m + '月').join('、')}</div>
                    ${isCurrentSeason ? '<span class="tag highlight" style="margin-top: 10px">現正當季！</span>' : ''}
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        ${season.drinks.slice(0, 2).map(d => d.name).join('、')}...
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染配餐推薦
    renderPairings: function() {
        const container = document.getElementById('pairing-list');
        if (!container || !this.data.pairings) return;

        container.innerHTML = this.data.pairings.pairings.map(pairing => `
            <div class="pairing-item">
                <div class="pairing-food">${pairing.icon}</div>
                <div class="pairing-info">
                    <div class="pairing-food-name">${pairing.foodTypeName}</div>
                    <div style="font-size: 12px; color: #666;">
                        ${pairing.examples.slice(0, 3).join('、')}...
                    </div>
                    <div class="pairing-drinks">
                        推薦：${pairing.recommendedDrinks.slice(0, 3).map(d => d.name).join('、')}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // 渲染排隊時機
    renderTiming: function() {
        const container = document.getElementById('timing-list');
        if (!container || !this.data.timing) return;

        const isWeekend = [0, 6].includes(new Date().getDay());
        const dayType = isWeekend ? 'weekend' : 'weekday';

        container.innerHTML = this.data.timing.iceShops.map(shop => {
            const status = shop.queueStatus[dayType];
            const levelInfo = this.data.timing.queueLevelDefinition[status.level];
            return `
                <div class="timing-card">
                    <div class="timing-header">
                        <span class="timing-shop">${shop.name}</span>
                        <span class="timing-level ${status.level}">${levelInfo.icon} ${levelInfo.name}</span>
                    </div>
                    <p style="font-size: 14px; margin-bottom: 10px;">
                        <strong>${isWeekend ? '假日' : '平日'}等待時間：</strong>${status.waitTime}
                    </p>
                    <div class="timing-tips">
                        <strong>💡 最佳時機：</strong>${shop.bestTime.recommended.join('、')}<br>
                        <span style="color: #FF6B6B;">⚠️ 避開：${shop.bestTime.avoid.join('、')}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染台南限定
    renderExclusive: function() {
        const container = document.getElementById('exclusive-list');
        if (!container || !this.data.exclusive) return;

        container.innerHTML = this.data.exclusive.exclusives.map(item => `
            <div class="exclusive-card">
                <div class="exclusive-header">
                    <span class="exclusive-icon">${item.icon}</span>
                    <div>
                        <div style="font-weight: bold; font-size: 16px;">${item.shopName}</div>
                        <div style="font-size: 13px; opacity: 0.9;">${item.drinkName}</div>
                    </div>
                </div>
                <div class="exclusive-body">
                    <div class="exclusive-reason">${item.exclusiveReason}</div>
                    <div style="margin-bottom: 10px;">
                        <strong>必點：</strong>${item.mustTry.join('、')}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666;">
                        <span>💰 ${item.priceRange}</span>
                        <span>📍 ${item.district}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // 渲染特色體驗
    renderExperience: function() {
        const container = document.getElementById('experience-list');
        if (!container || !this.data.experience) return;

        container.innerHTML = this.data.experience.experiences.map(exp => {
            const types = exp.experienceType.map(t => this.data.experience.experienceTypes[t]);
            return `
                <div class="feature-card">
                    <div class="feature-card-header">
                        <div class="feature-card-icon">${types[0]?.icon || '✨'}</div>
                        <div>
                            <div class="feature-card-title">${exp.name}</div>
                            <div class="feature-card-subtitle">${exp.category} · ${exp.district}</div>
                        </div>
                    </div>
                    <div class="feature-card-content">
                        <p>${exp.description}</p>
                        <div class="experience-tags">
                            ${types.map(t => `<span class="experience-tag">${t.icon} ${t.name}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染預約指南
    renderReservation: function() {
        const container = document.getElementById('reservation-list');
        if (!container || !this.data.reservation) return;

        const typeInfo = this.data.reservation.reservationTypes;

        container.innerHTML = this.data.reservation.shops.map(shop => {
            const type = typeInfo[shop.reservationType];
            return `
                <div class="feature-card">
                    <div class="feature-card-header">
                        <div class="feature-card-icon">${type.icon}</div>
                        <div>
                            <div class="feature-card-title">${shop.name}</div>
                            <div class="feature-card-subtitle">${shop.category} · ${shop.district}</div>
                        </div>
                        <span class="reservation-type ${shop.reservationType}">${type.name}</span>
                    </div>
                    <div class="feature-card-content">
                        <p><strong>預約方式：</strong>${shop.reservationInfo.method}</p>
                        ${shop.reservationInfo.waitTime ? `<p><strong>等待時間：</strong>${shop.reservationInfo.waitTime}</p>` : ''}
                        ${shop.reservationInfo.lineId ? `<p><strong>LINE ID：</strong>${shop.reservationInfo.lineId}</p>` : ''}
                        <p style="color: #FF6B6B;">💡 ${shop.reservationInfo.tips}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染外帶指南
    renderCarry: function() {
        const container = document.getElementById('carry-list');
        if (!container || !this.data.carry) return;

        const typeInfo = this.data.carry.carryTypes;

        container.innerHTML = this.data.carry.desserts.map(item => {
            const type = typeInfo[item.carryRating];
            return `
                <div class="feature-card">
                    <div class="feature-card-header">
                        <div style="flex: 1;">
                            <div class="feature-card-title">${item.name}</div>
                            <div class="feature-card-subtitle">${item.shopName}</div>
                        </div>
                        <span class="carry-rating ${item.carryRating}">${type.icon} ${type.name}</span>
                    </div>
                    <div class="feature-card-content">
                        <p><strong>保存時間：</strong>${item.carryInfo.maxDuration}</p>
                        <p><strong>保存條件：</strong>${item.carryInfo.temperature}</p>
                        ${item.hsrTips ? `
                            <p style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 8px;">
                                🚄 <strong>高鐵攜帶：</strong>${item.hsrTips.suitable ? '適合' : '不建議'}<br>
                                ${item.hsrTips.tips}
                            </p>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染限量追蹤
    renderLimited: function() {
        const container = document.getElementById('limited-list');
        if (!container || !this.data.limited) return;

        const typeInfo = this.data.limited.limitTypes;

        container.innerHTML = this.data.limited.limitedItems.map(item => {
            const type = typeInfo[item.limitType];
            return `
                <div class="feature-card">
                    <div class="feature-card-header">
                        <div style="flex: 1;">
                            <div class="feature-card-title">
                                ${item.itemName}
                                <span class="limited-urgency ${type.urgency}">${type.icon} ${type.name}</span>
                            </div>
                            <div class="feature-card-subtitle">${item.shopName}</div>
                        </div>
                    </div>
                    <div class="feature-card-content">
                        ${item.limitInfo.dailyQuantity ? `<p><strong>每日數量：</strong>${item.limitInfo.dailyQuantity}</p>` : ''}
                        ${item.limitInfo.soldOutTime ? `<p style="color: #f44336;"><strong>預估售完：</strong>${item.limitInfo.soldOutTime}</p>` : ''}
                        <div style="margin-top: 10px; padding: 10px; background: #fff5f0; border-radius: 8px;">
                            <strong>🎯 攻略：</strong><br>
                            建議到達時間：${item.bestStrategy.arrivalTime}<br>
                            ${item.bestStrategy.tips}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染店貓地圖
    renderPet: function() {
        const container = document.getElementById('pet-list');
        if (!container || !this.data.pet) return;

        container.innerHTML = this.data.pet.shops.filter(shop => shop.petType.includes('cat')).map(shop => `
            <div class="pet-card">
                <div class="pet-header">
                    <span class="pet-icon">🐱</span>
                    <div>
                        <div class="pet-shop-name">${shop.name}</div>
                        <div class="pet-names">
                            ${shop.catInfo ? `店貓：${shop.catInfo.names.join('、')}` : ''}
                        </div>
                    </div>
                </div>
                ${shop.catInfo ? `
                    <p style="font-size: 14px; margin-bottom: 10px;">
                        <strong>互動程度：</strong>
                        ${this.data.pet.interactionLevels[shop.catInfo.interactionLevel].icon}
                        ${this.data.pet.interactionLevels[shop.catInfo.interactionLevel].name}
                    </p>
                    <div class="pet-tips">
                        ${shop.catInfo.catFriendlyTips || shop.catInfo.personality}
                    </div>
                ` : ''}
                <p style="font-size: 13px; color: #666; margin-top: 10px;">
                    📍 ${shop.address}
                </p>
            </div>
        `).join('');
    },

    // 渲染深夜甜點
    renderLatenight: function(filter = 'all') {
        const container = document.getElementById('latenight-list');
        if (!container || !this.data.latenight) return;

        let shops = this.data.latenight.shops;
        if (filter !== 'all') {
            shops = shops.filter(s => s.timeCategory === filter);
        }

        container.innerHTML = shops.map(shop => {
            const category = this.data.latenight.timeCategories[shop.timeCategory];
            return `
                <div class="feature-card">
                    <div class="feature-card-header">
                        <span style="font-size: 32px;">${category.icon}</span>
                        <div style="flex: 1;">
                            <div class="feature-card-title">${shop.name}</div>
                            <div class="feature-card-subtitle">${shop.category} · 營業到 ${shop.closingTime}</div>
                        </div>
                    </div>
                    <div class="feature-card-content">
                        <p><strong>招牌：</strong>${shop.signature.join('、')}</p>
                        <p><strong>最後點餐：</strong>${shop.lateNightInfo.lastOrder}</p>
                        <p style="color: #666;">${shop.tips}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染CP排行
    renderCP: function() {
        const container = document.getElementById('cp-list');
        if (!container || !this.data.cp) return;

        const positionClass = ['gold', 'silver', 'bronze'];

        // 飲品排行
        let html = '<h3 style="margin: 20px 0 10px;">🥤 飲品CP排行</h3>';
        html += this.data.cp.rankings.drinks.slice(0, 5).map((item, index) => `
            <div class="ranking-item">
                <div class="ranking-position ${positionClass[index] || ''}">${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${item.name}</div>
                    <div class="ranking-highlight">${item.highlight}</div>
                </div>
                <div class="ranking-score">${item.cpScore}</div>
            </div>
        `).join('');

        // 甜點排行
        html += '<h3 style="margin: 20px 0 10px;">🍰 甜點CP排行</h3>';
        html += this.data.cp.rankings.desserts.slice(0, 5).map((item, index) => `
            <div class="ranking-item">
                <div class="ranking-position ${positionClass[index] || ''}">${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${item.name}</div>
                    <div class="ranking-highlight">${item.highlight}</div>
                </div>
                <div class="ranking-score">${item.cpScore}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    // 渲染飲食需求篩選
    renderDietary: function() {
        const filterContainer = document.getElementById('dietary-filters');
        const resultsContainer = document.getElementById('dietary-results');
        if (!filterContainer || !this.data.dietary) return;

        const types = this.data.dietary.dietaryTypes;

        filterContainer.innerHTML = Object.entries(types).map(([key, type]) => `
            <button class="dietary-btn" data-filter="${key}">
                <span class="dietary-icon">${type.icon}</span>
                <span class="dietary-label">${type.name}</span>
            </button>
        `).join('');

        // 顯示所有友善店家
        this.filterDietary('vegetarian');
    },

    // 篩選飲食需求
    filterDietary: function(filterType) {
        const resultsContainer = document.getElementById('dietary-results');
        if (!resultsContainer || !this.data.dietary) return;

        const friendlyShops = this.data.dietary.quickFilters[filterType + 'Friendly'] || [];

        resultsContainer.innerHTML = `
            <h4 style="margin: 20px 0 10px;">${this.data.dietary.dietaryTypes[filterType].icon} ${this.data.dietary.dietaryTypes[filterType].name}友善店家</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${friendlyShops.map(shop => `<span class="tag">${shop}</span>`).join('')}
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                ⚠️ 資訊僅供參考，實際成分請以店家說明為準
            </p>
        `;
    },

    // 設定事件監聽
    setupEventListeners: function() {
        // 深夜時間篩選
        document.querySelectorAll('#time-filter .time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#time-filter .time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderLatenight(e.target.dataset.time);
            });
        });

        // 飲食需求篩選
        document.querySelectorAll('.dietary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                document.querySelectorAll('.dietary-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                this.filterDietary(target.dataset.filter);
            });
        });
    }
};

// 切換區塊顯示
function showSection(sectionId) {
    // 隱藏所有區塊
    document.querySelectorAll('.feature-section').forEach(section => {
        section.classList.remove('active');
    });

    // 顯示指定區塊
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.add('active');
    }

    // 更新導航狀態
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    DrinkFeatures.init();
});

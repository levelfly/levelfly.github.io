/**
 * 台南甜點探險集章系統
 * 紀錄使用者的甜點探險足跡，收集徽章獎勵
 */

const DessertStamps = {
    // 集章店家列表
    shops: [
        {
            id: 'stamp001',
            name: '裕成水果店',
            category: '水果冰',
            district: '中西區',
            icon: '🥭',
            challenge: '品嚐芒果冰'
        },
        {
            id: 'stamp002',
            name: '泰成水果店',
            category: '水果冰',
            district: '中西區',
            icon: '🍈',
            challenge: '打卡哈密瓜冰'
        },
        {
            id: 'stamp003',
            name: '蜷尾家',
            category: '霜淇淋',
            district: '中西區',
            icon: '🍦',
            challenge: '品嚐每日限定口味'
        },
        {
            id: 'stamp004',
            name: '克林姆之屋',
            category: '泡芙',
            district: '中西區',
            icon: '🥧',
            challenge: '品嚐現做泡芙'
        },
        {
            id: 'stamp005',
            name: '依蕾特布丁',
            category: '布丁',
            district: '安平區',
            icon: '🍮',
            challenge: '品嚐焦糖布丁'
        },
        {
            id: 'stamp006',
            name: 'CHUN純薏仁',
            category: '甜品',
            district: '中西區',
            icon: '🥣',
            challenge: '品嚐米其林推薦薏仁'
        },
        {
            id: 'stamp007',
            name: '太陽牌冰品',
            category: '傳統冰品',
            district: '中西區',
            icon: '🍧',
            challenge: '品嚐80年老店冰品'
        },
        {
            id: 'stamp008',
            name: '島旬',
            category: '甜點',
            district: '中西區',
            icon: '🍰',
            challenge: '品嚐季節水果塔'
        },
        {
            id: 'stamp009',
            name: '窄門咖啡',
            category: '咖啡廳',
            district: '中西區',
            icon: '☕',
            challenge: '穿過38公分窄門'
        },
        {
            id: 'stamp010',
            name: '餐桌上的鹿早',
            category: '甜點咖啡',
            district: '中西區',
            icon: '🦌',
            challenge: '和店貓合照'
        },
        {
            id: 'stamp011',
            name: '雙全紅茶',
            category: '傳統飲品',
            district: '中西區',
            icon: '🧋',
            challenge: '品嚐50年紅茶牛奶'
        },
        {
            id: 'stamp012',
            name: '義豐冬瓜茶',
            category: '傳統飲品',
            district: '安平區',
            icon: '🧊',
            challenge: '品嚐安平冬瓜茶'
        }
    ],

    // 成就徽章
    badges: [
        {
            id: 'badge001',
            name: '甜點新手',
            icon: '🌱',
            description: '收集第1個章',
            requirement: { type: 'count', value: 1 },
            color: '#8BC34A'
        },
        {
            id: 'badge002',
            name: '甜點愛好者',
            icon: '🍬',
            description: '收集5個章',
            requirement: { type: 'count', value: 5 },
            color: '#FF9800'
        },
        {
            id: 'badge003',
            name: '甜點達人',
            icon: '🏆',
            description: '收集10個章',
            requirement: { type: 'count', value: 10 },
            color: '#FFD700'
        },
        {
            id: 'badge004',
            name: '甜點大師',
            icon: '👑',
            description: '收集全部12個章',
            requirement: { type: 'count', value: 12 },
            color: '#9C27B0'
        },
        {
            id: 'badge005',
            name: '冰品專家',
            icon: '🍧',
            description: '收集所有冰品類章',
            requirement: { type: 'category', value: ['水果冰', '霜淇淋', '傳統冰品'] },
            color: '#03A9F4'
        },
        {
            id: 'badge006',
            name: '古早味獵人',
            icon: '🏮',
            description: '收集所有傳統店家章',
            requirement: { type: 'shops', value: ['stamp007', 'stamp011', 'stamp012'] },
            color: '#795548'
        },
        {
            id: 'badge007',
            name: '正興街制霸',
            icon: '🛣️',
            description: '收集所有正興街附近店家章',
            requirement: { type: 'shops', value: ['stamp002', 'stamp003'] },
            color: '#E91E63'
        },
        {
            id: 'badge008',
            name: '貓奴認證',
            icon: '🐱',
            description: '拜訪有店貓的店家',
            requirement: { type: 'shops', value: ['stamp010'] },
            color: '#FF5722'
        }
    ],

    // 狀態管理
    state: {
        collectedStamps: [],
        earnedBadges: [],
        totalVisits: 0
    },

    // 初始化
    init: function() {
        this.loadState();
        this.render();
    },

    // 載入狀態
    loadState: function() {
        const saved = localStorage.getItem('dessertStamps');
        if (saved) {
            this.state = JSON.parse(saved);
        }
    },

    // 儲存狀態
    saveState: function() {
        localStorage.setItem('dessertStamps', JSON.stringify(this.state));
    },

    // 收集印章
    collectStamp: function(shopId) {
        if (this.state.collectedStamps.includes(shopId)) {
            return { success: false, message: '你已經收集過這個章了！' };
        }

        this.state.collectedStamps.push(shopId);
        this.state.totalVisits++;

        // 檢查新獲得的徽章
        const newBadges = this.checkNewBadges();

        this.saveState();
        this.render();

        return {
            success: true,
            message: '成功收集印章！',
            newBadges: newBadges
        };
    },

    // 移除印章（取消打卡）
    removeStamp: function(shopId) {
        const index = this.state.collectedStamps.indexOf(shopId);
        if (index > -1) {
            this.state.collectedStamps.splice(index, 1);
            // 重新檢查徽章
            this.recheckBadges();
            this.saveState();
            this.render();
        }
    },

    // 檢查新獲得的徽章
    checkNewBadges: function() {
        const newBadges = [];

        this.badges.forEach(badge => {
            if (this.state.earnedBadges.includes(badge.id)) return;

            const earned = this.checkBadgeRequirement(badge);
            if (earned) {
                this.state.earnedBadges.push(badge.id);
                newBadges.push(badge);
            }
        });

        return newBadges;
    },

    // 重新檢查所有徽章
    recheckBadges: function() {
        this.state.earnedBadges = [];
        this.badges.forEach(badge => {
            if (this.checkBadgeRequirement(badge)) {
                this.state.earnedBadges.push(badge.id);
            }
        });
    },

    // 檢查徽章條件
    checkBadgeRequirement: function(badge) {
        const req = badge.requirement;

        switch (req.type) {
            case 'count':
                return this.state.collectedStamps.length >= req.value;

            case 'category':
                const categoryShops = this.shops
                    .filter(s => req.value.includes(s.category))
                    .map(s => s.id);
                return categoryShops.every(id => this.state.collectedStamps.includes(id));

            case 'shops':
                return req.value.every(id => this.state.collectedStamps.includes(id));

            default:
                return false;
        }
    },

    // 取得進度統計
    getStats: function() {
        return {
            totalStamps: this.shops.length,
            collectedStamps: this.state.collectedStamps.length,
            progress: Math.round((this.state.collectedStamps.length / this.shops.length) * 100),
            totalBadges: this.badges.length,
            earnedBadges: this.state.earnedBadges.length,
            totalVisits: this.state.totalVisits
        };
    },

    // 渲染主介面
    render: function() {
        const container = document.getElementById('stamps-container');
        if (!container) return;

        const stats = this.getStats();

        container.innerHTML = `
            <div class="stamps-header">
                <h2>🎯 甜點探險集章</h2>
                <div class="stats-bar">
                    <div class="stat">
                        <span class="stat-value">${stats.collectedStamps}</span>
                        <span class="stat-label">已收集</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.totalStamps}</span>
                        <span class="stat-label">總數</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.progress}%</span>
                        <span class="stat-label">完成度</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.progress}%"></div>
                    </div>
                </div>
            </div>

            <div class="stamps-badges">
                <h3>🏅 獲得徽章</h3>
                <div class="badges-grid">
                    ${this.badges.map(badge => {
                        const earned = this.state.earnedBadges.includes(badge.id);
                        return `
                            <div class="badge-item ${earned ? 'earned' : 'locked'}"
                                 style="${earned ? `background: ${badge.color}20; border-color: ${badge.color}` : ''}">
                                <span class="badge-icon">${earned ? badge.icon : '🔒'}</span>
                                <span class="badge-name">${badge.name}</span>
                                <span class="badge-desc">${badge.description}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="stamps-grid">
                <h3>📍 集章地圖</h3>
                <div class="shop-stamps">
                    ${this.shops.map(shop => {
                        const collected = this.state.collectedStamps.includes(shop.id);
                        return `
                            <div class="stamp-card ${collected ? 'collected' : ''}"
                                 onclick="DessertStamps.toggleStamp('${shop.id}')">
                                <div class="stamp-icon">${collected ? shop.icon : '❓'}</div>
                                <div class="stamp-info">
                                    <span class="stamp-name">${shop.name}</span>
                                    <span class="stamp-category">${shop.category}</span>
                                    <span class="stamp-challenge">${shop.challenge}</span>
                                </div>
                                <div class="stamp-status">
                                    ${collected ? '✅' : '⬜'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="stamps-actions">
                <button class="btn-share" onclick="DessertStamps.shareProgress()">
                    📤 分享進度
                </button>
                <button class="btn-reset" onclick="DessertStamps.resetProgress()">
                    🔄 重置進度
                </button>
            </div>
        `;
    },

    // 切換印章狀態
    toggleStamp: function(shopId) {
        if (this.state.collectedStamps.includes(shopId)) {
            if (confirm('確定要取消這個打卡嗎？')) {
                this.removeStamp(shopId);
            }
        } else {
            const result = this.collectStamp(shopId);
            if (result.newBadges && result.newBadges.length > 0) {
                this.showBadgeNotification(result.newBadges);
            }
        }
    },

    // 顯示徽章通知
    showBadgeNotification: function(badges) {
        const badgeNames = badges.map(b => `${b.icon} ${b.name}`).join('、');
        alert(`🎉 恭喜獲得新徽章！\n\n${badgeNames}`);
    },

    // 分享進度
    shareProgress: function() {
        const stats = this.getStats();
        const text = `我在台南甜點探險中已收集 ${stats.collectedStamps}/${stats.totalStamps} 個章，完成度 ${stats.progress}%！獲得 ${stats.earnedBadges} 個徽章！快來一起探險吧！`;

        if (navigator.share) {
            navigator.share({
                title: '台南甜點探險集章',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('已複製到剪貼簿！');
            });
        }
    },

    // 重置進度
    resetProgress: function() {
        if (confirm('確定要重置所有進度嗎？這將清除所有收集的印章和徽章。')) {
            this.state = {
                collectedStamps: [],
                earnedBadges: [],
                totalVisits: 0
            };
            this.saveState();
            this.render();
        }
    },

    // 匯出資料
    exportData: function() {
        const data = JSON.stringify(this.state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dessert-stamps-backup.json';
        a.click();
    },

    // 匯入資料
    importData: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.collectedStamps && Array.isArray(data.collectedStamps)) {
                this.state = data;
                this.saveState();
                this.render();
                return { success: true, message: '匯入成功！' };
            }
            return { success: false, message: '資料格式錯誤' };
        } catch (e) {
            return { success: false, message: '無法解析資料' };
        }
    }
};

// CSS 樣式
const stampsStyles = `
<style>
.stamps-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.stamps-header {
    text-align: center;
    margin-bottom: 30px;
}

.stats-bar {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin: 20px 0;
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #FF6B6B;
}

.stat-label {
    font-size: 12px;
    color: #666;
}

.progress-container {
    padding: 0 20px;
}

.progress-bar {
    height: 10px;
    background: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D);
    transition: width 0.5s ease;
}

.stamps-badges {
    margin-bottom: 30px;
}

.stamps-badges h3 {
    margin-bottom: 15px;
    color: #333;
}

.badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
}

.badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
}

.badge-item.earned {
    animation: badgeEarned 0.5s ease;
}

.badge-item.locked {
    opacity: 0.5;
}

.badge-icon {
    font-size: 32px;
    margin-bottom: 8px;
}

.badge-name {
    font-size: 12px;
    font-weight: bold;
    color: #333;
}

.badge-desc {
    font-size: 10px;
    color: #666;
}

@keyframes badgeEarned {
    0% { transform: scale(0.8); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.stamps-grid h3 {
    margin-bottom: 15px;
    color: #333;
}

.shop-stamps {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.stamp-card {
    display: flex;
    align-items: center;
    padding: 15px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.stamp-card:hover {
    border-color: #FF6B6B;
    transform: translateX(5px);
}

.stamp-card.collected {
    background: linear-gradient(135deg, #fff5f5, #fff);
    border-color: #FF6B6B;
}

.stamp-icon {
    font-size: 36px;
    margin-right: 15px;
    width: 50px;
    text-align: center;
}

.stamp-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.stamp-name {
    font-weight: bold;
    color: #333;
    font-size: 16px;
}

.stamp-category {
    font-size: 12px;
    color: #666;
}

.stamp-challenge {
    font-size: 11px;
    color: #FF6B6B;
    margin-top: 4px;
}

.stamp-status {
    font-size: 24px;
}

.stamps-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
}

.btn-share, .btn-reset {
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.btn-share {
    background: linear-gradient(90deg, #FF6B6B, #FF8E53);
    color: white;
}

.btn-reset {
    background: #f0f0f0;
    color: #666;
}

.btn-share:hover, .btn-reset:hover {
    transform: scale(1.05);
}
</style>
`;

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DessertStamps;
}

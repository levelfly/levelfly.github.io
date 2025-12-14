/**
 * 台南飲品口味配對測驗
 * 根據使用者口味偏好推薦最適合的台南飲品
 */

const DrinkQuiz = {
    // 測驗題目
    questions: [
        {
            id: 'q1',
            question: '你喜歡的甜度是？',
            icon: '🍬',
            options: [
                { value: 'none', label: '無糖', icon: '🚫' },
                { value: 'less', label: '微糖', icon: '🤏' },
                { value: 'half', label: '半糖', icon: '⚖️' },
                { value: 'full', label: '全糖', icon: '🍯' }
            ]
        },
        {
            id: 'q2',
            question: '你喜歡什麼口感？',
            icon: '👅',
            options: [
                { value: 'refreshing', label: '清爽解渴', icon: '💧' },
                { value: 'creamy', label: '濃郁奶香', icon: '🥛' },
                { value: 'chewy', label: '有咀嚼感', icon: '🫧' },
                { value: 'fruity', label: '水果清甜', icon: '🍓' }
            ]
        },
        {
            id: 'q3',
            question: '現在是什麼情境？',
            icon: '🎯',
            options: [
                { value: 'hot', label: '大熱天想消暑', icon: '☀️' },
                { value: 'afterMeal', label: '剛吃完正餐', icon: '🍽️' },
                { value: 'afternoon', label: '下午茶時光', icon: '☕' },
                { value: 'night', label: '夜晚散步', icon: '🌙' }
            ]
        },
        {
            id: 'q4',
            question: '你比較喜歡？',
            icon: '💭',
            options: [
                { value: 'traditional', label: '傳統古早味', icon: '🏮' },
                { value: 'modern', label: '創新時尚', icon: '✨' },
                { value: 'healthy', label: '健康養生', icon: '💚' },
                { value: 'instagram', label: '打卡網美風', icon: '📸' }
            ]
        },
        {
            id: 'q5',
            question: '你的預算是？',
            icon: '💰',
            options: [
                { value: 'budget', label: '銅板價（50元以下）', icon: '🪙' },
                { value: 'medium', label: '小資族（50-100元）', icon: '💵' },
                { value: 'treat', label: '犒賞自己（100-200元）', icon: '💎' },
                { value: 'any', label: '好喝就好', icon: '🎉' }
            ]
        }
    ],

    // 飲品資料庫（含配對權重）
    drinks: [
        {
            id: 'd001',
            name: '雙全紅茶牛奶',
            shop: '雙全紅茶',
            tags: ['half', 'full', 'creamy', 'afterMeal', 'afternoon', 'traditional', 'budget'],
            description: '50年老店古早味紅茶牛奶',
            price: '40元',
            image: '🥛'
        },
        {
            id: 'd002',
            name: '青草茶',
            shop: '青草茶阿伯',
            tags: ['none', 'less', 'refreshing', 'hot', 'afterMeal', 'traditional', 'healthy', 'budget'],
            description: '傳統市場古早味，清涼退火',
            price: '25元',
            image: '🌿'
        },
        {
            id: 'd003',
            name: '冬瓜茶',
            shop: '義豐冬瓜茶',
            tags: ['half', 'full', 'refreshing', 'hot', 'afternoon', 'traditional', 'budget'],
            description: '安平老街招牌，古法熬煮',
            price: '30元',
            image: '🧊'
        },
        {
            id: 'd004',
            name: '芒果冰',
            shop: '裕成水果店',
            tags: ['half', 'fruity', 'hot', 'afternoon', 'instagram', 'treat', 'any'],
            description: '愛文芒果堆疊，份量大',
            price: '150元',
            image: '🥭'
        },
        {
            id: 'd005',
            name: '哈密瓜冰',
            shop: '泰成水果店',
            tags: ['half', 'fruity', 'hot', 'afternoon', 'modern', 'instagram', 'treat', 'any'],
            description: '整顆哈密瓜挖空裝冰',
            price: '180元',
            image: '🍈'
        },
        {
            id: 'd006',
            name: '每日限定霜淇淋',
            shop: '蜷尾家',
            tags: ['half', 'creamy', 'afternoon', 'modern', 'instagram', 'medium', 'treat'],
            description: '文青霜淇淋，每日口味不同',
            price: '100元',
            image: '🍦'
        },
        {
            id: 'd007',
            name: '純薏仁',
            shop: 'CHUN純薏仁',
            tags: ['less', 'half', 'chewy', 'afterMeal', 'afternoon', 'traditional', 'healthy', 'budget', 'medium'],
            description: '米其林推薦，健康美味',
            price: '55元',
            image: '🥣'
        },
        {
            id: 'd008',
            name: '胚芽奶茶',
            shop: '茶の魔手',
            tags: ['half', 'full', 'creamy', 'chewy', 'afternoon', 'night', 'modern', 'budget'],
            description: '台南之光，大杯超值',
            price: '35元',
            image: '🧋'
        },
        {
            id: 'd009',
            name: '紅豆牛奶冰',
            shop: '太陽牌冰品',
            tags: ['half', 'full', 'creamy', 'chewy', 'hot', 'afternoon', 'traditional', 'budget'],
            description: '80年老店，料多實在',
            price: '50元',
            image: '🍧'
        },
        {
            id: 'd010',
            name: '窄門咖啡',
            shop: '窄門咖啡',
            tags: ['none', 'less', 'refreshing', 'afternoon', 'night', 'modern', 'instagram', 'medium', 'treat'],
            description: '38公分窄門入口超特別',
            price: '150元',
            image: '☕'
        }
    ],

    // 當前狀態
    state: {
        currentQuestion: 0,
        answers: {},
        isComplete: false
    },

    // 初始化
    init: function() {
        this.state = {
            currentQuestion: 0,
            answers: {},
            isComplete: false
        };
        this.render();
    },

    // 渲染測驗
    render: function() {
        const container = document.getElementById('quiz-container');
        if (!container) return;

        if (this.state.isComplete) {
            this.renderResult(container);
        } else {
            this.renderQuestion(container);
        }
    },

    // 渲染題目
    renderQuestion: function(container) {
        const question = this.questions[this.state.currentQuestion];
        const progress = ((this.state.currentQuestion) / this.questions.length) * 100;

        container.innerHTML = `
            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${this.state.currentQuestion + 1} / ${this.questions.length}</span>
            </div>

            <div class="quiz-question">
                <div class="question-icon">${question.icon}</div>
                <h3 class="question-text">${question.question}</h3>
            </div>

            <div class="quiz-options">
                ${question.options.map(opt => `
                    <button class="quiz-option" onclick="DrinkQuiz.selectAnswer('${question.id}', '${opt.value}')">
                        <span class="option-icon">${opt.icon}</span>
                        <span class="option-label">${opt.label}</span>
                    </button>
                `).join('')}
            </div>

            ${this.state.currentQuestion > 0 ? `
                <button class="quiz-back" onclick="DrinkQuiz.prevQuestion()">
                    ← 上一題
                </button>
            ` : ''}
        `;
    },

    // 選擇答案
    selectAnswer: function(questionId, value) {
        this.state.answers[questionId] = value;

        if (this.state.currentQuestion < this.questions.length - 1) {
            this.state.currentQuestion++;
            this.render();
        } else {
            this.state.isComplete = true;
            this.render();
        }
    },

    // 上一題
    prevQuestion: function() {
        if (this.state.currentQuestion > 0) {
            this.state.currentQuestion--;
            this.render();
        }
    },

    // 計算結果
    calculateResult: function() {
        const answerValues = Object.values(this.state.answers);
        const scores = {};

        // 計算每個飲品的匹配分數
        this.drinks.forEach(drink => {
            let score = 0;
            answerValues.forEach(answer => {
                if (drink.tags.includes(answer)) {
                    score += 1;
                }
            });
            scores[drink.id] = score;
        });

        // 排序並取前三名
        const sorted = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id, score]) => ({
                ...this.drinks.find(d => d.id === id),
                matchScore: score
            }));

        return sorted;
    },

    // 渲染結果
    renderResult: function(container) {
        const results = this.calculateResult();
        const topResult = results[0];
        const matchPercent = Math.round((topResult.matchScore / 5) * 100);

        container.innerHTML = `
            <div class="quiz-result">
                <h2 class="result-title">🎉 最適合你的台南飲品是...</h2>

                <div class="result-main">
                    <div class="result-icon">${topResult.image}</div>
                    <h3 class="result-name">${topResult.name}</h3>
                    <p class="result-shop">📍 ${topResult.shop}</p>
                    <p class="result-desc">${topResult.description}</p>
                    <p class="result-price">💰 ${topResult.price}</p>
                    <div class="match-score">
                        <span class="match-label">匹配度</span>
                        <div class="match-bar">
                            <div class="match-fill" style="width: ${matchPercent}%"></div>
                        </div>
                        <span class="match-percent">${matchPercent}%</span>
                    </div>
                </div>

                <div class="result-alternatives">
                    <h4>其他推薦</h4>
                    <div class="alt-list">
                        ${results.slice(1).map(r => `
                            <div class="alt-item">
                                <span class="alt-icon">${r.image}</span>
                                <div class="alt-info">
                                    <span class="alt-name">${r.name}</span>
                                    <span class="alt-shop">${r.shop}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="result-actions">
                    <button class="btn-retry" onclick="DrinkQuiz.init()">
                        🔄 再測一次
                    </button>
                    <button class="btn-share" onclick="DrinkQuiz.share()">
                        📤 分享結果
                    </button>
                </div>
            </div>
        `;
    },

    // 分享功能
    share: function() {
        const results = this.calculateResult();
        const topResult = results[0];
        const text = `我在台南飲品測驗的結果是「${topResult.name}」！來自 ${topResult.shop}，你也來測測看吧！`;

        if (navigator.share) {
            navigator.share({
                title: '台南飲品口味測驗',
                text: text,
                url: window.location.href
            });
        } else {
            // 複製到剪貼簿
            navigator.clipboard.writeText(text).then(() => {
                alert('已複製到剪貼簿！');
            });
        }
    },

    // 儲存結果到 localStorage
    saveResult: function() {
        const results = this.calculateResult();
        const saved = JSON.parse(localStorage.getItem('drinkQuizHistory') || '[]');
        saved.push({
            date: new Date().toISOString(),
            answers: this.state.answers,
            result: results[0]
        });
        // 只保留最近10筆
        if (saved.length > 10) saved.shift();
        localStorage.setItem('drinkQuizHistory', JSON.stringify(saved));
    },

    // 取得歷史記錄
    getHistory: function() {
        return JSON.parse(localStorage.getItem('drinkQuizHistory') || '[]');
    }
};

// CSS 樣式（可內嵌或外部引入）
const quizStyles = `
<style>
.quiz-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
}

.quiz-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 30px;
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #FF6B6B, #FF8E53);
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 14px;
    color: #666;
}

.quiz-question {
    text-align: center;
    margin-bottom: 30px;
}

.question-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.question-text {
    font-size: 22px;
    color: #333;
}

.quiz-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.quiz-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
}

.quiz-option:hover {
    border-color: #FF6B6B;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.option-icon {
    font-size: 32px;
    margin-bottom: 10px;
}

.option-label {
    font-size: 14px;
    color: #333;
}

.quiz-back {
    margin-top: 20px;
    padding: 10px 20px;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
}

.result-main {
    text-align: center;
    padding: 30px;
    background: linear-gradient(135deg, #fff5f5, #fff);
    border-radius: 20px;
    margin-bottom: 20px;
}

.result-icon {
    font-size: 64px;
    margin-bottom: 15px;
}

.result-name {
    font-size: 28px;
    color: #FF6B6B;
    margin-bottom: 10px;
}

.result-shop {
    color: #666;
    margin-bottom: 10px;
}

.result-desc {
    color: #333;
    margin-bottom: 10px;
}

.result-price {
    font-weight: bold;
    color: #FF8E53;
}

.match-score {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    justify-content: center;
}

.match-bar {
    width: 100px;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.match-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.match-percent {
    font-weight: bold;
    color: #4CAF50;
}

.result-alternatives {
    padding: 20px;
    background: #f5f5f5;
    border-radius: 12px;
    margin-bottom: 20px;
}

.result-alternatives h4 {
    margin-bottom: 15px;
    color: #666;
}

.alt-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.alt-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px;
    background: white;
    border-radius: 8px;
}

.alt-icon {
    font-size: 24px;
}

.alt-info {
    display: flex;
    flex-direction: column;
}

.alt-name {
    font-weight: bold;
    color: #333;
}

.alt-shop {
    font-size: 12px;
    color: #666;
}

.result-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
}

.btn-retry, .btn-share {
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.btn-retry {
    background: #f0f0f0;
    color: #333;
}

.btn-share {
    background: linear-gradient(90deg, #FF6B6B, #FF8E53);
    color: white;
}

.btn-retry:hover, .btn-share:hover {
    transform: scale(1.05);
}
</style>
`;

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DrinkQuiz;
}

# Design: enhance-tainan-data

---

## 一、資料結構設計

### 1.1 店家資料新增欄位（向後相容）

所有新欄位皆為 optional，不影響現有功能。

```json
{
  // 現有欄位保持不變
  "id": "rst001",
  "name": "六千牛肉湯",
  "address": "中西區海安路一段63號",
  "hours": "05:00～售完",
  "closed": "週一",

  // === 新增欄位 ===

  // 排隊系統
  "queueStatus": "extreme",       // "none" | "short" | "medium" | "long" | "extreme"
  "waitTime": "60分鐘以上",        // 預估等候時間（文字）
  "bestArrivalTime": "03:00",     // 最佳抵達時間

  // 售完系統
  "soldOutTime": "07:00",         // 預估售完時間
  "earlyBirdTip": "凌晨3點發號碼牌（30組）",

  // 標籤系統
  "tags": [
    "michelin-bib",              // 米其林必比登
    "michelin-plate",            // 米其林餐盤
    "500-bowls",                 // 500碗評選
    "kid-friendly",              // 親子友善
    "pet-friendly",              // 寵物友善
    "late-night",                // 宵夜
    "vegetarian-option",         // 有素食選項
    "local-favorite"             // 在地人推薦
  ],

  // 季節限定
  "seasonal": {
    "available": ["winter"],     // spring, summer, autumn, winter
    "note": "草莓季 12月～3月"
  },

  // 價位
  "priceRange": {
    "min": 100,
    "max": 150,
    "currency": "TWD"
  },

  // 區域
  "district": "中西區",
  "area": "國華街商圈"
}
```

### 1.2 排隊狀態定義

| 狀態 | 值 | 說明 | 等候時間 | UI 顯示 |
|------|-----|------|---------|---------|
| 無需排隊 | none | 隨到隨吃 | 0 分鐘 | 🟢 免排隊 |
| 短 | short | 稍等一下 | <10 分鐘 | 🟢 短等候 |
| 中等 | medium | 需要等候 | 10-30 分鐘 | 🟡 中等等候 |
| 長 | long | 需要耐心 | 30-60 分鐘 | 🟠 較長等候 |
| 極長 | extreme | 超高人氣 | 60+ 分鐘 | 🔴 排隊名店 |

### 1.3 景點資料新增欄位

```json
{
  "id": "att001",
  "name": "四草綠色隧道",
  "address": "安南區大眾路360號",

  // === 新增欄位 ===

  // 票價系統
  "tickets": {
    "adult": 200,
    "child": 100,        // 7-12歲
    "senior": 30,        // 80歲以上
    "tainanResident": 0  // 台南市民
  },

  // 開放時間（含季節變化）
  "openingHours": {
    "weekday": { "start": "08:30", "end": "16:00" },
    "weekend": { "start": "08:00", "end": "16:30" },
    "summer": { "start": "08:30", "end": "17:00" },
    "winter": { "start": "08:00", "end": "16:30" }
  },

  // 建議停留時間
  "suggestedDuration": "1-1.5小時",

  // 拍照攻略
  "photoTips": {
    "bestSpots": [
      { "name": "船頭第一排", "rating": 5, "description": "視野無遮蔽，最適合拍天使之吻" },
      { "name": "船尾最後排", "rating": 4, "description": "折返時變船頭" }
    ],
    "bestTime": "早上第一班船",
    "avoid": ["下雨過後幾天（水面混濁）", "假日下午（排隊3小時）"],
    "tips": ["穿彩色衣物形成對比", "善用藍天白雲背景"]
  },

  // 必備物品
  "essentials": [
    { "item": "防曬乳", "provided": false },
    { "item": "防蚊液", "provided": false },
    { "item": "斗笠", "provided": true, "note": "現場免費提供" }
  ],

  // 周邊美食
  "nearbyFood": [
    { "name": "四草大眾廟旁蚵仔嗲", "distance": "步行1分鐘" },
    { "name": "同記安平豆花", "distance": "車程10分鐘" }
  ],

  // 交通方式
  "transportation": {
    "bus": ["台灣好行99台江線", "公車10號"],
    "parking": "免費停車場",
    "note": "導航「四草大眾廟」"
  }
}
```

---

## 二、智慧時間系統設計

### 2.1 營業狀態計算器

```javascript
// timeUtils.js
const TAIWAN_TIMEZONE = 'Asia/Taipei';

/**
 * 計算店家目前營業狀態
 * @returns 'open' | 'closed' | 'closing-soon' | 'sold-out-soon'
 */
function getBusinessStatus(shop) {
  const now = new Date();
  const currentTime = formatTime(now); // "14:30"

  // 檢查公休日
  if (isClosedToday(shop.closed)) {
    return { status: 'closed', message: '今日公休' };
  }

  // 解析營業時間
  const { openTime, closeTime } = parseHours(shop.hours);

  // 已打烊
  if (currentTime > closeTime) {
    return { status: 'closed', message: '已打烊' };
  }

  // 尚未開門
  if (currentTime < openTime) {
    return { status: 'closed', message: `${openTime} 開始營業` };
  }

  // 即將售完（針對早餐店）
  if (shop.soldOutTime && currentTime > subtractMinutes(shop.soldOutTime, 30)) {
    return { status: 'sold-out-soon', message: `⚠️ 預計 ${shop.soldOutTime} 售完` };
  }

  // 即將打烊
  if (currentTime > subtractMinutes(closeTime, 30)) {
    return { status: 'closing-soon', message: '即將打烊' };
  }

  return { status: 'open', message: '營業中' };
}
```

### 2.2 售完倒數計時器

```javascript
/**
 * 計算距離售完還有多少時間
 */
function getSoldOutCountdown(soldOutTime) {
  const now = new Date();
  const [hours, minutes] = soldOutTime.split(':').map(Number);

  const soldOutDate = new Date(now);
  soldOutDate.setHours(hours, minutes, 0, 0);

  const diff = soldOutDate - now;

  if (diff <= 0) {
    return { expired: true, message: '可能已售完' };
  }

  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursLeft > 0) {
    return { expired: false, message: `還剩 ${hoursLeft}小時${minutesLeft}分` };
  }
  return { expired: false, message: `還剩 ${minutesLeft} 分鐘！`, urgent: true };
}
```

### 2.3 日落時間查詢

```javascript
// 2025年台南日落時間表
const SUNSET_TIMES = {
  1: "17:25", 2: "17:50", 3: "18:10",
  4: "18:15", 5: "18:35", 6: "18:49",
  7: "18:50", 8: "18:35", 9: "18:05",
  10: "17:49", 11: "17:20", 12: "17:14"
};

function getSunsetInfo() {
  const month = new Date().getMonth() + 1;
  const sunset = SUNSET_TIMES[month];
  const suggestedArrival = subtractMinutes(sunset, 60);

  return {
    sunset,
    suggestedArrival,
    message: `今日日落 ${sunset}，建議 ${suggestedArrival} 前抵達`
  };
}
```

---

## 三、拍照攻略系統設計

### 3.1 photoSpots.json 結構

```json
{
  "spots": [
    {
      "id": "photo001",
      "name": "四草綠色隧道 - 天使之吻",
      "location": "四草綠色隧道水道盡頭",
      "attractionId": "att001",

      "bestPositions": [
        { "position": "船頭第一排", "rating": 5 },
        { "position": "船尾最後排", "rating": 4 }
      ],

      "bestTime": {
        "time": "08:30",
        "reason": "第一班船，水面最平靜"
      },

      "avoid": [
        { "condition": "下雨後", "reason": "水面混濁" },
        { "condition": "假日下午", "reason": "排隊3小時" }
      ],

      "tips": [
        "拍攝「天使之吻」需要水面平靜才有倒影",
        "建議使用廣角鏡頭",
        "可請船家暫停讓你拍攝"
      ],

      "hashtags": ["#四草綠色隧道", "#台版亞馬遜", "#天使之吻"]
    }
  ]
}
```

---

## 四、一日遊路線系統設計

### 4.1 routes.json 結構

```json
{
  "routes": [
    {
      "id": "route001",
      "name": "安平生態文化一日遊",
      "theme": "nature",
      "duration": "8小時",
      "difficulty": "easy",
      "estimatedCost": {
        "min": 500,
        "max": 800,
        "breakdown": {
          "transportation": 100,
          "tickets": 200,
          "food": 300
        }
      },

      "stops": [
        {
          "order": 1,
          "time": "08:00",
          "duration": "1.5小時",
          "placeId": "att001",
          "placeName": "四草綠色隧道",
          "activity": "搭第一班船",
          "tips": "建議07:30抵達排隊"
        },
        {
          "order": 2,
          "time": "09:30",
          "duration": "30分鐘",
          "placeName": "抹香鯨陳列館",
          "activity": "憑船票免費參觀",
          "transportation": {
            "from": 1,
            "method": "步行",
            "duration": "3分鐘"
          }
        }
        // ... 更多站點
      ],

      "mapUrl": "https://maps.google.com/...",
      "tags": ["親子", "自然", "文化"]
    }
  ]
}
```

---

## 五、互動功能設計

### 5.1 月老配對指南

```json
{
  "moonElders": [
    {
      "id": "temple001",
      "temple": "大天后宮",
      "specialty": "緣粉",
      "bestFor": ["尚無對象", "想要認識新朋友"],
      "ritual": "向月老稟報姓名、生辰、地址，說明理想對象條件",
      "offerings": ["糖果", "紅線"],
      "successRate": "每年撮合300+對",
      "tips": "誠心最重要，不要貪心求太多條件"
    },
    {
      "id": "temple002",
      "temple": "祀典武廟",
      "specialty": "斬爛桃花",
      "bestFor": ["想消除孽緣", "被糾纏"],
      "ritual": "向月老說明想斬除的對象和原因"
    }
  ]
}
```

### 5.2 收藏清單（LocalStorage）

```javascript
// favorites.js
const STORAGE_KEY = 'tainan-guide-favorites';

function getFavorites() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { restaurants: [], attractions: [], routes: [] };
}

function addFavorite(type, id) {
  const favorites = getFavorites();
  if (!favorites[type].includes(id)) {
    favorites[type].push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}

function removeFavorite(type, id) {
  const favorites = getFavorites();
  favorites[type] = favorites[type].filter(item => item !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

function isFavorite(type, id) {
  const favorites = getFavorites();
  return favorites[type].includes(id);
}
```

### 5.3 已訪打卡功能

```javascript
// visited.js
const VISITED_KEY = 'tainan-guide-visited';

function markVisited(type, id) {
  const visited = getVisited();
  const key = `${type}-${id}`;
  if (!visited[key]) {
    visited[key] = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('zh-TW')
    };
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  }
}

function getVisitedCount(type) {
  const visited = getVisited();
  return Object.keys(visited).filter(key => key.startsWith(type)).length;
}
```

---

## 六、前端 UI 設計

### 6.1 篩選器增強

```html
<!-- 排隊狀況篩選 -->
<div class="filter-group">
  <label>排隊狀況</label>
  <select id="queue-filter">
    <option value="">不限</option>
    <option value="none,short">🟢 免排隊</option>
    <option value="medium">🟡 中等等候</option>
    <option value="long,extreme">🔴 需要耐心</option>
  </select>
</div>

<!-- 標籤篩選 -->
<div class="filter-group">
  <label>特色標籤</label>
  <div class="tag-chips">
    <button class="chip" data-tag="michelin-bib">🌟 米其林必比登</button>
    <button class="chip" data-tag="500-bowls">🍜 500碗</button>
    <button class="chip" data-tag="kid-friendly">👶 親子友善</button>
    <button class="chip" data-tag="pet-friendly">🐕 寵物友善</button>
    <button class="chip" data-tag="late-night">🌙 宵夜</button>
  </div>
</div>

<!-- 營業狀態篩選 -->
<div class="filter-group">
  <label>營業狀態</label>
  <div class="toggle-group">
    <button class="toggle active" data-status="all">全部</button>
    <button class="toggle" data-status="open">營業中</button>
  </div>
</div>
```

### 6.2 卡片顯示增強

```html
<div class="shop-card">
  <!-- 營業狀態 Badge -->
  <div class="status-badge status-open">營業中</div>

  <!-- 排隊狀態 -->
  <span class="queue-badge queue-extreme">🔴 排隊 60分+</span>

  <!-- 售完倒數 -->
  <div class="soldout-countdown urgent">
    ⏰ 還剩 45 分鐘！
  </div>

  <!-- 店家資訊 -->
  <h3>六千牛肉湯</h3>
  <p class="address">📍 中西區海安路一段63號</p>
  <p class="hours">🕐 05:00～售完（約07:00）</p>

  <!-- 標籤 -->
  <div class="tags">
    <span class="tag michelin">🌟 必比登</span>
    <span class="tag local">💚 在地推薦</span>
  </div>

  <!-- 最佳時間提示 -->
  <p class="best-time">💡 建議凌晨 3:00 前抵達領號碼牌</p>

  <!-- 互動按鈕 -->
  <div class="actions">
    <button class="btn-favorite" onclick="toggleFavorite('restaurants', 'rst001')">
      ❤️ 收藏
    </button>
    <button class="btn-visited" onclick="markVisited('restaurants', 'rst001')">
      ✅ 去過了
    </button>
  </div>
</div>
```

### 6.3 CSS 樣式範例

```css
/* 排隊狀態 Badge */
.queue-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.queue-none, .queue-short { background: #d4edda; color: #155724; }
.queue-medium { background: #fff3cd; color: #856404; }
.queue-long { background: #ffe5d0; color: #854d0e; }
.queue-extreme { background: #f8d7da; color: #721c24; }

/* 售完倒數 */
.soldout-countdown {
  background: #fef3c7;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
}

.soldout-countdown.urgent {
  background: #fee2e2;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 標籤 Chips */
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-right: 4px;
}

.tag.michelin { background: #fef3c7; color: #92400e; }
.tag.local { background: #d1fae5; color: #065f46; }
```

---

## 七、效能考量

| 考量點 | 解決方案 |
|--------|---------|
| JSON 檔案變大 | 按類別分檔、前端分頁載入（每次20筆）|
| 圖片載入慢 | lazy loading + placeholder + WebP 格式 |
| 搜尋效能 | 前端 filter（資料量 <500 筆可接受）|
| 時間計算頻繁 | 每分鐘更新一次，非即時 |
| LocalStorage 限制 | 只存 ID，不存完整資料 |

---

## 八、檔案結構

```
tainan-guide/
├── data/
│   ├── restaurants.json      # 餐廳（含牛肉湯、鱔魚意麵等）
│   ├── snacks.json          # 小吃
│   ├── drinks.json          # 飲品
│   ├── attractions.json     # 景點
│   ├── nightmarkets.json    # 夜市
│   ├── hotels.json          # 住宿
│   ├── seafood.json         # 🆕 海鮮專區
│   ├── vegetarian.json      # 🆕 素食專區
│   ├── latenight.json       # 🆕 宵夜地圖
│   ├── photoSpots.json      # 🆕 拍照點
│   ├── routes.json          # 🆕 一日遊路線
│   ├── temples.json         # 🆕 廟宇（含月老資料）
│   └── events.json          # 🆕 季節活動
├── js/
│   ├── timeUtils.js         # 🆕 時間計算工具
│   ├── favorites.js         # 🆕 收藏功能
│   ├── visited.js           # 🆕 打卡功能
│   └── filters.js           # 🆕 進階篩選
├── css/
│   ├── badges.css           # 🆕 狀態標籤樣式
│   └── dark-mode.css        # 🆕 深色模式
└── pages/
    ├── photo-guide.html     # 🆕 拍照攻略頁
    ├── routes.html          # 🆕 路線規劃頁
    └── moon-elder.html      # 🆕 月老指南頁
```

---

## 九、進階功能設計（第二波）

### 9.1 節慶活動完整系統

```json
// events.json
{
  "events": [
    {
      "id": "evt001",
      "name": "鹽水蜂炮",
      "date": {
        "type": "lunar",
        "month": 1,
        "day": 15,
        "gregorian2025": "2025-02-12"
      },
      "location": "鹽水區武廟",
      "duration": "2天",
      "highlights": [
        "世界三大民俗慶典",
        "上百萬支蜂炮齊發"
      ],
      "safetyGear": [
        { "item": "全罩式安全帽", "required": true },
        { "item": "棉質長袖外套", "required": true },
        { "item": "厚手套", "required": true },
        { "item": "毛巾圍脖", "required": true },
        { "item": "護目鏡", "required": true },
        { "item": "耳塞", "recommended": true }
      ],
      "transportation": {
        "train": "搭至新營站，轉乘接駁車",
        "parking": "建議停放外圍停車場步行進入"
      },
      "tips": [
        "全身包緊不露肌膚",
        "勿穿化纖材質（會融化）",
        "貴重物品勿攜帶"
      ],
      "nearbyFood": [
        { "name": "阿三意麵", "note": "鹽水名產" },
        { "name": "鹽水豆簽羹", "note": "傳統小吃" }
      ]
    },
    {
      "id": "evt002",
      "name": "台南古蹟日",
      "date": {
        "type": "annual",
        "month": 9,
        "note": "9月第三週週末"
      },
      "discount": "部分古蹟免費開放",
      "activities": ["夜間導覽", "限定體驗活動"]
    },
    {
      "id": "evt003",
      "name": "漁光島藝術節",
      "date": {
        "type": "range",
        "start": "2025-03-29",
        "end": "2025-04-20"
      },
      "location": "漁光島",
      "highlights": ["大型裝置藝術", "海灘音樂會"],
      "tips": ["傍晚到訪可同時看夕陽"]
    },
    {
      "id": "evt004",
      "name": "芒果節",
      "date": {
        "type": "range",
        "start": "2025-06-01",
        "end": "2025-08-31"
      },
      "location": "玉井區",
      "specialMenu": ["芒果冰", "芒果乾", "情人果"],
      "farmExperience": "可預約採果體驗"
    }
  ]
}
```

### 9.2 交通整合系統

```json
// transportation.json
{
  "youbike": {
    "firstHour": 5,
    "perHour": 10,
    "stations": [
      { "name": "台南火車站", "bikes": 50, "nearbyAttractions": ["台南車站", "成功路商圈"] },
      { "name": "赤崁樓", "bikes": 30, "nearbyAttractions": ["赤崁樓", "祀典武廟"] },
      { "name": "安平古堡", "bikes": 25, "nearbyAttractions": ["安平古堡", "安平老街"] }
    ],
    "tips": [
      "需先註冊 YouBike 會員",
      "可用悠遊卡或信用卡",
      "夏天建議早晚騎乘避開高溫"
    ]
  },
  "bus": {
    "touristLines": [
      {
        "name": "台灣好行88府城巡迴線",
        "price": 18,
        "dayPass": 100,
        "frequency": "每30分鐘",
        "route": ["台南火車站", "孔廟", "林百貨", "赤崁樓", "安平古堡"],
        "tips": "可買古蹟漫遊券含此線無限搭乘"
      },
      {
        "name": "台灣好行99台江線",
        "price": 18,
        "dayPass": 100,
        "route": ["台南火車站", "四草大眾廟", "七股鹽山", "北門遊客中心"],
        "tips": "看夕陽必搭"
      },
      {
        "name": "台灣好行61西濱快線",
        "route": ["高鐵台南站", "七股鹽山", "北門井仔腳"],
        "tips": "可連接高鐵"
      }
    ],
    "regularLines": [
      { "number": "2", "route": "火車站→安平", "note": "最常用" },
      { "number": "10", "route": "火車站→四草", "note": "去綠色隧道" }
    ]
  },
  "parking": {
    "areas": [
      {
        "name": "中西區市中心",
        "rate": "20-40元/小時",
        "freeOptions": ["百貨公司消費滿額", "週日路邊停車部分免費"],
        "tips": "強烈建議搭大眾運輸"
      },
      {
        "name": "安平區",
        "rate": "30元/次（平日）",
        "weekendSurcharge": "假日50元/次",
        "recommend": "停安平漁人碼頭停車場較便宜"
      },
      {
        "name": "七股區",
        "rate": "免費",
        "note": "七股鹽山有大型免費停車場"
      }
    ]
  },
  "mrt": {
    "status": "建設中",
    "expectedOpen": "2027年",
    "note": "目前主要靠公車與YouBike"
  }
}
```

### 9.3 住宿推薦引擎

```json
// hotels.json 擴充結構
{
  "id": "hotel001",
  "name": "和逸飯店 台南西門館",
  "type": "hotel",        // hotel | bnb | hostel | hotspring
  "stars": 4,
  "priceRange": {
    "weekday": { "min": 3000, "max": 5000 },
    "weekend": { "min": 4000, "max": 7000 }
  },
  "district": "中西區",
  "nearbyMRT": null,      // 台南目前無捷運
  "nearbyTrain": "台南火車站步行3分鐘",

  "features": [
    "kid-friendly",       // 有兒童遊戲區
    "breakfast-included", // 含早餐
    "parking-free",       // 免費停車
    "pool"                // 有泳池
  ],

  "kidFacilities": {
    "playroom": true,
    "babyBed": true,
    "kidMenu": true,
    "characterRoom": "CARS主題房"
  },

  "nearbyFood": [
    { "name": "國華街", "distance": "步行5分鐘" },
    { "name": "赤崁樓美食區", "distance": "步行10分鐘" }
  ],

  "bookingTips": "暑假、連假需提前1個月預訂"
}
```

```javascript
// hotelFilter.js
function filterHotels(hotels, criteria) {
  return hotels.filter(h => {
    if (criteria.maxPrice && h.priceRange.weekday.max > criteria.maxPrice) return false;
    if (criteria.type && h.type !== criteria.type) return false;
    if (criteria.district && h.district !== criteria.district) return false;
    if (criteria.kidFriendly && !h.features.includes('kid-friendly')) return false;
    if (criteria.hasBreakfast && !h.features.includes('breakfast-included')) return false;
    return true;
  });
}
```

### 9.4 伴手禮指南

```json
// souvenirs.json
{
  "categories": [
    {
      "name": "百元以下伴手禮",
      "priceRange": { "max": 100 },
      "items": [
        {
          "name": "依蕾特布丁",
          "price": 35,
          "unit": "個",
          "whereToBy": ["正興街本店", "全家便利商店"],
          "shelfLife": "7天",
          "needRefrigeration": true,
          "tips": "全家買的是冷凍版，口感略不同"
        },
        {
          "name": "安平蝦餅",
          "price": 50,
          "unit": "包",
          "whereToBy": ["安平老街各店家"],
          "shelfLife": "3個月",
          "tips": "現炸最香，店家可試吃比較"
        }
      ]
    },
    {
      "name": "200-500元伴手禮",
      "priceRange": { "min": 200, "max": 500 },
      "items": [
        {
          "name": "舊振南綠豆椪",
          "price": 380,
          "unit": "盒/6入",
          "whereToBy": ["林百貨", "高鐵站", "機場"],
          "shelfLife": "14天",
          "mustPreorder": false
        },
        {
          "name": "克林台包",
          "price": 420,
          "unit": "盒/8入",
          "whereToBy": ["府前路本店"],
          "shelfLife": "冷凍30天",
          "mustPreorder": true,
          "preorderDays": 3
        }
      ]
    },
    {
      "name": "奢華伴手禮",
      "priceRange": { "min": 500 },
      "items": [
        {
          "name": "舊振南中秋禮盒",
          "price": 1280,
          "seasonal": "中秋限定",
          "mustPreorder": true,
          "note": "需提前1個月預訂"
        }
      ]
    }
  ],

  "packingTips": [
    { "type": "常溫", "items": ["蝦餅", "椪餅", "花生糖"], "note": "可托運" },
    { "type": "冷藏", "items": ["布丁", "蝦捲"], "note": "需保冰袋，建議最後一天買" },
    { "type": "冷凍", "items": ["克林台包", "周氏蝦捲"], "note": "需保冷袋+保冷劑" }
  ]
}
```

### 9.5 夜市智能導航

```json
// nightmarkets.json 擴充
{
  "id": "nm001",
  "name": "花園夜市",
  "schedule": {
    "days": ["四", "六", "日"],
    "mnemonic": "大大武花大武花",  // 夜市口訣
    "mnemonicExplanation": {
      "一": "大東",
      "二": "大東、武聖",
      "三": "武聖",
      "四": "花園",
      "五": "大東、武聖",
      "六": "花園",
      "日": "花園"
    }
  },
  "hours": { "start": "17:00", "end": "00:00" },
  "size": "large",  // small | medium | large
  "crowdLevel": {
    "weekday": "medium",
    "weekend": "extreme"
  },

  "mustEat": [
    { "rank": 1, "name": "二師兄滷味", "location": "A區入口", "waitTime": "15分鐘" },
    { "rank": 2, "name": "統大碳烤雞排", "location": "B區中段", "waitTime": "20分鐘" },
    { "rank": 3, "name": "阿美芭樂", "location": "C區", "waitTime": "5分鐘" }
  ],

  "navigation": {
    "zones": [
      { "name": "A區", "type": "小吃", "recommended": ["滷味", "蚵仔煎"] },
      { "name": "B區", "type": "炸物", "recommended": ["雞排", "鹹酥雞"] },
      { "name": "C區", "type": "飲料甜點", "recommended": ["芭樂", "木瓜牛奶"] },
      { "name": "D區", "type": "遊戲", "recommended": ["射氣球", "套圈圈"] }
    ],
    "suggestedRoute": "建議從A區入口開始，順時針繞一圈"
  },

  "tips": [
    "假日18:00後超難停車",
    "先繞一圈看完再買，避免買太多拿不動",
    "帶環保袋和濕紙巾"
  ]
}
```

```javascript
// nightmarketGuide.js
function getTonightMarkets() {
  const dayOfWeek = new Date().getDay(); // 0=日, 1=一...
  const dayMap = ['日', '一', '二', '三', '四', '五', '六'];
  const today = dayMap[dayOfWeek];

  return nightmarkets.filter(nm =>
    nm.schedule.days.includes(today)
  );
}

function generateMnemonic() {
  // 返回整週的夜市口訣
  return "大大武花大武花";
}
```

### 9.6 安全裝備清單產生器

```javascript
// safetyGear.js
function generatePackingList(activities) {
  const baseItems = [
    { item: "防曬乳", category: "必備" },
    { item: "水壺", category: "必備" },
    { item: "行動電源", category: "必備" }
  ];

  const activityGear = {
    "蜂炮": [
      { item: "全罩式安全帽", required: true, reason: "保護頭部" },
      { item: "棉質長袖", required: true, reason: "防火花（化纖會融化）" },
      { item: "厚手套", required: true },
      { item: "護目鏡", required: true },
      { item: "毛巾圍脖", required: true },
      { item: "耳塞", recommended: true }
    ],
    "四草綠色隧道": [
      { item: "防蚊液", required: true },
      { item: "帽子", recommended: true, note: "現場有提供斗笠" }
    ],
    "漁光島看夕陽": [
      { item: "野餐墊", recommended: true },
      { item: "防蚊液", required: true },
      { item: "薄外套", recommended: true, reason: "傍晚海邊較涼" }
    ],
    "七股鹽山": [
      { item: "太陽眼鏡", required: true, reason: "鹽山反光刺眼" },
      { item: "遮陽帽", required: true }
    ]
  };

  let list = [...baseItems];
  activities.forEach(act => {
    if (activityGear[act]) {
      list = list.concat(activityGear[act]);
    }
  });

  // 去重
  return [...new Map(list.map(item => [item.item, item])).values()];
}
```

### 9.7 親子景點比較器

```json
// kidFriendly.json
{
  "comparisons": [
    {
      "category": "生態教育",
      "spots": [
        {
          "name": "四草綠色隧道",
          "ageRecommend": "3歲以上",
          "duration": "1-1.5小時",
          "price": { "adult": 200, "child": 100 },
          "strollerFriendly": false,
          "highlights": ["搭船看紅樹林", "生態導覽"],
          "cons": ["船程較長幼兒可能無聊", "夏天悶熱"],
          "tips": "建議搭第一班船人少"
        },
        {
          "name": "七股鹽山",
          "ageRecommend": "全年齡",
          "duration": "1-2小時",
          "price": { "adult": 100, "child": 50 },
          "strollerFriendly": true,
          "highlights": ["爬鹽山", "鹽雕展覽", "吃鹽冰棒"],
          "cons": ["夏天炎熱", "沒遮蔽物"],
          "tips": "建議傍晚去，可順便看夕陽"
        }
      ]
    },
    {
      "category": "室內親子",
      "spots": [
        {
          "name": "南科考古館",
          "ageRecommend": "5歲以上",
          "duration": "2-3小時",
          "price": { "adult": 80, "child": 0 },
          "strollerFriendly": true,
          "highlights": ["互動展覽", "VR體驗", "考古沙坑"],
          "cons": ["位置較遠需開車"],
          "tips": "週三、週六有定時導覽"
        },
        {
          "name": "奇美博物館",
          "ageRecommend": "6歲以上",
          "duration": "3-4小時",
          "price": { "adult": 200, "child": 150 },
          "strollerFriendly": true,
          "highlights": ["西洋藝術", "樂器展", "大草坪"],
          "cons": ["內容對幼兒較難理解"],
          "tips": "可先在草坪野餐再入館"
        }
      ]
    }
  ]
}
```

### 9.8 打卡熱點時段建議

```json
// photoHotspots.json
{
  "hotspots": [
    {
      "name": "神農街",
      "bestTime": {
        "photo": "傍晚17:00-18:30",
        "reason": "燈籠亮起、夕陽光線柔和"
      },
      "avoid": {
        "time": "週末下午13:00-15:00",
        "reason": "人潮最多、難拍空景"
      },
      "tips": [
        "想拍空景建議平日早上10點前",
        "夜景需帶腳架"
      ],
      "hashtags": ["#神農街", "#台南老街", "#文青台南"]
    },
    {
      "name": "漁光島",
      "bestTime": {
        "photo": "日落前1小時",
        "reason": "金色夕陽+剪影"
      },
      "sunsetInfo": "依月份不同，約17:15-18:50",
      "avoid": {
        "condition": "漲潮時",
        "reason": "沙灘變小、無法拍月牙灣"
      },
      "tips": [
        "藝術節期間可拍裝置藝術",
        "退潮時可走到更遠的沙洲"
      ]
    },
    {
      "name": "井仔腳瓦盤鹽田",
      "bestTime": {
        "photo": "日落前30分鐘",
        "reason": "天空倒映在鹽田水面"
      },
      "mustCheck": "當天有無放水（無水則無倒影）",
      "tips": [
        "建議致電確認當天是否有水",
        "帶拖鞋可走進鹽田拍攝"
      ]
    }
  ]
}
```

### 9.9 APP/外部連結整合

```json
// externalLinks.json
{
  "transportation": [
    {
      "name": "YouBike 2.0",
      "type": "app",
      "ios": "https://apps.apple.com/tw/app/youbike2-0/id1542187398",
      "android": "https://play.google.com/store/apps/details?id=com.youbike.yangbike",
      "web": "https://www.youbike.com.tw/region/tainan/",
      "usage": "租借單車"
    },
    {
      "name": "大台南公車",
      "type": "app",
      "ios": "https://apps.apple.com/tw/app/大台南公車/id969421981",
      "android": "https://play.google.com/store/apps/details?id=com.viwave.tainanbus",
      "usage": "公車動態查詢"
    }
  ],
  "navigation": [
    {
      "name": "Google Maps",
      "type": "universal",
      "deepLinkTemplate": "https://www.google.com/maps/dir/?api=1&destination={lat},{lng}",
      "usage": "導航到景點"
    }
  ],
  "booking": [
    {
      "name": "四草綠色隧道線上預約",
      "type": "web",
      "url": "https://www.4grass.com/",
      "note": "可線上預約船班"
    },
    {
      "name": "奇美博物館購票",
      "type": "web",
      "url": "https://www.chimeimuseum.org/",
      "note": "線上購票可選時段"
    }
  ],
  "socialMedia": [
    {
      "name": "台南旅遊網",
      "type": "official",
      "url": "https://www.twtainan.net/",
      "usage": "官方旅遊資訊"
    }
  ]
}
```

### 9.10 AI 行程規劃器

```javascript
// tripPlanner.js
function generateTrip(preferences) {
  const {
    days,           // 天數
    pace,           // 'relaxed' | 'moderate' | 'intensive'
    interests,      // ['food', 'culture', 'nature', 'photo']
    hasKids,        // boolean
    budget,         // 'low' | 'medium' | 'high'
    startLocation   // 'train' | 'hsr' | 'car'
  } = preferences;

  // 根據偏好篩選景點
  let candidates = filterAttractions(interests, hasKids);

  // 依照 pace 決定每天景點數
  const spotsPerDay = {
    'relaxed': 2,
    'moderate': 3,
    'intensive': 4
  }[pace];

  // 地理位置優化（相近景點排同一天）
  const clustered = clusterByLocation(candidates);

  // 生成行程
  const itinerary = [];
  for (let day = 1; day <= days; day++) {
    const dayPlan = {
      day,
      spots: clustered.slice((day-1) * spotsPerDay, day * spotsPerDay),
      meals: suggestMeals(clustered[(day-1) * spotsPerDay], hasKids),
      tips: getDayTips(day, days)
    };
    itinerary.push(dayPlan);
  }

  return {
    itinerary,
    estimatedCost: calculateCost(itinerary, budget),
    packingList: generatePackingList(interests),
    warnings: getSeasonalWarnings()
  };
}

// 智能建議功能
function getSmartSuggestions(currentTime, location) {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) {
    return suggestBreakfast(location); // 早餐推薦（含牛肉湯、虱目魚粥）
  }
  if (hour >= 11 && hour < 14) {
    return suggestLunch(location);
  }
  if (hour >= 16 && hour < 18) {
    return suggestSunset(); // 夕陽景點
  }
  if (hour >= 18 && hour < 22) {
    return suggestDinner(location).concat(getTonightMarkets());
  }
  if (hour >= 22 || hour < 5) {
    return suggestLateNight(); // 宵夜推薦
  }
}
```

---

## 十、資料補充原則

> **重要**：在製作過程中遇到資料不足的部份，應該**馬上上網查詢補充**，而不是裝作沒看見。

### 10.1 需要上網補充的情況

| 情況 | 處理方式 |
|------|---------|
| 票價資訊不完整 | 查詢官方網站確認最新票價 |
| 營業時間不確定 | 查詢 Google Maps 或官方社群 |
| 新開幕店家 | 搜尋最新食記確認資訊 |
| 活動日期 | 查詢官方公告確認 2025 年日期 |
| 交通路線異動 | 查詢大台南公車官網 |
| 季節限定資訊 | 搜尋當季食記確認供應狀況 |

### 10.2 資料來源優先順序

1. **官方網站**：景點、交通、票價
2. **Google Maps**：營業時間、地址、電話
3. **部落格食記**：美食評價、推薦菜色
4. **社群媒體**：最新動態、臨時公休

### 10.3 資料標註

對於上網補充的資料，應在 JSON 中標註來源：

```json
{
  "price": 200,
  "priceSource": "official",      // official | google | blog | estimated
  "priceUpdated": "2025-01-15",
  "priceNote": "2024年12月調漲"
}
```

---

## 十一、新增檔案結構

```
tainan-guide/
├── data/
│   ├── ... (原有檔案)
│   ├── events.json          # 🆕 節慶活動
│   ├── transportation.json  # 🆕 交通資訊
│   ├── souvenirs.json       # 🆕 伴手禮
│   ├── kidFriendly.json     # 🆕 親子比較
│   ├── photoHotspots.json   # 🆕 打卡熱點
│   └── externalLinks.json   # 🆕 外部連結
├── js/
│   ├── ... (原有檔案)
│   ├── tripPlanner.js       # 🆕 行程規劃器
│   ├── nightmarketGuide.js  # 🆕 夜市導航
│   ├── safetyGear.js        # 🆕 裝備清單
│   └── hotelFilter.js       # 🆕 住宿篩選
└── pages/
    ├── ... (原有頁面)
    ├── events.html          # 🆕 活動日曆頁
    ├── transportation.html  # 🆕 交通指南頁
    ├── souvenirs.html       # 🆕 伴手禮頁
    ├── hotels.html          # 🆕 住宿推薦頁
    └── planner.html         # 🆕 行程規劃頁
```

---

## 十二、飲品甜點進階功能設計（Phase 8）

### 12.1 季節限定飲品日曆

```json
// seasonalDrinks.json
{
  "seasons": [
    {
      "id": "strawberry",
      "name": "草莓季",
      "months": [12, 1, 2, 3],
      "emoji": "🍓",
      "drinks": [
        {
          "name": "草莓牛奶",
          "shops": ["迷客夏", "醇白", "50嵐"],
          "priceRange": { "min": 55, "max": 75 },
          "availability": "季節限定，約12月中旬開始"
        },
        {
          "name": "草莓拿鐵",
          "shops": ["星巴克", "路易莎"],
          "priceRange": { "min": 120, "max": 150 }
        }
      ],
      "tips": ["大湖草莓最甜", "12月中～2月中品質最佳"]
    },
    {
      "id": "mango",
      "name": "芒果季",
      "months": [5, 6, 7, 8, 9],
      "emoji": "🥭",
      "drinks": [
        {
          "name": "芒果冰沙",
          "shops": ["冰鄉", "莉莉水果店", "裕成水果店"],
          "priceRange": { "min": 80, "max": 150 },
          "mustTry": true
        },
        {
          "name": "芒果牛奶",
          "shops": ["各水果店", "迷客夏"],
          "priceRange": { "min": 60, "max": 90 }
        }
      ],
      "tips": ["玉井愛文芒果最香甜", "6-7月為盛產期"]
    },
    {
      "id": "watermelon",
      "name": "西瓜季",
      "months": [6, 7, 8],
      "emoji": "🍉",
      "drinks": [
        {
          "name": "西瓜汁",
          "shops": ["各水果店"],
          "priceRange": { "min": 40, "max": 60 }
        },
        {
          "name": "西瓜牛奶",
          "shops": ["裕成水果店", "莉莉水果店"],
          "priceRange": { "min": 60, "max": 80 }
        }
      ],
      "tips": ["選購時敲擊聲清脆為佳"]
    },
    {
      "id": "pomelo",
      "name": "柚子季",
      "months": [9, 10],
      "emoji": "🍊",
      "drinks": [
        {
          "name": "柚子茶",
          "shops": ["茶の魔手", "50嵐"],
          "priceRange": { "min": 40, "max": 55 }
        },
        {
          "name": "柚香綠茶",
          "shops": ["各手搖飲店"],
          "priceRange": { "min": 35, "max": 50 }
        }
      ],
      "tips": ["麻豆文旦最有名", "中秋節前後最甜"]
    }
  ]
}
```

### 12.2 飲品配餐推薦系統

```javascript
// drinkPairing.js
const DRINK_PAIRINGS = {
  // 依食物類型推薦解膩飲品
  "牛肉湯": {
    recommended: ["青草茶", "冬瓜茶", "無糖綠茶"],
    reason: "牛肉湯味濃郁，需要清爽解膩",
    avoid: ["奶茶", "甜飲"],
    timing: "飯後 10 分鐘"
  },
  "鹹粥": {
    recommended: ["紅茶", "古早味紅茶", "決明子茶"],
    reason: "鹹粥配紅茶是台南傳統搭配",
    avoid: ["果汁"],
    timing: "邊吃邊喝"
  },
  "鱔魚意麵": {
    recommended: ["酸梅湯", "楊桃湯", "烏梅汁"],
    reason: "酸甜飲品解油膩",
    avoid: ["牛奶類"],
    timing: "飯後"
  },
  "蝦仁飯": {
    recommended: ["味噌湯", "無糖茶"],
    reason: "清淡搭配不搶味",
    avoid: ["重口味飲品"],
    timing: "配餐"
  },
  "甜食": {
    recommended: ["無糖茶", "黑咖啡", "青草茶"],
    reason: "避免糖分過量",
    avoid: ["含糖飲料"],
    timing: "飯後"
  },
  "炸物": {
    recommended: ["檸檬汁", "青草茶", "冬瓜茶"],
    reason: "解油膩去火氣",
    avoid: ["碳酸飲料"],
    timing: "飯後"
  },
  "碗粿": {
    recommended: ["冬瓜茶", "青草茶"],
    reason: "清涼解膩",
    avoid: [],
    timing: "飯後"
  }
};

function getDrinkRecommendation(food) {
  const pairing = DRINK_PAIRINGS[food];
  if (!pairing) {
    return {
      recommended: ["無糖茶", "水"],
      reason: "通用選擇",
      timing: "隨時"
    };
  }
  return pairing;
}

// 根據用戶今日已吃的食物推薦
function getSmartDrinkSuggestion(eatenFoods) {
  const oilyFoods = eatenFoods.filter(f =>
    ["炸物", "鱔魚意麵", "牛肉湯"].includes(f)
  );

  if (oilyFoods.length >= 2) {
    return {
      urgent: true,
      suggestion: "今天吃了不少油膩食物，強烈建議來杯青草茶或冬瓜茶！",
      shops: ["下大道青草茶", "義豐冬瓜茶"]
    };
  }

  return null;
}
```

### 12.3 冰品最佳時機指南

```json
// iceTiming.json
{
  "shops": [
    {
      "name": "冰鄉",
      "soldOutWarning": {
        "weekday": "14:00",
        "weekend": "12:00",
        "summer": "更早售完"
      },
      "queuePeak": {
        "time": "13:00-15:00",
        "waitTime": "30-60分鐘"
      },
      "bestTime": {
        "arrive": "11:00 前",
        "reason": "開店後 1 小時內最不用排"
      },
      "tips": ["假日建議 10:30 到", "外帶比內用快"]
    },
    {
      "name": "泰成水果店",
      "soldOutWarning": {
        "哈密瓜冰": "15:00 前常售完",
        "芒果冰": "夏季下午常缺"
      },
      "queuePeak": {
        "time": "14:00-17:00",
        "waitTime": "20-40分鐘"
      },
      "bestTime": {
        "arrive": "13:00 前",
        "reason": "品項最齊全"
      }
    },
    {
      "name": "莉莉水果店",
      "specialNote": "季節限定芒果冰 6-9 月",
      "queuePeak": {
        "time": "下午時段",
        "waitTime": "15-30分鐘"
      },
      "bestTime": {
        "arrive": "早上或傍晚",
        "reason": "避開午後人潮"
      }
    }
  ],
  "summerAlert": {
    "message": "⚠️ 夏季旺季提醒",
    "tips": [
      "熱門冰店建議提前 1-2 小時到",
      "假日人潮是平日 3 倍",
      "可先電話確認是否還有"
    ]
  }
}
```

### 12.4 台南限定飲品清單

```json
// tainanExclusiveDrinks.json
{
  "exclusive": [
    {
      "name": "茶の魔手",
      "type": "手搖飲連鎖",
      "whySpecial": "南部起家，北部店數極少",
      "mustTry": ["紅茶拿鐵", "冬瓜檸檬"],
      "priceRange": { "min": 25, "max": 55 },
      "locations": "台南市區多處",
      "tip": "銅板價大杯，CP值超高"
    },
    {
      "name": "雙全紅茶",
      "type": "老店",
      "whySpecial": "70年老店，古早味紅茶始祖",
      "mustTry": ["古早味紅茶"],
      "priceRange": { "min": 20, "max": 35 },
      "locations": "中正路 131巷 2號",
      "tip": "紅茶濃郁不澀，加糖加冰都好喝",
      "history": "1952年創立"
    },
    {
      "name": "重量杯",
      "type": "平價手搖",
      "whySpecial": "12元起的超銅板價",
      "mustTry": ["紅茶", "綠茶", "冬瓜茶"],
      "priceRange": { "min": 12, "max": 30 },
      "locations": "台南多處",
      "tip": "學生省錢首選"
    },
    {
      "name": "下大道青草茶",
      "type": "傳統青草茶",
      "whySpecial": "水仙宮市場內，在地人推薦",
      "mustTry": ["青草茶", "苦茶"],
      "priceRange": { "min": 25, "max": 40 },
      "locations": "中西區民族路三段",
      "tip": "吃完油膩食物必備解膩"
    }
  ]
}
```

### 12.5 特色體驗店家

```json
// specialExperience.json
{
  "catCafes": [
    {
      "name": "伴君耘",
      "feature": "虎掌送飲料",
      "description": "店貓會用小推車送茶給你！",
      "catCount": 3,
      "catNames": ["虎掌", "小花", "橘子"],
      "interaction": "high",
      "mustOrder": "招牌紅茶",
      "reservation": "假日建議預約",
      "note": "貓咪工作時間不固定，可能需等待"
    },
    {
      "name": "貓門咖啡",
      "feature": "貓咪主題裝潢",
      "description": "復古老屋改建，有店貓陪伴",
      "catCount": 2,
      "interaction": "medium",
      "mustOrder": "手沖咖啡"
    },
    {
      "name": "Dark Mode Café",
      "feature": "黑貓店長",
      "description": "神農街上的黑貓咖啡店",
      "catCount": 1,
      "catNames": ["黑糖"],
      "interaction": "low",
      "note": "貓咪怕生，遠觀不要強摸"
    }
  ],
  "creativeConcepts": [
    {
      "name": "藥師的私房紅茶",
      "feature": "掛號領茶",
      "description": "藥局改建，用處方簽點餐",
      "experience": "拿號碼牌掛號，叫號領茶",
      "mustOrder": "處方紅茶",
      "instagrammable": true,
      "tip": "適合拍照打卡"
    },
    {
      "name": "窄門咖啡",
      "feature": "38公分窄門",
      "description": "需側身才能進入的神秘咖啡店",
      "experience": "穿過超窄門，別有洞天",
      "mustOrder": "招牌咖啡",
      "tip": "體型較大者可能進不去"
    }
  ]
}
```

### 12.6 甜點預約系統整合

```json
// dessertReservation.json
{
  "reservationRequired": [
    {
      "name": "裏葉",
      "method": "現場排隊",
      "rules": {
        "openTime": "12:30",
        "suggestArrival": "12:00",
        "waitTime": "30-60分鐘",
        "dailyLimit": true
      },
      "tips": [
        "每日限量，售完為止",
        "平日比假日好排",
        "13:00 前通常還有"
      ]
    },
    {
      "name": "壹二茶堂",
      "method": "LINE@預約",
      "rules": {
        "reserveDays": 3,
        "lineId": "@122teatang",
        "cancelPolicy": "前一天可取消"
      },
      "tips": [
        "假日位置秒殺，建議提早",
        "可選時段但不保證座位"
      ]
    },
    {
      "name": "克林台包",
      "method": "電話預約",
      "rules": {
        "phone": "06-222-2257",
        "reserveDays": 3,
        "minOrder": "6入起"
      },
      "tips": [
        "八寶肉包最熱門",
        "冷凍可保存30天"
      ]
    },
    {
      "name": "金桃家草莓大福",
      "method": "現場排隊",
      "rules": {
        "season": "12月-3月",
        "dailyLimit": true,
        "soldOutTime": "下午前常售完"
      },
      "tips": [
        "草莓季限定",
        "每人限購數量",
        "建議中午前到"
      ]
    }
  ],
  "noReservation": [
    {
      "name": "依蕾特布丁",
      "note": "正興街本店排隊購買",
      "alternative": "全家便利商店有冷凍版"
    }
  ]
}
```

### 12.7 甜點攜帶指南

```json
// dessertCarryGuide.json
{
  "categories": [
    {
      "type": "常溫甜點",
      "canCarry": true,
      "hsr": "✅ 可帶上高鐵",
      "items": [
        {
          "name": "椪餅",
          "shelfLife": "14天",
          "storage": "密封常溫",
          "tip": "避免擠壓"
        },
        {
          "name": "煎餅/蛋捲",
          "shelfLife": "30天",
          "storage": "密封常溫",
          "tip": "包裝不要拆"
        },
        {
          "name": "舊振南綠豆椪",
          "shelfLife": "14天",
          "storage": "陰涼處",
          "tip": "官方禮盒有保鮮"
        },
        {
          "name": "安平蝦餅",
          "shelfLife": "90天",
          "storage": "密封常溫",
          "tip": "開封後盡快吃完"
        }
      ]
    },
    {
      "type": "冷藏甜點",
      "canCarry": "conditional",
      "hsr": "⚠️ 需保冷袋",
      "items": [
        {
          "name": "依蕾特布丁",
          "shelfLife": "7天",
          "storage": "冷藏",
          "carryTip": "需保冷袋+冰寶，車程2小時內OK",
          "buyTip": "最後一天買，直接帶回家"
        },
        {
          "name": "千層蛋糕",
          "shelfLife": "3天",
          "storage": "冷藏",
          "carryTip": "需保冷+避免傾斜",
          "buyTip": "建議現場吃"
        },
        {
          "name": "奶酪/布蕾",
          "shelfLife": "3-5天",
          "storage": "冷藏",
          "carryTip": "保冷袋可撐2-3小時"
        }
      ]
    },
    {
      "type": "冷凍甜點",
      "canCarry": "difficult",
      "hsr": "⚠️ 需保冷袋+保冷劑",
      "items": [
        {
          "name": "克林台包",
          "shelfLife": "30天",
          "storage": "冷凍",
          "carryTip": "需保冷袋+多個保冷劑",
          "buyTip": "宅配更方便"
        },
        {
          "name": "周氏蝦捲",
          "shelfLife": "60天",
          "storage": "冷凍",
          "carryTip": "店家有提供保冷服務",
          "buyTip": "可詢問宅配"
        }
      ]
    },
    {
      "type": "當日限定",
      "canCarry": false,
      "hsr": "❌ 建議當天吃",
      "items": [
        {
          "name": "草莓大福",
          "shelfLife": "當日",
          "reason": "草莓會出水",
          "buyTip": "現買現吃最好吃"
        },
        {
          "name": "現做泡芙",
          "shelfLife": "當日",
          "reason": "外皮會軟掉",
          "buyTip": "當點心立即享用"
        },
        {
          "name": "鮮奶油蛋糕",
          "shelfLife": "當日",
          "reason": "鮮奶油不耐放",
          "buyTip": "內用最佳"
        }
      ]
    }
  ],
  "packingTips": [
    "保冷袋在安平老街、林百貨可買到",
    "保冷劑可向店家索取或便利商店購買",
    "行程最後一天再買需冷藏的伴手禮",
    "高鐵車程約1.5小時，保冷袋可撐"
  ]
}
```

### 12.8 限量甜點追蹤器

```json
// limitedDesserts.json
{
  "dailyLimited": [
    {
      "name": "裏葉",
      "item": "各式甜點",
      "dailyQuantity": "每款約20份",
      "soldOutTime": "13:00-14:00",
      "difficulty": "高",
      "strategy": "12:00 排隊，開門後盡快點餐"
    },
    {
      "name": "亞米甜甜圈",
      "item": "甜甜圈",
      "dailyQuantity": "約100個",
      "soldOutTime": "11:00 前常售完",
      "difficulty": "極高",
      "strategy": "9:30 排隊，每人限購"
    },
    {
      "name": "深藍咖啡",
      "item": "千層蛋糕",
      "dailyQuantity": "每款約15片",
      "soldOutTime": "下午熱門口味售完",
      "difficulty": "中",
      "strategy": "下午 2 點前到，選擇較多"
    }
  ],
  "seasonalLimited": [
    {
      "name": "金桃家",
      "item": "草莓大福",
      "season": "12月-3月",
      "soldOutTime": "14:00 前",
      "tip": "草莓季才有，每日限量"
    },
    {
      "name": "冰鄉",
      "item": "芒果冰",
      "season": "5月-9月",
      "soldOutTime": "假日 12:00 前",
      "tip": "夏季限定，愛文芒果最甜"
    },
    {
      "name": "泰成水果店",
      "item": "哈密瓜瓜盅",
      "season": "全年但夏季最佳",
      "soldOutTime": "15:00 前常售完",
      "tip": "整顆哈密瓜裝冰，超浮誇"
    }
  ]
}
```

### 12.9 深夜甜點地圖

```json
// lateNightDesserts.json
{
  "shops": [
    {
      "name": "咚窩蕊",
      "closeTime": "02:00",
      "type": "鬆餅咖啡",
      "mustTry": ["厚鬆餅", "舒芙蕾"],
      "address": "中西區民生路一段",
      "note": "凌晨還能吃到現做鬆餅"
    },
    {
      "name": "裕成水果店",
      "closeTime": "04:00",
      "type": "水果冰品",
      "mustTry": ["木瓜牛奶", "綜合水果盤"],
      "address": "中西區民生路一段",
      "note": "凌晨也能吃到新鮮水果"
    },
    {
      "name": "䖙 Thenn Leh",
      "closeTime": "23:59",
      "type": "甜點咖啡",
      "mustTry": ["乳酪蛋糕"],
      "address": "中西區",
      "note": "接近午夜的甜點選擇"
    },
    {
      "name": "小西門深夜豆花",
      "closeTime": "01:00",
      "type": "傳統豆花",
      "mustTry": ["綜合豆花"],
      "address": "中西區",
      "note": "宵夜來碗甜豆花"
    },
    {
      "name": "台南永樂市場周邊",
      "closeTime": "各店不同",
      "type": "夜市甜點",
      "mustTry": ["紅豆湯", "仙草"],
      "note": "宵夜場甜湯攤"
    }
  ],
  "tips": [
    "深夜覓食建議搭配 Google Maps 確認營業",
    "凌晨店家營業時間可能浮動",
    "假日前夕通常開比較晚"
  ]
}
```

### 12.10 店貓/寵物甜點店地圖

```json
// petFriendlyDesserts.json
{
  "catShops": [
    {
      "name": "伴君耘",
      "cats": ["虎掌"],
      "feature": "貓咪送茶",
      "petPolicy": "店貓為主，不可帶寵物",
      "interaction": "高"
    },
    {
      "name": "Dark Mode Café",
      "cats": ["黑糖"],
      "feature": "黑貓店長",
      "petPolicy": "店貓為主",
      "interaction": "低（貓怕生）"
    },
    {
      "name": "貓門咖啡",
      "cats": ["多隻"],
      "feature": "貓咪主題",
      "petPolicy": "店貓為主",
      "interaction": "中"
    }
  ],
  "petFriendly": [
    {
      "name": "某咖啡店",
      "allowPets": true,
      "restrictions": "需牽繩/提籠",
      "outdoorSeating": true
    }
  ],
  "tips": [
    "店貓有自己的脾氣，請勿強迫互動",
    "拍照前請詢問店家",
    "過敏者請注意"
  ]
}
```

### 12.11 飲品口味配對測驗

```javascript
// drinkQuiz.js
const DRINK_QUIZ = {
  questions: [
    {
      id: 1,
      question: "你喜歡甜還是不甜？",
      options: [
        { value: "sweet", label: "我是螞蟻人，越甜越好" },
        { value: "medium", label: "微甜剛剛好" },
        { value: "none", label: "無糖主義者" }
      ]
    },
    {
      id: 2,
      question: "偏好茶香還是奶香？",
      options: [
        { value: "tea", label: "茶香派，喜歡茶葉的回甘" },
        { value: "milk", label: "奶香派，奶茶最對味" },
        { value: "fruit", label: "果香派，喜歡水果的清新" }
      ]
    },
    {
      id: 3,
      question: "喜歡傳統還是創新？",
      options: [
        { value: "traditional", label: "傳統經典，老味道最好" },
        { value: "modern", label: "創新口味，愛嘗鮮" },
        { value: "both", label: "都可以，看心情" }
      ]
    },
    {
      id: 4,
      question: "預算考量？",
      options: [
        { value: "budget", label: "銅板價最好（30元以下）" },
        { value: "medium", label: "普通價位（30-60元）" },
        { value: "premium", label: "品質優先，價格其次" }
      ]
    }
  ],

  results: {
    "sweet-tea-traditional-budget": {
      drink: "雙全紅茶",
      reason: "70年古早味，茶香濃郁，價格親民",
      shop: "雙全紅茶",
      price: "20-35元"
    },
    "none-tea-traditional-budget": {
      drink: "下大道青草茶",
      reason: "清涼退火，無糖健康，在地人推薦",
      shop: "下大道青草茶",
      price: "25-40元"
    },
    "sweet-milk-modern-medium": {
      drink: "茶の魔手紅茶拿鐵",
      reason: "南部限定，奶香濃郁，CP值高",
      shop: "茶の魔手",
      price: "35-50元"
    },
    "medium-fruit-modern-premium": {
      drink: "莉莉水果店芒果冰",
      reason: "新鮮水果，季節限定，值得一試",
      shop: "莉莉水果店",
      price: "80-150元"
    }
    // ... 更多組合
  }
};

function calculateDrinkResult(answers) {
  const key = Object.values(answers).join('-');
  return DRINK_QUIZ.results[key] || getDefaultRecommendation(answers);
}

function getDefaultRecommendation(answers) {
  // 根據主要偏好給出通用建議
  if (answers.sweetness === 'none') {
    return {
      drink: "無糖茶類",
      reason: "根據你的偏好，推薦清爽的無糖茶",
      suggestions: ["青草茶", "無糖綠茶", "黑咖啡"]
    };
  }
  // ...
}
```

### 12.12 甜點探險集章系統

```javascript
// dessertStamps.js
const STAMP_ACHIEVEMENTS = {
  categories: [
    {
      id: "pudding-hunter",
      name: "布丁獵人",
      description: "品嚐 5 家布丁店",
      icon: "🍮",
      required: 5,
      shops: ["依蕾特", "同記安平豆花布丁", "CHUN純薏仁", "銀波布丁", "東東芋圓布丁"]
    },
    {
      id: "mille-crepe-master",
      name: "千層達人",
      description: "嘗試 3 家千層蛋糕",
      icon: "🍰",
      required: 3,
      shops: ["深藍咖啡", "裏葉", "Café Flâneur 漫步咖啡"]
    },
    {
      id: "fruit-explorer",
      name: "水果探險家",
      description: "品嚐 5 家水果店",
      icon: "🍉",
      required: 5,
      shops: ["莉莉水果店", "裕成水果店", "泰成水果店", "冰鄉", "阿田水果店"]
    },
    {
      id: "night-owl",
      name: "夜貓子甜食家",
      description: "凌晨時段吃過 3 家深夜甜點",
      icon: "🦉",
      required: 3,
      timeCondition: "22:00-04:00"
    },
    {
      id: "cat-lover",
      name: "貓奴甜點控",
      description: "造訪 3 家店貓甜點店",
      icon: "🐱",
      required: 3,
      shops: ["伴君耘", "貓門咖啡", "Dark Mode Café"]
    },
    {
      id: "seasonal-chaser",
      name: "季節獵人",
      description: "吃到 3 種季節限定甜點",
      icon: "🍓",
      required: 3,
      items: ["草莓大福", "芒果冰", "哈密瓜瓜盅"]
    }
  ]
};

// LocalStorage 儲存打卡記錄
const STAMPS_KEY = 'tainan-dessert-stamps';

function getStamps() {
  const data = localStorage.getItem(STAMPS_KEY);
  return data ? JSON.parse(data) : { visited: [], achievements: [] };
}

function addStamp(shopId, timestamp) {
  const stamps = getStamps();
  if (!stamps.visited.find(v => v.shopId === shopId)) {
    stamps.visited.push({ shopId, timestamp, date: new Date().toLocaleDateString('zh-TW') });
    checkAchievements(stamps);
    localStorage.setItem(STAMPS_KEY, JSON.stringify(stamps));
  }
  return stamps;
}

function checkAchievements(stamps) {
  STAMP_ACHIEVEMENTS.categories.forEach(achievement => {
    const visited = stamps.visited.filter(v =>
      achievement.shops?.includes(v.shopId) ||
      achievement.items?.includes(v.shopId)
    );

    if (visited.length >= achievement.required &&
        !stamps.achievements.includes(achievement.id)) {
      stamps.achievements.push(achievement.id);
      showAchievementUnlock(achievement);
    }
  });
}

function showAchievementUnlock(achievement) {
  // 顯示成就解鎖動畫
  alert(`🎉 恭喜解鎖成就：${achievement.icon} ${achievement.name}！`);
}
```

---

## 十三、Phase 8 新增檔案結構

```
tainan-guide/
├── data/
│   ├── ... (原有檔案)
│   ├── seasonalDrinks.json      # 🆕 季節限定飲品
│   ├── drinkPairings.json       # 🆕 飲品配餐推薦
│   ├── iceTiming.json           # 🆕 冰品最佳時機
│   ├── tainanExclusiveDrinks.json # 🆕 台南限定飲品
│   ├── specialExperience.json   # 🆕 特色體驗店家
│   ├── dessertReservation.json  # 🆕 甜點預約系統
│   ├── dessertCarryGuide.json   # 🆕 甜點攜帶指南
│   ├── limitedDesserts.json     # 🆕 限量甜點追蹤
│   ├── lateNightDesserts.json   # 🆕 深夜甜點地圖
│   └── petFriendlyDesserts.json # 🆕 店貓/寵物店
├── js/
│   ├── ... (原有檔案)
│   ├── drinkPairing.js          # 🆕 飲品配餐邏輯
│   ├── drinkQuiz.js             # 🆕 口味配對測驗
│   └── dessertStamps.js         # 🆕 集章系統
└── pages/
    ├── ... (原有頁面)
    ├── seasonal-drinks.html     # 🆕 季節限定飲品頁
    ├── drink-quiz.html          # 🆕 飲品測驗頁
    ├── dessert-guide.html       # 🆕 甜點攻略頁
    └── stamps.html              # 🆕 集章頁面
```

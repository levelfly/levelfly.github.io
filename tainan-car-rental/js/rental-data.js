// 台南租車公司資料
const rentalCompanies = [
    {
        id: 1,
        name: "和運租車",
        englishName: "Easyrent",
        type: "chain",
        website: "https://www.easyrent.com.tw/",
        phone: "0800-024-550",
        locations: [
            { name: "台南高鐵站", address: "台南市歸仁區歸仁大道", hours: "08:00-20:00" },
            { name: "台南火車站", address: "台南市東區", hours: "08:00-20:00" }
        ],
        sevenSeaterModels: [
            { model: "Toyota SIENTA", price: 3700, priceType: "day" },
            { model: "Hyundai STAREX", price: 5000, priceType: "day" },
            { model: "Toyota 旅行家", price: 5000, priceType: "day" },
            { model: "Toyota GRANVIA 9人座", price: 7000, priceType: "day" },
            { model: "Toyota SIENNA", price: 9000, priceType: "day" },
            { model: "Toyota ALPHARD", price: 10000, priceType: "day" }
        ],
        mileageLimit: "依車款",
        mileageOvercharge: "依車款",
        rating: 4.3,
        reviewCount: 850,
        features: ["高鐵站接駁", "APP預約", "iRent自助租還", "全台據點"],
        insurance: ["強制險", "第三人責任險", "乘客險", "車損險"],
        pros: ["全台據點多", "車況新", "APP操作便利", "品牌信譽佳"],
        cons: ["價格較高", "熱門車款需提早預約"],
        bestFor: "重視品牌與服務品質的家庭出遊",
        twoDayEstimate: 7400
    },
    {
        id: 2,
        name: "格上租車",
        englishName: "Car-Plus",
        type: "chain",
        website: "https://www.car-plus.com.tw/",
        phone: "0800-222-568",
        locations: [
            { name: "台南北門站", address: "台南市北區北門路二段111號", phone: "06-223-5566", hours: "08:00-20:00" },
            { name: "台南高鐵站", address: "台南市歸仁區沙崙里9鄰歸仁大道100號", phone: "06-600-0006", hours: "07:30-21:00" }
        ],
        sevenSeaterModels: [
            { model: "Toyota SIENTA", price: 3500, priceType: "day" },
            { model: "Hyundai CUSTIN", price: 4500, priceType: "day" },
            { model: "九人座商旅車", price: 5500, priceType: "day" }
        ],
        mileageLimit: "300km/日",
        mileageOvercharge: "3-5元/km",
        rating: 4.2,
        reviewCount: 720,
        features: ["Go Smart APP", "高鐵站據點", "會員優惠", "多元車款"],
        insurance: ["強制險", "第三人責任險", "乘客險", "車體損失險"],
        pros: ["加入會員送租車金$390", "高鐵站營業時間長", "線上預約便利"],
        cons: ["假日需加價", "熱門時段車輛較搶手"],
        bestFor: "搭高鐵到台南的旅客",
        twoDayEstimate: 7000
    },
    {
        id: 3,
        name: "直航租車",
        englishName: "Any-Car",
        type: "chain",
        website: "https://www.any-car.com.tw/",
        phone: "0800-568-568",
        locations: [
            { name: "台南火車站", address: "台南市東區", hours: "08:00-20:00" },
            { name: "台南高鐵站", address: "台南市歸仁區中正南路二段13號", phone: "06-330-5757", hours: "週一~五 08:00-18:00, 週六日 08:00-20:00" }
        ],
        sevenSeaterModels: [
            { model: "七人座商旅車", price: 3150, priceType: "day" },
            { model: "Hyundai CUSTIN GLT-B", price: 6500, priceType: "day" }
        ],
        mileageLimit: "400km/日",
        mileageOvercharge: "汽油車3元/km，柴油車5元/km",
        rating: 4.5,
        reviewCount: 560,
        features: ["高鐵站免費接駁", "客運站免費接駁", "免押證件", "24小時道路救援"],
        insurance: ["強制險", "第三人責任險", "乘客險", "竊盜險", "車損險"],
        pros: ["價格透明", "免押證件免保證金", "接駁服務完善", "評價優良"],
        cons: ["三日前預約才享優惠價", "2000cc以上車款臨時租需加300元/日"],
        bestFor: "追求性價比的旅客",
        twoDayEstimate: 6300
    },
    {
        id: 4,
        name: "iRent 自助租車",
        englishName: "iRent",
        type: "self-service",
        website: "https://www.irentcar.com.tw/",
        phone: "0800-024-550",
        locations: [
            { name: "台南市區多點", address: "路邊租還點遍布台南市區", hours: "24小時" }
        ],
        sevenSeaterModels: [
            { model: "Toyota SIENTA 7人座", price: 2450, priceType: "10hr", note: "10小時方案可用24小時" }
        ],
        mileageLimit: "無限制",
        mileageOvercharge: "里程費另計（約3-4元/km）",
        rating: 4.0,
        reviewCount: 1200,
        features: ["24小時自助租還", "APP操作", "路邊租還", "以時計費"],
        insurance: ["強制險", "第三人責任險", "乘客險"],
        pros: ["24小時可租還", "彈性時間計費", "免接觸取還車", "同站租還方便"],
        cons: ["七人座車較難找到", "需加油卡加油", "里程費另計"],
        bestFor: "短程短時間用車或臨時租車需求",
        twoDayEstimate: 5500
    },
    {
        id: 5,
        name: "AVIS 艾維士租車",
        englishName: "AVIS",
        type: "international",
        website: "https://www.avis-taiwan.com/",
        phone: "02-2718-0123",
        locations: [
            { name: "台南高鐵站", address: "台南市歸仁區", hours: "08:00-20:00" }
        ],
        sevenSeaterModels: [
            { model: "七人座休旅車", price: 4500, priceType: "day" }
        ],
        mileageLimit: "依方案",
        mileageOvercharge: "4元/km",
        rating: 4.4,
        reviewCount: 380,
        features: ["國際品牌", "Costco會員優惠", "保險完善", "高鐵接駁"],
        insurance: ["強制險", "第三人責任險", "乘客險", "駕駛險", "竊盜險", "車損險"],
        pros: ["國際品牌信譽", "Costco會員享4折", "保險最完善", "車況佳"],
        cons: ["價格較高", "需提前預約"],
        bestFor: "重視保險與品牌的旅客、Costco會員",
        twoDayEstimate: 9000
    },
    {
        id: 6,
        name: "中租租車",
        englishName: "Chailease",
        type: "chain",
        website: "https://www.rentalcar.com.tw/",
        phone: "0800-024-680",
        locations: [
            { name: "台南站", address: "台南市", hours: "08:30-20:30" }
        ],
        sevenSeaterModels: [
            { model: "Hyundai CUSTIN 1.5 七人座", price: 3500, priceType: "day" }
        ],
        mileageLimit: "連租2天以上享100km免費",
        mileageOvercharge: "依車款",
        rating: 4.1,
        reviewCount: 450,
        features: ["連租優惠", "二站互還免費", "全台據點", "線上預約"],
        insurance: ["強制險", "第三人責任險", "乘客險"],
        pros: ["連租2天享里程優惠", "異地還車免手續費", "車款選擇多"],
        cons: ["據點較少", "熱門時段需提早預約"],
        bestFor: "多日租車或需要甲租乙還的旅客",
        twoDayEstimate: 7000
    },
    {
        id: 7,
        name: "小馬租車",
        englishName: "Pony Rent-a-Car",
        type: "local-chain",
        website: "https://www.ponyrent.com.tw/",
        phone: "06-236-5788",
        locations: [
            { name: "台南小馬", address: "台南市東區小東路382號", phone: "06-236-5788", hours: "08:00-20:00" },
            { name: "台南高鐵", address: "台南市歸仁區歸仁大道98號", phone: "06-303-2988", hours: "08:00-18:00" }
        ],
        sevenSeaterModels: [
            { model: "七人座休旅車", price: 3200, priceType: "day" }
        ],
        mileageLimit: "依車款",
        mileageOvercharge: "依車款",
        rating: 4.0,
        reviewCount: 320,
        features: ["38年經驗", "高鐵站步行可達", "多種車款", "機車也可租"],
        insurance: ["強制險", "第三人責任險", "乘客險"],
        pros: ["老字號信譽", "高鐵站方便", "服務態度佳"],
        cons: ["保險自付額較高", "需事先確認車況"],
        bestFor: "想在高鐵站附近快速取車的旅客",
        twoDayEstimate: 6400
    },
    {
        id: 8,
        name: "松興租車",
        englishName: "Tainan-Car",
        type: "local",
        website: "http://www.tainan-car.com.tw/",
        phone: "06-200-6302",
        locations: [
            { name: "前站店", address: "台南市東區前鋒路192號", phone: "06-200-6302", hours: "08:00-21:30" },
            { name: "後站店", address: "台南火車站後站出口", hours: "08:00-21:30" }
        ],
        sevenSeaterModels: [
            { model: "Toyota SIENTA 1.8", price: 2500, priceType: "day" }
        ],
        mileageLimit: "依車款",
        mileageOvercharge: "依車款",
        rating: 3.5,
        reviewCount: 280,
        features: ["火車站旁", "10年在地經驗", "價格實惠"],
        insurance: ["強制險", "第三人責任險"],
        pros: ["位置便利", "價格親民", "在地老店"],
        cons: ["評價較兩極", "車況需確認", "服務品質不穩定"],
        bestFor: "預算有限、搭火車抵達的旅客",
        twoDayEstimate: 5000
    },
    {
        id: 9,
        name: "固得租車",
        englishName: "GoodCars",
        type: "chain",
        website: "https://www.goodcars.tw/",
        phone: "線上預約",
        locations: [
            { name: "台南站", address: "台南市", hours: "依預約" }
        ],
        sevenSeaterModels: [
            { model: "七人座車款", price: 3000, priceType: "day" }
        ],
        mileageLimit: "依車款",
        mileageOvercharge: "依車款",
        rating: 4.0,
        reviewCount: 200,
        features: ["線上預約", "多城市服務", "外籍旅客友善"],
        insurance: ["基礎保險", "可加購安心保險"],
        pros: ["線上預約便利", "價格透明", "提供外籍服務"],
        cons: ["需綁定信用卡保證金$10,000", "據點較少"],
        bestFor: "習慣線上預約的旅客",
        twoDayEstimate: 6000
    },
    {
        id: 10,
        name: "LINE GO 租車",
        englishName: "LINE GO",
        type: "platform",
        website: "https://www.linego.me/",
        phone: "APP內客服",
        locations: [
            { name: "台南市區多點", address: "超過30個站點", hours: "24小時" }
        ],
        sevenSeaterModels: [
            { model: "七人座車款", price: 2800, priceType: "day", note: "時租$180起/hr" }
        ],
        mileageLimit: "里程費另計",
        mileageOvercharge: "依車款",
        rating: 4.2,
        reviewCount: 580,
        features: ["LINE APP整合", "聰明租還", "新會員禮包", "多品牌車款"],
        insurance: ["第三人責任險", "駕駛人傷害險", "乘客責任險", "車體損失險", "竊盜險"],
        pros: ["新會員送$1000禮包", "60分鐘免費", "LINE操作便利", "站點多"],
        cons: ["里程費另計", "熱門車款需碰運氣"],
        bestFor: "習慣用LINE的年輕旅客",
        twoDayEstimate: 5600
    }
];

// 車款資訊
const vehicleModels = [
    {
        name: "Toyota SIENTA",
        seats: 7,
        engine: "1.8L",
        features: ["雙側滑門", "低地板設計", "省油"],
        luggage: "2個登機箱（第三排收折可放更多）",
        pros: "滑門設計適合窄小停車位，上下車方便",
        cons: "滿載7人時行李空間受限",
        avgPrice: 3200,
        image: "sienta"
    },
    {
        name: "Toyota Wish",
        seats: 7,
        engine: "2.0L",
        features: ["空間寬敞", "傳統車門"],
        luggage: "3個登機箱",
        pros: "車內空間比SIENTA大，適合6人以上",
        cons: "已停產，車齡較高",
        avgPrice: 3000,
        image: "wish"
    },
    {
        name: "Hyundai CUSTIN",
        seats: 7,
        engine: "1.5L Turbo",
        features: ["電動滑門", "感應尾門", "新車款"],
        luggage: "2個28吋+2個24吋",
        pros: "配備新穎，空間大，舒適度高",
        cons: "價格較高",
        avgPrice: 4500,
        image: "custin"
    },
    {
        name: "Hyundai STAREX",
        seats: 9,
        engine: "2.5L 柴油",
        features: ["超大空間", "適合團體"],
        luggage: "多個大型行李箱",
        pros: "空間超大，適合多人多行李",
        cons: "車身較大不易操控",
        avgPrice: 5000,
        image: "starex"
    },
    {
        name: "Toyota GRANVIA",
        seats: 9,
        engine: "2.8L 柴油",
        features: ["豪華內裝", "大空間", "舒適乘坐"],
        luggage: "超大行李空間",
        pros: "舒適度極高，適合長途",
        cons: "價格較高，車身大",
        avgPrice: 7000,
        image: "granvia"
    }
];

// 常見問題
const faqData = [
    {
        question: "台南租7人座車需要準備什麼文件？",
        answer: "需準備有效駕照（持照滿1年以上）、身分證、信用卡（部分公司需要）。外籍旅客需準備護照、有效國際駕照（IDP）、原國駕照及簽證。"
    },
    {
        question: "12月13日是假日還是平日？價格會有差嗎？",
        answer: "12月13日是星期六，屬於假日。假日價格通常比平日高約$200-500元/天，建議提早預約以確保有車可租。"
    },
    {
        question: "7人座車可以放幾件行李？",
        answer: "以SIENTA為例，7人滿座時行李空間有限（約1-2個登機箱）。建議將第三排一側收折，可放3-4個大型行李箱。如果7人都帶大型行李，建議考慮9人座車款。"
    },
    {
        question: "台南高鐵站取車方便嗎？",
        answer: "大多數租車公司在高鐵站附近都有據點，且多提供免費接駁服務。直航租車、格上租車、和運租車等都有高鐵站門市，步行約5-10分鐘可達。"
    },
    {
        question: "租車需要加什麼保險？",
        answer: "基本保險（強制險、第三人責任險）通常已包含在租金中。建議加購車體損失險（CDW）和竊盜險，以降低意外時的自付額。部分公司如AVIS保險較完善。"
    },
    {
        question: "兩天一夜租車費用大概多少？",
        answer: "7人座車款兩天一夜約$5,000-9,000元，視車款和租車公司而定。SIENTA約$6,000-7,000元，CUSTIN約$7,000-9,000元。建議比較多家取得最優惠價格。"
    },
    {
        question: "里程費怎麼計算？",
        answer: "部分公司有里程限制（如每日300-400km），超過需另外收費（約$3-5/km）。iRent和LINE GO是里程費另計。建議選擇里程限制足夠或連租優惠的方案。"
    },
    {
        question: "可以甲地租乙地還嗎？",
        answer: "大多數連鎖租車公司都提供甲租乙還服務，但可能收取$500-1,500元手續費。中租租車提供二站互還免手續費優惠。"
    }
];

// 租車注意事項
const rentalTips = [
    {
        title: "提早預約",
        icon: "📅",
        content: "12月是旅遊旺季，7人座車款較搶手，建議至少提前一週預約。"
    },
    {
        title: "確認車況",
        icon: "🔍",
        content: "取車時務必仔細檢查車身外觀，有任何刮痕或凹陷都要拍照存證並告知租車公司。"
    },
    {
        title: "了解保險",
        icon: "🛡️",
        content: "確認租金是否包含保險，了解自付額金額，必要時加購車體損失險。"
    },
    {
        title: "注意里程",
        icon: "📏",
        content: "確認每日里程限制，台南市區至七股、關子嶺等郊區來回約80-100km，規劃好行程避免超額。"
    },
    {
        title: "油費計算",
        icon: "⛽",
        content: "了解油費計算方式：滿油取車滿油還、或依里程數計費。使用指定加油卡可能有優惠。"
    },
    {
        title: "還車時間",
        icon: "⏰",
        content: "注意還車時間，逾時通常以每小時1/10日租金計費，超過6小時算一天。"
    }
];

// 推薦行程
const suggestedItineraries = [
    {
        title: "台南經典兩天一夜",
        day1: ["台南高鐵站取車", "安平古堡", "安平老街午餐", "四草綠色隧道", "神農街", "海安路晚餐"],
        day2: ["奇美博物館", "十鼓仁糖文創園區", "台南高鐵站還車"],
        totalDistance: "約80km",
        suitable: "適合7人座"
    },
    {
        title: "台南自然生態之旅",
        day1: ["台南高鐵站取車", "七股鹽山", "七股潟湖遊船", "北門水晶教堂", "井仔腳瓦盤鹽田夕陽"],
        day2: ["關子嶺溫泉", "白河蓮花公園", "台南高鐵站還車"],
        totalDistance: "約150km",
        suitable: "需注意里程限制"
    }
];

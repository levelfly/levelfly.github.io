// 台南租車公司完整資料（基於2024-2025調查報告）
const companies = [
    // 連鎖租車公司
    {
        id: 1,
        name: '中租租車',
        englishName: 'Chailease',
        type: 'chain',
        website: 'https://www.rentalcar.com.tw/',
        phone: '0800-024-680',
        location: '高鐵站附近',
        vehicle: 'Hyundai Custin (7人)',
        dailyPrice: 2799,
        twoDayPrice: 5600,
        mileageLimit: '部分不限里程',
        rating: 4.7,
        features: ['連租3天6折', '不限里程方案', '新車款'],
        icon: 'fa-building',
        color: 'text-green-600',
        recommended: true,
        badge: 'CP值最高'
    },
    {
        id: 2,
        name: '格上租車',
        englishName: 'Car Plus',
        type: 'chain',
        website: 'https://www.car-plus.com.tw/',
        phone: '06-600-0006',
        location: '高鐵站內櫃檯',
        vehicle: 'LUXGEN M7 (8人)',
        dailyPrice: 3120,
        twoDayPrice: 6240,
        mileageLimit: '400km/日',
        mileageOvercharge: 'NT$2/km',
        rating: 4.6,
        features: ['高鐵站內取車', '營業至21:30', '新戶送$390'],
        icon: 'fa-train',
        color: 'text-blue-600',
        recommended: true,
        badge: '高鐵最方便'
    },
    {
        id: 3,
        name: '小馬租車',
        englishName: 'Pony Rent',
        type: 'chain',
        website: 'https://www.ponyrent.com.tw/',
        phone: '06-236-5788',
        location: '火車站/高鐵站',
        vehicle: 'Toyota SIENTA (7人)',
        dailyPrice: 3120,
        twoDayPrice: 6240,
        mileageLimit: '300km/日',
        mileageOvercharge: 'NT$5/km',
        rating: 4.9,
        features: ['車款最多', '38年經驗', '服務專業'],
        icon: 'fa-horse',
        color: 'text-purple-600',
        recommended: false,
        badge: '評價最高'
    },
    {
        id: 4,
        name: 'IWS愛旺租車',
        englishName: 'IWS',
        type: 'chain',
        website: 'https://www.iws.com.tw/',
        phone: '0800-288-568',
        location: '高鐵站(免費接送)',
        vehicle: 'MPV經濟7人座',
        dailyPrice: 3000,
        twoDayPrice: 6000,
        mileageLimit: '依方案',
        mileageOvercharge: 'NT$5/km',
        rating: 4.8,
        features: ['高鐵免費接送', '車輛新穎', '全台可甲租乙還'],
        icon: 'fa-shuttle-van',
        color: 'text-orange-500',
        recommended: false,
        badge: ''
    },
    {
        id: 5,
        name: 'AVIS安維斯',
        englishName: 'AVIS',
        type: 'chain',
        website: 'https://www.avis-taiwan.com/',
        phone: '0800-600-601',
        location: '府城站/高鐵站',
        vehicle: 'VW Sharan (7人)',
        dailyPrice: 4000,
        twoDayPrice: 8000,
        mileageLimit: '400km/日',
        mileageOvercharge: 'NT$2/km',
        rating: 4.5,
        features: ['進口豪華車', '保險完善', '國際品牌'],
        icon: 'fa-gem',
        color: 'text-red-600',
        recommended: false,
        badge: ''
    },
    {
        id: 6,
        name: '和運租車',
        englishName: 'Easyrent',
        type: 'chain',
        website: 'https://www.easyrent.com.tw/',
        phone: '0800-024-550',
        location: '火車站/高鐵站',
        vehicle: 'Toyota SIENTA (7人)',
        dailyPrice: 2500,
        twoDayPrice: 5000,
        mileageLimit: '依方案',
        mileageOvercharge: 'NT$3.1/km',
        rating: 4.4,
        features: ['iRent彈性租', '甲租乙還免費', '信用卡優惠'],
        icon: 'fa-car',
        color: 'text-teal-600',
        recommended: false,
        badge: ''
    },
    // 本地租車行
    {
        id: 7,
        name: '直航租車',
        englishName: 'Anycar',
        type: 'local',
        website: 'https://www.any-car.com.tw/',
        phone: '線上預約',
        location: '火車站/高鐵站',
        vehicle: '7人座休旅車',
        dailyPrice: 1370,
        twoDayPrice: 2740,
        mileageLimit: '依方案',
        mileageOvercharge: 'NT$5/km',
        rating: 4.5,
        features: ['本地最便宜', '雙據點', '保險完整'],
        icon: 'fa-plane',
        color: 'text-sky-500',
        recommended: true,
        badge: '最便宜'
    },
    {
        id: 8,
        name: '松興租車',
        englishName: 'Tainan Car',
        type: 'local',
        website: 'http://www.tainan-car.com.tw/',
        phone: '線上預約',
        location: '火車站旁步行可達',
        vehicle: '7人座休旅車',
        dailyPrice: 1600,
        twoDayPrice: 3200,
        mileageLimit: '依方案',
        mileageOvercharge: 'NT$3/km',
        rating: 4.9,
        features: ['火車站最近', '免費行車記錄器', '評價極高'],
        icon: 'fa-store',
        color: 'text-amber-600',
        recommended: false,
        badge: ''
    },
    {
        id: 9,
        name: '裕昌租車',
        englishName: 'Yuchange',
        type: 'local',
        website: 'https://tn-yc-carrental.com.tw/',
        phone: '電洽詢價',
        location: '監理站旁(可代駕接送)',
        vehicle: '7-9人座休旅車',
        dailyPrice: 0,
        twoDayPrice: 0,
        mileageLimit: '需確認',
        rating: 4.3,
        features: ['30年老店', '代駕接送', '企業長租'],
        icon: 'fa-building',
        color: 'text-gray-600',
        recommended: false,
        badge: '',
        priceNote: '需電洽詢價'
    },
    // 線上平台
    {
        id: 10,
        name: 'gogoout',
        englishName: 'gogoout',
        type: 'platform',
        website: 'https://gogoout.com/suggestion/tainan-car-rental',
        phone: '線上客服',
        location: '整合9家車行',
        vehicle: '多種7人座可選',
        dailyPrice: 2800,
        twoDayPrice: 5600,
        mileageLimit: '依車行',
        rating: 4.5,
        features: ['一站比價', '最高40%折扣', '6天前免費取消'],
        icon: 'fa-search',
        color: 'text-indigo-600',
        recommended: false,
        badge: '比價平台'
    },
    {
        id: 11,
        name: 'Klook',
        englishName: 'Klook',
        type: 'platform',
        website: 'https://www.klook.com/zh-TW/car-rentals/',
        phone: 'App客服',
        location: '多家連鎖+本地',
        vehicle: '多種7人座可選',
        dailyPrice: 2500,
        twoDayPrice: 5000,
        mileageLimit: '依車行',
        rating: 4.6,
        features: ['App方便', '酷幣回饋', '部分免費取消'],
        icon: 'fa-mobile-alt',
        color: 'text-orange-500',
        recommended: false,
        badge: ''
    },
    {
        id: 12,
        name: 'KKday',
        englishName: 'KKday',
        type: 'platform',
        website: 'https://www.kkday.com/',
        phone: 'App客服',
        location: '直航租車等',
        vehicle: '多種7人座可選',
        dailyPrice: 2800,
        twoDayPrice: 5600,
        mileageLimit: '依車行',
        rating: 4.5,
        features: ['整合行程', '優惠碼多', '方便預訂'],
        icon: 'fa-globe',
        color: 'text-red-500',
        recommended: false,
        badge: ''
    }
];

// 車款資訊
const vehicles = [
    {
        name: 'Toyota SIENTA',
        seats: 7,
        engine: '1.8L',
        bags: '2大1小',
        price: '2,500',
        tag: '經濟實惠',
        desc: '市區靈活好鑽，滑門設計適合窄停車位。適合行李不多的家庭。',
        pros: '省油、好操控、滑門設計',
        cons: '7人滿座時行李空間受限'
    },
    {
        name: 'Hyundai Custin',
        seats: 7,
        engine: '1.5L Turbo',
        bags: '3大2小',
        price: '3,500',
        tag: '科技舒適',
        desc: '第二排獨立座椅，電動滑門，長輩乘坐最舒適。',
        pros: '配備新穎、空間大、舒適度高',
        cons: '價格較高'
    },
    {
        name: 'Hyundai Staria',
        seats: 9,
        engine: '2.2L 柴油',
        bags: '4大3小',
        price: '4,200',
        tag: '未來科技',
        desc: '外型前衛，空間超大，適合多人多行李出遊。',
        pros: '造型獨特、空間大、柴油省油',
        cons: '車身較大、價格較高'
    },
    {
        name: 'Hyundai Starex',
        seats: 9,
        engine: '2.5L 柴油',
        bags: '5大4小',
        price: '5,200',
        tag: '超大空間',
        desc: '經典廂型車，行李空間最大，適合團體旅遊。',
        pros: '空間最大、載物量驚人',
        cons: '車身大不易操控'
    },
    {
        name: 'Toyota Granvia',
        seats: 9,
        engine: '2.8L 柴油',
        bags: '5大3小',
        price: '5,500',
        tag: '豪華商務',
        desc: '極致寬敞空間，適合長途與多行李。乘坐舒適度極高。',
        pros: '舒適度極高、適合長途',
        cons: '價格最高'
    },
    {
        name: 'Toyota Alphard',
        seats: 7,
        engine: '2.5L Hybrid',
        bags: '3大2小',
        price: '8,000',
        tag: '頂級豪華',
        desc: '頂級商務MPV，VIP級乘坐體驗，適合重要場合。',
        pros: '豪華內裝、VIP級享受',
        cons: '價格非常高'
    }
];

// 常見問題
const faqs = [
    {
        q: '請問需要準備什麼證件？',
        a: '本國國民需攜帶<strong>身分證</strong>及<strong>有效駕照</strong>（持照滿1年以上）；外籍旅客需備妥護照、國際駕照（IDP）及原國籍駕照。部分車款需年滿26歲。'
    },
    {
        q: '租金是否包含保險？',
        a: '大部分連鎖車行租金已含<strong>強制險</strong>，但建議加購「<strong>安心免責</strong>」方案（約$30-100/時或$600/日），發生擦撞時可免除自負額與營業損失。松興租車需另購第三責任險。'
    },
    {
        q: '高鐵站取車方便嗎？',
        a: '非常方便！<strong>格上租車</strong>櫃檯就在高鐵站內，下車即可取車；<strong>IWS愛旺</strong>提供免費接送（約5分鐘車程）；直航、中租也有高鐵站附近據點。'
    },
    {
        q: '可以甲地租乙地還嗎？',
        a: '可以！<strong>和運租車</strong>預約時申請可免費；格上租車租3天以上免費；中租、小馬等需收$300-1,500手續費。建議提前確認。'
    },
    {
        q: '12月13日是假日嗎？價格會貴多少？',
        a: '12月13日是<strong>週六（假日）</strong>，價格通常比平日高約$200-500元/天。7人座車款較搶手，建議提前3-7天預約。'
    },
    {
        q: '7人座車可以放幾件行李？',
        a: '以SIENTA為例，7人滿座時約放1-2個登機箱。建議收折第三排一側，可放3-4個大行李箱。若7人都帶大行李，建議選9人座車款。'
    },
    {
        q: '里程費怎麼計算？',
        a: '部分公司有里程限制（每日300-400km），超過需另收$2-5/km。<strong>中租部分方案不限里程</strong>。iRent、LINE GO是里程費另計（約$3-4/km）。台南兩天一夜約跑80-150km。'
    },
    {
        q: '還車超時怎麼計算？',
        a: '逾時1-6小時：通常以<strong>每小時日租金的1/10</strong>計費；逾時超過6小時：以<strong>一日租金</strong>計算。建議預留緩衝時間。'
    }
];

// 保險比較表
const insuranceComparison = [
    { company: '格上租車', compulsory: true, thirdParty: true, driver: true, deductible: '依認定', addon: '安心免責' },
    { company: '中租租車', compulsory: true, thirdParty: true, driver: '需確認', deductible: '需確認', addon: '需確認' },
    { company: '小馬租車', compulsory: true, thirdParty: 'NT$200萬', driver: true, deductible: '需確認', addon: 'NT$600/日' },
    { company: 'IWS愛旺', compulsory: true, thirdParty: true, driver: true, deductible: '需確認', addon: '有' },
    { company: 'AVIS', compulsory: true, thirdParty: true, driver: true, deductible: '最高NT$50,000', addon: '有' },
    { company: '和運租車', compulsory: true, thirdParty: 'NT$200萬', driver: true, deductible: '最高NT$10,000', addon: 'NT$30/時' },
    { company: '直航租車', compulsory: true, thirdParty: true, driver: true, deductible: '需確認', addon: '需確認' },
    { company: '松興租車', compulsory: true, thirdParty: '需另購', driver: '需另購', deductible: '需確認', addon: '需確認' }
];

// 優惠碼資訊
const coupons = [
    { platform: '格上租車', code: '新戶註冊', discount: '送NT$390', note: '日租$250+共享車$140', expiry: '2025/12/31' },
    { platform: '中租租車', code: '連租3-5天', discount: '6折優惠', note: '不分平假日', expiry: '持續進行' },
    { platform: 'Klook', code: 'APP10TW', discount: 'App首購9折', note: '新用戶限定', expiry: '持續進行' },
    { platform: 'Klook', code: 'Q9WHF', discount: '滿1000折100', note: '新用戶限定', expiry: '持續進行' },
    { platform: 'KKday', code: '2025ITF94', discount: '全站94折', note: '持續進行', expiry: '持續進行' },
    { platform: 'KKday', code: 'KKWSA', discount: '全站96折', note: '最高折$120', expiry: '持續進行' }
];

// 信用卡優惠
const creditCardDeals = [
    { bank: '中國信託', weekday: '75折', weekend: '85折', company: '和運租車' },
    { bank: '玉山銀行', weekday: '75折', weekend: '85折', company: '和運租車' },
    { bank: '台新銀行', weekday: '75折', weekend: '85折', company: '和運租車' },
    { bank: '富邦銀行', weekday: '75折', weekend: '85折', company: '和運租車' },
    { bank: '聯邦銀行', weekday: '75折', weekend: '85折', company: '和運租車' },
    { bank: '和泰聯名卡(壽星)', weekday: '50折', weekend: '70折', company: '和運租車' }
];

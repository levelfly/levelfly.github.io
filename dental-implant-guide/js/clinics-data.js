// 大台北地區植牙診所資料
// 資料來源：各診所官網、Google Maps、PTT、Dcard、MyDentist 等
// 更新日期：2025年12月

const clinicsData = [
    // === 台北市 ===
    {
        id: 1,
        name: "悅庭牙醫診所",
        district: "士林區",
        city: "taipei",
        address: "台北市士林區中山北路五段472號",
        phone: "0800-888-153",
        website: "https://yttsd.com/",
        rating: 5.0,
        reviewCount: 47,
        priceRange: "9萬以下/顆",
        features: ["sedation", "tech", "allon4"],
        implantBrands: ["Astra Tech"],
        doctors: [
            { name: "蔡醫師", specialty: "導引式植牙" }
        ],
        highlights: [
            "數位牙科領航者，斥資上億元引進設備",
            "擁有20位以上專業牙醫師",
            "TCI舒眠無痛麻醉",
            "AR擴增實境植牙系統",
            "植體3-10年保固"
        ],
        pros: [
            "設備先進，數位化程度高",
            "環境舒適明亮",
            "醫師團隊專業親切",
            "服務流程完善"
        ],
        cons: [
            "熱門時段需提前預約",
            "價格偏中上"
        ],
        tags: ["數位植牙", "舒眠植牙", "All-on-4"],
        source: "官網、Dent&Co、PTT"
    },
    {
        id: 2,
        name: "雅偲牙醫診所",
        district: "中正區",
        city: "taipei",
        address: "台北市中正區館前路2號6樓",
        phone: "02-2370-3777",
        website: "https://www.arsdentclinic.com/",
        rating: 4.8,
        reviewCount: 120,
        priceRange: "7-13.5萬/顆",
        features: ["tech", "allon4"],
        implantBrands: ["Nobel Biocare", "Straumann"],
        doctors: [
            { name: "鄭聖達", specialty: "牙周病暨植牙專科，台大醫師背景" }
        ],
        highlights: [
            "台大植牙/牙周專科權威",
            "水雷射微創植牙",
            "數位植牙導引板技術",
            "All-on-4 全口重建專家"
        ],
        pros: [
            "醫師技術精湛，動作俐落",
            "台大醫師團隊背景",
            "植牙復原快速",
            "護士衛教細心"
        ],
        cons: [
            "知名醫師較難預約",
            "價格較高"
        ],
        tags: ["台大團隊", "水雷射", "All-on-4"],
        source: "官網、良醫健康網"
    },
    {
        id: 3,
        name: "晨光牙醫診所",
        district: "中正區",
        city: "taipei",
        address: "台北市中正區忠孝西路一段50號",
        phone: "02-2381-8866",
        website: "https://www.denthsu.com/",
        rating: 4.7,
        reviewCount: 85,
        priceRange: "依評估報價",
        features: ["tech", "premium"],
        implantBrands: ["Straumann", "Nobel Biocare"],
        doctors: [
            { name: "徐振祥", specialty: "困難植牙、高階補骨權威" }
        ],
        highlights: [
            "專攻高難度植牙領域",
            "高階補骨技術權威",
            "北醫牙科校友會會長",
            "專科醫師團隊協作"
        ],
        pros: [
            "困難案例經驗豐富",
            "補骨技術頂尖",
            "醫師專業度高"
        ],
        cons: [
            "需預約評估",
            "困難案例價格較高"
        ],
        tags: ["困難植牙", "補骨權威"],
        source: "官網"
    },
    {
        id: 4,
        name: "勤美悠植牙醫診所",
        district: "中山區",
        city: "taipei",
        address: "台北市中山區民生東路三段27號",
        phone: "02-2516-2220",
        website: "https://ddc-implant.com/",
        rating: 4.6,
        reviewCount: 68,
        priceRange: "依評估報價",
        features: ["allon4", "sedation"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "多位主治醫師", specialty: "全口重建、高齡植牙" }
        ],
        highlights: [
            "數位化科技輔助治療",
            "高齡安全植牙專家",
            "慢性病安全植牙",
            "客製化醫療服務"
        ],
        pros: [
            "高齡患者照護經驗豐富",
            "慢性病患者友善",
            "服務客製化"
        ],
        cons: [
            "需詳細評估時間較長"
        ],
        tags: ["高齡植牙", "全口重建"],
        source: "官網"
    },
    {
        id: 5,
        name: "禾玥牙醫診所",
        district: "中山區",
        city: "taipei",
        address: "台北市中山區松江路46巷6號1樓",
        phone: "02-2581-8880",
        website: "https://artemisdental.com.tw/",
        rating: 4.9,
        reviewCount: 55,
        priceRange: "依評估報價",
        features: ["allon4", "tech"],
        implantBrands: ["Straumann BLX"],
        doctors: [
            { name: "郭光哲", specialty: "All-on-X、Navident導航植牙" },
            { name: "陳皓", specialty: "植牙專科" }
        ],
        highlights: [
            "瑞士Straumann原廠認證診所",
            "Navident 4D動態導航植牙",
            "All-on-X 一日全口重建",
            "舒眠植牙服務"
        ],
        pros: [
            "導航植牙技術先進",
            "診療環境舒適",
            "醫師耐心專業"
        ],
        cons: [
            "需提前預約"
        ],
        tags: ["導航植牙", "Straumann認證", "All-on-4"],
        source: "官網、Dent&Co"
    },
    {
        id: 6,
        name: "生活家牙醫診所",
        district: "大安區",
        city: "taipei",
        address: "台北市大安區忠孝東路四段212號6樓",
        phone: "02-2776-6338",
        website: "https://lifedr.tw/",
        rating: 4.7,
        reviewCount: 90,
        priceRange: "依評估報價",
        features: ["comfort"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "多位專科醫師", specialty: "植牙、矯正、美白" }
        ],
        highlights: [
            "豐富植牙經驗",
            "深受大台北居民信賴",
            "全方位牙科服務",
            "3D齒雕服務"
        ],
        pros: [
            "地點便利（東區）",
            "服務項目多元",
            "口碑良好"
        ],
        cons: [
            "熱門時段需等待"
        ],
        tags: ["東區", "全方位"],
        source: "官網"
    },
    {
        id: 7,
        name: "敦南麗緻牙醫診所",
        district: "大安區",
        city: "taipei",
        address: "台北市大安區敦化南路一段",
        phone: "02-2771-0098",
        website: "https://www.ritzdental.com/",
        rating: 4.8,
        reviewCount: 45,
        priceRange: "依評估報價",
        features: ["sedation", "premium", "comfort"],
        implantBrands: ["頂級品牌"],
        doctors: [
            { name: "專業團隊", specialty: "全口植牙、舒眠治療" }
        ],
        highlights: [
            "舒眠植牙專業",
            "麻醉專科醫師合作",
            "高端診療環境",
            "精密儀器監控手術安全"
        ],
        pros: [
            "環境高端舒適",
            "舒眠技術成熟",
            "安全監控完善"
        ],
        cons: [
            "價格偏高端"
        ],
        tags: ["舒眠植牙", "高端環境"],
        source: "官網"
    },
    {
        id: 8,
        name: "雅術牙醫診所",
        district: "信義區",
        city: "taipei",
        address: "台北市信義區忠孝東路五段",
        phone: "02-2765-8866",
        website: "https://www.artechdent.com/",
        rating: 4.6,
        reviewCount: 72,
        priceRange: "依評估報價",
        features: ["tech"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "沈育群", specialty: "3D數位植牙、水雷射微創" }
        ],
        highlights: [
            "水雷射微創植牙",
            "高齡植牙、糖尿病患者微創植牙",
            "牙周病微創治療",
            "鄰近永春捷運站"
        ],
        pros: [
            "水雷射技術成熟",
            "適合高齡及慢性病患者",
            "交通便利"
        ],
        cons: [
            "需評估是否適合微創"
        ],
        tags: ["水雷射", "微創植牙", "高齡友善"],
        source: "官網"
    },
    {
        id: 9,
        name: "新禾牙醫診所",
        district: "中正區",
        city: "taipei",
        address: "台北市中正區忠孝東路一段",
        phone: "02-2321-0666",
        website: "https://www.teethspa.tw/",
        rating: 4.5,
        reviewCount: 58,
        priceRange: "依評估報價",
        features: ["tech", "sedation"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "微創植牙" }
        ],
        highlights: [
            "微創植牙5-10分鐘完成",
            "3D電腦掃描輔助",
            "舒眠無痛治療",
            "傷口小、癒合快"
        ],
        pros: [
            "微創手術時間短",
            "恢復期短",
            "疼痛感低"
        ],
        cons: [
            "需符合微創條件"
        ],
        tags: ["微創植牙", "快速植牙"],
        source: "官網"
    },
    {
        id: 10,
        name: "立威口腔顎面外科牙醫診所",
        district: "大同區",
        city: "taipei",
        address: "台北市大同區（近圓山站）",
        phone: "02-2599-1600",
        website: "https://leaderway.tw/",
        rating: 4.7,
        reviewCount: 63,
        priceRange: "依評估報價",
        features: ["tech", "sedation"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "口腔顎面外科專科醫師", specialty: "微創植牙、困難拔牙" }
        ],
        highlights: [
            "口腔顎面外科專科",
            "TCI鎮靜舒眠",
            "3D斷層+水雷射設備",
            "微創手術縮小傷口"
        ],
        pros: [
            "外科專業度高",
            "舒眠設備完善",
            "手術精準"
        ],
        cons: [
            "需提前預約評估"
        ],
        tags: ["口腔外科", "舒眠植牙", "微創"],
        source: "官網"
    },
    {
        id: 11,
        name: "似真牙醫診所",
        district: "內湖區",
        city: "taipei",
        address: "台北市內湖區（西湖捷運站附近）",
        phone: "02-2659-2859",
        website: "https://www.verax.com.tw/",
        rating: 4.5,
        reviewCount: 42,
        priceRange: "依評估報價",
        features: ["tech"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "水雷射微創植牙" }
        ],
        highlights: [
            "位於內湖科學園區",
            "水雷射微創植牙",
            "鄰近西湖捷運站"
        ],
        pros: [
            "交通便利",
            "服務內湖科技業族群"
        ],
        cons: [
            "資訊較少"
        ],
        tags: ["內湖", "水雷射"],
        source: "官網"
    },
    {
        id: 12,
        name: "翡冷翠牙醫診所",
        district: "大安區",
        city: "taipei",
        address: "台北市大安區",
        phone: "02-2707-1777",
        website: "https://www.nrdentaltw.com/",
        rating: 4.7,
        reviewCount: 38,
        priceRange: "依評估報價",
        features: ["allon4", "sedation"],
        implantBrands: ["Nobel Biocare"],
        doctors: [
            { name: "多位專攻全口重建醫師", specialty: "All-on-4/6困難全口重建" }
        ],
        highlights: [
            "All-on-4/6一日全口重建",
            "使用Nobel諾保科植體",
            "舒眠植牙服務",
            "證照核可麻醉醫師"
        ],
        pros: [
            "全口重建經驗豐富",
            "舒眠技術專業",
            "麻醉監控完善"
        ],
        cons: [
            "需預約評估"
        ],
        tags: ["All-on-4", "舒眠植牙", "Nobel認證"],
        source: "官網"
    },
    {
        id: 13,
        name: "戴志翰牙醫",
        district: "中正區",
        city: "taipei",
        address: "台北市中正區",
        phone: "預約制",
        website: "https://www.dr-tai.com.tw/",
        rating: 4.9,
        reviewCount: 35,
        priceRange: "依評估報價",
        features: ["premium", "tech"],
        implantBrands: ["Nobel Biocare"],
        doctors: [
            { name: "戴志翰", specialty: "植牙專科，多學會認證" }
        ],
        highlights: [
            "中華民國口腔植體學會專科醫師",
            "台灣牙醫植體醫學會專科醫師",
            "美國紐約大學牙周病暨植牙專科",
            "曾與植牙教父Dennis Tarnow發表國際論文"
        ],
        pros: [
            "國際級學術背景",
            "專科認證齊全",
            "植牙經驗豐富"
        ],
        cons: [
            "需提前預約",
            "價格偏高端"
        ],
        tags: ["專科認證", "國際經歷"],
        source: "官網、良醫健康網"
    },
    {
        id: 14,
        name: "台北榮民總醫院口腔醫學部",
        district: "北投區",
        city: "taipei",
        address: "台北市北投區石牌路二段201號",
        phone: "02-2875-7572",
        website: "https://wd.vghtpe.gov.tw/dent/",
        rating: 4.3,
        reviewCount: 200,
        priceRange: "依健保/自費",
        features: ["hospital"],
        implantBrands: ["依科別選用"],
        doctors: [
            { name: "林怡君", specialty: "牙周診治、植牙、美國華盛頓大學進修" }
        ],
        highlights: [
            "醫學中心等級",
            "斥資2億打造新門診",
            "105張牙科診療椅",
            "電腦虛擬植牙+手術導板"
        ],
        pros: [
            "醫學中心資源豐富",
            "設備最新",
            "複雜案例可跨科會診"
        ],
        cons: [
            "候診時間較長",
            "流程較制式化"
        ],
        tags: ["醫學中心", "教學醫院"],
        source: "官網"
    },

    // === 新北市 ===
    {
        id: 15,
        name: "歐仕美牙醫診所",
        district: "永和區",
        city: "newtaipei",
        address: "新北市永和區中山路一段7號2樓",
        phone: "02-2929-7676",
        website: "https://allsmile-dental.com/",
        rating: 4.9,
        reviewCount: 382,
        priceRange: "依評估報價",
        features: ["allon4", "sedation", "value"],
        implantBrands: ["Nobel Biocare", "Straumann"],
        doctors: [
            { name: "康智為", specialty: "All-on-4/6全口重建，哈佛、俄亥俄州立大學進修" }
        ],
        highlights: [
            "植牙權威康智為院長領軍",
            "超過20年執業經驗",
            "Nobel & Straumann植體講師認證",
            "一般植牙完成超過千人",
            "近捷運頂溪站"
        ],
        pros: [
            "醫師經驗豐富",
            "國際認證背景",
            "價格合理",
            "可做舒眠麻醉"
        ],
        cons: [
            "熱門時段需提前預約"
        ],
        tags: ["永和", "All-on-4", "植體講師"],
        source: "官網、Dcard"
    },
    {
        id: 16,
        name: "蒔美牙醫集團（三重院區）",
        district: "三重區",
        city: "newtaipei",
        address: "新北市三重區五華街196號",
        phone: "02-2857-0008",
        website: "https://www.smile-dental.tw/sanchongsmile",
        rating: 4.8,
        reviewCount: 95,
        priceRange: "依評估報價",
        features: ["allon4", "tech", "sedation"],
        implantBrands: ["Straumann"],
        doctors: [
            { name: "多位專科醫師", specialty: "植牙專科、矯正專科" }
        ],
        highlights: [
            "植牙全口重建中心超過十年經驗",
            "瑞士Straumann頂級植體",
            "X-Guide 3D藍光導航",
            "醫學中心等級無菌手術室",
            "高壓氧加速術後恢復"
        ],
        pros: [
            "設備先進",
            "品牌植體有保障",
            "多家分院可選擇"
        ],
        cons: [
            "需預約評估"
        ],
        tags: ["三重", "Straumann", "導航植牙"],
        source: "官網"
    },
    {
        id: 17,
        name: "蒔美牙醫集團（北大院區）",
        district: "三峽區",
        city: "newtaipei",
        address: "新北市三峽區學成路256號",
        phone: "02-2672-8766",
        website: "https://www.smile-dental.tw/beidasmile",
        rating: 4.8,
        reviewCount: 88,
        priceRange: "依評估報價",
        features: ["allon4", "tech", "sedation"],
        implantBrands: ["Straumann"],
        doctors: [
            { name: "朱安捷", specialty: "植牙專科院長" },
            { name: "紀皓雲", specialty: "植牙專科副院長" }
        ],
        highlights: [
            "深耕北大特區十多年",
            "與患者建立長期信賴關係",
            "完整全口重建服務"
        ],
        pros: [
            "在地口碑良好",
            "醫師團隊穩定",
            "服務北大、三峽、鶯歌、樹林地區"
        ],
        cons: [
            "地點偏遠需自行前往"
        ],
        tags: ["北大", "三峽", "Straumann"],
        source: "官網"
    },
    {
        id: 18,
        name: "寶石牙醫診所",
        district: "三重區",
        city: "newtaipei",
        address: "新北市三重區",
        phone: "02-2988-5666",
        website: "https://www.diamond-dental.com.tw/",
        rating: 4.7,
        reviewCount: 65,
        priceRange: "依評估報價",
        features: ["tech"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業醫師團隊", specialty: "植牙、一般牙科" }
        ],
        highlights: [
            "超過百例成功植牙經驗",
            "先進植牙設備",
            "無菌高氧植牙技術"
        ],
        pros: [
            "經驗豐富",
            "設備先進"
        ],
        cons: [
            "需預約"
        ],
        tags: ["三重", "高氧植牙"],
        source: "官網"
    },
    {
        id: 19,
        name: "博誠美學牙醫診所",
        district: "永和區",
        city: "newtaipei",
        address: "新北市永和區中正路417號",
        phone: "02-8660-8555",
        website: "https://www.bcdc.tw/",
        rating: 4.8,
        reviewCount: 78,
        priceRange: "依評估報價",
        features: ["premium"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "何家銘", specialty: "德國法蘭克福歌德大學植牙碩士" }
        ],
        highlights: [
            "院長擁有德國植牙碩士學位",
            "齒顎矯正專科",
            "美容牙科服務"
        ],
        pros: [
            "學術背景優秀",
            "服務項目多元"
        ],
        cons: [
            "需預約"
        ],
        tags: ["永和", "德國學歷"],
        source: "官網"
    },
    {
        id: 20,
        name: "世樺牙醫診所",
        district: "永和區",
        city: "newtaipei",
        address: "新北市永和區永和路一段154號",
        phone: "02-2925-8899",
        website: "",
        rating: 4.9,
        reviewCount: 1756,
        priceRange: "依評估報價",
        features: ["value"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "一般牙科、植牙" }
        ],
        highlights: [
            "Google評價極高",
            "超過1700則評論",
            "在地口碑優良"
        ],
        pros: [
            "評價數量多且高分",
            "在地信任度高"
        ],
        cons: [
            "可能較為繁忙"
        ],
        tags: ["永和", "高評價"],
        source: "Google Maps"
    },
    {
        id: 21,
        name: "雲天牙醫診所",
        district: "汐止區",
        city: "newtaipei",
        address: "新北市汐止區",
        phone: "02-2641-8888",
        website: "https://www.ytdentalcare.com/",
        rating: 4.7,
        reviewCount: 52,
        priceRange: "All-on-4 約38萬起",
        features: ["allon4", "value", "tech"],
        implantBrands: ["歐美大廠"],
        doctors: [
            { name: "專業團隊", specialty: "All-on-4、微創植牙" }
        ],
        highlights: [
            "All-on-4收費約38萬起",
            "4D微創導航植牙",
            "Navident導航技術",
            "汐止、大安皆有診所"
        ],
        pros: [
            "All-on-4價格較親民",
            "導航技術先進",
            "多點據點方便"
        ],
        cons: [
            "需評估是否適合"
        ],
        tags: ["汐止", "All-on-4", "高性價比"],
        source: "官網"
    },
    {
        id: 22,
        name: "偉仁牙醫診所",
        district: "板橋區",
        city: "newtaipei",
        address: "新北市板橋區三民路二段203之5號",
        phone: "02-2963-1234",
        website: "",
        rating: 4.7,
        reviewCount: 134,
        priceRange: "依評估報價",
        features: [],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "一般牙科、植牙" }
        ],
        highlights: [
            "板橋區口碑診所",
            "評價良好"
        ],
        pros: [
            "在地評價佳"
        ],
        cons: [
            "資訊較少"
        ],
        tags: ["板橋"],
        source: "Google Maps"
    },
    {
        id: 23,
        name: "瑞星牙醫診所",
        district: "中和區",
        city: "newtaipei",
        address: "新北市中和區安邦街130號",
        phone: "02-2245-0088",
        website: "",
        rating: 4.8,
        reviewCount: 234,
        priceRange: "依評估報價",
        features: [],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "一般牙科、植牙" }
        ],
        highlights: [
            "中和區高評價診所",
            "超過230則評論"
        ],
        pros: [
            "評價高",
            "評論數多"
        ],
        cons: [
            "詳細植牙資訊需洽詢"
        ],
        tags: ["中和", "高評價"],
        source: "Google Maps"
    },
    {
        id: 24,
        name: "維風牙醫診所",
        district: "新店區",
        city: "newtaipei",
        address: "新北市新店區北新路一段291號2樓",
        phone: "02-2911-8899",
        website: "",
        rating: 4.7,
        reviewCount: 42,
        priceRange: "依評估報價",
        features: [],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "一般牙科、植牙" }
        ],
        highlights: [
            "新店區評價良好診所"
        ],
        pros: [
            "評價佳"
        ],
        cons: [
            "資訊較少"
        ],
        tags: ["新店"],
        source: "Google Maps"
    },
    {
        id: 25,
        name: "永漾美學牙醫診所",
        district: "永和區",
        city: "newtaipei",
        address: "新北市永和區",
        phone: "02-2922-0201",
        website: "",
        rating: 4.6,
        reviewCount: 48,
        priceRange: "依評估報價",
        features: ["comfort"],
        implantBrands: ["多品牌選擇"],
        doctors: [
            { name: "專業團隊", specialty: "美學牙科、植牙" }
        ],
        highlights: [
            "提供全方位診療照料",
            "美學牙科服務"
        ],
        pros: [
            "美學服務"
        ],
        cons: [
            "詳細資訊需洽詢"
        ],
        tags: ["永和", "美學牙科"],
        source: "網路資料"
    }
];

// 導出資料
if (typeof module !== 'undefined' && module.exports) {
    module.exports = clinicsData;
}

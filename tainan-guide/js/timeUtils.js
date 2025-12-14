/**
 * 台南旅遊指南 - 時間工具模組
 * 營業狀態計算、售完倒數、日落時間查詢
 */

const TimeUtils = (() => {
  // 星期對應（0=日, 1=一, ..., 6=六）
  const DAY_MAP = {
    '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6
  };

  const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

  // 台南日落時間表（每月中旬的約略日落時間）
  const SUNSET_TIMES = {
    1: '17:25',   // 一月
    2: '17:50',   // 二月
    3: '18:10',   // 三月
    4: '18:25',   // 四月
    5: '18:40',   // 五月
    6: '18:50',   // 六月
    7: '18:50',   // 七月
    8: '18:30',   // 八月
    9: '18:00',   // 九月
    10: '17:30', // 十月
    11: '17:10', // 十一月
    12: '17:10'  // 十二月
  };

  /**
   * 解析時間字串為分鐘數（從午夜起算）
   * @param {string} timeStr - 時間字串，如 "09:00" 或 "17:30"
   * @returns {number} 分鐘數
   */
  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    // 處理跨夜（如 01:00 表示凌晨，但若營業時間是 18:00-01:00，則 01:00 應視為 25:00）
    return hours * 60 + minutes;
  }

  /**
   * 格式化分鐘數為時間字串
   * @param {number} minutes - 分鐘數
   * @returns {string} 時間字串
   */
  function formatMinutesToTime(minutes) {
    if (minutes === null) return '--:--';
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 解析營業時間字串
   * @param {string} hoursStr - 營業時間字串，如 "09:00-17:00" 或 "18:00-00:00"
   * @returns {Object|null} { open: number, close: number } 或 null
   */
  function parseBusinessHours(hoursStr) {
    if (!hoursStr) return null;

    // 嘗試匹配 "HH:MM-HH:MM" 格式
    const match = hoursStr.match(/(\d{1,2}:\d{2})\s*[-~至到]\s*(\d{1,2}:\d{2})/);
    if (!match) return null;

    let open = parseTimeToMinutes(match[1]);
    let close = parseTimeToMinutes(match[2]);

    if (open === null || close === null) return null;

    // 處理跨夜營業（如 18:00-01:00）
    if (close <= open) {
      close += 24 * 60; // 加上 24 小時
    }

    return { open, close };
  }

  /**
   * 取得當前時間的分鐘數
   * @param {Date} [date] - 可選的日期物件
   * @returns {number} 分鐘數
   */
  function getCurrentMinutes(date = new Date()) {
    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * 檢查今天是否為休息日
   * @param {string[]} closedDays - 休息日陣列，如 ["一", "二"]
   * @param {Date} [date] - 可選的日期物件
   * @returns {boolean}
   */
  function isClosedDay(closedDays, date = new Date()) {
    if (!closedDays || !Array.isArray(closedDays) || closedDays.length === 0) {
      return false;
    }
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    return closedDays.includes(dayName);
  }

  /**
   * 檢查今天是否為營業日（針對夜市等特定營業日）
   * @param {string[]} openDays - 營業日陣列，如 ["四", "六", "日"]
   * @param {Date} [date] - 可選的日期物件
   * @returns {boolean}
   */
  function isOpenDay(openDays, date = new Date()) {
    if (!openDays || !Array.isArray(openDays) || openDays.length === 0) {
      return true; // 沒有指定營業日則預設每天營業
    }
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    return openDays.includes(dayName);
  }

  /**
   * 計算營業狀態
   * @param {Object} shop - 店家資料
   * @param {Date} [date] - 可選的日期物件
   * @returns {Object} 營業狀態物件
   */
  function getBusinessStatus(shop, date = new Date()) {
    const result = {
      isOpen: false,
      status: 'closed',       // 'open', 'closing-soon', 'closed', 'day-off'
      statusText: '休息中',
      statusClass: 'status-closed',
      nextEvent: null,        // 'opens' 或 'closes'
      nextEventTime: null,    // 下次開門/打烊時間
      minutesUntil: null      // 距離下次事件的分鐘數
    };

    // 檢查是否為休息日
    if (isClosedDay(shop.closedDays, date)) {
      result.status = 'day-off';
      result.statusText = '今日公休';
      result.statusClass = 'status-day-off';
      return result;
    }

    // 檢查是否為營業日（夜市等）
    if (!isOpenDay(shop.openDays, date)) {
      result.status = 'day-off';
      result.statusText = '今日未營業';
      result.statusClass = 'status-day-off';
      // 計算下次營業日
      const nextOpenDay = getNextOpenDay(shop.openDays, date);
      if (nextOpenDay) {
        result.statusText = `${nextOpenDay}營業`;
      }
      return result;
    }

    // 解析營業時間
    const hours = parseBusinessHours(shop.hours);
    if (!hours) {
      // 全天開放或無法解析
      if (shop.hours && shop.hours.includes('全天')) {
        result.isOpen = true;
        result.status = 'open';
        result.statusText = '全天開放';
        result.statusClass = 'status-open';
      } else {
        result.statusText = '營業時間不明';
        result.statusClass = 'status-unknown';
      }
      return result;
    }

    const currentMinutes = getCurrentMinutes(date);
    // 處理跨夜判斷
    let adjustedCurrent = currentMinutes;
    if (hours.close > 24 * 60 && currentMinutes < hours.open - 12 * 60) {
      // 凌晨時段，視為前一天的延續
      adjustedCurrent = currentMinutes + 24 * 60;
    }

    if (adjustedCurrent >= hours.open && adjustedCurrent < hours.close) {
      // 營業中
      result.isOpen = true;
      result.status = 'open';
      result.nextEvent = 'closes';
      result.nextEventTime = formatMinutesToTime(hours.close);
      result.minutesUntil = hours.close - adjustedCurrent;

      // 即將打烊（30 分鐘內）
      if (result.minutesUntil <= 30) {
        result.status = 'closing-soon';
        result.statusText = `即將打烊（${result.minutesUntil}分鐘）`;
        result.statusClass = 'status-closing-soon';
      } else if (result.minutesUntil <= 60) {
        result.statusText = `營業中（${result.minutesUntil}分後打烊）`;
        result.statusClass = 'status-open';
      } else {
        result.statusText = '營業中';
        result.statusClass = 'status-open';
      }
    } else {
      // 休息中
      result.isOpen = false;
      result.status = 'closed';
      result.nextEvent = 'opens';

      if (adjustedCurrent < hours.open) {
        result.minutesUntil = hours.open - adjustedCurrent;
        result.nextEventTime = formatMinutesToTime(hours.open);
      } else {
        // 今天已過營業時間，計算明天開門
        result.minutesUntil = (24 * 60 - adjustedCurrent) + hours.open;
        result.nextEventTime = formatMinutesToTime(hours.open);
      }

      if (result.minutesUntil <= 30) {
        result.statusText = `即將開門（${result.minutesUntil}分鐘）`;
        result.statusClass = 'status-opening-soon';
      } else if (result.minutesUntil <= 60) {
        result.statusText = `${result.minutesUntil}分後開門`;
        result.statusClass = 'status-closed';
      } else {
        const hoursUntil = Math.floor(result.minutesUntil / 60);
        if (hoursUntil < 12) {
          result.statusText = `約${hoursUntil}小時後開門`;
        } else {
          result.statusText = '休息中';
        }
        result.statusClass = 'status-closed';
      }
    }

    return result;
  }

  /**
   * 計算下次營業日
   * @param {string[]} openDays - 營業日陣列
   * @param {Date} [date] - 可選的日期物件
   * @returns {string|null} 下次營業日名稱
   */
  function getNextOpenDay(openDays, date = new Date()) {
    if (!openDays || openDays.length === 0) return null;

    const currentDay = date.getDay();
    const openDayNumbers = openDays.map(d => DAY_MAP[d]).sort((a, b) => a - b);

    // 找下一個營業日
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (openDayNumbers.includes(checkDay)) {
        if (i === 1) return '明天';
        if (i === 2) return '後天';
        return `週${DAY_NAMES[checkDay]}`;
      }
    }
    return null;
  }

  /**
   * 計算售完倒數
   * @param {string} soldOutTime - 售完時間，如 "14:00"
   * @param {Date} [date] - 可選的日期物件
   * @returns {Object} 售完狀態物件
   */
  function getSoldOutCountdown(soldOutTime, date = new Date()) {
    const result = {
      isSoldOut: false,
      countdown: null,
      countdownText: '',
      urgencyLevel: 'normal'  // 'normal', 'warning', 'critical'
    };

    if (!soldOutTime) return result;

    const soldOutMinutes = parseTimeToMinutes(soldOutTime);
    if (soldOutMinutes === null) return result;

    const currentMinutes = getCurrentMinutes(date);
    const minutesUntil = soldOutMinutes - currentMinutes;

    if (minutesUntil <= 0) {
      result.isSoldOut = true;
      result.countdownText = '可能已售完';
      result.urgencyLevel = 'critical';
    } else if (minutesUntil <= 30) {
      result.countdown = minutesUntil;
      result.countdownText = `約${minutesUntil}分鐘後可能售完`;
      result.urgencyLevel = 'critical';
    } else if (minutesUntil <= 60) {
      result.countdown = minutesUntil;
      result.countdownText = `約${minutesUntil}分鐘後可能售完`;
      result.urgencyLevel = 'warning';
    } else {
      const hoursUntil = Math.floor(minutesUntil / 60);
      result.countdown = minutesUntil;
      result.countdownText = `約${hoursUntil}小時後可能售完`;
      result.urgencyLevel = 'normal';
    }

    return result;
  }

  /**
   * 取得今日日落時間
   * @param {Date} [date] - 可選的日期物件
   * @returns {Object} 日落資訊
   */
  function getSunsetInfo(date = new Date()) {
    const month = date.getMonth() + 1;
    const sunsetTime = SUNSET_TIMES[month];
    const sunsetMinutes = parseTimeToMinutes(sunsetTime);
    const currentMinutes = getCurrentMinutes(date);
    const minutesUntil = sunsetMinutes - currentMinutes;

    const result = {
      time: sunsetTime,
      isPast: minutesUntil < 0,
      minutesUntil: Math.max(0, minutesUntil),
      text: ''
    };

    if (result.isPast) {
      result.text = '今日已日落';
    } else if (minutesUntil <= 30) {
      result.text = `即將日落（${minutesUntil}分鐘）`;
    } else if (minutesUntil <= 60) {
      result.text = `約${minutesUntil}分鐘後日落`;
    } else {
      const hours = Math.floor(minutesUntil / 60);
      const mins = minutesUntil % 60;
      result.text = `約${hours}小時${mins > 0 ? mins + '分' : ''}後日落`;
    }

    return result;
  }

  /**
   * 建議最佳前往時間
   * @param {Object} shop - 店家資料
   * @returns {string} 建議文字
   */
  function getBestTimeAdvice(shop) {
    if (shop.bestTime) {
      return shop.bestTime;
    }

    // 根據特性推斷
    if (shop.tags && shop.tags.includes('sunset-spot')) {
      const sunset = getSunsetInfo();
      return `建議日落前1小時（今日約${sunset.time}日落）`;
    }

    if (shop.tags && shop.tags.includes('sold-out-warning') && shop.soldOutTime) {
      return `建議${shop.soldOutTime}前到達`;
    }

    if (shop.queueStatus === 'long') {
      return '建議平日或非尖峰時段前往';
    }

    return '';
  }

  /**
   * 批量計算店家營業狀態
   * @param {Array} shops - 店家陣列
   * @param {Date} [date] - 可選的日期物件
   * @returns {Map} 以 shop.id 為 key 的狀態 Map
   */
  function batchGetBusinessStatus(shops, date = new Date()) {
    const statusMap = new Map();
    shops.forEach(shop => {
      statusMap.set(shop.id, getBusinessStatus(shop, date));
    });
    return statusMap;
  }

  // 公開 API
  return {
    parseTimeToMinutes,
    formatMinutesToTime,
    parseBusinessHours,
    getCurrentMinutes,
    isClosedDay,
    isOpenDay,
    getBusinessStatus,
    getNextOpenDay,
    getSoldOutCountdown,
    getSunsetInfo,
    getBestTimeAdvice,
    batchGetBusinessStatus,
    DAY_NAMES,
    DAY_MAP
  };
})();

// 如果是 ES Module 環境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimeUtils;
}

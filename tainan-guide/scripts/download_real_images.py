#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台南旅遊指南 - 店家真實照片下載腳本
使用 Bing Image Search 下載各店家的真實照片
"""

import os
import requests
import time
import re
from urllib.parse import quote
from bs4 import BeautifulSoup

# 設定
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
IMAGES_DIR = os.path.join(BASE_DIR, 'images')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

def create_directories():
    """建立圖片目錄"""
    categories = ['restaurants', 'snacks', 'nightmarkets', 'drinks', 'hotels', 'attractions']
    for cat in categories:
        path = os.path.join(IMAGES_DIR, cat)
        os.makedirs(path, exist_ok=True)
        print(f"目錄已建立: {path}")

def search_bing_images(query, count=5):
    """使用 Bing 搜尋圖片並返回 URL 列表"""
    search_url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2&first=1"

    try:
        response = requests.get(search_url, headers=HEADERS, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # 尋找圖片連結
        image_urls = []

        # 方法1: 從 murl 屬性中提取
        for a_tag in soup.find_all('a', class_='iusc'):
            m = a_tag.get('m')
            if m:
                # 提取 murl
                match = re.search(r'"murl":"([^"]+)"', m)
                if match:
                    url = match.group(1)
                    if url.startswith('http') and any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                        image_urls.append(url)
                        if len(image_urls) >= count:
                            break

        return image_urls
    except Exception as e:
        print(f"  搜尋失敗: {e}")
        return []

def download_image(url, save_path):
    """下載圖片到指定路徑"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()

        # 確保是圖片
        content_type = response.headers.get('content-type', '')
        if 'image' not in content_type and not url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            return False

        with open(save_path, 'wb') as f:
            f.write(response.content)

        # 檢查檔案大小 (至少 5KB)
        if os.path.getsize(save_path) < 5000:
            os.remove(save_path)
            return False

        return True
    except Exception as e:
        print(f"  下載失敗 {url}: {e}")
        return False

def search_and_download(search_term, save_path, category_name):
    """搜尋並下載店家圖片"""
    print(f"搜尋: {search_term}")

    # 如果檔案已存在且大小足夠，跳過
    if os.path.exists(save_path) and os.path.getsize(save_path) > 10000:
        print(f"  已存在，跳過")
        return True

    # 搜尋圖片
    queries = [
        f"{search_term} 台南",
        f"{search_term} 店面",
        f"{search_term}",
    ]

    for query in queries:
        image_urls = search_bing_images(query, count=5)

        for url in image_urls:
            if download_image(url, save_path):
                print(f"  成功下載: {os.path.basename(save_path)}")
                return True

        time.sleep(1)  # 避免請求太頻繁

    print(f"  無法找到圖片")
    return False

# =============================================
# 店家資料定義
# =============================================

RESTAURANTS = {
    'atang-1.jpg': '阿堂鹹粥',
    '6000beef-1.jpg': '六千牛肉湯',
    'wenzhang-1.jpg': '文章牛肉湯',
    'amei-1.jpg': '阿美飯店 台南',
    'duxiaoyue-1.jpg': '度小月擔仔麵',
    'zhuxinju-1.jpg': '筑馨居',
    'chun-1.jpg': 'CHUN純薏仁 台南',
    'chiuxiaojuan-1.jpg': '邱家小卷米粉',
    'aizai-1.jpg': '矮仔成蝦仁飯',
    'fuji-1.jpg': '福記肉圓 台南',
}

SNACKS = {
    'fusheng-1.jpg': '富盛號碗粿',
    'asong-1.jpg': '阿松割包',
    'jindechun-1.jpg': '金得春捲',
    'yejia-1.jpg': '葉家小卷米粉',
    'yongle-sharou-1.jpg': '永樂燒肉飯',
    'along-1.jpg': '阿龍香腸熟肉',
    'shihjingju-1.jpg': '石精臼蚵仔煎',
    'aming-1.jpg': '阿明豬心冬粉',
    'wuming-douhua-1.jpg': '台南無名豆花 民族路',
    'ajiang-1.jpg': '阿江炒鱔魚',
    'chunxian-1.jpg': '醇涎坊鍋燒意麵',
    'lili-1.jpg': '莉莉水果店 台南',
    'xiadado-1.jpg': '下大道米糕',
    'luocheng-1.jpg': '落成米糕',
    'huangshi-1.jpg': '黃氏蝦仁肉圓',
    'ahe-1.jpg': '阿和肉燥飯 安平',
    'zhoushi-1.jpg': '安平周氏蝦捲',
    'tongji-1.jpg': '同記安平豆花',
    'ahan-1.jpg': '阿憨鹹粥',
    'jipin-1.jpg': '集品蝦仁飯',
}

NIGHTMARKETS = {
    'huayuan-1.jpg': '台南花園夜市',
    'huayuan-2.jpg': '花園夜市 攤位',
    'dadong-1.jpg': '大東夜市 台南',
    'wusheng-1.jpg': '武聖夜市',
    'xiaobei-1.jpg': '小北成功夜市',
    'yongda-1.jpg': '永大夜市 永康',
}

DRINKS = {
    'shuangquan-1.jpg': '雙全紅茶 台南',
    'yifeng-1.jpg': '義豐冬瓜茶',
    'atian-1.jpg': '阿田水果店 台南',
    'qingcao-1.jpg': '水仙宮市場 青草茶',
    'taiyang-1.jpg': '太陽牌冰品',
    'taicheng-1.jpg': '泰成水果店 哈密瓜冰',
    'yucheng-1.jpg': '裕成水果店 芒果冰',
    'juanweijia-1.jpg': '蜷尾家甘味處',
    'narrowdoor-1.jpg': '窄門咖啡 台南',
    'gandan-1.jpg': '甘單咖啡 台南',
    'shunfeng-1.jpg': '順風號 台南咖啡',
    'jiuzhennan-1.jpg': '舊振南餅店',
    'elate-1.jpg': '依蕾特布丁',
    'xiaoxijiao-1.jpg': '小西腳青草茶',
    'cream-1.jpg': '克林姆之屋 泡芙',
}

HOTELS = {
    'hotel-cozzi-1.jpg': '和逸飯店台南西門館',
    'hotel-cozzi-2.jpg': '和逸飯店 卡通頻道 台南',
    'silks-1.jpg': '台南晶英酒店',
    'chateau-1.jpg': '夏都城旅安平館',
    'justsleep-1.jpg': '捷絲旅台南十鼓館',
    'theplace-1.jpg': '台南老爺行旅',
    'uai-1.jpg': '友愛街旅館 台南',
    'banyan147-1.jpg': '神榕147 民宿',
    'xiehouse-1.jpg': '謝宅 台南民宿',
    'lakeshore-1.jpg': '煙波大飯店台南館',
    'tayih-1.jpg': '台南大億麗緻酒店',
    'caoji-1.jpg': '艸祭民宿',
    'toong-mao-1.jpg': '關子嶺統茂溫泉會館',
    'king-1.jpg': '景大溫泉莊園',
    'shangri-la-1.jpg': '香格里拉台南遠東國際大飯店',
    'uij-1.jpg': 'U.I.J Hotel 友愛街',
}

def main():
    """主程式"""
    print("=" * 50)
    print("台南旅遊指南 - 店家真實照片下載")
    print("=" * 50)

    create_directories()

    all_items = [
        ('restaurants', RESTAURANTS),
        ('snacks', SNACKS),
        ('nightmarkets', NIGHTMARKETS),
        ('drinks', DRINKS),
        ('hotels', HOTELS),
    ]

    total = sum(len(items) for _, items in all_items)
    downloaded = 0
    failed = 0

    for category, items in all_items:
        print(f"\n{'='*50}")
        print(f"分類: {category}")
        print(f"{'='*50}")

        category_dir = os.path.join(IMAGES_DIR, category)

        for filename, search_term in items.items():
            save_path = os.path.join(category_dir, filename)

            if search_and_download(search_term, save_path, category):
                downloaded += 1
            else:
                failed += 1

            time.sleep(2)  # 避免請求太頻繁

    print(f"\n{'='*50}")
    print(f"下載完成!")
    print(f"成功: {downloaded}/{total}")
    print(f"失敗: {failed}/{total}")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()

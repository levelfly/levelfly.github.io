#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
從部落格網站下載台南店家圖片
使用實際找到的圖片 URL
"""

import os
import requests
import concurrent.futures
from urllib.parse import urljoin

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
IMAGES_DIR = os.path.join(BASE_DIR, 'images')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Referer': 'https://www.google.com/',
}

# 從部落格和維基找到的真實圖片 URL
IMAGES = {
    'restaurants': {
        # 阿堂鹹粥 - 從部落格
        'atang-1.jpg': 'https://bunnyann.tw/wp-content/uploads/2025/03/Atang-porridge.jpg',
        # 六千牛肉湯
        'beef-1.jpg': 'https://i0.wp.com/img.hoolee.tw/uploads/2014/07/1491098016-2f38e65c492db3d27c0d4d14eb528fab.jpg',
        '6000beef-1.jpg': 'https://thiskp.com/wp-content/uploads/2024/07/liuqian_02.jpg',
        # 文章牛肉湯
        'wenzhang-1.jpg': 'https://lordcat.net/wp-content/uploads/2022/03/1647170285-3837295856-g.jpg',
        # 度小月擔仔麵 - Wikimedia
        'duxiaoyue-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg',
        # 阿美飯店
        'amei-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Taiwanese_cuisine.jpg',
        # 筑馨居
        'zhuxinju-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/30/%E5%89%8D%E5%8D%97%E8%8F%9C%E5%9C%92%E6%97%A5%E5%BC%8F%E5%AE%BF%E8%88%8D12.jpg',
        # CHUN純薏仁
        'chun-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Douhua.jpg',
        # 邱家小卷米粉
        'chiuxiaojuan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/59/Taiwanese_d%C3%A0nz%C7%8Eimi%C3%A0n.jpg',
        # 矮仔成蝦仁飯
        'aizai-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Taiwanese_cuisine.jpg',
        # 福記肉圓
        'fuji-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Taiwanese_Meatballs.JPG',
    },
    'snacks': {
        # 碗粿
        'fusheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Wagui.JPG',
        # 割包
        'asong-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Gua-Bao_Pork.jpg',
        # 春捲
        'jindechun-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/88/Popiah-taiwan.jpg',
        # 葉家小卷米粉
        'yejia-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/TanTsiNoodle001.jpg',
        # 燒肉飯
        'yongle-sharou-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Pork_rice_%28Taiwan%29.jpg',
        # 香腸
        'along-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/05/Taiwan_Sausage.jpg',
        # 蚵仔煎
        'shihjingju-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/83/Oysteromelette.jpg',
        # 豬心冬粉
        'aming-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/16-%E5%8F%B0%E5%8D%97%E6%97%A9%E9%A4%90%E5%9C%8B%E8%8F%AF%E8%A1%97%E9%98%BF%E6%9D%91%E7%89%9B%E8%82%89%E6%B9%AF%EF%BC%8C%E5%8F%B0%E5%8D%97%E7%9C%9F%E5%A5%BD_%2829484622036%29.jpg',
        # 無名豆花
        'wuming-douhua-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Douhua.jpg',
        # 鱔魚意麵
        'ajiang-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/59/Taiwanese_d%C3%A0nz%C7%8Eimi%C3%A0n.jpg',
        # 鍋燒意麵
        'chunxian-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8f/TanTsiNoodle001.jpg',
        # 水果店
        'lili-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Taiwan_2009_Fruit_and_Vegetable_Stall_at_Taipei_Traditional_Market_FRD_7295.jpg',
        # 米糕
        'xiadado-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Migao.jpg',
        'luocheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Migao.jpg',
        # 蝦仁肉圓
        'huangshi-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Taiwanese_Meatballs.JPG',
        # 肉燥飯
        'ahe-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Pork_rice_%28Taiwan%29.jpg',
        # 蝦捲
        'zhoushi-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/2010-02-19_Chou%27s_Shrimp_Rolls_in_Tainan.jpg',
        # 豆花
        'tongji-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Douhua.jpg',
        # 鹹粥
        'ahan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Milkfish_congee.jpg',
        # 蝦仁飯
        'jipin-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Taiwanese_cuisine.jpg',
    },
    'nightmarkets': {
        # 花園夜市 - Wikimedia
        'huayuan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/53/The_Garden_Night_Market_in_Tainan_2014-05-29_14.jpg',
        'huayuan-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6e/The_Garden_Night_Market_in_Tainan_2014-05-29_08.jpg',
        # 大東夜市
        'dadong-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/02/2007-05-12_night_market_in_Tainan.jpg',
        # 武聖夜市
        'wusheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Night_market_on_Yule_Street_Tainan_November_2017.jpg',
        # 小北成功夜市
        'xiaobei-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Tainan_Anping_night_market.jpg',
        # 永大夜市
        'yongda-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/02/2007-05-12_night_market_in_Tainan.jpg',
    },
    'drinks': {
        # 紅茶
        'shuangquan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Black_tea.jpg',
        # 冬瓜茶
        'yifeng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Winter_melon_tea.JPG',
        # 水果店
        'atian-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Taiwan_2009_Fruit_and_Vegetable_Stall_at_Taipei_Traditional_Market_FRD_7295.jpg',
        # 青草茶
        'qingcao-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Herbal_tea_store.jpg',
        # 冰品
        'taiyang-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Mango_shaved_ice_%286009677929%29.jpg',
        'taicheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Mango_shaved_ice_%286009677929%29.jpg',
        'yucheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Mango_shaved_ice_%286009677929%29.jpg',
        # 霜淇淋
        'juanweijia-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/31/Ice_cream_cone.jpg',
        # 咖啡
        'narrowdoor-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG',
        'gandan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG',
        'shunfeng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG',
        # 餅店
        'jiuzhennan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Pineapple_Cake.jpg',
        # 布丁
        'elate-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Cr%C3%A8me_caramel.jpg',
        # 青草茶
        'xiaoxijiao-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Herbal_tea_store.jpg',
        # 泡芙
        'cream-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Profiterole.jpg',
    },
    'hotels': {
        # 飯店
        'hotel-cozzi-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Tainan_Taiwan_TRA-Tainan-Station-02.jpg',
        'hotel-cozzi-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Tainan_Taiwan_TRA-Tainan-Station-02.jpg',
        'silks-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Shin_Kong_Mitsukoshi_Tainan_Place.JPG',
        'chateau-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Tainan_Taiwan_TRA-Tainan-Station-02.jpg',
        'justsleep-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Tainan_Taiwan_TRA-Tainan-Station-02.jpg',
        'theplace-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Shin_Kong_Mitsukoshi_Tainan_Place.JPG',
        # 老街/民宿
        'uai-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'banyan147-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'xiehouse-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'lakeshore-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Tainan_Taiwan_TRA-Tainan-Station-02.jpg',
        'tayih-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Tainan_Taiwan_TRA-Tainan-Station-02.jpg',
        'caoji-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        # 溫泉
        'toong-mao-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Guanziling_Hot_Spring.jpg',
        'king-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Guanziling_Hot_Spring.jpg',
        'shangri-la-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Shin_Kong_Mitsukoshi_Tainan_Place.JPG',
        'uij-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
    },
}

def download_image(args):
    """下載單張圖片"""
    url, save_path = args
    try:
        response = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        if response.status_code == 200 and len(response.content) > 1000:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True, os.path.basename(save_path)
        else:
            return False, f"{os.path.basename(save_path)} (status: {response.status_code})"
    except Exception as e:
        return False, f"{os.path.basename(save_path)} ({str(e)[:50]})"

def main():
    print("=" * 50)
    print("下載台南店家圖片（從部落格和維基）")
    print("=" * 50)

    # 建立目錄
    for cat in IMAGES.keys():
        os.makedirs(os.path.join(IMAGES_DIR, cat), exist_ok=True)

    # 準備下載任務
    tasks = []
    for category, items in IMAGES.items():
        for filename, url in items.items():
            save_path = os.path.join(IMAGES_DIR, category, filename)
            # 跳過已存在的檔案
            if os.path.exists(save_path) and os.path.getsize(save_path) > 5000:
                print(f"已存在: {filename}")
                continue
            tasks.append((url, save_path))

    print(f"\n需要下載: {len(tasks)} 張圖片")

    if not tasks:
        print("所有圖片已存在！")
        return

    # 並行下載
    success = 0
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(download_image, tasks)
        for ok, name in results:
            if ok:
                success += 1
                print(f"✓ {name}")
            else:
                failed.append(name)
                print(f"✗ {name}")

    print(f"\n{'=' * 50}")
    print(f"完成！成功: {success}/{len(tasks)}")
    if failed:
        print(f"失敗: {len(failed)}")

if __name__ == '__main__':
    main()

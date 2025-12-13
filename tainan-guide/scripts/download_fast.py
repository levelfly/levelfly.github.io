#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速下載台南店家圖片 - 使用預設的 Wikimedia Commons URL
"""

import os
import requests
import concurrent.futures

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
IMAGES_DIR = os.path.join(BASE_DIR, 'images')

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}

# 直接使用圖片 URL (主要來自 Wikimedia Commons)
IMAGES = {
    'restaurants': {
        'atang-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Milkfish_congee.jpg/640px-Milkfish_congee.jpg',
        '6000beef-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/16-%E5%8F%B0%E5%8D%97%E6%97%A9%E9%A4%90%E5%9C%8B%E8%8F%AF%E8%A1%97%E9%98%BF%E6%9D%91%E7%89%9B%E8%82%89%E6%B9%AF%EF%BC%8C%E5%8F%B0%E5%8D%97%E7%9C%9F%E5%A5%BD_%2829484622036%29.jpg/640px-16-%E5%8F%B0%E5%8D%97%E6%97%A9%E9%A4%90%E5%9C%8B%E8%8F%AF%E8%A1%97%E9%98%BF%E6%9D%91%E7%89%9B%E8%82%89%E6%B9%AF%EF%BC%8C%E5%8F%B0%E5%8D%97%E7%9C%9F%E5%A5%BD_%2829484622036%29.jpg',
        'wenzhang-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Beef_soup_in_Taiwan.jpg/640px-Beef_soup_in_Taiwan.jpg',
        'amei-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Taiwanese_cuisine.jpg/640px-Taiwanese_cuisine.jpg',
        'duxiaoyue-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg/640px-DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg',
        'zhuxinju-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%E5%89%8D%E5%8D%97%E8%8F%9C%E5%9C%92%E6%97%A5%E5%BC%8F%E5%AE%BF%E8%88%8D12.jpg/640px-%E5%89%8D%E5%8D%97%E8%8F%9C%E5%9C%92%E6%97%A5%E5%BC%8F%E5%AE%BF%E8%88%8D12.jpg',
        'chun-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Job%27s_tears_soup.jpg/640px-Job%27s_tears_soup.jpg',
        'chiuxiaojuan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Squid_thick_noodle_soup.jpg/640px-Squid_thick_noodle_soup.jpg',
        'aizai-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Shrimp_rice_in_Taiwan.jpg/640px-Shrimp_rice_in_Taiwan.jpg',
        'fuji-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Taiwanese_meatball.jpg/640px-Taiwanese_meatball.jpg',
    },
    'snacks': {
        'fusheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Wa_gui.jpg/640px-Wa_gui.jpg',
        'asong-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Gua_bao.jpg/640px-Gua_bao.jpg',
        'jindechun-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Popiah.jpg/640px-Popiah.jpg',
        'yejia-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Squid_thick_noodle_soup.jpg/640px-Squid_thick_noodle_soup.jpg',
        'yongle-sharou-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Taiwanese_grilled_pork_rice.jpg/640px-Taiwanese_grilled_pork_rice.jpg',
        'along-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Taiwanese_sausage.jpg/640px-Taiwanese_sausage.jpg',
        'shihjingju-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Oyster_omelette.jpg/640px-Oyster_omelette.jpg',
        'aming-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Pig_heart_vermicelli.jpg/640px-Pig_heart_vermicelli.jpg',
        'wuming-douhua-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Taiwan_food_02.jpg/640px-Taiwan_food_02.jpg',
        'ajiang-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Eel_noodles.jpg/640px-Eel_noodles.jpg',
        'chunxian-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Taiwanese_pot_noodle_soup.jpg/640px-Taiwanese_pot_noodle_soup.jpg',
        'lili-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Taiwanese_fruit_platter.jpg/640px-Taiwanese_fruit_platter.jpg',
        'xiadado-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Mi_gao.jpg/640px-Mi_gao.jpg',
        'luocheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Mi_gao.jpg/640px-Mi_gao.jpg',
        'huangshi-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Taiwanese_meatball.jpg/640px-Taiwanese_meatball.jpg',
        'ahe-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Braised_pork_rice.jpg/640px-Braised_pork_rice.jpg',
        'zhoushi-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2010-02-19_Chou%27s_Shrimp_Rolls_in_Tainan.jpg/640px-2010-02-19_Chou%27s_Shrimp_Rolls_in_Tainan.jpg',
        'tongji-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Taiwan_food_02.jpg/640px-Taiwan_food_02.jpg',
        'ahan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Milkfish_congee.jpg/640px-Milkfish_congee.jpg',
        'jipin-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Shrimp_rice_in_Taiwan.jpg/640px-Shrimp_rice_in_Taiwan.jpg',
    },
    'nightmarkets': {
        'huayuan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/The_Garden_Night_Market_in_Tainan_2014-05-29_14.jpg/640px-The_Garden_Night_Market_in_Tainan_2014-05-29_14.jpg',
        'huayuan-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/The_Garden_Night_Market_in_Tainan_2014-05-29_08.jpg/640px-The_Garden_Night_Market_in_Tainan_2014-05-29_08.jpg',
        'dadong-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/2007-05-12_night_market_in_Tainan.jpg/640px-2007-05-12_night_market_in_Tainan.jpg',
        'wusheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/2007-05-12_night_market_in_Tainan.jpg/640px-2007-05-12_night_market_in_Tainan.jpg',
        'xiaobei-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Night_market_on_Yule_Street_Tainan_November_2017.jpg/640px-Night_market_on_Yule_Street_Tainan_November_2017.jpg',
        'yongda-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Night_market_on_Yule_Street_Tainan_November_2017.jpg/640px-Night_market_on_Yule_Street_Tainan_November_2017.jpg',
    },
    'drinks': {
        'shuangquan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Black_tea_in_Taiwan.jpg/640px-Black_tea_in_Taiwan.jpg',
        'yifeng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Winter_melon_tea.jpg/640px-Winter_melon_tea.jpg',
        'atian-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Papaya_milk.jpg/640px-Papaya_milk.jpg',
        'qingcao-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Herbal_tea_Taiwan.jpg/640px-Herbal_tea_Taiwan.jpg',
        'taiyang-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Red_bean_shaved_ice.jpg/640px-Red_bean_shaved_ice.jpg',
        'taicheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Melon_shaved_ice.jpg/640px-Melon_shaved_ice.jpg',
        'yucheng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Mango_shaved_ice_in_Taiwan.jpg/640px-Mango_shaved_ice_in_Taiwan.jpg',
        'juanweijia-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Soft_serve_ice_cream.jpg/640px-Soft_serve_ice_cream.jpg',
        'narrowdoor-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coffee_shop_interior.jpg/640px-Coffee_shop_interior.jpg',
        'gandan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coffee_shop_interior.jpg/640px-Coffee_shop_interior.jpg',
        'shunfeng-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coffee_shop_interior.jpg/640px-Coffee_shop_interior.jpg',
        'jiuzhennan-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Taiwanese_pineapple_cake.jpg/640px-Taiwanese_pineapple_cake.jpg',
        'elate-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Cr%C3%A8me_caramel.jpg/640px-Cr%C3%A8me_caramel.jpg',
        'xiaoxijiao-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Herbal_tea_Taiwan.jpg/640px-Herbal_tea_Taiwan.jpg',
        'cream-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Profiterole.jpg/640px-Profiterole.jpg',
    },
    'hotels': {
        'hotel-cozzi-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'hotel-cozzi-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'silks-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'chateau-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'justsleep-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'theplace-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'uai-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg/640px-Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'banyan147-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg/640px-Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'xiehouse-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg/640px-Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'lakeshore-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'tayih-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'caoji-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg/640px-Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
        'toong-mao-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Hot_spring_pool.jpg/640px-Hot_spring_pool.jpg',
        'king-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Hot_spring_pool.jpg/640px-Hot_spring_pool.jpg',
        'shangri-la-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hotel_room_interior.jpg/640px-Hotel_room_interior.jpg',
        'uij-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg/640px-Shennong_Street%2C_Tainan_City%2C_Taiwan.jpg',
    },
}

def download_image(args):
    url, save_path = args
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True, os.path.basename(save_path)
    except Exception as e:
        pass
    return False, os.path.basename(save_path)

def main():
    print("快速下載台南店家圖片...")

    # 建立目錄
    for cat in IMAGES.keys():
        os.makedirs(os.path.join(IMAGES_DIR, cat), exist_ok=True)

    # 收集所有下載任務
    tasks = []
    for category, items in IMAGES.items():
        for filename, url in items.items():
            save_path = os.path.join(IMAGES_DIR, category, filename)
            tasks.append((url, save_path))

    print(f"總共 {len(tasks)} 張圖片")

    # 平行下載
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(download_image, tasks)
        for ok, name in results:
            if ok:
                success += 1
                print(f"✓ {name}")
            else:
                print(f"✗ {name}")

    print(f"\n完成！成功: {success}/{len(tasks)}")

if __name__ == '__main__':
    main()

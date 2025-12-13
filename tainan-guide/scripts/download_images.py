#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download representative images for Tainan Travel Guide
Sources: Wikimedia Commons (CC licensed)
Updated with verified URLs from search
"""

import urllib.request
import os
from pathlib import Path
import ssl
import time

# Disable SSL verification for some sites
ssl._create_default_https_context = ssl._create_unverified_context

# Base path
BASE_DIR = Path(r"E:\PycharmProjects\人生管理\網站\levelfly.github.io\tainan-guide\images")

# Headers
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def download_image(url, filepath, name):
    """Download image from URL to filepath"""
    try:
        print(f"  Downloading: {name}")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_bytes(data)
            file_size = len(data) / 1024
            print(f"    OK - {file_size:.1f} KB")
            return True
    except Exception as e:
        print(f"    FAILED - {str(e)[:50]}")
        return False

# =========================================================
# ATTRACTIONS (15) - Verified Wikimedia Commons URLs
# =========================================================
print("\n" + "="*60)
print("ATTRACTIONS")
print("="*60)

attractions = [
    ("chimei-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Chimei_Museum_%E5%A5%87%E7%BE%8E%E5%8D%9A%E7%89%A9%E9%A4%A8_-_panoramio.jpg/1280px-Chimei_Museum_%E5%A5%87%E7%BE%8E%E5%8D%9A%E7%89%A9%E9%A4%A8_-_panoramio.jpg", "奇美博物館"),
    # 十鼓仁糖文創園區 - 使用台南安平天際線
    ("tendrum-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "十鼓仁糖文創園區"),
    ("tnam2-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Tainan_Art_Museum_Building_2_%28%E5%8F%B0%E5%8D%97%E5%B8%82%E7%BE%8E%E8%A1%93%E9%A4%A82%E9%A4%A8%29.jpg/1280px-Tainan_Art_Museum_Building_2_%28%E5%8F%B0%E5%8D%97%E5%B8%82%E7%BE%8E%E8%A1%93%E9%A4%A82%E9%A4%A8%29.jpg", "台南美術館二館"),
    ("sicao-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Sihcao_Green_Tunnel.JPG/1280px-Sihcao_Green_Tunnel.JPG", "四草綠色隧道"),
    ("chihkan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Chihkan_Tower_%28Fort_Provintia%29.jpg/1280px-Chihkan_Tower_%28Fort_Provintia%29.jpg", "赤崁樓"),
    ("anping-fort-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Tainan_Taiwan_Fort-Zeelandia-01.jpg/1280px-Tainan_Taiwan_Fort-Zeelandia-01.jpg", "安平古堡"),
    ("shennong-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg/1280px-%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg", "神農街"),
    ("waterworks-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Shanshang_Water_Treatment_Plant%2C_Tainan_City_%28Taiwan%29.jpg/1280px-Shanshang_Water_Treatment_Plant%2C_Tainan_City_%28Taiwan%29.jpg", "台南山上花園水道博物館"),
    ("hele-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/%E8%87%BA%E5%8D%97%E6%B2%B3%E6%A8%82%E5%BB%A3%E5%A0%B4.jpg/1280px-%E8%87%BA%E5%8D%97%E6%B2%B3%E6%A8%82%E5%BB%A3%E5%A0%B4.jpg", "河樂廣場"),
    ("nmth-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/%E5%9C%8B%E7%AB%8B%E8%87%BA%E7%81%A3%E6%AD%B7%E5%8F%B2%E5%8D%9A%E7%89%A9%E9%A4%A8_01.jpg/1280px-%E5%9C%8B%E7%AB%8B%E8%87%BA%E7%81%A3%E6%AD%B7%E5%8F%B2%E5%8D%9A%E7%89%A9%E9%A4%A8_01.jpg", "國立臺灣歷史博物館"),
    ("qigu-salt-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/%E4%B8%83%E8%82%A1%E7%9B%90%E5%B1%B1_-_Qigu_Salt_Mound_-_2012.02_-_panoramio.jpg/1280px-%E4%B8%83%E8%82%A1%E7%9B%90%E5%B1%B1_-_Qigu_Salt_Mound_-_2012.02_-_panoramio.jpg", "七股鹽山"),
    ("beimen-salt-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/%E4%BA%95%E4%BB%94%E8%85%B3%E7%93%A6%E7%9B%A4%E9%B9%BD%E7%94%B0.JPG/1280px-%E4%BA%95%E4%BB%94%E8%85%B3%E7%93%A6%E7%9B%A4%E9%B9%BD%E7%94%B0.JPG", "井仔腳瓦盤鹽田"),
    ("hayashi-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Hayashi_Department_Store_in_Tainan%2C_Taiwan_%28%E6%9E%97%E7%99%BE%E8%B2%A8%EF%BC%89.jpg/1280px-Hayashi_Department_Store_in_Tainan%2C_Taiwan_%28%E6%9E%97%E7%99%BE%E8%B2%A8%EF%BC%89.jpg", "林百貨"),
    ("yuguang-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Yuguang_Island_Pine_Grove_%E6%BC%81%E5%85%89%E5%B3%B6%E6%9D%BE%E6%9E%97_-_panoramio.jpg/1280px-Yuguang_Island_Pine_Grove_%E6%BC%81%E5%85%89%E5%B3%B6%E6%9D%BE%E6%9E%97_-_panoramio.jpg", "漁光島"),
    ("blueprint-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/17-%E5%8F%B0%E5%8D%97%E8%97%8D%E6%99%92%E5%9C%96%E6%96%87%E5%89%B5%E5%9C%92%E5%8D%80_%2829484623946%29.jpg/1280px-17-%E5%8F%B0%E5%8D%97%E8%97%8D%E6%99%92%E5%9C%96%E6%96%87%E5%89%B5%E5%9C%92%E5%8D%80_%2829484623946%29.jpg", "藍晒圖文創園區"),
]

success = 0
for filename, url, name in attractions:
    filepath = BASE_DIR / "attractions" / filename
    if download_image(url, filepath, name):
        success += 1
    time.sleep(0.3)
print(f"\nAttractions: {success}/{len(attractions)} downloaded")

# =========================================================
# RESTAURANTS (10) - Generic food images from Wikimedia Commons
# =========================================================
print("\n" + "="*60)
print("RESTAURANTS")
print("="*60)

restaurants = [
    # 阿堂鹹粥 - 使用台南虱目魚鹹粥圖片
    ("atang-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/84/%E8%87%BA%E5%8D%97%E9%A3%B2%E9%A3%9F_%E8%99%B1%E7%9B%AE%E9%AD%9A%E9%B9%B9%E7%B2%A5.jpg", "阿堂鹹粥"),
    # 六千牛肉湯 - 台灣牛肉麵湯圖片
    ("6000beef-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Taiwanese_Beef_Noodle_Soup_from_%E7%A9%86%E8%A8%98%E7%89%9B%E8%82%89%E9%BA%B5_MuJI_Beef_Noodles_Soup_in_Taipei.jpg/1280px-Taiwanese_Beef_Noodle_Soup_from_%E7%A9%86%E8%A8%98%E7%89%9B%E8%82%89%E9%BA%B5_MuJI_Beef_Noodles_Soup_in_Taipei.jpg", "六千牛肉湯"),
    # 文章牛肉湯
    ("wenzhang-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Taiwanese_Beef_Noodle_Soup_from_%E7%A9%86%E8%A8%98%E7%89%9B%E8%82%89%E9%BA%B5_MuJI_Beef_Noodles_Soup_in_Taipei.jpg/1024px-Taiwanese_Beef_Noodle_Soup_from_%E7%A9%86%E8%A8%98%E7%89%9B%E8%82%89%E9%BA%B5_MuJI_Beef_Noodles_Soup_in_Taipei.jpg", "文章牛肉湯"),
    # 阿美飯店 - 使用台南擔仔麵代表台菜（已驗證有效）
    ("amei-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bb/DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg", "阿美飯店"),
    # 度小月擔仔麵 - 使用台南度小月圖片
    ("duxiaoyue-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/bb/DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg", "度小月擔仔麵"),
    # 筑馨居 - 使用台南鹹粥代表台菜（已驗證有效）
    ("zhuxinju-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/84/%E8%87%BA%E5%8D%97%E9%A3%B2%E9%A3%9F_%E8%99%B1%E7%9B%AE%E9%AD%9A%E9%B9%B9%E7%B2%A5.jpg", "筑馨居"),
    # CHUN純薏仁 - 薏仁甜湯
    ("chun-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Douhua_dessert.jpg/1280px-Douhua_dessert.jpg", "CHUN純薏仁"),
    # 邱家小卷米粉 - 使用台南小卷米粉圖片
    ("chiuxiaojuan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/83/%E6%96%BD%E5%AE%B6%E5%B0%8F%E5%8D%B7%E7%B1%B3%E7%B2%89_Shih%27s_Neritic_Squid_Rice_Noodles-20210827.jpg", "邱家小卷米粉"),
    # 矮仔成蝦仁飯 - 使用矮仔成實際圖片
    ("aizai-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/7e/Ai_Zai_Cheng_Shrimp_Rice_20120203.jpg", "矮仔成蝦仁飯"),
    # 福記肉圓
    ("fuji-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Hsinchu_Bawan.jpg/1280px-Hsinchu_Bawan.jpg", "福記肉圓"),
]

success = 0
for filename, url, name in restaurants:
    filepath = BASE_DIR / "restaurants" / filename
    if download_image(url, filepath, name):
        success += 1
    time.sleep(0.3)
print(f"\nRestaurants: {success}/{len(restaurants)} downloaded")

# =========================================================
# SNACKS (20) - Taiwanese food images
# =========================================================
print("\n" + "="*60)
print("SNACKS")
print("="*60)

snacks = [
    # 富盛號碗粿 - 碗粿
    ("fusheng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/%E3%80%90%E6%96%B0%E7%AB%B9%E7%BE%8E%E9%A3%9F%E3%80%91%E7%AC%AC%E4%B8%80%E7%A2%97%E6%BB%B7%E8%82%89%E9%A3%AF_%2832787778013%29.jpg/1280px-%E3%80%90%E6%96%B0%E7%AB%B9%E7%BE%8E%E9%A3%9F%E3%80%91%E7%AC%AC%E4%B8%80%E7%A2%97%E6%BB%B7%E8%82%89%E9%A3%AF_%2832787778013%29.jpg", "富盛號碗粿"),
    # 阿松割包 - 割包
    ("asong-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Steamed_Sandwich%2Ctaken_by_LeoAlmighty.jpg/1280px-Steamed_Sandwich%2Ctaken_by_LeoAlmighty.jpg", "阿松割包"),
    # 金得春捲 - 使用蚵仔煎代替（已驗證有效）
    ("jindechun-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/da/Oyster_Omelette_2008-7-17.jpg", "金得春捲"),
    # 葉家小卷米粉 - 小卷米粉
    ("yejia-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/83/%E6%96%BD%E5%AE%B6%E5%B0%8F%E5%8D%B7%E7%B1%B3%E7%B2%89_Shih%27s_Neritic_Squid_Rice_Noodles-20210827.jpg", "葉家小卷米粉"),
    # 永樂燒肉飯 - 使用台南鹹粥代替（已驗證有效）
    ("yongle-sharou-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/84/%E8%87%BA%E5%8D%97%E9%A3%B2%E9%A3%9F_%E8%99%B1%E7%9B%AE%E9%AD%9A%E9%B9%B9%E7%B2%A5.jpg", "永樂燒肉飯"),
    # 阿龍香腸熟肉 - 使用蚵仔煎代替（已驗證有效）
    ("along-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/da/Oyster_Omelette_2008-7-17.jpg", "阿龍香腸熟肉"),
    # 石精臼蚵仔煎 - 蚵仔煎
    ("shihjingju-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/da/Oyster_Omelette_2008-7-17.jpg", "石精臼蚵仔煎"),
    # 阿明豬心冬粉 - 使用豆花代替（已驗證有效）
    ("aming-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/Douhua_dessert.jpg", "阿明豬心冬粉"),
    # 無名豆花 - 豆花
    ("wuming-douhua-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/Douhua_dessert.jpg", "無名豆花"),
    # 阿江炒鱔魚 - 鱔魚意麵
    ("ajiang-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg/1280px-DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg", "阿江炒鱔魚"),
    # 醇涎坊鍋燒意麵 - 意麵
    ("chunxian-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg/1024px-DuSiaoYue_danzai_noodle_by_Prince_Roy_in_Tainan%2C_Taiwan.jpg", "醇涎坊鍋燒意麵"),
    # 莉莉水果店 - 使用冬瓜圖片代替（已驗證有效）
    ("lili-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b1/Winter_melon.jpg", "莉莉水果店"),
    # 下大道米糕 - 筒仔米糕
    ("xiadado-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Tube_rice_pudding_that_look_like_Minced_pork_rice.jpg/1280px-Tube_rice_pudding_that_look_like_Minced_pork_rice.jpg", "下大道米糕"),
    # 落成米糕 - 筒仔米糕
    ("luocheng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Tube_rice_pudding_that_look_like_Minced_pork_rice.jpg/1024px-Tube_rice_pudding_that_look_like_Minced_pork_rice.jpg", "落成米糕"),
    # 黃氏蝦仁肉圓 - 肉圓
    ("huangshi-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Hsinchu_Bawan.jpg/1024px-Hsinchu_Bawan.jpg", "黃氏蝦仁肉圓"),
    # 阿和肉燥飯 - 使用台南鹹粥代替（已驗證有效）
    ("ahe-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/84/%E8%87%BA%E5%8D%97%E9%A3%B2%E9%A3%9F_%E8%99%B1%E7%9B%AE%E9%AD%9A%E9%B9%B9%E7%B2%A5.jpg", "阿和肉燥飯"),
    # 安平周氏蝦捲 - 使用蚵仔煎代替（已驗證有效）
    ("zhoushi-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/da/Oyster_Omelette_2008-7-17.jpg", "安平周氏蝦捲"),
    # 同記安平豆花 - 豆花
    ("tongji-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Douhua_dessert.jpg/1024px-Douhua_dessert.jpg", "同記安平豆花"),
    # 阿憨鹹粥 - 虱目魚鹹粥
    ("ahan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/84/%E8%87%BA%E5%8D%97%E9%A3%B2%E9%A3%9F_%E8%99%B1%E7%9B%AE%E9%AD%9A%E9%B9%B9%E7%B2%A5.jpg", "阿憨鹹粥"),
    # 集品蝦仁飯 - 蝦仁飯
    ("jipin-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/7e/Ai_Zai_Cheng_Shrimp_Rice_20120203.jpg", "集品蝦仁飯"),
]

success = 0
for filename, url, name in snacks:
    filepath = BASE_DIR / "snacks" / filename
    if download_image(url, filepath, name):
        success += 1
    time.sleep(0.3)
print(f"\nSnacks: {success}/{len(snacks)} downloaded")

# =========================================================
# NIGHTMARKETS (5) - Night market images
# =========================================================
print("\n" + "="*60)
print("NIGHTMARKETS")
print("="*60)

nightmarkets = [
    # 花園夜市 - 台南花園夜市實際照片
    ("huayuan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ed/%E5%8F%B0%E5%8D%97%E8%8A%B1%E5%9C%92%E5%A4%9C%E5%B8%82_%E8%B7%AF%E6%99%AF.jpg", "花園夜市"),
    # 大東夜市 - 士林夜市代替圖
    ("dadong-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/71/ShiLin.jpg", "大東夜市"),
    # 武聖夜市 - 士林夜市代替圖
    ("wusheng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/71/ShiLin.jpg", "武聖夜市"),
    # 小北成功夜市 - 士林夜市代替圖
    ("xiaobei-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/71/ShiLin.jpg", "小北成功夜市"),
    # 永大夜市 - 士林夜市代替圖
    ("yongda-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/71/ShiLin.jpg", "永大夜市"),
]

success = 0
for filename, url, name in nightmarkets:
    filepath = BASE_DIR / "nightmarkets" / filename
    if download_image(url, filepath, name):
        success += 1
    time.sleep(0.3)
print(f"\nNightmarkets: {success}/{len(nightmarkets)} downloaded")

# =========================================================
# DRINKS (15) - Beverage and dessert images
# =========================================================
print("\n" + "="*60)
print("DRINKS")
print("="*60)

drinks = [
    # 雙全紅茶 - 珍珠奶茶（已驗證）
    ("shuangquan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/44/Pearl_Milktea.jpg", "雙全紅茶"),
    # 義豐冬瓜茶 - 冬瓜茶
    ("yifeng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b1/Winter_melon.jpg", "義豐冬瓜茶"),
    # 阿田水果店 - 使用冬瓜圖片代替（已驗證有效）
    ("atian-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b1/Winter_melon.jpg", "阿田水果店"),
    # 青草茶阿伯 - 青草茶（王老吉代替）
    ("qingcao-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/Wong_Lo_Kat_herbal_tea.jpg", "青草茶阿伯"),
    # 太陽牌冰品 - 台灣剉冰（珍珠奶茶代替）
    ("taiyang-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/7/78/TimeForTea_BubbleTea.JPG", "太陽牌冰品"),
    # 泰成水果店 - 使用冬瓜圖片代替（已驗證有效）
    ("taicheng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b1/Winter_melon.jpg", "泰成水果店"),
    # 裕成水果店 - 使用珍珠奶茶代替（已驗證有效）
    ("yucheng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/44/Pearl_Milktea.jpg", "裕成水果店"),
    # 蜷尾家甘味處 - 使用豆花代替（已驗證有效）
    ("juanweijia-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/Douhua_dessert.jpg", "蜷尾家甘味處"),
    # 窄門咖啡 - 咖啡（直接 URL）
    ("narrowdoor-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG", "窄門咖啡"),
    # 甘單咖啡 - 咖啡（直接 URL）
    ("gandan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG", "甘單咖啡"),
    # 順風號 - 咖啡店（直接 URL）
    ("shunfeng-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG", "順風號"),
    # 舊振南餅店 - 鳳梨酥（已驗證）
    ("jiuzhennan-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/64/Pineapple_Pastry.JPG", "舊振南餅店"),
    # 依蕾特布丁 - 使用咖啡代替（已驗證有效）
    ("elate-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG", "依蕾特布丁"),
    # 小西腳青草茶 - 青草茶
    ("xiaoxijiao-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/0/0d/Wong_Lo_Kat_herbal_tea.jpg", "小西腳青草茶"),
    # 克林姆之屋 - 使用鳳梨酥代替（已驗證有效）
    ("cream-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/6/64/Pineapple_Pastry.JPG", "克林姆之屋"),
]

success = 0
for filename, url, name in drinks:
    filepath = BASE_DIR / "drinks" / filename
    if download_image(url, filepath, name):
        success += 1
    time.sleep(0.3)
print(f"\nDrinks: {success}/{len(drinks)} downloaded")

# =========================================================
# HOTELS (15) - Hotel and accommodation images
# =========================================================
print("\n" + "="*60)
print("HOTELS")
print("="*60)

hotels = [
    # 使用台南安平天際線作為飯店代表圖（已驗證有效）
    ("hotel-cozzi-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "和逸飯店台南西門館"),
    ("silks-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "台南晶英酒店"),
    # 夏都城旅安平館 - 安平天際線
    ("chateau-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "夏都城旅安平館"),
    # 捷絲旅台南十鼓館 - 使用台南安平天際線
    ("justsleep-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "捷絲旅台南十鼓館"),
    # 台南老爺行旅 - 台南安平天際線
    ("theplace-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "台南老爺行旅"),
    # 友愛街旅館 - 神農街（直接 URL）
    ("uai-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/df/%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg", "友愛街旅館"),
    # 神榕147 - 神農街
    ("banyan147-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/df/%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg", "神榕147"),
    # 謝宅 - 神農街
    ("xiehouse-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/df/%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg", "謝宅"),
    # 煙波大飯店台南館 - 台南安平天際線
    ("lakeshore-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "煙波大飯店台南館"),
    # 台南大億麗緻酒店 - 台南安平天際線
    ("tayih-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "台南大億麗緻酒店"),
    # 艸祭民宿 - 神農街
    ("caoji-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/df/%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg", "艸祭民宿"),
    # 關子嶺統茂溫泉會館 - 使用台南安平天際線
    ("toong-mao-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "關子嶺統茂溫泉會館"),
    # 景大溫泉莊園 - 使用台南安平天際線
    ("king-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "景大溫泉莊園"),
    # 香格里拉台南遠東國際大飯店 - 台南安平天際線
    ("shangri-la-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Tainan_Anping_Skyline_2017.jpg", "香格里拉台南遠東國際大飯店"),
    # U.I.J Hotel & Hostel - 神農街
    ("uij-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/d/df/%E7%A5%9E%E8%BE%B2%E8%A1%97_Shennong_Street_Tainan_City02.jpg", "U.I.J Hotel & Hostel"),
]

success = 0
for filename, url, name in hotels:
    filepath = BASE_DIR / "hotels" / filename
    if download_image(url, filepath, name):
        success += 1
    time.sleep(0.3)
print(f"\nHotels: {success}/{len(hotels)} downloaded")

print("\n" + "="*60)
print("DOWNLOAD COMPLETE")
print("="*60)

#!/usr/bin/env python3
"""
104人力銀行職缺爬蟲
==================
這個爬蟲可以根據關鍵字搜尋 104 上的職缺，並儲存成 CSV 檔案。

使用方式：
    python 104_job_scraper.py

注意事項：
    1. 請適當控制爬取速度，避免對網站造成負擔
    2. 本程式僅供學習和個人求職使用
    3. 請遵守 104 的使用條款
"""

import requests
import json
import csv
import time
import os
from datetime import datetime

class Job104Scraper:
    def __init__(self):
        self.base_url = "https://www.104.com.tw/jobs/search/list"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.104.com.tw/jobs/search/",
            "Accept": "application/json, text/plain, */*",
        }
        self.jobs = []

    def search_jobs(self, keyword, area=None, max_pages=5, delay=1.5):
        """
        搜尋職缺

        參數:
            keyword: 搜尋關鍵字 (例如: "Python", "前端工程師")
            area: 地區代碼 (例如: "6001001000" 為台北市，None 為全台灣)
            max_pages: 最多爬取幾頁 (每頁約 20 筆)
            delay: 每次請求間隔秒數 (建議 1-2 秒)
        """
        print(f"\n🔍 搜尋關鍵字: {keyword}")
        print(f"📄 預計爬取頁數: {max_pages}")
        print("-" * 50)

        for page in range(1, max_pages + 1):
            params = {
                "ro": 0,           # 0: 全部, 1: 全職
                "kwop": 7,         # 關鍵字選項
                "keyword": keyword,
                "order": 12,       # 排序方式: 12=日期新到舊
                "asc": 0,          # 降冪
                "page": page,
                "mode": "s",       # 搜尋模式
                "jobsource": "2018indexpoc",
            }

            if area:
                params["area"] = area

            try:
                response = requests.get(
                    self.base_url,
                    params=params,
                    headers=self.headers,
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()
                    job_list = data.get("data", {}).get("list", [])

                    if not job_list:
                        print(f"⚠️  第 {page} 頁沒有更多資料，結束搜尋")
                        break

                    for job in job_list:
                        job_info = self._parse_job(job)
                        self.jobs.append(job_info)

                    total = data.get("data", {}).get("totalCount", "?")
                    print(f"✅ 第 {page}/{max_pages} 頁完成 | 本頁 {len(job_list)} 筆 | 總共約 {total} 筆職缺")

                else:
                    print(f"❌ 第 {page} 頁請求失敗: {response.status_code}")

            except Exception as e:
                print(f"❌ 第 {page} 頁發生錯誤: {e}")

            # 禮貌性延遲
            if page < max_pages:
                time.sleep(delay)

        print(f"\n📊 總共爬取 {len(self.jobs)} 筆職缺")
        return self.jobs

    def _parse_job(self, job):
        """解析單一職缺資料"""
        return {
            "職缺名稱": job.get("jobName", ""),
            "公司名稱": job.get("custName", ""),
            "工作地點": job.get("jobAddrNo498", "") or job.get("jobAddress", ""),
            "薪資": job.get("salaryDesc", ""),
            "工作經驗": job.get("periodDesc", ""),
            "學歷要求": job.get("eduDesc", ""),
            "更新日期": job.get("appearDate", ""),
            "工作連結": f"https://www.104.com.tw/job/{job.get('link', {}).get('job', '')}" if job.get('link') else "",
            "公司連結": f"https://www.104.com.tw/company/{job.get('link', {}).get('cust', '')}" if job.get('link') else "",
            "標籤": ", ".join(job.get("tags", [])) if job.get("tags") else "",
        }

    def save_to_csv(self, filename=None):
        """儲存結果到 CSV 檔案"""
        if not self.jobs:
            print("⚠️  沒有資料可儲存")
            return

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"104_jobs_{timestamp}.csv"

        with open(filename, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=self.jobs[0].keys())
            writer.writeheader()
            writer.writerows(self.jobs)

        print(f"💾 已儲存至: {filename}")
        return filename

    def display_sample(self, n=5):
        """顯示前 n 筆資料"""
        print(f"\n📋 前 {min(n, len(self.jobs))} 筆職缺預覽:")
        print("=" * 70)

        for i, job in enumerate(self.jobs[:n], 1):
            print(f"\n{i}. {job['職缺名稱']}")
            print(f"   🏢 {job['公司名稱']}")
            print(f"   📍 {job['工作地點']}")
            print(f"   💰 {job['薪資']}")
            print(f"   🔗 {job['工作連結']}")


# 地區代碼參考
AREA_CODES = {
    "台北市": "6001001000",
    "新北市": "6001002000",
    "桃園市": "6001003000",
    "台中市": "6001006000",
    "台南市": "6001010000",
    "高雄市": "6001011000",
    "新竹市": "6001004000",
    "新竹縣": "6001004000",
}


def main():
    """主程式"""
    print("=" * 60)
    print("🔧 104 人力銀行職缺爬蟲")
    print("=" * 60)

    scraper = Job104Scraper()

    # ===== 設定搜尋條件 =====
    keyword = "Python"        # 修改這裡來搜尋不同關鍵字
    area = None               # 設為 None 搜尋全台，或用 AREA_CODES["台北市"]
    max_pages = 3             # 爬取頁數 (每頁約 20 筆)
    # ========================

    # 開始爬取
    jobs = scraper.search_jobs(
        keyword=keyword,
        area=area,
        max_pages=max_pages,
        delay=1.5  # 每頁間隔 1.5 秒
    )

    # 顯示範例
    scraper.display_sample(5)

    # 儲存到 CSV
    scraper.save_to_csv()

    print("\n✅ 爬蟲執行完成！")


if __name__ == "__main__":
    main()

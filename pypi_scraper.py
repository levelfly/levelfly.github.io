#!/usr/bin/env python3
"""
PyPI 套件爬蟲
=============
爬取 Python Package Index (PyPI) 上的套件資訊

功能：
- 查詢單一套件詳細資訊
- 批次查詢多個套件
- 取得套件版本歷史
- 匯出成 CSV 或 JSON

使用方式：
    python pypi_scraper.py
"""

import requests
import json
import csv
from datetime import datetime


class PyPIScraper:
    def __init__(self):
        self.base_url = "https://pypi.org/pypi"
        self.packages = []

    def get_package_info(self, package_name):
        """
        取得單一套件的詳細資訊

        參數:
            package_name: 套件名稱 (例如: 'requests', 'numpy')

        回傳:
            dict: 套件資訊，失敗則回傳 None
        """
        url = f"{self.base_url}/{package_name}/json"

        try:
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                info = data["info"]
                releases = data.get("releases", {})

                # 計算總版本數
                version_count = len(releases)

                # 取得最新版本的下載資訊
                latest_version = info.get("version", "")
                latest_release = releases.get(latest_version, [])

                # 計算套件大小
                package_size = 0
                if latest_release:
                    for file_info in latest_release:
                        if file_info.get("packagetype") == "bdist_wheel":
                            package_size = file_info.get("size", 0)
                            break
                    if package_size == 0 and latest_release:
                        package_size = latest_release[0].get("size", 0)

                package_info = {
                    "name": info.get("name", ""),
                    "version": info.get("version", ""),
                    "summary": info.get("summary", ""),
                    "author": info.get("author") or info.get("maintainer") or "N/A",
                    "author_email": info.get("author_email") or info.get("maintainer_email") or "N/A",
                    "license": (info.get("license") or "N/A")[:50],
                    "requires_python": info.get("requires_python") or "N/A",
                    "homepage": info.get("home_page") or info.get("project_url") or "N/A",
                    "package_url": info.get("package_url", ""),
                    "version_count": version_count,
                    "size_bytes": package_size,
                    "size_mb": round(package_size / 1024 / 1024, 2) if package_size else 0,
                    "keywords": info.get("keywords") or "N/A",
                    "classifiers": info.get("classifiers", []),
                    "dependencies": info.get("requires_dist") or [],
                }

                return package_info

            elif response.status_code == 404:
                print(f"⚠️  套件 '{package_name}' 不存在")
                return None
            else:
                print(f"❌ 請求失敗: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ 錯誤: {e}")
            return None

    def get_package_versions(self, package_name, limit=20):
        """取得套件的版本歷史"""
        url = f"{self.base_url}/{package_name}/json"

        try:
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                releases = data.get("releases", {})

                versions = []
                for version, files in releases.items():
                    if files:  # 跳過空的版本
                        upload_time = files[0].get("upload_time", "")
                        versions.append({
                            "version": version,
                            "upload_time": upload_time[:10] if upload_time else "N/A",
                            "python_requires": files[0].get("requires_python", "N/A"),
                        })

                # 按時間排序（最新的在前）
                versions.sort(key=lambda x: x["upload_time"], reverse=True)
                return versions[:limit]

        except Exception as e:
            print(f"❌ 錯誤: {e}")
            return []

    def scrape_multiple(self, package_names, verbose=True):
        """
        批次爬取多個套件資訊

        參數:
            package_names: 套件名稱列表
            verbose: 是否顯示進度
        """
        self.packages = []
        total = len(package_names)

        for i, name in enumerate(package_names, 1):
            if verbose:
                print(f"[{i}/{total}] 正在爬取: {name}...", end=" ")

            info = self.get_package_info(name)
            if info:
                self.packages.append(info)
                if verbose:
                    print(f"✅ v{info['version']}")
            else:
                if verbose:
                    print("❌ 失敗")

        return self.packages

    def display_package(self, package_info):
        """顯示套件資訊"""
        if not package_info:
            return

        print(f"\n{'=' * 60}")
        print(f"📦 {package_info['name']} v{package_info['version']}")
        print(f"{'=' * 60}")
        print(f"📝 描述: {package_info['summary']}")
        print(f"👤 作者: {package_info['author']}")
        print(f"📧 信箱: {package_info['author_email']}")
        print(f"📜 授權: {package_info['license']}")
        print(f"🐍 Python 版本: {package_info['requires_python']}")
        print(f"📊 版本數量: {package_info['version_count']}")
        print(f"💾 套件大小: {package_info['size_mb']} MB")
        print(f"🔗 首頁: {package_info['homepage']}")
        print(f"📦 PyPI: {package_info['package_url']}")

        if package_info['dependencies']:
            print(f"\n📋 依賴套件 ({len(package_info['dependencies'])} 個):")
            for dep in package_info['dependencies'][:10]:
                print(f"   • {dep}")
            if len(package_info['dependencies']) > 10:
                print(f"   ... 還有 {len(package_info['dependencies']) - 10} 個")

    def save_to_csv(self, filename=None):
        """儲存到 CSV"""
        if not self.packages:
            print("⚠️  沒有資料可儲存")
            return

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"pypi_packages_{timestamp}.csv"

        # 選擇要匯出的欄位
        fields = ["name", "version", "summary", "author", "license",
                  "requires_python", "version_count", "size_mb", "homepage"]

        with open(filename, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(self.packages)

        print(f"💾 已儲存至: {filename}")
        return filename

    def save_to_json(self, filename=None):
        """儲存到 JSON"""
        if not self.packages:
            print("⚠️  沒有資料可儲存")
            return

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"pypi_packages_{timestamp}.json"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.packages, f, ensure_ascii=False, indent=2)

        print(f"💾 已儲存至: {filename}")
        return filename


# 熱門套件分類
POPULAR_PACKAGES = {
    "web_frameworks": ["django", "flask", "fastapi", "tornado", "pyramid", "bottle"],
    "data_science": ["numpy", "pandas", "scipy", "matplotlib", "seaborn", "plotly"],
    "machine_learning": ["scikit-learn", "tensorflow", "torch", "keras", "xgboost"],
    "web_scraping": ["requests", "beautifulsoup4", "scrapy", "selenium", "httpx", "lxml"],
    "testing": ["pytest", "unittest2", "nose2", "coverage", "tox", "hypothesis"],
    "utilities": ["click", "rich", "tqdm", "python-dotenv", "pydantic", "loguru"],
}


def main():
    """主程式示範"""
    print("=" * 60)
    print("🐍 PyPI 套件爬蟲")
    print("=" * 60)

    scraper = PyPIScraper()

    # ===== 示範 1: 查詢單一套件 =====
    print("\n【示範 1】查詢單一套件詳細資訊")
    info = scraper.get_package_info("requests")
    scraper.display_package(info)

    # ===== 示範 2: 查詢版本歷史 =====
    print("\n\n【示範 2】requests 版本歷史 (最近 10 個)")
    print("-" * 40)
    versions = scraper.get_package_versions("requests", limit=10)
    for v in versions:
        print(f"   v{v['version']:15} 發布於 {v['upload_time']}")

    # ===== 示範 3: 批次爬取 =====
    print("\n\n【示範 3】批次爬取 Web Scraping 相關套件")
    print("-" * 40)
    packages = scraper.scrape_multiple(POPULAR_PACKAGES["web_scraping"])

    # 顯示摘要
    print(f"\n📊 爬取結果摘要:")
    print(f"{'套件名稱':20} {'版本':12} {'Python 需求':15} {'大小'}")
    print("-" * 60)
    for pkg in packages:
        print(f"{pkg['name']:20} {pkg['version']:12} {pkg['requires_python']:15} {pkg['size_mb']} MB")

    # 儲存結果
    scraper.save_to_csv()

    print("\n✅ 爬蟲執行完成！")


if __name__ == "__main__":
    main()

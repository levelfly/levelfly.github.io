# -*- coding: utf-8 -*-
"""系統性截圖比對：Chromium vs WebKit，覆蓋所有場景與關鍵元素。"""
import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'tools' / 'render_check'
OUT.mkdir(exist_ok=True)

BASE = 'http://127.0.0.1:8777'
IPHONE = {'width': 390, 'height': 844, 'device_scale_factor': 2}
SCENES = [
    ('title', '?go=title'),
    ('map', '?go=map'),
    ('marsh_count', '?go=marsh'),
    ('cove_listen', '?go=cove'),
    ('grove_count', '?go=grove'),
    ('cliff_listen', '?go=cliff'),
    ('light_quantity', '?go=light'),
    ('lantern', '?go=lantern', True),
    ('finale', '?go=finale'),
]


def log(msg):
    print(msg, flush=True)


async def screenshot(page, name, wait_ms=2200):
    path = OUT / f'{name}.png'
    await page.screenshot(path=str(path), full_page=False)
    log(f'  → {path}')
    return path


async def open_scene(page, suffix, seed_bugs=False):
    await page.goto(f'{BASE}/')
    # 預先寫入 localStorage，讓收藏頁顯示已收到的光靈
    if seed_bugs:
        bugs = {b: 2 for b in ['popo', 'mimi', 'nunu', 'suisui', 'tata', 'yoyo', 'lala', 'kuku']}
        save = json.dumps({'bugs': bugs, 'runs': 3, 'secrets': {'sneeze': True, 'crab': True}, 'best': 4, 'muted': True})
        await page.evaluate(f"localStorage.setItem('glowisle.v1', {save!r});")
    await page.goto(f'{BASE}/{suffix}')
    # 等載入畫面出現並點一下開始
    await page.wait_for_selector('#loader.ready', timeout=15000)
    await asyncio.sleep(0.3)
    await page.click('#loader', timeout=5000)
    await page.wait_for_selector('#loader.gone', timeout=15000, state='attached')
    await asyncio.sleep(1.0)  # 等 .gone 的 0.7s opacity transition 完全結束


async def run_browser(browser_name, p):
    log(f'\n== {browser_name} ==')
    browser = await p[browser_name].launch()
    context = await browser.new_context(viewport=IPHONE, locale='zh-TW')
    page = await context.new_page()

    for item in SCENES:
        name, suffix = item[0], item[1]
        seed_bugs = item[2] if len(item) > 2 else False
        log(f'[{name}]')
        try:
            await open_scene(page, suffix, seed_bugs=seed_bugs)
            await screenshot(page, f'{browser_name}_{name}')
            # 關卡畫面多等一題的語音/動畫穩定
            if 'count' in name or 'listen' in name or 'quantity' in name:
                await asyncio.sleep(3.2)
                await screenshot(page, f'{browser_name}_{name}_stable')
        except Exception as e:
            log(f'  ERROR {name}: {e}')
            # 仍試著截一張當下畫面
            try:
                await screenshot(page, f'{browser_name}_{name}_error')
            except Exception:
                pass

    await browser.close()


async def main():
    async with async_playwright() as p:
        await run_browser('chromium', p)
        await run_browser('webkit', p)
    log(f'\n全部截圖放在 {OUT}')


if __name__ == '__main__':
    asyncio.run(main())

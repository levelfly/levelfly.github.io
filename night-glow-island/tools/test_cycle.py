# -*- coding: utf-8 -*-
"""測試週目顯示與難度變化。"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
BASE = 'http://127.0.0.1:8777'
OUT = ROOT / 'tools' / 'render_check'
OUT.mkdir(exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844, 'device_scale_factor': 2},
            has_touch=True,
        )
        page = await context.new_page()

        logs = []
        page.on('console', lambda msg: logs.append(f'{msg.type}: {msg.text}'))
        page.on('pageerror', lambda err: logs.append(f'pageerror: {err}'))

        # 測試第一輪 map
        await page.goto(f'{BASE}/?go=map')
        await page.wait_for_selector('#loader.ready', timeout=15000)
        await asyncio.sleep(0.3)
        await page.click('#loader')
        await page.wait_for_selector('#loader.gone', timeout=15000, state='attached')
        await asyncio.sleep(1.5)
        await page.screenshot(path=str(OUT / 'test_cycle_map1.png'))

        # 模擬完成所有地點一次後再看 map（第二輪）
        # 注意存檔已經是 v2 分檔格式：塞 v1 沒有用 —— 第一次載入就會寫出 v2，
        # 之後 v2 優先，舊格式會被安靜地忽略掉（測試會假綠）。
        cycles = { 'marsh': 1, 'cove': 1, 'grove': 1, 'cliff': 1, 'light': 1 }
        save = json.dumps({
            'activeProfile': 'age4',
            'shared': {'muted': True, 'secrets': {}},
            'profiles': {
                'age4': {'bugs': {}, 'goldenBugs': {}, 'platinumBugs': {},
                         'runs': 1, 'cycles': cycles, 'best': 0},
            },
        })
        await page.evaluate(f"localStorage.setItem('glowisle.v2', {save!r});")
        await page.goto(f'{BASE}/?go=map')
        await page.wait_for_selector('#loader.ready', timeout=15000)
        await page.click('#loader')
        await page.wait_for_selector('#loader.gone', timeout=15000, state='attached')
        await asyncio.sleep(1.5)
        await page.screenshot(path=str(OUT / 'test_cycle_map2.png'))

        # 測試二週目 marsh 的題目難度
        await page.goto(f'{BASE}/?go=marsh')
        await page.wait_for_selector('#loader.ready', timeout=15000)
        await page.click('#loader')
        await page.wait_for_selector('#loader.gone', timeout=15000, state='attached')
        await asyncio.sleep(2.0)
        q = await page.evaluate('() => { try { return window.__glow?.q; } catch(e) { return null; } }')
        print('marsh cycle 1 q =', q)

        print('--- logs ---')
        for l in logs:
            print(l)

        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())

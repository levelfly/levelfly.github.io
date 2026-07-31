# -*- coding: utf-8 -*-
"""自動化走過 marsh 地點，驗證各種模式與挑戰 HUD 都能正常運作。"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
BASE = 'http://127.0.0.1:8777'
OUT = ROOT / 'tools' / 'render_check'
OUT.mkdir(exist_ok=True)


def center(rect):
    return rect['left'] + rect['width'] / 2, rect['top'] + rect['height'] / 2


async def tap_prop(page, rect):
    x, y = center(rect)
    await page.touchscreen.tap(x, y)


async def get_props(page):
    return await page.evaluate('''() => {
        const nodes = Array.from(document.querySelectorAll('.prop'));
        return nodes.map(n => ({
            value: n.dataset.value,
            locked: n.dataset.locked,
            rect: n.getBoundingClientRect(),
        }));
    }''')


async def get_q(page):
    return await page.evaluate('() => { try { return window.__glow?.q; } catch(e) { return null; } }')


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

        await page.goto(f'{BASE}/?go=marsh')
        await page.wait_for_selector('#loader.ready', timeout=15000)
        await asyncio.sleep(0.3)
        await page.click('#loader')
        await page.wait_for_selector('#loader.gone', timeout=15000, state='attached')
        await asyncio.sleep(1.5)

        for round_idx in range(12):
            print(f'--- round {round_idx} ---')
            q = await get_q(page)
            print('q =', q)
            props = await get_props(page)
            if not props:
                print('board empty, wait for finishArea')
                for _ in range(20):
                    await asyncio.sleep(0.5)
                    if 'map' in page.url or 'finale' in page.url or 'title' in page.url:
                        print('left level:', page.url)
                        break
                await page.screenshot(path=str(OUT / 'test_level1_finished.png'))
                break

            countables = [p for p in props if p['value'] is None]
            tokens = [p for p in props if p['value'] is not None]

            if q and q.get('mode') == 'count' and countables:
                for c in countables:
                    await tap_prop(page, c['rect'])
                    await asyncio.sleep(0.32)
                await asyncio.sleep(0.7)

            if not q:
                print('no q, break')
                break
            answer = str(q['answer'])
            print('answer =', answer)

            # 等待答案 token 解鎖
            for _ in range(30):
                box = await page.evaluate(f'''() => {{
                    const n = document.querySelector('.prop[data-value="{answer}"]');
                    return n ? {{ rect: n.getBoundingClientRect(), locked: n.dataset.locked }} : null;
                }}''')
                if box and box['locked'] != '1':
                    break
                await asyncio.sleep(0.05)

            if box:
                await tap_prop(page, box['rect'])
            else:
                print('answer token not found')
                break

            await asyncio.sleep(3.5)
            await page.screenshot(path=str(OUT / f'test_level1_round_{round_idx}.png'))

            challenge = await page.evaluate('''() => {
                const p = document.querySelector('.hc-perfect');
                const f = document.querySelector('.hc-focus');
                return { perfectLost: p?.classList.contains('lost'), focusLost: f?.classList.contains('lost') };
            }''')
            print('challenge hud:', challenge)

        print('final url:', page.url)
        print('--- logs ---')
        for l in logs:
            print(l)

        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())

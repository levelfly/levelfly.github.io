# -*- coding: utf-8 -*-
"""晨風群島（6 歲檔）的走查。

這座島還沒對小孩開放（profiles.js 的 age6.ready 是 false），
但美術與地圖已經在跑了，所以要有東西看著它 —— 不然改壞了會等到開門那天才發現。

驗四件事：
  1. 開場（skytitle）與航線圖（skymap）都進得去、零 console error
  2. fps 沒有掉回去（夜光島當年是 12fps 換回 60fps 的，不准吐回去）
  3. 五座島的節點都在，點得到、位置在畫面內
  4. 亮背景沒有被夜光島的深色層污染（.bg-layer::after 那層深藍漸層是慣犯）

先開好 server：python serve.py
"""
import asyncio
import io
import sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = "http://127.0.0.1:8777"
fails = []


def check(name, ok, detail=""):
    print(("  ✓ " if ok else "  ✗ ") + name + (f"　{detail}" if detail else ""))
    if not ok:
        fails.append(name)


async def boot(ctx, url):
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    await pg.add_init_script("window.__f=0;(function l(){window.__f++;requestAnimationFrame(l);})();")
    await pg.goto(url)
    await pg.wait_for_selector("#loader.ready", timeout=25000)
    await pg.click("#loader")
    # loader 在 .gone 之後 800ms 會被移除，所以等「不在了或已 gone」，不要等某個 class
    await pg.wait_for_function(
        "() => { const l = document.getElementById('loader'); return !l || l.classList.contains('gone'); }",
        timeout=25000)
    await asyncio.sleep(3.0)
    return pg, errs


async def fps(pg, secs=2.0):
    a = await pg.evaluate("() => window.__f")
    await asyncio.sleep(secs)
    b = await pg.evaluate("() => window.__f")
    return (b - a) / secs


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        for label, vw, vh in [("直握", 390, 844), ("橫握", 844, 390)]:
            ctx = await browser.new_context(
                viewport={"width": vw, "height": vh, "device_scale_factor": 1}, has_touch=True)

            print(f"開場（{label}）")
            pg, errs = await boot(ctx, f"{BASE}/?profile=age6")
            f = await fps(pg)
            check(f"{label} 開場零錯誤", not errs, str(errs[:2]))
            check(f"{label} 開場 fps ≥ 50", f >= 50, f"{f:.0f}")
            check(f"{label} 開場是晨風群島",
                  (await pg.evaluate("() => document.querySelector('.title-main')?.textContent")) == "晨風群島")
            await pg.close()

            print(f"航線圖（{label}）")
            pg, errs = await boot(ctx, f"{BASE}/?profile=age6&go=map&lit=garden,mill")
            f = await fps(pg)
            check(f"{label} 航線圖零錯誤", not errs, str(errs[:2]))
            check(f"{label} 航線圖 fps ≥ 50", f >= 50, f"{f:.0f}")
            check(f"{label} 場景是 skymap",
                  (await pg.evaluate("() => window.__glow?.sceneName")) == "skymap")

            # 五座島的節點都要在畫面內，而且夠大到戳得到（小孩的手指不精準）
            nodes = await pg.evaluate("""() => Array.from(document.querySelectorAll('.prop')).map(n => {
              const r = n.getBoundingClientRect();
              return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
            })""")
            check(f"{label} 五座島都在", len(nodes) == 5, f"{len(nodes)} 個")
            inside = [n for n in nodes if 0 <= n["x"] <= vw and 0 <= n["y"] <= vh]
            check(f"{label} 節點都在畫面內", len(inside) == len(nodes),
                  f"{len(inside)}/{len(nodes)}")
            small = [n for n in nodes if min(n["w"], n["h"]) < 44]
            check(f"{label} 節點都夠大（≥44px）", not small, f"{len(small)} 個太小")

            # 亮島不能被夜光島的深色層壓濁：下半部要是暖亮色，不是灰
            buf = await pg.screenshot()
            im = Image.open(io.BytesIO(buf)).convert("RGB")
            W, H = im.size
            r, g, b = im.getpixel((W // 2, int(H * .85)))
            check(f"{label} 下半部沒被壓成灰", r > 200 and g > 190 and r >= b, f"rgb({r},{g},{b})")
            await pg.close()
            await ctx.close()

        await browser.close()

    print("\n=== 結果 ===")
    if fails:
        for f_ in fails:
            print("✗", f_)
        sys.exit(1)
    print("✓ 晨風群島全綠：開場與航線圖都進得去、60fps、五座島點得到、配色沒被夜色污染")


if __name__ == "__main__":
    asyncio.run(main())
